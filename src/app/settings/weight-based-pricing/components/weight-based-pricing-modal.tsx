"use client"

import { Controller, useForm } from "react-hook-form"
import { WeightBasedPrice, CreateWeightBasedPricePayload, CityType } from "@/types/weightBasedPricingTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toastUtils } from "@/utils/toast-utils"

interface WeightBasedPricingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: WeightBasedPrice | null
    cityType: CityType
    onSuccess?: () => void
}

export function WeightBasedPricingModal({ open, onOpenChange, item, cityType, onSuccess }: WeightBasedPricingModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<CreateWeightBasedPricePayload>({
        mode: 'onChange',
        defaultValues: {
            cityType: cityType,
            category: "",
            weightKg: 0,
            price: 0,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                cityType: item.cityType,
                category: item.category,
                weightKg: item.weightKg,
                price: item.price,
            })
        } else if (open) {
            reset({
                cityType: cityType,
                category: "",
                weightKg: 0,
                price: 0,
            })
        }
    }, [item, open, reset, cityType])

    const onSubmit = async (values: CreateWeightBasedPricePayload) => {
        setIsSubmitting(true)
        try {
            if (item) {
                // Update existing item
                const response = await ApiService.updateWeightBasedPrice(item.id, values)
                if (response.status && response.data) {
                    toastUtils.success("Updated", "Weight-based price updated successfully.")
                    onSuccess?.()
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update price.")
                }
            } else {
                // Create new item
                const response = await ApiService.createWeightBasedPrice(values)
                if (response.status && response.data) {
                    toastUtils.success("Created", "Weight-based price created successfully.")
                    onSuccess?.()
                } else {
                    toastUtils.error("Create Failed", response.message || "Failed to create price.")
                }
            }
        } catch (error) {
            toastUtils.error("Operation Failed", "An error occurred while processing your request.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Weight-Based Price" : "Add Weight-Based Price"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the weight-based pricing tier." : "Create a new weight-based pricing tier. Pricing is stored per category and shared across all routes with the same category."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>City Type *</Label>
                            <Controller
                                control={control}
                                name="cityType"
                                rules={{ required: "City type is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!!item}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select city type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="inside_city">Inside City</SelectItem>
                                                <SelectItem value="outside_city">Outside City</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.cityType && (
                                            <p className="text-sm text-destructive">{errors.cityType.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Controller
                                control={control}
                                name="category"
                                rules={{ required: "Category is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            {...field}
                                            placeholder="e.g., MAINLAND 1"
                                            disabled={!!item}
                                        />
                                        {errors.category && (
                                            <p className="text-sm text-destructive">{errors.category.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Weight (kg) *</Label>
                            <Controller
                                control={control}
                                name="weightKg"
                                rules={{ 
                                    required: "Weight is required", 
                                    min: { value: 0, message: "Weight must be 0 or greater" },
                                    max: { value: 100, message: "Weight must be 100 or less" }
                                }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="1"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            disabled={!!item}
                                            placeholder="0"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Weight in kilograms
                                        </p>
                                        {errors.weightKg && (
                                            <p className="text-sm text-destructive">{errors.weightKg.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Price (₦) *</Label>
                            <Controller
                                control={control}
                                name="price"
                                rules={{ 
                                    required: "Price is required", 
                                    min: { value: 0, message: "Price must be 0 or greater" } 
                                }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            placeholder="0.00"
                                        />
                                        {errors.price && (
                                            <p className="text-sm text-destructive">{errors.price.message}</p>
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
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

