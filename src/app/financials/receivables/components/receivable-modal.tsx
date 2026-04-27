"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { CreateReceivablePayload, Receivable } from "@/types/financialsTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/providers/store.provider"
import { formatPrice, unformatCurrencyInput } from "@/handlers/formatters"
import { format } from "date-fns"

interface ReceivableModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: Receivable | null
    onSuccess?: () => void
}

export function ReceivableModal({ open, onOpenChange, item, onSuccess }: ReceivableModalProps) {
    const { receivablesStore, shipmentStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customers, setCustomers] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([])
    const [shipments, setShipments] = useState<{ id: string; trackingCode: string }[]>([])

    const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<CreateReceivablePayload>({
        defaultValues: {
            customerId: "",
            shipmentId: "",
            invoiceDate: format(new Date(), "yyyy-MM-dd"),
            dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
            totalAmount: 0,
            items: [],
            notes: "",
            terms: "",
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    })

    const watchedTotalAmount = watch("totalAmount")
    const watchedItems = watch("items")

    useEffect(() => {
        if (open) {
            loadCustomers()
            loadShipments()
            if (item) {
                reset({
                    customerId: item.customerId,
                    shipmentId: item.shipmentId || "",
                    invoiceDate: format(new Date(item.invoiceDate), "yyyy-MM-dd"),
                    dueDate: format(new Date(item.dueDate), "yyyy-MM-dd"),
                    totalAmount: item.totalAmount,
                    items: item.items || [],
                    notes: item.notes || "",
                    terms: item.terms || "",
                })
            } else {
                reset({
                    customerId: "",
                    shipmentId: "",
                    invoiceDate: format(new Date(), "yyyy-MM-dd"),
                    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                    totalAmount: 0,
                    items: [],
                    notes: "",
                    terms: "",
                })
            }
        }
    }, [item, open, reset])

    const loadCustomers = async () => {
        try {
            const response = await ApiService.getAllCustomers({ limit: 1000 })
            if (response.status && response.data) {
                setCustomers(response.data.map(c => ({
                    id: c.id,
                    firstName: c.firstName || "",
                    lastName: c.lastName || "",
                    email: c.email || "",
                })))
            }
        } catch (error) {
            console.error("Failed to load customers:", error)
        }
    }

    const loadShipments = async () => {
        try {
            const response = await shipmentStore.fetchAllShipments({ limit: 1000 })
            if (response.success) {
                setShipments(shipmentStore.shipments.map(s => ({
                    id: s.id,
                    trackingCode: s.trackingCode,
                })))
            }
        } catch (error) {
            console.error("Failed to load shipments:", error)
        }
    }

    const calculateTotal = () => {
        if (!watchedItems || watchedItems.length === 0) return 0
        return watchedItems.reduce((sum, item) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0)
            const tax = item.tax || 0
            const discount = item.discount || 0
            return sum + itemTotal + tax - discount
        }, 0)
    }

    useEffect(() => {
        const total = calculateTotal()
        if (total > 0 && watchedTotalAmount !== total) {
            reset({ ...watch(), totalAmount: total })
        }
    }, [watchedItems])

    const onSubmit = async (values: CreateReceivablePayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await receivablesStore.updateReceivable(item.id, values)
            } else {
                response = await receivablesStore.createReceivable(values)
            }
            if (response.success) {
                toastUtils.success(item ? "Updated" : "Created", `Invoice ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            }
        } catch (error) {
            console.error("Failed to save receivable:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the invoice information." : "Create a new invoice for a customer."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Customer *</Label>
                            <Controller
                                control={control}
                                name="customerId"
                                rules={{ required: "Customer is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.firstName} {c.lastName} ({c.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.customerId && (
                                            <p className="text-sm text-destructive">{errors.customerId.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Shipment (Optional)</Label>
                            <Controller
                                control={control}
                                name="shipmentId"
                                render={({ field }) => (
                                    <Select 
                                        value={field.value || undefined} 
                                        onValueChange={(value) => field.onChange(value || "")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select shipment (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {shipments.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.trackingCode}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Invoice Date *</Label>
                            <Controller
                                control={control}
                                name="invoiceDate"
                                rules={{ required: "Invoice date is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="date" {...field} />
                                        {errors.invoiceDate && (
                                            <p className="text-sm text-destructive">{errors.invoiceDate.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date *</Label>
                            <Controller
                                control={control}
                                name="dueDate"
                                rules={{ required: "Due date is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="date" {...field} />
                                        {errors.dueDate && (
                                            <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Amount *</Label>
                            <Controller
                                control={control}
                                name="totalAmount"
                                rules={{ required: "Total amount is required", min: { value: 0.01, message: "Amount must be greater than 0" } }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="text"
                                            value={formatPrice(field.value, "", 2).replace("₦", "").trim()}
                                            onChange={(e) => {
                                                const unformatted = unformatCurrencyInput(e.target.value)
                                                field.onChange(parseFloat(unformatted) || 0)
                                            }}
                                            placeholder="0.00"
                                        />
                                        {errors.totalAmount && (
                                            <p className="text-sm text-destructive">{errors.totalAmount.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Controller
                            control={control}
                            name="notes"
                            render={({ field }) => (
                                <Textarea {...field} placeholder="Additional notes..." rows={3} />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Terms</Label>
                        <Controller
                            control={control}
                            name="terms"
                            render={({ field }) => (
                                <Textarea {...field} placeholder="Payment terms..." rows={2} />
                            )}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

