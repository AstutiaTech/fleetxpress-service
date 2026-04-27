"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { VehicleType, UpdateVehicleTypePayload } from "@/types/vehicleTypeTypes"
import { toastUtils } from "@/utils/toast-utils"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiService } from "@/lib/api"

interface UpdateVehicleTypeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vehicleType: VehicleType | null
    onSuccess?: () => void
}

export function UpdateVehicleTypeModal({ open, onOpenChange, vehicleType, onSuccess }: UpdateVehicleTypeModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<UpdateVehicleTypePayload>({
        mode: 'onChange',
        defaultValues: {
            name: vehicleType?.name || "",
            size: vehicleType?.size || "",
            status: vehicleType?.status ?? 1,
        },
    })

    // Reset form when vehicleType changes
    useEffect(() => {
        if (vehicleType && open) {
            reset({
                name: vehicleType.name,
                size: vehicleType.size,
                status: vehicleType.status,
            })
        }
    }, [vehicleType, open, reset])

    const onSubmit = async (values: UpdateVehicleTypePayload) => {
        if (!vehicleType) return
        
        setIsSubmitting(true)
        try {
            const response = await ApiService.updateVehicleType(vehicleType.id, values)
            if (response.status && response.data) {
                toastUtils.success("Updated", "Vehicle type updated successfully.")
                onSuccess?.()
                onOpenChange(false)
                reset()
            } else {
                toastUtils.error("Update Failed", response.message || "Failed to update vehicle type.")
            }
        } catch (error) {
            console.error("Failed to update vehicle type:", error)
            toastUtils.error("Update Failed", "An error occurred while updating the vehicle type.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDisable = async () => {
        if (!vehicleType) return
        
        const newStatus = vehicleType.status === 1 ? 0 : 1
        if (confirm(`Are you sure you want to ${vehicleType.status === 1 ? 'disable' : 'enable'} vehicle type "${vehicleType.name}"?`)) {
            setIsSubmitting(true)
            try {
                const response = await ApiService.updateVehicleType(vehicleType.id, { status: newStatus })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Vehicle type ${vehicleType.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    onSuccess?.()
                    onOpenChange(false)
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update vehicle type.")
                }
            } catch (error) {
                console.error("Failed to update vehicle type:", error)
                toastUtils.error("Update Failed", "An error occurred while updating the vehicle type.")
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    if (!vehicleType) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Update Vehicle Type</DialogTitle>
                    <DialogDescription>
                        Update the details for {vehicleType.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Controller
                            control={control}
                            name="name"
                            rules={{ required: "Name is required" }}
                            render={({ field }) => (
                                <>
                                    <Input {...field} placeholder="e.g., Motorcycle" />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name.message}</p>
                                    )}
                                </>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Size *</Label>
                        <Controller
                            control={control}
                            name="size"
                            rules={{ required: "Size is required" }}
                            render={({ field }) => (
                                <>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Small">Small</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Large">Large</SelectItem>
                                            <SelectItem value="Extra Large">Extra Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.size && (
                                        <p className="text-sm text-destructive">{errors.size.message}</p>
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
                                    <Select
                                        value={field.value?.toString()}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                    >
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDisable} 
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {vehicleType.status === 1 ? "Disable" : "Enable"}
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

