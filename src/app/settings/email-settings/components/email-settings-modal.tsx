"use client"

import { Controller, useForm } from "react-hook-form"
import { CreateEmailSettingsPayload, EmailSettings } from "@/types/emailTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toastUtils } from "@/utils/toast-utils"

interface EmailSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: EmailSettings | null
    onSuccess?: () => void
}

export function EmailSettingsModal({ open, onOpenChange, item, onSuccess }: EmailSettingsModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateEmailSettingsPayload>({
        defaultValues: {
            provider: "",
            mailFromName: "",
            mailFromEmail: "",
            apiKey: "",
            mailUser: "",
            mailPassword: "",
            mailHost: "",
            status: 1,
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                provider: item.provider,
                mailFromName: item.mailFromName,
                mailFromEmail: item.mailFromEmail,
                apiKey: item.apiKey,
                mailUser: item.mailUser,
                mailPassword: item.mailPassword,
                mailHost: item.mailHost,
                status: item.status,
            })
        } else if (open) {
            reset({
                provider: "",
                mailFromName: "",
                mailFromEmail: "",
                apiKey: "",
                mailUser: "",
                mailPassword: "",
                mailHost: "",
                status: 1,
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateEmailSettingsPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updateEmailSettings(item.id, values)
            } else {
                response = await ApiService.createEmailSettings(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Email setting ${item ? "updated" : "created"} successfully.`)
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
                    <DialogTitle>{item ? "Edit Email Setting" : "Add Email Setting"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the email provider settings." : "Configure a new email provider."}
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
                                        <Input {...field} placeholder="e.g., SendGrid" />
                                        {errors.provider && (
                                            <p className="text-sm text-destructive">{errors.provider.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>From Name *</Label>
                            <Controller
                                control={control}
                                name="mailFromName"
                                rules={{ required: "From name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., FleetXpress" />
                                        {errors.mailFromName && (
                                            <p className="text-sm text-destructive">{errors.mailFromName.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>From Email *</Label>
                            <Controller
                                control={control}
                                name="mailFromEmail"
                                rules={{ required: "From email is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" } }}
                                render={({ field }) => (
                                    <>
                                        <Input type="email" {...field} placeholder="noreply@3flogistics.com" />
                                        {errors.mailFromEmail && (
                                            <p className="text-sm text-destructive">{errors.mailFromEmail.message}</p>
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
                                        <Input type="password" {...field} placeholder="SG.your-api-key" />
                                        {errors.apiKey && (
                                            <p className="text-sm text-destructive">{errors.apiKey.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mail User *</Label>
                            <Controller
                                control={control}
                                name="mailUser"
                                rules={{ required: "Mail user is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="noreply@3flogistics.com" />
                                        {errors.mailUser && (
                                            <p className="text-sm text-destructive">{errors.mailUser.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mail Password *</Label>
                            <Controller
                                control={control}
                                name="mailPassword"
                                rules={{ required: "Mail password is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="password" {...field} />
                                        {errors.mailPassword && (
                                            <p className="text-sm text-destructive">{errors.mailPassword.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label>Mail Host *</Label>
                            <Controller
                                control={control}
                                name="mailHost"
                                rules={{ required: "Mail host is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="smtp.sendgrid.net" />
                                        {errors.mailHost && (
                                            <p className="text-sm text-destructive">{errors.mailHost.message}</p>
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

