"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { CreateCurrencyPayload, Currency } from "@/types/currencyTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CurrencyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: Currency | null
    onSuccess?: () => void
}

export function CurrencyModal({ open, onOpenChange, item, onSuccess }: CurrencyModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateCurrencyPayload>({
        defaultValues: {
            name: "",
            symbol: "",
            exchangeRate: 1,
            status: 1,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                name: item.name,
                symbol: item.symbol,
                exchangeRate: item.exchangeRate,
                status: item.status,
            })
        } else if (open) {
            reset({
                name: "",
                symbol: "",
                exchangeRate: 1,
                status: 1,
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateCurrencyPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updateCurrency(item.id, values)
            } else {
                response = await ApiService.createCurrency(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Currency ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} currency.`)
            }
        } catch (error) {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the currency.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Currency" : "Add Currency"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the currency settings." : "Add a new currency."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Controller
                                control={control}
                                name="name"
                                rules={{ required: "Name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., US Dollar" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Symbol *</Label>
                            <Controller
                                control={control}
                                name="symbol"
                                rules={{ required: "Symbol is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., $" maxLength={5} />
                                        {errors.symbol && (
                                            <p className="text-sm text-destructive">{errors.symbol.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Exchange Rate *</Label>
                            <Controller
                                control={control}
                                name="exchangeRate"
                                rules={{ required: "Exchange rate is required", min: { value: 0, message: "Exchange rate must be 0 or greater" } }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                        {errors.exchangeRate && (
                                            <p className="text-sm text-destructive">{errors.exchangeRate.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status *</Label>
                            <Controller
                                control={control}
                                name="status"
                                rules={{ required: "Status is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Active</SelectItem>
                                                <SelectItem value="0">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && (
                                            <p className="text-sm text-destructive">{errors.status.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
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

