"use client"

import { DeliveryStatus, PaymentStatus, Shipment, ShipmentStatus } from "@/types/shipmentTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toastUtils } from "@/utils/toast-utils"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import { useStore } from "@/providers/store.provider"

interface UpdateStatusModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shipment: Shipment
    onSuccess?: () => void
}

export function UpdateStatusModal({ open, onOpenChange, shipment, onSuccess }: UpdateStatusModalProps) {
    const { shipmentStore } = useStore()
    const { hasRole } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const isAgent = hasRole("agent")
    const isSuperAdminOrAdmin = hasRole("superadmin", "admin")
    
    const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>(shipment.status)
    const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(shipment.deliveryStatus)
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(shipment.paymentStatus)

    // Reset payment status to "unpaid" if shipment status changes to "pending" and payment is "paid"
    const handleShipmentStatusChange = (value: ShipmentStatus) => {
        setShipmentStatus(value)
        // If payment status is "paid" and new status is "pending", reset payment to "unpaid"
        // If status is "processing", "assigned", or "failed", leave payment as is
        if (paymentStatus === "paid" && value === "pending") {
            setPaymentStatus("unpaid")
        }
    }

    const shipmentStatusOptions: ShipmentStatus[] = ["pending", "processing", "assigned", "failed"]
    const deliveryStatusOptions: DeliveryStatus[] = ["picked-up", "in-transit", "at-warehouse", "out-for-delivery", "delivered", "failed-delivery", "returned", "cancelled"]
    const paymentStatusOptions: PaymentStatus[] = ["unpaid", "processing", "paid"]

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const updatePayload: {
                status?: ShipmentStatus
                deliveryStatus?: DeliveryStatus
                paymentStatus?: PaymentStatus
            } = {}

            // Agent can only update delivery and shipment status
            if (isAgent) {
                updatePayload.status = shipmentStatus
                updatePayload.deliveryStatus = deliveryStatus
            } else if (isSuperAdminOrAdmin) {
                // Superadmin/Admin can update all statuses
                updatePayload.status = shipmentStatus
                updatePayload.deliveryStatus = deliveryStatus
                
                // Prevent payment status changes when shipment status is "assigned" or "failed"
                if (shipmentStatus === "assigned" || shipmentStatus === "failed") {
                    // Don't include paymentStatus in the payload - keep it as is
                    // Payment status cannot be changed for assigned or failed shipments
                } else {
                    // Only allow "paid" status if shipment status is not "pending"
                    if (paymentStatus === "paid" && shipmentStatus === "pending") {
                        toastUtils.error("Invalid Status", "Payment status cannot be set to 'paid' when shipment status is 'pending'.")
                        setIsSubmitting(false)
                        return
                    }
                    
                    updatePayload.paymentStatus = paymentStatus
                }
            }

            const result = await shipmentStore.updateShipmentStatuses(shipment.id, updatePayload)
            
            if (result.success) {
                toastUtils.success("Status Updated", "Shipment statuses have been updated successfully.")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toastUtils.error("Update Failed", result.error || "Failed to update shipment statuses.")
            }
        } catch {
            toastUtils.error("Update Failed", "An error occurred while updating shipment statuses.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Update Shipment Statuses</DialogTitle>
                    <DialogDescription>
                        Update the statuses for shipment {shipment.trackingCode}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Shipment Status</Label>
                        <Select
                            value={shipmentStatus}
                            onValueChange={(value) => handleShipmentStatusChange(value as ShipmentStatus)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select shipment status" />
                            </SelectTrigger>
                            <SelectContent>
                                {shipmentStatusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Delivery Status</Label>
                        <Select
                            value={deliveryStatus}
                            onValueChange={(value) => setDeliveryStatus(value as DeliveryStatus)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select delivery status" />
                            </SelectTrigger>
                            <SelectContent>
                                {deliveryStatusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isSuperAdminOrAdmin && (
                        <div className="space-y-2">
                            <Label>Payment Status</Label>
                            {shipmentStatus === "pending" && paymentStatus === "paid" && (
                                <p className="text-xs text-muted-foreground mb-1">
                                    Note: Payment status will be reset to "unpaid" when shipment status is "pending"
                                </p>
                            )}
                            {(shipmentStatus === "assigned" || shipmentStatus === "failed") && (
                                <p className="text-xs text-muted-foreground mb-1">
                                    Note: Payment status cannot be changed when shipment status is "{shipmentStatus}"
                                </p>
                            )}
                            <Select
                                value={paymentStatus}
                                onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
                                disabled={isSubmitting || shipmentStatus === "assigned" || shipmentStatus === "failed"}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentStatusOptions.map((status) => {
                                        const isPaidDisabled = status === "paid" && shipmentStatus === "pending"
                                        return (
                                            <SelectItem 
                                                key={status} 
                                                value={status}
                                                disabled={isPaidDisabled}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                {isPaidDisabled && " (Set status to 'processing', 'assigned', or 'failed' first)"}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {isAgent && (
                        <p className="text-sm text-muted-foreground">
                            Note: As an agent, you can only update shipment and delivery statuses.
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Statuses
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

