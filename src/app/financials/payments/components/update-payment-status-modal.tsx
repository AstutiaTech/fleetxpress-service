"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertTriangle } from "lucide-react"
import { PaymentTransaction, PaymentStatus, UpdatePaymentStatusPayload } from "@/types/financialsTypes"
import { useStore } from "@/providers/store.provider"
import { toastUtils } from "@/utils/toast-utils"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge"

interface UpdatePaymentStatusModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    payment: PaymentTransaction
    onSuccess?: () => void
}

function getAllowedStatuses(currentStatus: PaymentStatus): PaymentStatus[] {
    const statusFlow: Record<PaymentStatus, PaymentStatus[]> = {
        PENDING: ["PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
        PROCESSING: ["COMPLETED", "FAILED", "CANCELLED"],
        COMPLETED: [], // Cannot change from completed
        FAILED: ["PENDING"], // Can retry
        CANCELLED: [], // Cannot change from cancelled
    }

    return statusFlow[currentStatus] || []
}

export function UpdatePaymentStatusModal({ open, onOpenChange, payment, onSuccess }: UpdatePaymentStatusModalProps) {
    const { paymentsStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const allowedStatuses = getAllowedStatuses(payment.status)

    const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<UpdatePaymentStatusPayload>({
        defaultValues: {
            status: payment.status,
            externalReference: payment.externalReference || "",
        },
    })

    const watchedStatus = watch("status")

    const onSubmit = async (values: UpdatePaymentStatusPayload) => {
        setIsSubmitting(true)
        try {
            const response = await paymentsStore.updatePaymentStatus(payment.id, values)
            if (response.success) {
                toastUtils.success("Status Updated", "Payment status updated successfully.")
                
                // If status changed to COMPLETED, show info about automatic processing
                if (values.status === "COMPLETED" && payment.status !== "COMPLETED") {
                    toastUtils.info(
                        "Payment Processed",
                        "Payment has been processed. Invoice/bill and ledger entries have been updated automatically."
                    )
                }

                onSuccess?.()
                onOpenChange(false)
                reset()
            }
        } catch (error) {
            console.error("Failed to update payment status:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Update Payment Status</DialogTitle>
                    <DialogDescription>
                        Update the status for payment {payment.transactionReference}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Current Status</Label>
                        <div>
                            <PaymentStatusBadge status={payment.status} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>New Status *</Label>
                        <Controller
                            control={control}
                            name="status"
                            rules={{ required: "Status is required" }}
                            render={({ field }) => (
                                <>
                                    <Select value={field.value} onValueChange={field.onChange} disabled={allowedStatuses.length === 0}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allowedStatuses.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-destructive">{errors.status.message}</p>
                                    )}
                                    {allowedStatuses.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            This payment status cannot be changed.
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {watchedStatus === "COMPLETED" && (
                        <div className="space-y-2">
                            <Label>External Reference (Recommended)</Label>
                            <Controller
                                control={control}
                                name="externalReference"
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder={
                                            payment.paymentMethod === "BANK_TRANSFER"
                                                ? "Bank transaction reference"
                                                : payment.paymentMethod === "CHEQUE"
                                                ? "Cheque number"
                                                : "Reference number"
                                        }
                                    />
                                )}
                            />
                            <p className="text-xs text-muted-foreground">
                                Required for bank transfers and cheques
                            </p>
                        </div>
                    )}

                    {watchedStatus === "COMPLETED" && payment.status !== "COMPLETED" && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Important:</strong> Changing status to COMPLETED will automatically:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Update invoice/bill paid amounts</li>
                                    <li>Create ledger entries</li>
                                    <li>Update account balances</li>
                                </ul>
                                This action cannot be undone without creating a reversal entry.
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || allowedStatuses.length === 0}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Status
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

