"use client"

import { Controller, useForm } from "react-hook-form"
import { CreateStaffPayload, StaffUser } from "@/types/staffTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { ApiErrorData } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { GooglePlacesInput } from "@/components/google-places-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { StaffRole } from "@/types/staffTypes"
import { toastUtils } from "@/utils/toast-utils"
import { useStore } from "@/providers/store.provider"

interface StaffModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: StaffUser | null
    onSuccess?: () => void
}

const STAFF_ROLES: StaffRole[] = ["superadmin", "admin", "manager", "agent"]

export function StaffModal({ open, onOpenChange, item, onSuccess }: StaffModalProps) {
    const { shipmentStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [imageUrl, setImageUrl] = useState("")
    const [countries, setCountries] = useState<{ id: number; name: string }[]>([])

    const { control, handleSubmit, reset, setValue, formState: { errors, isValid }, watch } = useForm<CreateStaffPayload>({
        mode: 'onChange',
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            address: "",
            country: "",
            profilePicture: "",
            email: "",
            role: "admin",
            isEmailVerified: false,
        },
    })

    const watchedProfilePicture = watch("profilePicture")

    useEffect(() => {
        if (open) {
            loadCountries()
        }
    }, [open])


    useEffect(() => {
        if (watchedProfilePicture) {
            setImageUrl(watchedProfilePicture)
        }
    }, [watchedProfilePicture])

    useEffect(() => {
        if (item && open) {
            reset({
                firstName: item.profile?.firstName || "",
                lastName: item.profile?.lastName || "",
                phone: item.profile?.phone || "",
                address: item.profile?.address || "",
                country: item.profile?.country || "",
                profilePicture: item.profile?.profilePicture || "",
                email: item.email || "",
                role: item.staff?.role || "admin",
                isEmailVerified: item.isEmailVerified || false,
            })
            setImageUrl(item.profile?.profilePicture || "")
        } else if (open) {
            reset({
                firstName: "",
                lastName: "",
                phone: "",
                address: "",
                country: "",
                profilePicture: "",
                email: "",
                role: "admin",
                isEmailVerified: false,
            })
            setImageUrl("")
        }
    }, [item, open, reset])

    const loadCountries = async () => {
        try {
            const countriesData = await shipmentStore.fetchCountries({ limit: 200 })
            setCountries(countriesData.map(c => ({ id: c.id, name: c.name })))
        } catch {
            console.error("Failed to load countries")
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
                setValue("profilePicture", response.data.url)
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

    const onSubmit = async (values: CreateStaffPayload) => {
        setIsSubmitting(true)
        try {
            const payload: CreateStaffPayload = {
                firstName: values.firstName,
                lastName: values.lastName,
                phone: values.phone,
                email: values.email,
                role: values.role,
                isEmailVerified: values.isEmailVerified,
            }

            // Only include address if it has a value
            if (values.address && values.address.trim()) {
                payload.address = values.address
            }

            // Only include country if it has a value
            if (values.country && values.country.trim()) {
                payload.country = values.country
            }

            // Include profile picture URL if it has a value
            if (values.profilePicture && values.profilePicture.trim()) {
                payload.profilePicture = values.profilePicture
            }

            let response
            if (item) {
                response = await ApiService.updateStaff(item.id, payload)
            } else {
                response = await ApiService.createStaff(payload)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Staff ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.response?.message || `Failed to ${item ? "update" : "create"} staff.`)
            }
        } catch (error: unknown) {
            const errorData: any = error as ApiErrorData
            toastUtils.error(item ? "Update Failed" : "Creation Failed", errorData.response?.data?.data?.message || `Failed to ${item ? "update" : "create"} staff.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Staff" : "Add Staff"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the staff member information." : "Create a new staff member."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>First Name *</Label>
                            <Controller
                                control={control}
                                name="firstName"
                                rules={{ required: "First name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="John" />
                                        {errors.firstName && (
                                            <p className="text-sm text-destructive">{errors.firstName.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name *</Label>
                            <Controller
                                control={control}
                                name="lastName"
                                rules={{ required: "Last name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="Doe" />
                                        {errors.lastName && (
                                            <p className="text-sm text-destructive">{errors.lastName.message}</p>
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
                                        <Input type="email" {...field} placeholder="admin@example.com" />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone *</Label>
                            <Controller
                                control={control}
                                name="phone"
                                rules={{ required: "Phone is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="+2348012345678" />
                                        {errors.phone && (
                                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role *</Label>
                            <Controller
                                control={control}
                                name="role"
                                rules={{ required: "Role is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STAFF_ROLES.map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.role && (
                                            <p className="text-sm text-destructive">{errors.role.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Verified</Label>
                            <Controller
                                control={control}
                                name="isEmailVerified"
                                render={({ field }) => (
                                    <Select
                                        value={field.value ? "true" : "false"}
                                        onValueChange={(value) => field.onChange(value === "true")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select verification status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Verified</SelectItem>
                                            <SelectItem value="false">Not Verified</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label>Address</Label>
                            <Controller
                                control={control}
                                name="address"
                                render={({ field }) => (
                                    <GooglePlacesInput
                                        value={field.value || ""}
                                        onValueChange={field.onChange}
                                        onPlaceResolved={(payload) => {
                                            field.onChange(payload.address)
                                            // Extract and set country from Google Places components
                                            if (payload.components?.country) {
                                                const countryName = payload.components.country
                                                // Find matching country in our list
                                                const matchedCountry = countries.find(
                                                    c => c.name.toLowerCase() === countryName.toLowerCase() ||
                                                    countryName.toLowerCase().includes(c.name.toLowerCase()) ||
                                                    c.name.toLowerCase().includes(countryName.toLowerCase())
                                                )
                                                if (matchedCountry) {
                                                    setValue("country", matchedCountry.name)
                                                } else {
                                                    // If not found in list, set directly
                                                    setValue("country", countryName)
                                                }
                                            }
                                        }}
                                        onCoordinatesCleared={() => {}}
                                        placeholder="Search for address"
                                        error={errors.address?.message}
                                    />
                                )}
                            />
                            {errors.address && (
                                <p className="text-sm text-destructive">{errors.address.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Controller
                                control={control}
                                name="country"
                                render={({ field }) => (
                                    <Select
                                        value={field.value || ""}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map((c) => (
                                                <SelectItem key={c.id} value={c.name}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label>Profile Picture</Label>
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
                                        <img src={imageUrl} alt="Profile" className="h-20 w-20 object-cover rounded" />
                                    </div>
                                )}
                            </div>
                            <Controller
                                control={control}
                                name="profilePicture"
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

