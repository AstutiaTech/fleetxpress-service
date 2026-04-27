"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { CreateNotificationSettingsPayload, NotificationSettings } from "@/types/notificationTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"

interface NotificationSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: NotificationSettings | null
    onSuccess?: () => void
}

export function NotificationSettingsModal({ open, onOpenChange, item, onSuccess }: NotificationSettingsModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateNotificationSettingsPayload>({
        defaultValues: {
            firebaseServerKey: "",
            firebaseProjectId: "",
        },
    })

    useEffect(() => {
        if (item && open) {
            reset({
                firebaseServerKey: item.firebaseServerKey || "",
                firebaseProjectId: item.firebaseProjectId || "",
            })
        } else if (open) {
            reset({
                firebaseServerKey: "",
                firebaseProjectId: "",
            })
        }
    }, [item, open, reset])

    const onSubmit = async (values: CreateNotificationSettingsPayload) => {
        const firebaseServerKey = values.firebaseServerKey?.trim()
        const firebaseProjectId = values.firebaseProjectId?.trim()
        const payload: CreateNotificationSettingsPayload = {
            firebaseServerKey,
            firebaseProjectId: firebaseProjectId || undefined,
        }

        setIsSubmitting(true)
        try {
            const response = await ApiService.updateNotificationSettings(payload)
            if (response.status && response.data) {
                toastUtils.success("Updated", "Notification settings updated successfully.")
                onSuccess?.()
            } else {
                toastUtils.error("Update Failed", response.message || "Failed to update settings.")
            }
        } catch (error) {
            toastUtils.error("Update Failed", "An error occurred while updating the settings.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Notification Settings</DialogTitle>
                    <DialogDescription>
                        Configure Firebase push notification settings
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Firebase Server Key *</Label>
                            <Controller
                                control={control}
                                name="firebaseServerKey"
                                rules={{
                                    required: "Firebase server key is required",
                                    validate: (value) =>
                                        (value?.trim()?.length || 0) > 0 || "Firebase server key is required",
                                }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="AAAA...your-firebase-server-key" />
                                        {errors.firebaseServerKey && (
                                            <p className="text-sm text-destructive">{errors.firebaseServerKey.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Firebase Project ID</Label>
                            <Controller
                                control={control}
                                name="firebaseProjectId"
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="your-project-id" />
                                        {errors.firebaseProjectId && (
                                            <p className="text-sm text-destructive">{errors.firebaseProjectId.message}</p>
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
                            Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

