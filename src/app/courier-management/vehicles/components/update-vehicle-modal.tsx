"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Vehicle, UpdateVehiclePayload } from "@/types/vehicleTypes"
import { VehicleType } from "@/types/vehicleTypeTypes"
import { Driver } from "@/types/driverTypes"
import { toastUtils } from "@/utils/toast-utils"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiService } from "@/lib/api"

interface UpdateVehicleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vehicle: Vehicle | null
    onSuccess?: () => void
}

export function UpdateVehicleModal({ open, onOpenChange, vehicle, onSuccess }: UpdateVehicleModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])

    const { control, handleSubmit, reset, formState: { errors, isValid }, watch } = useForm<UpdateVehiclePayload>({
        mode: 'onChange',
        defaultValues: {
            vehicleTypeId: vehicle?.vehicleTypeId || "",
            registrationNumber: vehicle?.registrationNumber || "",
            capacity: vehicle?.capacity || 0,
            baseLocation: vehicle?.baseLocation || "",
            driverId: vehicle?.driverId || "",
            status: vehicle?.status ?? 1,
        },
    })

    const watchedVehicleTypeId = watch("vehicleTypeId")

    useEffect(() => {
        if (vehicle && open) {
            reset({
                vehicleTypeId: vehicle.vehicleTypeId,
                registrationNumber: vehicle.registrationNumber,
                capacity: vehicle.capacity,
                baseLocation: vehicle.baseLocation,
                driverId: vehicle.driverId,
                status: vehicle.status,
            })
        }
    }, [vehicle, open, reset])

    useEffect(() => {
        loadVehicleTypes()
        loadDrivers()
    }, [])

    useEffect(() => {
        if (watchedVehicleTypeId) {
            loadDrivers()
        }
    }, [watchedVehicleTypeId])

    const loadVehicleTypes = async () => {
        try {
            const response = await ApiService.getAllVehicleTypes()
            if (response.status && response.data) {
                setVehicleTypes(response.data.filter(vt => vt.status === 1))
            }
        } catch {
            console.error("Failed to load vehicle types")
        }
    }

    const loadDrivers = async () => {
        try {
            const response = await ApiService.getAllDrivers()
            if (response.status && response.data) {
                let filteredDrivers = response.data.filter(d => d.status === 1)
                if (watchedVehicleTypeId) {
                    filteredDrivers = filteredDrivers.filter(d => d.vehicleTypeId === watchedVehicleTypeId)
                }
                setDrivers(filteredDrivers)
            }
        } catch {
            console.error("Failed to load drivers")
        }
    }

    const onSubmit = async (values: UpdateVehiclePayload) => {
        if (!vehicle) return
        
        setIsSubmitting(true)
        try {
            const response = await ApiService.updateVehicle(vehicle.id, values)
            if (response.status && response.data) {
                toastUtils.success("Updated", "Vehicle updated successfully.")
                onSuccess?.()
                onOpenChange(false)
                reset()
            } else {
                toastUtils.error("Update Failed", response.message || "Failed to update vehicle.")
            }
        } catch (error) {
            console.error("Failed to update vehicle:", error)
            toastUtils.error("Update Failed", "An error occurred while updating the vehicle.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDisable = async () => {
        if (!vehicle) return
        
        const newStatus = vehicle.status === 1 ? 0 : 1
        if (confirm(`Are you sure you want to ${vehicle.status === 1 ? 'disable' : 'enable'} vehicle "${vehicle.registrationNumber}"?`)) {
            setIsSubmitting(true)
            try {
                const response = await ApiService.updateVehicle(vehicle.id, { status: newStatus })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Vehicle ${vehicle.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    onSuccess?.()
                    onOpenChange(false)
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update vehicle.")
                }
            } catch (error) {
                console.error("Failed to update vehicle:", error)
                toastUtils.error("Update Failed", "An error occurred while updating the vehicle.")
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    if (!vehicle) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Vehicle</DialogTitle>
                    <DialogDescription>
                        Update the details for {vehicle.registrationNumber}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Vehicle Type *</Label>
                            <Controller
                                control={control}
                                name="vehicleTypeId"
                                rules={{ required: "Vehicle type is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value)
                                                control._formValues.driverId = ""
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select vehicle type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicleTypes.map((vt) => (
                                                    <SelectItem key={vt.id} value={vt.id}>
                                                        {vt.name} ({vt.size})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.vehicleTypeId && (
                                            <p className="text-sm text-destructive">{errors.vehicleTypeId.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Registration Number *</Label>
                            <Controller
                                control={control}
                                name="registrationNumber"
                                rules={{ required: "Registration number is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., ABC-123-XY" />
                                        {errors.registrationNumber && (
                                            <p className="text-sm text-destructive">{errors.registrationNumber.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity *</Label>
                            <Controller
                                control={control}
                                name="capacity"
                                rules={{ required: "Capacity is required", min: { value: 0, message: "Capacity must be 0 or greater" } }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                        {errors.capacity && (
                                            <p className="text-sm text-destructive">{errors.capacity.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Base Location *</Label>
                            <Controller
                                control={control}
                                name="baseLocation"
                                rules={{ required: "Base location is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., Lagos" />
                                        {errors.baseLocation && (
                                            <p className="text-sm text-destructive">{errors.baseLocation.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Driver *</Label>
                            <Controller
                                control={control}
                                name="driverId"
                                rules={{ required: "Driver is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!watchedVehicleTypeId || drivers.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select driver" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {drivers.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.name} ({d.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.driverId && (
                                            <p className="text-sm text-destructive">{errors.driverId.message}</p>
                                        )}
                                        {watchedVehicleTypeId && drivers.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No drivers available for this vehicle type</p>
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
                            {vehicle.status === 1 ? "Disable" : "Enable"}
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

