"use client"

import { Controller, useForm } from "react-hook-form"
import { CreateWarehouseTypePayload, WarehouseType } from "@/types/warehouseTypeTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toastUtils } from "@/utils/toast-utils"

interface WarehouseTypeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: WarehouseType | null
    onSuccess?: () => void
}

export function WarehouseTypeModal({ open, onOpenChange, item, onSuccess }: WarehouseTypeModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<CreateWarehouseTypePayload>({
        mode: 'onChange',
        defaultValues: {
            name: "",
            status: 1,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                name: item.name,
                status: item.status,
            })
        } else if (open) {
            reset({
                name: "",
                status: 1,
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateWarehouseTypePayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updateWarehouseType(item.id, values)
            } else {
                response = await ApiService.createWarehouseType(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Warehouse type ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} warehouse type.`)
            }
        } catch {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the warehouse type.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Warehouse Type" : "Add Warehouse Type"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the warehouse type information." : "Create a new warehouse type."}
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
                                        <Input {...field} placeholder="e.g., Distribution Center" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
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

