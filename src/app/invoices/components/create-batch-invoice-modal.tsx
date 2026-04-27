"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { CreateBatchInvoicePayload } from "@/types/financialsTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useState } from "react"
import { DatePicker } from "@/components/date-picker"
import { formatPrice } from "@/handlers/formatters"

interface CreateBatchInvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customerId: string
    shipmentIds: string[]
    totalAmount: number
    onSuccess: () => void
}

export function CreateBatchInvoiceModal({
    open,
    onOpenChange,
    customerId,
    shipmentIds,
    totalAmount,
    onSuccess,
}: CreateBatchInvoiceModalProps) {
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date())
    const [dueDate, setDueDate] = useState<Date | undefined>(() => {
        const date = new Date()
        date.setDate(date.getDate() + 15) // Default 15 days
        return date
    })
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!invoiceDate || !dueDate) {
            setError("Invoice date and due date are required")
            return
        }

        if (dueDate < invoiceDate) {
            setError("Due date must be after invoice date")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const payload: CreateBatchInvoicePayload = {
                customerId,
                shipmentIds,
                invoiceDate: invoiceDate.toISOString().split("T")[0],
                dueDate: dueDate.toISOString().split("T")[0],
                notes: notes.trim() || undefined,
            }

            const response = await ApiService.createBatchInvoice(payload)

            if (response.status && response.data) {
                toastUtils.success("Invoice Created", "Batch invoice has been created successfully.")
                onSuccess()
            } else {
                setError(response.message || "Failed to create batch invoice")
                toastUtils.error("Creation Failed", response.message || "Failed to create batch invoice.")
            }
        } catch (err: any) {
            setError(err.message || "Failed to create batch invoice")
            toastUtils.error("Creation Failed", err.message || "Failed to create batch invoice.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Batch Invoice</DialogTitle>
                    <DialogDescription>
                        Create a consolidated invoice for {shipmentIds.length} selected shipment(s)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="rounded-md border p-3 bg-muted/50">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Creating invoice for</p>
                            <p className="text-lg font-semibold">
                                {shipmentIds.length} shipment(s)
                            </p>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-xl font-bold">{formatPrice(totalAmount)}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Invoice Date *</Label>
                            <DatePicker
                                className="w-full"
                                initialDate={invoiceDate}
                                onDateChange={(date) => setInvoiceDate(date)}
                                hint="Select invoice date"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date *</Label>
                            <DatePicker
                                className="w-full"
                                initialDate={dueDate}
                                onDateChange={(date) => setDueDate(date)}
                                hint="Select due date"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Consolidated invoice for prepaid shipments"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !invoiceDate || !dueDate}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

