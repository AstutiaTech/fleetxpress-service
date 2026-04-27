"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { CreatePayablePayload, Payable } from "@/types/financialsTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/providers/store.provider"
import { formatPrice, unformatCurrencyInput } from "@/handlers/formatters"
import { format } from "date-fns"

interface PayableModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: Payable | null
    onSuccess?: () => void
}

export function PayableModal({ open, onOpenChange, item, onSuccess }: PayableModalProps) {
    const { payablesStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [drivers, setDrivers] = useState<{ id: string; name: string; email: string }[]>([])

    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreatePayablePayload>({
        defaultValues: {
            driverId: "",
            vendorId: "",
            billDate: format(new Date(), "yyyy-MM-dd"),
            dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
            totalAmount: 0,
            items: [],
            notes: "",
            terms: "",
        },
    })

    useEffect(() => {
        if (open) {
            loadDrivers()
            if (item) {
                reset({
                    driverId: item.driverId || "",
                    vendorId: item.vendorId || "",
                    billDate: format(new Date(item.billDate), "yyyy-MM-dd"),
                    dueDate: format(new Date(item.dueDate), "yyyy-MM-dd"),
                    totalAmount: item.totalAmount,
                    items: item.items || [],
                    notes: item.notes || "",
                    terms: item.terms || "",
                })
            } else {
                reset({
                    driverId: "",
                    vendorId: "",
                    billDate: format(new Date(), "yyyy-MM-dd"),
                    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                    totalAmount: 0,
                    items: [],
                    notes: "",
                    terms: "",
                })
            }
        }
    }, [item, open, reset])

    const loadDrivers = async () => {
        try {
            const response = await ApiService.getAllDrivers()
            if (response.status && response.data) {
                setDrivers(response.data.map(d => ({
                    id: d.id,
                    name: d.name,
                    email: d.email || "",
                })))
            }
        } catch (error) {
            console.error("Failed to load drivers:", error)
        }
    }

    const onSubmit = async (values: CreatePayablePayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await payablesStore.updatePayable(item.id, values)
            } else {
                response = await payablesStore.createPayable(values)
            }
            if (response.success) {
                toastUtils.success(item ? "Updated" : "Created", `Bill ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            }
        } catch (error) {
            console.error("Failed to save payable:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Bill" : "Create Bill"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the bill information." : "Create a new bill for a driver or vendor."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Driver (Optional)</Label>
                            <Controller
                                control={control}
                                name="driverId"
                                render={({ field }) => (
                                    <Select 
                                        value={field.value || undefined} 
                                        onValueChange={(value) => field.onChange(value || "")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select driver (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.name} ({d.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Bill Date *</Label>
                            <Controller
                                control={control}
                                name="billDate"
                                rules={{ required: "Bill date is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="date" {...field} />
                                        {errors.billDate && (
                                            <p className="text-sm text-destructive">{errors.billDate.message}</p>
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

