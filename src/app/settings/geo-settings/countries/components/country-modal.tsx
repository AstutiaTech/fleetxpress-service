"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Country, CreateCountryPayload } from "@/types/geoTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CountryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: Country | null
    onSuccess?: () => void
}

export function CountryModal({ open, onOpenChange, item, onSuccess }: CountryModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateCountryPayload>({
        defaultValues: {
            name: "",
            code: "",
            isoCode: "",
            capital: "",
            longitude: 0,
            latitude: 0,
            status: 1,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                name: item.name,
                code: item.code,
                isoCode: item.isoCode,
                capital: item.capital,
                longitude: item.longitude,
                latitude: item.latitude,
                status: item.status,
            })
        } else if (open) {
            reset({
                name: "",
                code: "",
                isoCode: "",
                capital: "",
                longitude: 0,
                latitude: 0,
                status: 1,
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateCountryPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updateCountry(item.id, values)
            } else {
                response = await ApiService.createCountry(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Country ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} country.`)
            }
        } catch (error) {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the country.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Country" : "Add Country"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the country information." : "Add a new country."}
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
                                        <Input {...field} placeholder="e.g., Nigeria" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Code *</Label>
                            <Controller
                                control={control}
                                name="code"
                                rules={{ required: "Code is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., NG" maxLength={3} />
                                        {errors.code && (
                                            <p className="text-sm text-destructive">{errors.code.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ISO Code *</Label>
                            <Controller
                                control={control}
                                name="isoCode"
                                rules={{ required: "ISO code is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., NGA" maxLength={3} />
                                        {errors.isoCode && (
                                            <p className="text-sm text-destructive">{errors.isoCode.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Capital *</Label>
                            <Controller
                                control={control}
                                name="capital"
                                rules={{ required: "Capital is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., Abuja" />
                                        {errors.capital && (
                                            <p className="text-sm text-destructive">{errors.capital.message}</p>
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

