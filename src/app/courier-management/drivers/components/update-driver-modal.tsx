"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { Driver, UpdateDriverPayload } from "@/types/driverTypes"
import { VehicleType } from "@/types/vehicleTypeTypes"
import { WareHouse } from "@/types/warehousesType"
import { toastUtils } from "@/utils/toast-utils"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiService } from "@/lib/api"
import { Progress } from "@/components/ui/progress"

interface UpdateDriverModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    driver: Driver | null
    onSuccess?: () => void
}

export function UpdateDriverModal({ open, onOpenChange, driver, onSuccess }: UpdateDriverModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [imageUrl, setImageUrl] = useState("")
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
    const [warehouses, setWarehouses] = useState<WareHouse[]>([])

    const { control, handleSubmit, reset, formState: { errors, isValid }, watch } = useForm<UpdateDriverPayload>({
        mode: 'onChange',
        defaultValues: {
            name: driver?.name || "",
            email: driver?.email || "",
            picture: driver?.picture || "",
            phoneNumber1: driver?.phoneNumber1 || "",
            phoneNumber2: driver?.phoneNumber2 || "",
            vehicleTypeId: driver?.vehicleTypeId || "",
            warehouseId: driver?.warehouseId || "",
            status: driver?.status ?? 1,
        },
    })

    const watchedPicture = watch("picture")

    useEffect(() => {
        if (driver && open) {
            reset({
                name: driver.name,
                email: driver.email,
                picture: driver.picture,
                phoneNumber1: driver.phoneNumber1,
                phoneNumber2: driver.phoneNumber2,
                vehicleTypeId: driver.vehicleTypeId,
                warehouseId: driver.warehouseId,
                status: driver.status,
            })
            setImageUrl(driver.picture)
        }
    }, [driver, open, reset])

    useEffect(() => {
        loadVehicleTypes()
        loadWarehouses()
    }, [])

    useEffect(() => {
        if (watchedPicture) {
            setImageUrl(watchedPicture)
        }
    }, [watchedPicture])

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

    const loadWarehouses = async () => {
        try {
            const response = await ApiService.getAllWarehouses()
            if (response.status && response.data) {
                setWarehouses(response.data.filter(w => w.status === 1))
            }
        } catch {
            console.error("Failed to load warehouses")
        }
    }

    const handleImageUpload = async (file: File) => {
        setIsUploading(true)
        setUploadProgress(0)
        try {
            const response = await ApiService.uploadFile(file, (progress) => {
                setUploadProgress(progress)
            })
            if (response.status && response.data) {
                setImageUrl(response.data.url)
                reset({ ...watch(), picture: response.data.url })
                toastUtils.success("Uploaded", "Image uploaded successfully.")
            } else {
                toastUtils.error("Upload Failed", response.message || "Failed to upload image.")
            }
        } catch {
            toastUtils.error("Upload Failed", "An error occurred while uploading the image.")
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const onSubmit = async (values: UpdateDriverPayload) => {
        if (!driver) return
        
        setIsSubmitting(true)
        try {
            const response = await ApiService.updateDriver(driver.id, values)
            if (response.status && response.data) {
                toastUtils.success("Updated", "Driver updated successfully.")
                onSuccess?.()
                onOpenChange(false)
                reset()
            } else {
                toastUtils.error("Update Failed", response.message || "Failed to update driver.")
            }
        } catch (error) {
            console.error("Failed to update driver:", error)
            toastUtils.error("Update Failed", "An error occurred while updating the driver.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDisable = async () => {
        if (!driver) return
        
        const newStatus = driver.status === 1 ? 0 : 1
        if (confirm(`Are you sure you want to ${driver.status === 1 ? 'disable' : 'enable'} driver "${driver.name}"?`)) {
            setIsSubmitting(true)
            try {
                const response = await ApiService.updateDriver(driver.id, { status: newStatus })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Driver ${driver.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    onSuccess?.()
                    onOpenChange(false)
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update driver.")
                }
            } catch (error) {
                console.error("Failed to update driver:", error)
                toastUtils.error("Update Failed", "An error occurred while updating the driver.")
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    if (!driver) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Driver</DialogTitle>
                    <DialogDescription>
                        Update the details for {driver.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2 space-y-2">
                            <Label>Name *</Label>
                            <Controller
                                control={control}
                                name="name"
                                rules={{ required: "Name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., John Doe" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Controller
                                control={control}
                                name="email"
                                rules={{ required: "Email is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" } }}
                                render={({ field }) => (
                                    <>
                                        <Input type="email" {...field} placeholder="driver@example.com" />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number 1 *</Label>
                            <Controller
                                control={control}
                                name="phoneNumber1"
                                rules={{ required: "Phone number is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="+2348012345678" />
                                        {errors.phoneNumber1 && (
                                            <p className="text-sm text-destructive">{errors.phoneNumber1.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number 2</Label>
                            <Controller
                                control={control}
                                name="phoneNumber2"
                                render={({ field }) => (
                                    <Input {...field} placeholder="+2348023456789" />
                                )}
                            />
                        </div>
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
                                            onValueChange={field.onChange}
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
                            <Label>Warehouse *</Label>
                            <Controller
                                control={control}
                                name="warehouseId"
                                rules={{ required: "Warehouse is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select warehouse" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((w) => (
                                                    <SelectItem key={w.id} value={w.id}>
                                                        {w.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.warehouseId && (
                                            <p className="text-sm text-destructive">{errors.warehouseId.message}</p>
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
                        <div className="md:col-span-2 space-y-2">
                            <Label>Picture</Label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                handleImageUpload(file)
                                            }
                                        }}
                                        disabled={isUploading}
                                        className="flex-1"
                                    />
                                    {isUploading && (
                                        <div className="flex-1">
                                            <Progress value={uploadProgress} />
                                        </div>
                                    )}
                                </div>
                                {imageUrl && (
                                    <div className="mt-2">
                                        <img src={imageUrl} alt="Driver" className="h-20 w-20 object-cover rounded" />
                                    </div>
                                )}
                            </div>
                            <Controller
                                control={control}
                                name="picture"
                                render={({ field }) => (
                                    <Input type="hidden" {...field} />
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
                            {driver.status === 1 ? "Disable" : "Enable"}
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

