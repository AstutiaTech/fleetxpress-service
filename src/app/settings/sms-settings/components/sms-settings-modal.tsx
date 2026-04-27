"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { CreateSmsSettingsPayload, SmsSettings } from "@/types/smsTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SmsSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: SmsSettings | null
    onSuccess?: () => void
}

export function SmsSettingsModal({ open, onOpenChange, item, onSuccess }: SmsSettingsModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateSmsSettingsPayload>({
        defaultValues: {
            provider: "",
            secretKey: "",
            publicKey: "",
            apiKey: "",
            apiUrl: "",
            applicationToken: "",
            applicationId: "",
            username: "",
            password: "",
            status: 1,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                provider: item.provider,
                secretKey: item.secretKey,
                publicKey: item.publicKey,
                apiKey: item.apiKey,
                apiUrl: item.apiUrl,
                applicationToken: item.applicationToken,
                applicationId: item.applicationId,
                username: item.username,
                password: item.password,
                status: item.status,
            })
        } else if (open) {
            reset({
                provider: "",
                secretKey: "",
                publicKey: "",
                apiKey: "",
                apiUrl: "",
                applicationToken: "",
                applicationId: "",
                username: "",
                password: "",
                status: 1,
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateSmsSettingsPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updateSmsSettings(item.id, values)
            } else {
                response = await ApiService.createSmsSettings(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `SMS setting ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} setting.`)
            }
        } catch (error) {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the setting.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit SMS Setting" : "Add SMS Setting"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the SMS provider settings." : "Configure a new SMS provider."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2 space-y-2">
                            <Label>Provider *</Label>
                            <Controller
                                control={control}
                                name="provider"
                                rules={{ required: "Provider is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., Twilio" />
                                        {errors.provider && (
                                            <p className="text-sm text-destructive">{errors.provider.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Secret Key *</Label>
                            <Controller
                                control={control}
                                name="secretKey"
                                rules={{ required: "Secret key is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="password" {...field} />
                                        {errors.secretKey && (
                                            <p className="text-sm text-destructive">{errors.secretKey.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Public Key *</Label>
                            <Controller
                                control={control}
                                name="publicKey"
                                rules={{ required: "Public key is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="password" {...field} />
                                        {errors.publicKey && (
                                            <p className="text-sm text-destructive">{errors.publicKey.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>API Key *</Label>
                            <Controller
                                control={control}
                                name="apiKey"
                                rules={{ required: "API key is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="password" {...field} />
                                        {errors.apiKey && (
                                            <p className="text-sm text-destructive">{errors.apiKey.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label>API URL *</Label>
                            <Controller
                                control={control}
                                name="apiUrl"
                                rules={{ required: "API URL is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="https://api.provider.com" />
                                        {errors.apiUrl && (
                                            <p className="text-sm text-destructive">{errors.apiUrl.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Application Token *</Label>
                            <Controller
                                control={control}
                                name="applicationToken"
                                rules={{ required: "Application token is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="password" {...field} />
                                        {errors.applicationToken && (
                                            <p className="text-sm text-destructive">{errors.applicationToken.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Application ID *</Label>
                            <Controller
                                control={control}
                                name="applicationId"
                                rules={{ required: "Application ID is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="app-123456" />
                                        {errors.applicationId && (
                                            <p className="text-sm text-destructive">{errors.applicationId.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Username *</Label>
                            <Controller
                                control={control}
                                name="username"
                                rules={{ required: "Username is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} />
                                        {errors.username && (
                                            <p className="text-sm text-destructive">{errors.username.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password *</Label>
                            <Controller
                                control={control}
                                name="password"
                                rules={{ required: "Password is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="password" {...field} />
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password.message}</p>
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

