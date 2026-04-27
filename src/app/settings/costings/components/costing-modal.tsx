"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { CostingRate, CreateCostingRatePayload } from "@/types/costingTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CostingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: CostingRate | null
    onSuccess?: () => void
}

export function CostingModal({ open, onOpenChange, item, onSuccess }: CostingModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateCostingRatePayload>({
        defaultValues: {
            name: "",
            slug: "",
            status: 1,
            insideCharge: 0,
            outsideCharge: 0,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                name: item.name,
                slug: item.slug,
                status: item.status,
                insideCharge: item.insideCharge,
                outsideCharge: item.outsideCharge,
            })
        } else if (open) {
            reset({
                name: "",
                slug: "",
                status: 1,
                insideCharge: 0,
                outsideCharge: 0,
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateCostingRatePayload) => {
        if (!item) {
            toastUtils.error("Error", "Please select an item to edit.")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await ApiService.updateCosting(item.id, values)
            if (response.status && response.data) {
                toastUtils.success("Updated", "Costing setting updated successfully.")
                onSuccess?.()
            } else {
                toastUtils.error("Update Failed", response.message || "Failed to update setting.")
            }
        } catch (error) {
            toastUtils.error("Update Failed", "An error occurred while updating the setting.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Costing Setting" : "Add Costing Setting"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the costing rate settings." : "Create a new costing rate setting."}
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
                                        <Input {...field} placeholder="e.g., Liquid/Fragile" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug *</Label>
                            <Controller
                                control={control}
                                name="slug"
                                rules={{ required: "Slug is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., liquid-fragile" />
                                        {errors.slug && (
                                            <p className="text-sm text-destructive">{errors.slug.message}</p>
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
                        <div className="space-y-2">
                            <Label>Inside Charge (₦) *</Label>
                            <Controller
                                control={control}
                                name="insideCharge"
                                rules={{ required: "Inside charge is required", min: { value: 0, message: "Charge must be 0 or greater" } }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                        {errors.insideCharge && (
                                            <p className="text-sm text-destructive">{errors.insideCharge.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Outside Charge (₦) *</Label>
                            <Controller
                                control={control}
                                name="outsideCharge"
                                rules={{ required: "Outside charge is required", min: { value: 0, message: "Charge must be 0 or greater" } }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                        {errors.outsideCharge && (
                                            <p className="text-sm text-destructive">{errors.outsideCharge.message}</p>
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
                        <Button type="submit" disabled={isSubmitting || !item}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

