"use client"

import { Controller, useForm } from "react-hook-form"
import { CreateWarehousePayload, WareHouse } from "@/types/warehousesType"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toastUtils } from "@/utils/toast-utils"
import { WarehouseType } from "@/types/warehouseTypeTypes"
import { useStore } from "@/providers/store.provider"

interface WarehouseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: WareHouse | null
    onSuccess?: () => void
}

export function WarehouseModal({ open, onOpenChange, item, onSuccess }: WarehouseModalProps) {
    const { shipmentStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [warehouseTypes, setWarehouseTypes] = useState<WarehouseType[]>([])
    const [states, setStates] = useState<{ id: number; name: string }[]>([])
    const [cities, setCities] = useState<{ id: number; name: string; stateId: number }[]>([])
    const [lgas, setLgas] = useState<{ id: number; name: string; stateId: number }[]>([])
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null)

    const { control, handleSubmit, reset, formState: { errors, isValid }, watch } = useForm<CreateWarehousePayload>({
        mode: 'onChange',
        defaultValues: {
            name: "",
            capacity: 0,
            spaceUsed: 0,
            city: "",
            state: "",
            lga: "",
            hubTypeId: "",
            phoneNumber: "",
            managerId: "",
            longitude: 0,
            latitude: 0,
            emailAddress: "",
            status: 1,
        },
    })

    const watchedState = watch("state")

    useEffect(() => {
        if (open) {
            loadWarehouseTypes()
            loadStates()
        }
    }, [open])

    useEffect(() => {
        if (watchedState && open) {
            const stateObj = states.find(s => s.name === watchedState)
            if (stateObj) {
                setSelectedStateId(stateObj.id)
                loadCities(stateObj.id)
                loadLGAs(stateObj.id)
            }
        }
    }, [watchedState, open, states])

    useEffect(() => {
        if (item && open) {
            reset({
                name: item.name,
                capacity: item.capacity,
                spaceUsed: item.spaceUsed,
                city: item.city,
                state: item.state,
                lga: item.lga,
                hubTypeId: item.hubTypeId,
                phoneNumber: item.phoneNumber,
                managerId: item.managerId,
                longitude: item.longitude,
                latitude: item.latitude,
                emailAddress: item.emailAddress,
                status: item.status,
            })
            const stateObj = states.find(s => s.name === item.state)
            if (stateObj) {
                setSelectedStateId(stateObj.id)
                loadCities(stateObj.id)
                loadLGAs(stateObj.id)
            }
        } else if (open) {
            reset({
                name: "",
                capacity: 0,
                spaceUsed: 0,
                city: "",
                state: "",
                lga: "",
                hubTypeId: "",
                phoneNumber: "",
                managerId: "",
                longitude: 0,
                latitude: 0,
                emailAddress: "",
                status: 1,
            })
            setSelectedStateId(null)
            setCities([])
            setLgas([])
        }
    }, [item, open, reset, states])

    const loadWarehouseTypes = async () => {
        try {
            const response = await ApiService.getAllWarehouseTypes()
            if (response.status && response.data) {
                setWarehouseTypes(response.data.filter(wt => wt.status === 1))
            }
        } catch {
            console.error("Failed to load warehouse types")
        }
    }

    const loadStates = async () => {
        try {
            const statesData = await shipmentStore.fetchStates(0, { limit: 200 })
            setStates(statesData.map(s => ({ id: s.id, name: s.name })))
        } catch {
            console.error("Failed to load states")
        }
    }

    const loadCities = async (stateId: number) => {
        try {
            const response = await ApiService.getCities(stateId, { limit: 1000 })
            if (response.status && response.data) {
                setCities(response.data.map(c => ({ id: c.id, name: c.name, stateId: c.stateId })))
            }
        } catch {
            console.error("Failed to load cities")
        }
    }

    const loadLGAs = async (stateId: number) => {
        try {
            const response = await ApiService.getLgas(stateId, { limit: 1000 })
            if (response.status && response.data) {
                setLgas(response.data.map(l => ({ id: l.id, name: l.name, stateId: l.stateId })))
            }
        } catch {
            console.error("Failed to load LGAs")
        }
    }

    const onSubmit = async (values: CreateWarehousePayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updateWarehouse(item.id, values)
            } else {
                response = await ApiService.createWarehouse(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Warehouse ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} warehouse.`)
            }
        } catch {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the warehouse.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the warehouse information." : "Create a new warehouse."}
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
                                        <Input {...field} placeholder="e.g., Lagos Main Warehouse" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Warehouse Type *</Label>
                            <Controller
                                control={control}
                                name="hubTypeId"
                                rules={{ required: "Warehouse type is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select warehouse type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouseTypes.map((wt) => (
                                                    <SelectItem key={wt.id} value={wt.id}>
                                                        {wt.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.hubTypeId && (
                                            <p className="text-sm text-destructive">{errors.hubTypeId.message}</p>
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
                            <Label>Space Used *</Label>
                            <Controller
                                control={control}
                                name="spaceUsed"
                                rules={{ required: "Space used is required", min: { value: 0, message: "Space used must be 0 or greater" } }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                        {errors.spaceUsed && (
                                            <p className="text-sm text-destructive">{errors.spaceUsed.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>State *</Label>
                            <Controller
                                control={control}
                                name="state"
                                rules={{ required: "State is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value)
                                                reset({ ...watch(), city: "", lga: "" })
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map((s) => (
                                                    <SelectItem key={s.id} value={s.name}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.state && (
                                            <p className="text-sm text-destructive">{errors.state.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>City *</Label>
                            <Controller
                                control={control}
                                name="city"
                                rules={{ required: "City is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value)
                                                reset({ ...watch(), lga: "" })
                                            }}
                                            disabled={!selectedStateId || cities.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select city" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities.map((c) => (
                                                    <SelectItem key={c.id} value={c.name}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.city && (
                                            <p className="text-sm text-destructive">{errors.city.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>LGA *</Label>
                            <Controller
                                control={control}
                                name="lga"
                                rules={{ required: "LGA is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!selectedStateId || lgas.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select LGA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {lgas.map((l) => (
                                                    <SelectItem key={l.id} value={l.name}>
                                                        {l.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.lga && (
                                            <p className="text-sm text-destructive">{errors.lga.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number *</Label>
                            <Controller
                                control={control}
                                name="phoneNumber"
                                rules={{ required: "Phone number is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="+2348012345678" />
                                        {errors.phoneNumber && (
                                            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address *</Label>
                            <Controller
                                control={control}
                                name="emailAddress"
                                rules={{ required: "Email address is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" } }}
                                render={({ field }) => (
                                    <>
                                        <Input type="email" {...field} placeholder="warehouse@example.com" />
                                        {errors.emailAddress && (
                                            <p className="text-sm text-destructive">{errors.emailAddress.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Manager ID *</Label>
                            <Controller
                                control={control}
                                name="managerId"
                                rules={{ required: "Manager ID is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="Manager ID" />
                                        {errors.managerId && (
                                            <p className="text-sm text-destructive">{errors.managerId.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Longitude *</Label>
                            <Controller
                                control={control}
                                name="longitude"
                                rules={{ required: "Longitude is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            placeholder="6.5244"
                                        />
                                        {errors.longitude && (
                                            <p className="text-sm text-destructive">{errors.longitude.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Latitude *</Label>
                            <Controller
                                control={control}
                                name="latitude"
                                rules={{ required: "Latitude is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            placeholder="3.3792"
                                        />
                                        {errors.latitude && (
                                            <p className="text-sm text-destructive">{errors.latitude.message}</p>
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

