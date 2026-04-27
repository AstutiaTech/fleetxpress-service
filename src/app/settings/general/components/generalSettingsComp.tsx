"use client"

import {
    Building2,
    DollarSign,
    Mail,
    MapPin,
    Percent,
    Phone,
    Save,
    Upload,
    X,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { buildImageUrl } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"
import { useForm } from "react-hook-form"
import { useStore } from "@/providers/store.provider"

interface GeneralSettingsForm {
    applicationName: string
    copyright: string
    phone1: string
    phone2: string
    emailAddress: string
    primaryAddress: string
    location: string
    about: string
    currency: string
    orderTrackingPrefix: string
    orderInvoicePrefix: string
    invoicePrefix: string
    primaryColor: string
    textColor: string
    vat: number
    tax: number
    insurance: number
    insuranceThreshold?: number
    insuranceCalculationMethod?: "declaredValue" | "subtotal" | "both"
    logo: string
    favicon: string
    // Volumetric Weight Settings
    volumetricDivisor?: number
    maxSupportedKg?: number
    overMaxWeightPolicy?: "useHighestTier" | "reject" | "manualOverride"
    missingTierPolicy?: "useNearestLower" | "useNearestHigher" | "error"
    thresholdComparison?: ">" | ">="
}

export const GeneralSettingsComp = observer(() => {
    const { settingsStore, uploadStore } = useStore()
    const [logoPreview, setLogoPreview] = useState<string | null>("/images/logo_full.png")
    const [faviconPreview, setFaviconPreview] = useState<string | null>("/images/logo_icon.png")
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [faviconFile, setFaviconFile] = useState<File | null>(null)
    const [logoUploadId, setLogoUploadId] = useState<string | null>(null)
    const [faviconUploadId, setFaviconUploadId] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<GeneralSettingsForm>({
        defaultValues: {
            applicationName: "FleetXpress",
            copyright: "© 2024 FleetXpress. All rights reserved.",
            phone1: "+1234567890",
            phone2: "+1234567891",
            emailAddress: "contact@3flogistics.com",
            primaryAddress: "123 Main Street, Suite 100",
            location: "Lagos, Nigeria",
            about: "We are a leading logistics company...",
            currency: "NGN",
            orderTrackingPrefix: "TRK",
            orderInvoicePrefix: "ORD",
            invoicePrefix: "INV",
            primaryColor: "#007bff",
            textColor: "#000000",
            vat: 7.5,
            tax: 5,
            insurance: 2.5,
            insuranceThreshold: 0,
            insuranceCalculationMethod: "declaredValue",
            logo: "",
            favicon: "",
            volumetricDivisor: 0,
            maxSupportedKg: 0,
            overMaxWeightPolicy: "useHighestTier",
            missingTierPolicy: "useNearestLower",
            thresholdComparison: ">",
        },
    })

    // Fetch settings on mount - always refresh to get latest
    useEffect(() => {
        const loadSettings = async () => {
            // Always fetch fresh settings when component mounts
            if (!settingsStore.generalSettings) {
                await settingsStore.fetchGeneralSettings(true)
            }
            
            if (settingsStore.generalSettings) {
                const settings = settingsStore.generalSettings
                reset({
                    applicationName: settings.applicationName || "FleetXpress",
                    copyright: settings.copyright || "© 2024 FleetXpress. All rights reserved.",
                    phone1: settings.phone1 || "",
                    phone2: settings.phone2 || "",
                    emailAddress: settings.emailAddress || "",
                    primaryAddress: settings.primaryAddress || "",
                    location: settings.location || "",
                    about: settings.about || "",
                    currency: settings.currency || "NGN",
                    orderTrackingPrefix: settings.orderTrackingPrefix || "TRK",
                    orderInvoicePrefix: settings.orderInvoicePrefix || "ORD",
                    invoicePrefix: settings.invoicePrefix || "INV",
                    primaryColor: settings.primaryColor || "#007bff",
                    textColor: settings.textColor || "#000000",
                    vat: settings.vat || 0,
                    tax: settings.tax || 0,
                    insurance: settings.insurance || 0,
                    insuranceThreshold: settings.insuranceThreshold || 10000,
                    insuranceCalculationMethod: settings.insuranceCalculationMethod || "declaredValue",
                    logo: settings.logo || "",
                    favicon: settings.favicon || "",
                    volumetricDivisor: settings.volumetricDivisor || 5000,
                    maxSupportedKg: settings.maxSupportedKg || 100,
                    overMaxWeightPolicy: settings.overMaxWeightPolicy || "useHighestTier",
                    missingTierPolicy: settings.missingTierPolicy || "useNearestLower",
                    thresholdComparison: settings.thresholdComparison || ">",
                })
                if (settings.logo) {
                    setLogoPreview(buildImageUrl(settings.logo))
                } else {
                    setLogoPreview("/images/logo_full.png")
                }
                if (settings.favicon) {
                    setFaviconPreview(buildImageUrl(settings.favicon))
                } else {
                    setFaviconPreview("/images/logo_icon.png")
                }
            }
        }
        loadSettings()
    }, [settingsStore, reset])

    const watchedLogo = watch("logo")
    const watchedFavicon = watch("favicon")

    useEffect(() => {
        if (watchedLogo && !logoFile) {
            setLogoPreview(watchedLogo ? buildImageUrl(watchedLogo) : "/images/logo_full.png")
        }
    }, [watchedLogo, logoFile])

    useEffect(() => {
        if (watchedFavicon && !faviconFile) {
            setFaviconPreview(watchedFavicon ? buildImageUrl(watchedFavicon) : "/images/logo_icon.png")
        }
    }, [watchedFavicon, faviconFile])

    const validateFile = (file: File): { valid: boolean; error?: string } => {
        // Check file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowedTypes.includes(file.type.toLowerCase())) {
            return {
                valid: false,
                error: "File type not supported. Please upload JPEG, PNG, or WEBP files only.",
            }
        }

        // Check file size (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return {
                valid: false,
                error: "File size exceeds 5MB limit. Please choose a smaller file.",
            }
        }

        return { valid: true }
    }

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file
            const validation = validateFile(file)
            if (!validation.valid) {
                toastUtils.error("Invalid File", validation.error || "Please select a valid image file")
                // Reset the input
                e.target.value = ""
                return
            }

            setLogoFile(file)
            // Show preview immediately
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)

            // Upload the file
            const uploadId = `logo_${Date.now()}`
            setLogoUploadId(uploadId)
            const result = await uploadStore.uploadFile(file, uploadId)
            
            if (result.success && result.data) {
                const uploadedUrl = result.data.url
                setValue("logo", uploadedUrl, { shouldValidate: true, shouldDirty: true })
                setLogoPreview(buildImageUrl(uploadedUrl))
                setLogoFile(null) // Clear file after successful upload
            } else {
                // On error, keep the preview but clear the upload ID
                setLogoUploadId(null)
                setLogoFile(null)
            }
        }
    }

    const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file
            const validation = validateFile(file)
            if (!validation.valid) {
                toastUtils.error("Invalid File", validation.error || "Please select a valid image file")
                // Reset the input
                e.target.value = ""
                return
            }

            setFaviconFile(file)
            // Show preview immediately
            const reader = new FileReader()
            reader.onloadend = () => {
                setFaviconPreview(reader.result as string)
            }
            reader.readAsDataURL(file)

            // Upload the file
            const uploadId = `favicon_${Date.now()}`
            setFaviconUploadId(uploadId)
            const result = await uploadStore.uploadFile(file, uploadId)
            
            if (result.success && result.data) {
                const uploadedUrl = result.data.url
                setValue("favicon", uploadedUrl, { shouldValidate: true, shouldDirty: true })
                setFaviconPreview(buildImageUrl(uploadedUrl))
                setFaviconFile(null) // Clear file after successful upload
            } else {
                // On error, keep the preview but clear the upload ID
                setFaviconUploadId(null)
                setFaviconFile(null)
            }
        }
    }

    const removeLogo = () => {
        setLogoPreview(null)
        setLogoFile(null)
        setValue("logo", "")
        if (logoUploadId) {
            uploadStore.clearUpload(logoUploadId)
            setLogoUploadId(null)
        }
    }

    const removeFavicon = () => {
        setFaviconPreview(null)
        setFaviconFile(null)
        setValue("favicon", "")
        if (faviconUploadId) {
            uploadStore.clearUpload(faviconUploadId)
            setFaviconUploadId(null)
        }
    }

    const onSubmit = async (data: GeneralSettingsForm) => {
        try {
            // Get current form values to ensure uploaded URLs are included
            const currentLogo = watch("logo")
            const currentFavicon = watch("favicon")
            
            // Ensure logo and favicon URLs from uploads are included
            const settingsData: Partial<GeneralSettingsForm> = {
                ...data,
                logo: currentLogo || data.logo || "",
                favicon: currentFavicon || data.favicon || "",
            }
            
            const result = await settingsStore.updateGeneralSettings(settingsData)
            if (result.success && result.data) {
                // Update previews if logo/favicon changed
                if (result.data.logo) {
                    setLogoPreview(buildImageUrl(result.data.logo))
                    setValue("logo", result.data.logo)
                }
                if (result.data.favicon) {
                    setFaviconPreview(buildImageUrl(result.data.favicon))
                    setValue("favicon", result.data.favicon)
                }
            }
        } catch (error) {
            console.error("Error saving settings:", error)
        }
    }

    return (
        <div className="pb-14">
            <DashboardHeader title="General Settings" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - General Information */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Information</CardTitle>
                                <CardDescription>
                                    Basic application information and contact details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="applicationName">
                                        Application Name *
                                    </Label>
                                    <Input
                                        id="applicationName"
                                        {...register("applicationName", {
                                            required: "Application name is required",
                                        })}
                                        leftIcon={<Building2 className="h-4 w-4" />}
                                        placeholder="FleetXpress"
                                        className="pl-8"
                                    />
                                    {errors.applicationName && (
                                        <p className="text-sm text-destructive">
                                            {errors.applicationName.message}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone1">Phone 1 *</Label>
                                        <Input
                                            id="phone1"
                                            type="tel"
                                            {...register("phone1", {
                                                required: "Phone 1 is required",
                                            })}
                                            leftIcon={<Phone className="h-4 w-4" />}
                                            placeholder="+1234567890"
                                            className="pl-8"
                                        />
                                        {errors.phone1 && (
                                            <p className="text-sm text-destructive">
                                                {errors.phone1.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone2">Phone 2</Label>
                                        <Input
                                            id="phone2"
                                            type="tel"
                                            {...register("phone2")}
                                            leftIcon={<Phone className="h-4 w-4" />}
                                            placeholder="+1234567891"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emailAddress">
                                        Email Address *
                                    </Label>
                                    <Input
                                        id="emailAddress"
                                        type="email"
                                        {...register("emailAddress", {
                                            required: "Email address is required",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Invalid email address",
                                            },
                                        })}
                                        leftIcon={<Mail className="h-4 w-4" />}
                                        placeholder="contact@3flogistics.com"
                                        className="pl-8"
                                    />
                                    {errors.emailAddress && (
                                        <p className="text-sm text-destructive">
                                            {errors.emailAddress.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="primaryAddress">
                                        Primary Address *
                                    </Label>
                                    <Input
                                        id="primaryAddress"
                                        {...register("primaryAddress", {
                                            required: "Primary address is required",
                                        })}
                                        leftIcon={<MapPin className="h-4 w-4" />}
                                        placeholder="123 Main Street, Suite 100"
                                        className="pl-8"
                                    />
                                    {errors.primaryAddress && (
                                        <p className="text-sm text-destructive">
                                            {errors.primaryAddress.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <Input
                                        id="location"
                                        {...register("location", {
                                            required: "Location is required",
                                        })}
                                        leftIcon={<MapPin className="h-4 w-4" />}
                                        placeholder="Lagos, Nigeria"
                                        className="pl-8"
                                    />
                                    {errors.location && (
                                        <p className="text-sm text-destructive">
                                            {errors.location.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="about">About</Label>
                                    <Textarea
                                        id="about"
                                        {...register("about")}
                                        placeholder="We are a leading logistics company..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Order & Invoice Settings</CardTitle>
                                <CardDescription>
                                    Configure prefixes for orders and invoices
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency *</Label>
                                        <Input
                                            id="currency"
                                            {...register("currency", {
                                                required: "Currency is required",
                                            })}
                                            leftIcon={
                                                <DollarSign className="h-4 w-4" />
                                            }
                                            placeholder="NGN"
                                            className="pl-8"
                                        />
                                        {errors.currency && (
                                            <p className="text-sm text-destructive">
                                                {errors.currency.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="orderTrackingPrefix">
                                            Order Tracking Prefix
                                        </Label>
                                        <Input
                                            id="orderTrackingPrefix"
                                            {...register("orderTrackingPrefix")}
                                            placeholder="TRK"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="orderInvoicePrefix">
                                            Order Invoice Prefix
                                        </Label>
                                        <Input
                                            id="orderInvoicePrefix"
                                            {...register("orderInvoicePrefix")}
                                            placeholder="ORD"
                                            className="pl-8"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="invoicePrefix">
                                            Invoice Prefix
                                        </Label>
                                        <Input
                                            id="invoicePrefix"
                                            {...register("invoicePrefix")}
                                            placeholder="INV"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Branding & Financial Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Branding & Localization</CardTitle>
                                <CardDescription>
                                    Customize your brand identity
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="copyright">Copyright</Label>
                                    <Textarea
                                        id="copyright"
                                        {...register("copyright")}
                                        placeholder="© 2024 FleetXpress. All rights reserved."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="logo">Logo</Label>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="logo"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={handleLogoChange}
                                                    className="hidden pl-8"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const input = document.getElementById("logo") as HTMLInputElement
                                                        input?.click()
                                                    }}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Choose File
                                                </Button>
                                                {logoPreview && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={removeLogo}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            {logoUploadId && (
                                                <div className="mt-2 space-y-1">
                                                    <Progress 
                                                        value={uploadStore.getUploadProgress(logoUploadId)?.progress || 0} 
                                                        className="h-2"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        {uploadStore.getUploadProgress(logoUploadId)?.status === "uploading" 
                                                            ? `Uploading... ${uploadStore.getUploadProgress(logoUploadId)?.progress || 0}%`
                                                            : uploadStore.getUploadProgress(logoUploadId)?.status === "success"
                                                            ? "Upload complete"
                                                            : uploadStore.getUploadProgress(logoUploadId)?.status === "error"
                                                            ? "Upload failed"
                                                            : ""}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Recommended: 200x50px, PNG or SVG
                                            </p>
                                        </div>
                                        {logoPreview && (
                                            <div className="shrink-0">
                                                <div className="relative w-32 h-16 border rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo preview"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="favicon">Favicon</Label>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="favicon"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={handleFaviconChange}
                                                    className="hidden pl-8"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const input = document.getElementById("favicon") as HTMLInputElement
                                                        input?.click()
                                                    }}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Choose File
                                                </Button>
                                                {faviconPreview && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={removeFavicon}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            {faviconUploadId && (
                                                <div className="mt-2 space-y-1">
                                                    <Progress 
                                                        value={uploadStore.getUploadProgress(faviconUploadId)?.progress || 0} 
                                                        className="h-2"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        {uploadStore.getUploadProgress(faviconUploadId)?.status === "uploading" 
                                                            ? `Uploading... ${uploadStore.getUploadProgress(faviconUploadId)?.progress || 0}%`
                                                            : uploadStore.getUploadProgress(faviconUploadId)?.status === "success"
                                                            ? "Upload complete"
                                                            : uploadStore.getUploadProgress(faviconUploadId)?.status === "error"
                                                            ? "Upload failed"
                                                            : ""}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Recommended: 32x32px, ICO or PNG
                                            </p>
                                        </div>
                                        {faviconPreview && (
                                            <div className="shrink-0">
                                                <div className="relative w-16 h-16 border rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={faviconPreview}
                                                        alt="Favicon preview"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Theme & Colors</CardTitle>
                                <CardDescription>
                                    Customize your application colors
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="primaryColor">
                                            Primary Color
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="primaryColor"
                                                type="color"
                                                {...register("primaryColor")}
                                                className="h-10 w-20 p-1 cursor-pointer pl-8"
                                            />
                                            <Input
                                                {...register("primaryColor")}
                                                placeholder="#007bff"
                                                className="flex-1 pl-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="textColor">
                                            Text Color
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="textColor"
                                                type="color"
                                                {...register("textColor")}
                                                className="h-10 w-20 p-1 cursor-pointer pl-8"
                                            />
                                            <Input
                                                {...register("textColor")}
                                                placeholder="#000000"
                                                className="flex-1 pl-8"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Settings</CardTitle>
                                <CardDescription>
                                    Configure tax, VAT, and insurance rates
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vat">VAT (%)</Label>
                                        <div className="relative">
                                            <Input
                                                id="vat"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                {...register("vat", {
                                                    valueAsNumber: true,
                                                    min: {
                                                        value: 0,
                                                        message:
                                                            "VAT must be 0 or greater",
                                                    },
                                                    max: {
                                                        value: 100,
                                                        message:
                                                            "VAT cannot exceed 100%",
                                                    },
                                                })}
                                                leftIcon={
                                                    <Percent className="h-4 w-4" />
                                                }
                                                placeholder="7.5"
                                                className="pl-8"
                                            />
                                        </div>
                                        {errors.vat && (
                                            <p className="text-sm text-destructive">
                                                {errors.vat.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax">Tax (%)</Label>
                                        <div className="relative">
                                            <Input
                                                id="tax"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                {...register("tax", {
                                                    valueAsNumber: true,
                                                    min: {
                                                        value: 0,
                                                        message:
                                                            "Tax must be 0 or greater",
                                                    },
                                                    max: {
                                                        value: 100,
                                                        message:
                                                            "Tax cannot exceed 100%",
                                                    },
                                                })}
                                                leftIcon={
                                                    <Percent className="h-4 w-4" />
                                                }
                                                placeholder="5"
                                                className="pl-8"
                                            />
                                        </div>
                                        {errors.tax && (
                                            <p className="text-sm text-destructive">
                                                {errors.tax.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="insurance">
                                            Insurance (%)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="insurance"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                {...register("insurance", {
                                                    valueAsNumber: true,
                                                    min: {
                                                        value: 0,
                                                        message:
                                                            "Insurance must be 0 or greater",
                                                    },
                                                    max: {
                                                        value: 100,
                                                        message:
                                                            "Insurance cannot exceed 100%",
                                                    },
                                                })}
                                                leftIcon={
                                                    <Percent className="h-4 w-4" />
                                                }
                                                placeholder="2.5"
                                                className="pl-8"
                                            />
                                        </div>
                                        {errors.insurance && (
                                            <p className="text-sm text-destructive">
                                                {errors.insurance.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="insuranceCalculationMethod">
                                        Insurance Calculation Method
                                    </Label>
                                    <Select
                                        value={watch("insuranceCalculationMethod") || "declaredValue"}
                                        onValueChange={(value: "declaredValue" | "subtotal" | "both") => {
                                            setValue("insuranceCalculationMethod", value, { shouldValidate: true, shouldDirty: true })
                                        }}
                                    >
                                        <SelectTrigger id="insuranceCalculationMethod" className="w-full">
                                            <SelectValue placeholder="Select calculation method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="declaredValue">
                                                Based on Declared Value
                                            </SelectItem>
                                            <SelectItem value="subtotal">
                                                Based on Subtotal
                                            </SelectItem>
                                            <SelectItem value="both">
                                                Based on Both (Declared Value + Subtotal)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Select how insurance should be calculated: based on declared value of goods, subtotal (delivery + extra costs), or both combined.
                                    </p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="insuranceThreshold">
                                        Insurance Threshold (₦)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="insuranceThreshold"
                                            type="number"
                                            step="100"
                                            min="0"
                                            {...register("insuranceThreshold", {
                                                valueAsNumber: true,
                                                min: {
                                                    value: 0,
                                                    message: "Insurance threshold must be 0 or greater",
                                                },
                                            })}
                                            leftIcon={<DollarSign className="h-4 w-4" />}
                                            placeholder="10000"
                                            className="pl-8"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Minimum value required for insurance to be applied. The threshold is compared against the selected calculation method base value (declared value, subtotal, or both).
                                    </p>
                                    {errors.insuranceThreshold && (
                                        <p className="text-sm text-destructive">
                                            {errors.insuranceThreshold.message}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Volumetric Weight Settings</CardTitle>
                                <CardDescription>
                                    Configure volumetric weight calculation and pricing policies
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="volumetricDivisor">
                                            Volumetric Divisor
                                        </Label>
                                        <Input
                                            id="volumetricDivisor"
                                            type="number"
                                            step="1"
                                            min="1"
                                            {...register("volumetricDivisor", {
                                                valueAsNumber: true,
                                                min: {
                                                    value: 1,
                                                    message: "Divisor must be 1 or greater",
                                                },
                                            })}
                                            placeholder="5000"
                                            className="pl-8"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Divisor for calculating volumetric weight (default: 5000)
                                        </p>
                                        {errors.volumetricDivisor && (
                                            <p className="text-sm text-destructive">
                                                {errors.volumetricDivisor.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxSupportedKg">
                                        Max Supported Weight (kg)
                                    </Label>
                                    <Input
                                        id="maxSupportedKg"
                                        type="number"
                                        step="1"
                                        min="1"
                                        {...register("maxSupportedKg", {
                                            valueAsNumber: true,
                                            min: {
                                                value: 1,
                                                message: "Max weight must be 1 or greater",
                                            },
                                        })}
                                        placeholder="100"
                                        className="pl-8"
                                    />
                                    {errors.maxSupportedKg && (
                                        <p className="text-sm text-destructive">
                                            {errors.maxSupportedKg.message}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="overMaxWeightPolicy">
                                            Over Max Weight Policy
                                        </Label>
                                        <select
                                            id="overMaxWeightPolicy"
                                            {...register("overMaxWeightPolicy")}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="useHighestTier">Use Highest Tier</option>
                                            <option value="reject">Reject</option>
                                            <option value="manualOverride">Manual Override</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="missingTierPolicy">
                                            Missing Tier Policy
                                        </Label>
                                        <select
                                            id="missingTierPolicy"
                                            {...register("missingTierPolicy")}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="useNearestLower">Use Nearest Lower</option>
                                            <option value="useNearestHigher">Use Nearest Higher</option>
                                            <option value="error">Error</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="thresholdComparison">
                                        Threshold Comparison
                                    </Label>
                                    <select
                                        id="thresholdComparison"
                                        {...register("thresholdComparison")}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value=">">Greater Than (&gt;)</option>
                                        <option value=">=">Greater Than or Equal (&gt;=)</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || settingsStore.isUpdating}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting || settingsStore.isUpdating ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </form>
        </div>
    )
})
