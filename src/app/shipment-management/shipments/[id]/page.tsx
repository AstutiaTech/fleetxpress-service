"use client"

import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Costing, Parcel } from "@/types/shipmentTypes"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Metadata } from "next"
import { format } from "date-fns"
import { generateWaybillImage } from "@/utils/waybill-image"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"
import { useStore } from "@/providers/store.provider"

export default observer(function ShipmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { shipmentStore, settingsStore } = useStore()
    const shipmentId = params.id as string
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

    useEffect(() => {
        if (shipmentId) {
            shipmentStore.fetchShipmentDetails(shipmentId)
        }

        return () => {
            shipmentStore.clearCurrentShipment()
        }
    }, [shipmentId, shipmentStore])

    const shipment = shipmentStore.currentShipment
    const parcels = shipmentStore.shipmentParcels
    const costing = shipmentStore.shipmentCosting
    const isLoading = shipmentStore.isLoading || shipmentStore.isLoadingParcels || shipmentStore.isLoadingCosting

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "outline",
            "in-transit": "default",
            delivered: "default",
            cancelled: "destructive",
        }
        return (
            <Badge variant={variants[status] || "outline"}>
                {status.toUpperCase()}
            </Badge>
        )
    }

    const getDeliveryStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "outline",
            "picked-up": "default",
            "in-transit": "default",
            "out-for-delivery": "default",
            delivered: "default",
            failed: "destructive",
        }
        return (
            <Badge variant={variants[status] || "outline"}>
                {status?.toUpperCase()}
            </Badge>
        )
    }

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            paid: "default",
            unpaid: "destructive",
            partial: "outline",
        }
        return (
            <Badge variant={variants[status] || "outline"}>
                {status.toUpperCase()}
            </Badge>
        )
    }

    const parcelColumns: CustomTableColumn<Parcel>[] = [
        {
            header: "Packaging",
            cell: (row: Parcel) => row.packaging?.name || "N/A",
        },
        {
            header: "Dimensions (L×W×H)",
            cell: (row: Parcel) => `${row.length} × ${row.width} × ${row.height} cm`,
        },
        {
            header: "Weight",
            cell: (row: Parcel) => `${row.weight} kg`,
            sortable: true,
        },
        {
            header: "Quantity",
            accessor: "quantity" as keyof Parcel,
            sortable: true,
        },
        {
            header: "Declared Value",
            cell: (row: Parcel) => {
                if (row.declaredValue === null || row.declaredValue === undefined) return "N/A"
                const formatter = new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    minimumFractionDigits: 2,
                })
                return formatter.format(Number(row.declaredValue))
            },
        },
        {
            header: "Rush Hour",
            cell: (row: Parcel) => (
                <Badge variant={row.isRushHour ? "default" : "outline"}>
                    {row.isRushHour ? "Yes" : "No"}
                </Badge>
            ),
        },
        {
            header: "Extra Cost",
            cell: (row: Parcel) => `₦${row.extraCost.toLocaleString()}`,
            sortable: true,
        },
    ]

    const handleDownloadWaybill = async () => {
        if (!shipment || !costing) {
            toastUtils.error("Error", "Shipment or costing information not available")
            return
        }

        setIsGeneratingPDF(true)
        try {
            // Ensure settings are loaded
            if (!settingsStore.generalSettings) {
                await settingsStore.fetchGeneralSettings()
            }
            const dataUrl = await generateWaybillImage(shipment, costing, parcels, settingsStore.generalSettings)
            
            // Create download link
            const link = document.createElement("a")
            link.href = dataUrl
            link.download = `Waybill-${shipment.trackingCode}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            toastUtils.success("Success", "Waybill downloaded successfully")
        } catch (error) {
            console.error("Failed to generate waybill PDF:", error)
            toastUtils.error("Error", "Failed to generate waybill PDF")
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full overflow-x-hidden">
                <DashboardHeader title="Shipment Details" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (!shipment) {
        return (
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full overflow-x-hidden">
                <DashboardHeader title="Shipment Details" />
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Shipment not found.</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => router.push("/shipment-management/shipments")}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Shipments
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 w-full max-w-full overflow-x-hidden pb-14">
            <div className="flex items-center justify-between">
                <DashboardHeader title="Shipment Details" />
                <div className="flex gap-2">
                    {shipment && costing && (
                        <Button
                            variant="default"
                            onClick={handleDownloadWaybill}
                            disabled={isGeneratingPDF}
                        >
                            {isGeneratingPDF ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Waybill
                                </>
                            )}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => router.push("/shipment-management/shipments")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Shipments
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Tracking Code</p>
                            <p className="font-medium">{shipment.trackingCode}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            {getStatusBadge(shipment.status)}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Delivery Status</p>
                            {getDeliveryStatusBadge(shipment.deliveryStatus)}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Payment Status</p>
                            {getPaymentStatusBadge(shipment.paymentStatus)}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p className="font-medium">{format(new Date(shipment.createdAt), "PPp")}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sender Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sender Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{shipment.sender?.profile?.firstName || "N/A"}</p>
                            <p className="font-medium">{shipment.sender?.profile?.lastName || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{shipment.sender?.email || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">
                                {shipment.sender?.profile?.city}, {shipment.sender?.profile?.state}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Recipient Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recipient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">
                                {shipment.recipientFirstName} {shipment.recipientLastName}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{shipment.recipientPhoneNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{shipment.recipientEmail}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">{shipment.recipientAddress}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Destination Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Destination</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">City</p>
                            <p className="font-medium">{shipment.destinationCity?.name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">State</p>
                            <p className="font-medium">{shipment.destinationState?.name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">LGA</p>
                            <p className="font-medium">{shipment.destinationLga?.name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Country</p>
                            <p className="font-medium">{shipment.destinationCountry?.name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Delivery Address</p>
                            <p className="font-medium">{shipment.deliveryAddress}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Pickup Point */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pickup Point</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{shipment.pickupPoint?.name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">
                                {shipment.pickupPoint?.city}, {shipment.pickupPoint?.state}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{shipment.pickupPoint?.phoneNumber || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{shipment.pickupPoint?.emailAddress || "N/A"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Payment Type</p>
                            <p className="font-medium">{shipment.paymentType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Payment Mode</p>
                            <p className="font-medium">{shipment.paymentMode}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Who Pays Shipping</p>
                            <p className="font-medium">{shipment.whoPaysShippingFee}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Delivery Option</p>
                            <p className="font-medium">{shipment.deliveryOption}</p>
                        </div>
                        {shipment.isScheduled && (
                            <div>
                                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                                <p className="font-medium">
                                    {format(new Date(shipment.scheduledDate), "PPp")}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Costing Information */}
            {costing && (
                <Card>
                    <CardHeader>
                        <CardTitle>Costing Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold">₦{costing.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Delivery Charge</p>
                                <p className="text-lg font-semibold">₦{costing.deliveryCharge.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Packaging Charge</p>
                                <p className="text-lg font-semibold">₦{costing.packagingCharge.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">VAT</p>
                                <p className="text-lg font-semibold">₦{costing.vat.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tax</p>
                                <p className="text-lg font-semibold">₦{costing.tax.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Insurance</p>
                                <p className="text-lg font-semibold">₦{costing.insurance.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Extra Cost</p>
                                <p className="text-lg font-semibold">₦{costing.extraCost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Extra Volume</p>
                                <p className="text-lg font-semibold">₦{costing.extraVolume.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Parcels */}
            {parcels.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Parcels ({parcels.length})</CardTitle>
                        <CardDescription>All parcels in this shipment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CustomTable
                            columns={parcelColumns}
                            data={parcels}
                            enableSorting={true}
                            hasExport={false}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Note */}
            {shipment.note && (
                <Card>
                    <CardHeader>
                        <CardTitle>Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{shipment.note}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
})

