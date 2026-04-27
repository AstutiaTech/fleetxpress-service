"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { CreateCustomerPayload, CustomerUser } from "@/types/auth"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useStore } from "@/providers/store.provider"

interface CustomerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: CustomerUser | null
    onSuccess?: () => void
}

export function CustomerModal({ open, onOpenChange, item, onSuccess }: CustomerModalProps) {
    const { shipmentStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [imageUrl, setImageUrl] = useState("")
    const [countries, setCountries] = useState<{ id: number; name: string }[]>([])
    const [states, setStates] = useState<{ id: number; name: string; countryId: number }[]>([])
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)

    const { control, handleSubmit, reset, formState: { errors, isValid }, watch } = useForm<CreateCustomerPayload>({
        mode: 'onChange',
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            country: "",
            profilePicture: "",
            email: "",
            isEmailVerified: false,
            status: 1,
        },
    })

    const watchedCountry = watch("country")
    const watchedProfilePicture = watch("profilePicture")

    useEffect(() => {
        if (open) {
            loadCountries()
        }
    }, [open])

    useEffect(() => {
        if (watchedCountry && open) {
            const countryObj = countries.find(c => c.name === watchedCountry)
            if (countryObj) {
                setSelectedCountryId(countryObj.id)
                loadStates(countryObj.id)
            }
        }
    }, [watchedCountry, open, countries])

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
                city: item.profile?.city || "",
                state: item.profile?.state || "",
                zip: item.profile?.zip || "",
                country: item.profile?.country || "",
                profilePicture: item.profile?.profilePicture || "",
                email: item.email || "",
                isEmailVerified: item.isEmailVerified || false,
                status: item.status || 1,
            })
            setImageUrl(item.profile?.profilePicture || "")
            const countryObj = countries.find(c => c.name === item.profile?.country)
            if (countryObj) {
                setSelectedCountryId(countryObj.id)
                loadStates(countryObj.id)
            }
        } else if (open) {
            reset({
                firstName: "",
                lastName: "",
                phone: "",
                address: "",
                city: "",
                state: "",
                zip: "",
                country: "",
                profilePicture: "",
                email: "",
                isEmailVerified: false,
                status: 1,
            })
            setImageUrl("")
            setSelectedCountryId(null)
            setStates([])
        }
    }, [item, open, reset, countries])

    const loadCountries = async () => {
        try {
            const countriesData = await shipmentStore.fetchCountries({ limit: 200 })
            setCountries(countriesData.map(c => ({ id: c.id, name: c.name })))
        } catch {
            console.error("Failed to load countries")
        }
    }

    const loadStates = async (countryId: number) => {
        try {
            const response = await ApiService.getStates(countryId, { limit: 1000 })
            if (response.status && response.data) {
                setStates(response.data.map(s => ({ id: s.id, name: s.name, countryId: s.countryId })))
            }
        } catch {
            console.error("Failed to load states")
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
                reset({ ...watch(), profilePicture: response.data.url })
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

    const onSubmit = async (values: CreateCustomerPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                // TODO: Add updateCustomer API method if needed
                toastUtils.error("Update Not Available", "Customer update functionality is not yet implemented.")
                setIsSubmitting(false)
                return
            } else {
                response = await ApiService.createCustomer(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Customer ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} customer.`)
            }
        } catch {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the customer.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Customer" : "Add Customer"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the customer information." : "Create a new customer."}
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
                                        <Input type="email" {...field} placeholder="john.doe@example.com" />
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
                        <div className="md:col-span-2 space-y-2">
                            <Label>Address *</Label>
                            <Controller
                                control={control}
                                name="address"
                                rules={{ required: "Address is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="123 Main Street" />
                                        {errors.address && (
                                            <p className="text-sm text-destructive">{errors.address.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Country *</Label>
                            <Controller
                                control={control}
                                name="country"
                                rules={{ required: "Country is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value)
                                                reset({ ...watch(), state: "", city: "" })
                                            }}
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
                                        {errors.country && (
                                            <p className="text-sm text-destructive">{errors.country.message}</p>
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
                                            onValueChange={field.onChange}
                                            disabled={!selectedCountryId || states.length === 0}
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
                                        <Input {...field} placeholder="Lagos" />
                                        {errors.city && (
                                            <p className="text-sm text-destructive">{errors.city.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ZIP Code *</Label>
                            <Controller
                                control={control}
                                name="zip"
                                rules={{ required: "ZIP code is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="100001" />
                                        {errors.zip && (
                                            <p className="text-sm text-destructive">{errors.zip.message}</p>
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

