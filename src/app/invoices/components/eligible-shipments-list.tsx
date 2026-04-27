"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Receipt } from "lucide-react"
import { EligibleShipment, EligibleShipmentsResponse } from "@/types/financialsTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { CreateBatchInvoiceModal } from "./create-batch-invoice-modal"

interface EligibleShipmentsListProps {
    customerId: string
    onInvoiceCreated?: () => void
}

export function EligibleShipmentsList({ customerId, onInvoiceCreated }: EligibleShipmentsListProps) {
    const [shipments, setShipments] = useState<EligibleShipment[]>([])
    const [selectedShipments, setSelectedShipments] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [totalAmount, setTotalAmount] = useState(0)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (customerId) {
            fetchEligibleShipments()
        }
    }, [customerId])

    const fetchEligibleShipments = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await ApiService.getEligibleShipments(customerId)
            if (response.status && response.data) {
                setShipments(response.data.shipments || [])
                setTotalAmount(response.data.totalAmount || 0)
            } else {
                setError(response.message || "Failed to fetch eligible shipments")
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch eligible shipments")
            toastUtils.error("Failed to Load", "Unable to fetch eligible shipments. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedShipments(new Set(shipments.map((s) => s.id)))
        } else {
            setSelectedShipments(new Set())
        }
    }

    const handleSelectShipment = (shipmentId: string, checked: boolean) => {
        const newSelected = new Set(selectedShipments)
        if (checked) {
            newSelected.add(shipmentId)
        } else {
            newSelected.delete(shipmentId)
        }
        setSelectedShipments(newSelected)
    }

    const handleCreateInvoice = () => {
        if (selectedShipments.size === 0) {
            setError("Please select at least one shipment")
            toastUtils.error("No Selection", "Please select at least one shipment to create a batch invoice.")
            return
        }
        setCreateModalOpen(true)
    }

    const calculateSelectedTotal = () => {
        return shipments
            .filter((s) => selectedShipments.has(s.id))
            .reduce((sum, s) => sum + s.amount, 0)
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "outline",
            processing: "default",
            assigned: "default",
            failed: "destructive",
        }
        return (
            <Badge variant={variants[status] || "outline"}>
                {status.toUpperCase()}
            </Badge>
        )
    }

    const getDeliveryStatusBadge = (status?: string) => {
        if (!status) return <span className="text-muted-foreground">-</span>
        return (
            <Badge variant="outline">
                {status.replace(/-/g, " ").toUpperCase()}
            </Badge>
        )
    }

    const columns: CustomTableColumn<EligibleShipment & { selected?: boolean }>[] = [
        {
            header: (
                <div className="flex items-center space-x-2">
                    <Checkbox
                        checked={
                            shipments.length > 0 && selectedShipments.size === shipments.length
                                ? true
                                : selectedShipments.size > 0 && selectedShipments.size < shipments.length
                                ? "indeterminate"
                                : false
                        }
                        onCheckedChange={handleSelectAll}
                    />
                    <span>Select</span>
                </div>
            ),
            cell: (row: EligibleShipment) => (
                <Checkbox
                    checked={selectedShipments.has(row.id)}
                    onCheckedChange={(checked) => handleSelectShipment(row.id, checked as boolean)}
                />
            ),
        },
        {
            header: "Tracking Code",
            accessor: "trackingCode",
            cell: (row: EligibleShipment) => row.trackingCode || "N/A",
        },
        {
            header: "Status",
            cell: (row: EligibleShipment) => getStatusBadge(row.status),
        },
        {
            header: "Delivery Status",
            cell: (row: EligibleShipment) => getDeliveryStatusBadge(row.deliveryStatus),
        },
        {
            header: "Amount",
            cell: (row: EligibleShipment) => (
                <div className="font-medium">{formatPrice(row.amount)}</div>
            ),
            sortable: true,
            sortFn: (a: EligibleShipment, b: EligibleShipment) => a.amount - b.amount,
        },
        {
            header: "Created",
            cell: (row: EligibleShipment) => format(new Date(row.createdAt), "MMM dd, yyyy"),
            sortable: true,
            sortFn: (a: EligibleShipment, b: EligibleShipment) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
    ]

    if (loading && shipments.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Eligible Shipments for Batch Invoicing</CardTitle>
                            <CardDescription>
                                Select prepaid, unpaid shipments to create a consolidated invoice
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleCreateInvoice}
                            disabled={selectedShipments.size === 0}
                        >
                            <Receipt className="mr-2 h-4 w-4" />
                            Create Batch Invoice ({selectedShipments.size})
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && shipments.length === 0 && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
                            {error}
                        </div>
                    )}

                    {selectedShipments.size > 0 && (
                        <div className="mb-4 p-3 rounded-md bg-muted">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    Selected: {selectedShipments.size} shipment(s)
                                </span>
                                <span className="font-semibold">
                                    Total: {formatPrice(calculateSelectedTotal())}
                                </span>
                            </div>
                        </div>
                    )}

                    {shipments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                No eligible shipments found. All prepaid shipments for this customer are either paid or already invoiced.
                            </p>
                        </div>
                    ) : (
                        <>
                            <CustomTable
                                columns={columns}
                                data={shipments}
                                enableSorting={true}
                                emptyContent={
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">No shipments found.</p>
                                    </div>
                                }
                            />
                            <div className="mt-4 flex justify-between items-center pt-4 border-t">
                                <span className="text-sm text-muted-foreground">
                                    Total: {shipments.length} shipment(s)
                                </span>
                                <span className="text-lg font-semibold">
                                    Total Amount: {formatPrice(totalAmount)}
                                </span>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {createModalOpen && (
                <CreateBatchInvoiceModal
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                    customerId={customerId}
                    shipmentIds={Array.from(selectedShipments)}
                    totalAmount={calculateSelectedTotal()}
                    onSuccess={() => {
                        setCreateModalOpen(false)
                        setSelectedShipments(new Set())
                        fetchEligibleShipments()
                        onInvoiceCreated?.()
                    }}
                />
            )}
        </>
    )
}

