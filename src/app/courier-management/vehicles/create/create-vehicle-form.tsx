"use client"

import { Controller, useForm } from "react-hook-form"
import { CreateVehiclePayload } from "@/types/vehicleTypes"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toastUtils } from "@/utils/toast-utils"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/providers/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleType } from "@/types/vehicleTypeTypes"
import { Driver } from "@/types/driverTypes"

export default function CreateVehicleForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])

    const { control, handleSubmit, formState: { errors, isValid }, watch } = useForm<CreateVehiclePayload>({
        mode: 'onChange',
        defaultValues: {
            vehicleTypeId: "",
            registrationNumber: "",
            capacity: 0,
            baseLocation: "",
            driverId: "",
            status: 1,
        },
    })

    const watchedVehicleTypeId = watch("vehicleTypeId")

    useEffect(() => {
        loadVehicleTypes()
        loadDrivers()
    }, [])

    useEffect(() => {
        // Filter drivers by selected vehicle type
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
                // Filter drivers by vehicle type if one is selected
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

    const onSubmit = async (values: CreateVehiclePayload) => {
        setIsSubmitting(true)
        try {
            const response = await ApiService.createVehicle(values)
            if (response.status && response.data) {
                toastUtils.success("Created", "Vehicle created successfully.")
                router.push("/courier-management/vehicles")
            } else {
                toastUtils.error("Creation Failed", response.message || "Failed to create vehicle.")
            }
        } catch {
            toastUtils.error("Creation Failed", "An error occurred while creating the vehicle.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Create Vehicle" />
                <section className="w-full max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vehicle Information</CardTitle>
                            <CardDescription>Enter the details for the new vehicle</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                            // Reset driver when vehicle type changes
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
                                <div className="flex gap-4 pt-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => router.back()}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting || !isValid}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Vehicle
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PageTransition>
    )
}

