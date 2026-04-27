"use client"

import { ActiveMode, CreatePaymentSettingsPayload, PaymentSettings, UpdatePaymentSettingsPayload } from "@/types/paymentTypes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toastUtils } from "@/utils/toast-utils"
import { validatePaystackKey } from "@/utils/payment-key-validator"

interface PaymentSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: PaymentSettings | null
    onSuccess?: () => void
    allowCreate?: boolean // If false, only allow updates
}

export function PaymentSettingsModal({ open, onOpenChange, item, onSuccess, allowCreate = true }: PaymentSettingsModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSecretKey, setShowSecretKey] = useState(false)
    const [showPublicKey, setShowPublicKey] = useState(false)
    const [showLiveModeWarning, setShowLiveModeWarning] = useState(false)
    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<CreatePaymentSettingsPayload>({
        defaultValues: {
            provider: "",
            secretKey: "",
            publicKey: "",
            activeMode: ActiveMode.SANDBOX,
            status: 1,
        },
    })

    const watchedActiveMode = watch("activeMode")
    const watchedProvider = watch("provider")

    useEffect(() => {
        if (item && open) {
            reset({
                provider: item.provider,
                secretKey: item.secretKey || "",
                publicKey: item.publicKey || "",
                activeMode: item.activeMode || ActiveMode.SANDBOX,
                status: item.status ?? 1,
            })
        } else if (open) {
            reset({
                provider: "",
                secretKey: "",
                publicKey: "",
                activeMode: ActiveMode.SANDBOX,
                status: 1,
            })
        }
        setShowSecretKey(false)
        setShowPublicKey(false)
        setShowLiveModeWarning(false)
    }, [item, open, reset])

    useEffect(() => {
        if (watchedActiveMode === ActiveMode.LIVE && !item) {
            setShowLiveModeWarning(true)
        } else {
            setShowLiveModeWarning(false)
        }
    }, [watchedActiveMode, item])

    const onSubmit = async (values: CreatePaymentSettingsPayload) => {
        // Prevent creating new entries if not allowed
        if (!item && !allowCreate) {
            toastUtils.error("Creation Not Allowed", "Only one payment setting can exist. Please update the existing setting instead.")
            return
        }

        // For new settings, require at least one key
        if (!item) {
            if (!values.secretKey && !values.publicKey) {
                toastUtils.error("Validation Failed", "At least one key (Secret or Public) is required when creating a new payment setting.")
                return
            }
        }

        // Validate Paystack keys if provider is Paystack
        if (values.provider?.toLowerCase().includes('paystack')) {
            if (values.secretKey && !validatePaystackKey(values.secretKey, 'secret')) {
                toastUtils.error("Validation Failed", "Invalid Paystack secret key format. It should start with 'sk_test_' or 'sk_live_'")
                return
            }
            if (values.publicKey && !validatePaystackKey(values.publicKey, 'public')) {
                toastUtils.error("Validation Failed", "Invalid Paystack public key format. It should start with 'pk_test_' or 'pk_live_'")
                return
            }
        }

        // Clean up empty strings to undefined for optional fields
        const cleanedValues: CreatePaymentSettingsPayload = {
            ...values,
            secretKey: values.secretKey?.trim() || undefined,
            publicKey: values.publicKey?.trim() || undefined,
        }

        // Confirm if switching to Live mode
        if (values.activeMode === ActiveMode.LIVE && (!item || item.activeMode !== ActiveMode.LIVE)) {
            const confirmed = window.confirm(
                "⚠️ Warning: You are about to switch to LIVE mode. This will use real payment credentials and process actual transactions. Are you sure you want to continue?"
            )
            if (!confirmed) {
                return
            }
        }

        setIsSubmitting(true)
        try {
            let response
            if (item) {
                // For updates, only send changed fields
                const updatePayload: UpdatePaymentSettingsPayload = {}
                if (cleanedValues.provider !== item.provider) updatePayload.provider = cleanedValues.provider
                if (cleanedValues.secretKey && cleanedValues.secretKey !== item.secretKey) updatePayload.secretKey = cleanedValues.secretKey
                if (cleanedValues.publicKey && cleanedValues.publicKey !== item.publicKey) updatePayload.publicKey = cleanedValues.publicKey
                if (cleanedValues.activeMode !== item.activeMode) updatePayload.activeMode = cleanedValues.activeMode
                if (cleanedValues.status !== item.status) updatePayload.status = cleanedValues.status
                
                response = await ApiService.updatePaymentSettings(item.id, updatePayload)
            } else {
                response = await ApiService.createPaymentSettings(cleanedValues)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Payment setting ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} setting.`)
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.response || error?.message || `An error occurred while ${item ? "updating" : "creating"} the setting.`
            toastUtils.error(item ? "Update Failed" : "Creation Failed", errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Payment Setting" : "Add Payment Setting"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the payment provider settings." : "Configure a new payment provider."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Provider *</Label>
                            <Controller
                                control={control}
                                name="provider"
                                rules={{ required: "Provider is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., Paystack" />
                                        {errors.provider && (
                                            <p className="text-sm text-destructive">{errors.provider.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <Controller
                                control={control}
                                name="secretKey"
                                render={({ field }) => (
                                    <div className="relative">
                                        <Input 
                                            type={showSecretKey ? "text" : "password"} 
                                            {...field} 
                                            placeholder="sk_test_..." 
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowSecretKey(!showSecretKey)}
                                        >
                                            {showSecretKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty to keep existing key</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Public Key</Label>
                            <Controller
                                control={control}
                                name="publicKey"
                                render={({ field }) => (
                                    <div className="relative">
                                        <Input 
                                            type={showPublicKey ? "text" : "password"} 
                                            {...field} 
                                            placeholder="pk_test_..." 
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowPublicKey(!showPublicKey)}
                                        >
                                            {showPublicKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty to keep existing key</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Active Mode</Label>
                            <Controller
                                control={control}
                                name="activeMode"
                                render={({ field }) => (
                                    <>
                                        <Select onValueChange={field.onChange} value={field.value || ActiveMode.SANDBOX}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ActiveMode.SANDBOX}>Sandbox</SelectItem>
                                                <SelectItem value={ActiveMode.LIVE}>Live</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {field.value === ActiveMode.LIVE && (
                                            <Alert className="mt-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription className="text-xs">
                                                    Live mode uses real payment credentials. Ensure your keys are correct.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Status</Label>
                                <Controller
                                    control={control}
                                    name="status"
                                    render={({ field }) => (
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">
                                                {field.value === 1 ? "Active" : "Inactive"}
                                            </span>
                                            <Switch
                                                checked={field.value === 1}
                                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
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

