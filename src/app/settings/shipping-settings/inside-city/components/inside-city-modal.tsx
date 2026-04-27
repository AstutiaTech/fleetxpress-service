"use client"

import { Controller, useForm } from "react-hook-form"
import { CreateInsideCityPayload, InsideCity } from "@/types/insideCityTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toastUtils } from "@/utils/toast-utils"

interface InsideCityModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: InsideCity | null
    onSuccess?: () => void
}

export function InsideCityModal({ open, onOpenChange, item, onSuccess }: InsideCityModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<CreateInsideCityPayload>({
        mode: 'onChange',
        defaultValues: {
            title: "",
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                title: item.title,
            })
        } else if (open) {
            reset({
                title: "",
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateInsideCityPayload) => {
        setIsSubmitting(true)
        try {
            if (item) {
                // Update existing item
                const response = await ApiService.updateInsideCity(item.id, values)
                if (response.status && response.data) {
                    toastUtils.success("Updated", "Inside city route updated successfully.")
                    onSuccess?.()
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update route.")
                }
            } else {
                // Create new item
                const response = await ApiService.createInsideCity(values)
                if (response.status && response.data) {
                    toastUtils.success("Created", "Inside city route created successfully.")
                    onSuccess?.()
                } else {
                    toastUtils.error("Create Failed", response.message || "Failed to create route.")
                }
            }
        } catch {
            toastUtils.error("Operation Failed", "An error occurred while processing your request.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Inside City Route" : "Add Inside City Route"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the inside city route name." : "Create a new inside city route. Pricing is handled through the weight-based pricing system."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Route Title *</Label>
                            <Controller
                                control={control}
                                name="title"
                                rules={{ required: "Title is required" }}
                                render={({ field }) => (
                                    <>
                                    <Input {...field} placeholder="e.g., Ogba - Ikeja" />
                                        {errors.title && (
                                            <p className="text-sm text-destructive">{errors.title.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        <p className="text-xs text-muted-foreground">
                            Note: Pricing is configured separately in Weight-Based Pricing settings.
                        </p>
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
