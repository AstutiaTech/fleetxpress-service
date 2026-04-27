"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { EditShipmentFormContent } from "./edit-shipment-form-content"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"
import { useAuth } from "@/hooks/use-auth"
import { useStore } from "@/providers/store.provider"

export const EditShipmentForm = observer(() => {
    const params = useParams()
    const router = useRouter()
    const { shipmentStore } = useStore()
    const { hasRole } = useAuth()
    const shipmentId = params.id as string
    const [isLoading, setIsLoading] = useState(true)
    const [canEdit, setCanEdit] = useState(false)

    useEffect(() => {
        if (shipmentId) {
            loadShipment()
        }
    }, [shipmentId])

    const loadShipment = async () => {
        setIsLoading(true)
        try {
            const result = await shipmentStore.fetchShipmentDetails(shipmentId)
            if (result.success && shipmentStore.currentShipment) {
                const shipment = shipmentStore.currentShipment
                
                // Check if user has permission to edit
                const hasEditPermission = hasRole("superadmin", "admin", "manager")
                if (!hasEditPermission) {
                    toastUtils.error("Permission Denied", "You don't have permission to edit shipments.")
                    router.push(`/shipment-management/shipments/${shipmentId}`)
                    return
                }

                // Check if shipment can be edited
                // If payment status is paid and shipment is not pending and not disabled, cannot edit
                const isEditable = !(
                    shipment.paymentStatus === "paid" &&
                    shipment.status !== "pending" &&
                    !shipment.deletedAt
                )

                if (!isEditable) {
                    toastUtils.error(
                        "Cannot Edit Shipment",
                        "This shipment cannot be edited because it is already paid and not in pending status."
                    )
                    router.push(`/shipment-management/shipments/${shipmentId}`)
                    return
                }

                setCanEdit(true)
            } else {
                toastUtils.error("Failed to Load", "Unable to load shipment details.")
                router.push("/shipment-management/shipments")
            }
        } catch (error) {
            toastUtils.error("Error", "An error occurred while loading the shipment.")
            router.push("/shipment-management/shipments")
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex flex-1 flex-col gap-6 pb-14">
                    <DashboardHeader title="Edit Shipment" />
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </PageTransition>
        )
    }

    if (!canEdit || !shipmentStore.currentShipment) {
        return (
            <PageTransition>
                <div className="flex flex-1 flex-col gap-6 pb-14">
                    <DashboardHeader title="Edit Shipment" />
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    This shipment cannot be edited or you don&apos;t have permission.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/shipment-management/shipments/${shipmentId}`)}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Shipment Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-6 pb-14">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <DashboardHeader title="Edit Shipment" />
                    <Button variant="outline" onClick={() => router.push(`/shipment-management/shipments/${shipmentId}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                </div>

                <Alert>
                    <AlertTitle>Editing Shipment</AlertTitle>
                    <AlertDescription>
                        You are editing shipment {shipmentStore.currentShipment.trackingCode}. 
                        Make sure to review all changes before submitting.
                    </AlertDescription>
                </Alert>

                <EditShipmentFormContentWrapper shipmentId={shipmentId} />
            </div>
        </PageTransition>
    )
})

const EditShipmentFormContentWrapper = observer(({ shipmentId }: { shipmentId: string }) => {
    const { shipmentStore } = useStore()
    if (!shipmentStore.currentShipment) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading shipment data...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }
    return <EditShipmentFormContent shipmentId={shipmentId} shipment={shipmentStore.currentShipment} />
})

export default EditShipmentForm

