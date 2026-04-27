"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { City, CreateCityPayload } from "@/types/geoTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CityModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: City | null
    onSuccess?: () => void
    states: { id: number; name: string }[]
}

export function CityModal({ open, onOpenChange, item, onSuccess, states }: CityModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateCityPayload>({
        defaultValues: {
            stateId: 0,
            name: "",
            longitude: 0,
            latitude: 0,
            status: 1,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                stateId: item.stateId,
                name: item.name,
                longitude: item.longitude,
                latitude: item.latitude,
                status: item.status,
            })
        } else if (open) {
            reset({
                stateId: states[0]?.id || 0,
                name: "",
                longitude: 0,
                latitude: 0,
                status: 1,
            })
        }
    }, [item, open, reset, states])

    const onSubmit = async (values: CreateCityPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updateCity(item.id, values)
            } else {
                response = await ApiService.createCity(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `City ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} city.`)
            }
        } catch (error) {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the city.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit City" : "Add City"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the city information." : "Add a new city."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>State *</Label>
                            <Controller
                                control={control}
                                name="stateId"
                                rules={{ required: "State is required", min: { value: 1, message: "Please select a state" } }}
                                render={({ field }) => (
                                    <>
                                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map((state) => (
                                                    <SelectItem key={state.id} value={state.id.toString()}>
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.stateId && (
                                            <p className="text-sm text-destructive">{errors.stateId.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Controller
                                control={control}
                                name="name"
                                rules={{ required: "Name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., Ikeja" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
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
                                            />
                                            {errors.latitude && (
                                                <p className="text-sm text-destructive">{errors.latitude.message}</p>
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
                                            />
                                            {errors.longitude && (
                                                <p className="text-sm text-destructive">{errors.longitude.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>
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

