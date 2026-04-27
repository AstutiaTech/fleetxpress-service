"use client"

import { Controller, useForm } from "react-hook-form"
import { CreateVehicleTypePayload } from "@/types/vehicleTypeTypes"
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

export default function CreateVehicleTypeForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<CreateVehicleTypePayload>({
        mode: 'onChange',
        defaultValues: {
            name: "",
            size: "",
            status: 1,
        },
    })

    const onSubmit = async (values: CreateVehicleTypePayload) => {
        setIsSubmitting(true)
        try {
            const response = await ApiService.createVehicleType(values)
            if (response.status && response.data) {
                toastUtils.success("Created", "Vehicle type created successfully.")
                router.push("/courier-management/vehicle-types")
            } else {
                toastUtils.error("Creation Failed", response.message || "Failed to create vehicle type.")
            }
        } catch {
            toastUtils.error("Creation Failed", "An error occurred while creating the vehicle type.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Create Vehicle Type" />
                <section className="w-full max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vehicle Type Information</CardTitle>
                            <CardDescription>Enter the details for the new vehicle type</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                        Create Vehicle Type
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

