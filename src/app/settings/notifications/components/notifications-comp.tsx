"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { Edit, Eye, EyeOff } from "lucide-react"
import { NotificationSettings } from "@/types/notificationTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { NotificationSettingsModal } from "./notification-settings-modal"

export const NotificationsComp = observer(() => {
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showServerKey, setShowServerKey] = useState(false)

    useEffect(() => {
        loadNotificationSettings()
    }, [])

    const loadNotificationSettings = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getNotificationSettings()
            if (response.status && response.data) {
                setNotificationSettings(response.data)
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch notification settings.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
    }

    const handleSuccess = () => {
        loadNotificationSettings()
        handleModalClose()
    }

    const serverKey = notificationSettings?.firebaseServerKey?.trim() || ""
    const maskedServerKey = serverKey ? `${"*".repeat(Math.min(serverKey.length, 12))}${serverKey.length > 4 ? serverKey.slice(-4) : ""}` : "Not configured"

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader title="Notification Settings" />
                <section className="w-full max-w-full">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Firebase Configuration</CardTitle>
                                    <CardDescription>Configure Firebase push notification settings</CardDescription>
                                    <p className="text-sm text-amber-600 mt-2">
                                        Changing this value affects push delivery for all riders.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    {notificationSettings ? "Edit" : "Configure"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <p className="text-muted-foreground">Loading...</p>
                            ) : notificationSettings ? (
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm font-medium">Firebase Project ID:</span>
                                        <p className="text-sm text-muted-foreground">{notificationSettings.firebaseProjectId || "Not configured"}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium">Firebase Server Key:</span>
                                            {serverKey && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowServerKey((prev) => !prev)}
                                                >
                                                    {showServerKey ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                                    {showServerKey ? "Hide" : "Reveal"}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-mono break-all">
                                            {showServerKey ? serverKey : maskedServerKey}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No notification settings configured. Click "Configure" to set up.</p>
                            )}
                        </CardContent>
                    </Card>
                </section>
                
                <NotificationSettingsModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={notificationSettings}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default NotificationsComp

