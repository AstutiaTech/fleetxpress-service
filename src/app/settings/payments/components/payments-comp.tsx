"use client"

import { ActiveMode, PaymentSettings } from "@/types/paymentTypes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Edit, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { PaymentSettingsModal } from "./payment-settings-modal"
import { format } from "date-fns"
import { maskKey } from "@/utils/payment-key-validator"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"

export const PaymentsComp = observer(() => {
    const [paymentSetting, setPaymentSetting] = useState<PaymentSettings | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        loadPaymentSettings()
    }, [])

    const loadPaymentSettings = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllPaymentSettings()
            if (response.status && response.data) {
                // Only use the first entry if multiple exist
                const settings = response.data
                if (settings.length > 0) {
                    setPaymentSetting(settings[0])
                } else {
                    setPaymentSetting(null)
                }
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch payment settings.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = () => {
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
    }

    const handleSuccess = () => {
        loadPaymentSettings()
        handleModalClose()
    }


    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                    <DashboardHeader title="Payment Settings" />
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader 
                    title="Payment Settings" 
                    rightWidgets={[
                        paymentSetting && (
                            <Button 
                                key="edit" 
                                variant="default" 
                                className="cursor-pointer"
                                onClick={handleEdit}
                            >
                                <Edit className="w-4 h-4 mr-2" /> Edit Settings
                            </Button>
                        )
                    ]} 
                />

                {paymentSetting ? (
                    <>
                        {paymentSetting.status !== 1 && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Payment provider is currently inactive. Activate it to enable payment processing.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Provider Configuration</CardTitle>
                                <CardDescription>
                                    Manage your payment provider settings. Only one payment setting can be configured at a time.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Provider</label>
                                        <p className="text-base font-semibold">{paymentSetting.provider}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Active Mode</label>
                                        <div>
                                            <Badge variant={paymentSetting.activeMode === ActiveMode.LIVE ? "destructive" : "secondary"}>
                                                {paymentSetting.activeMode === ActiveMode.LIVE ? "Live" : "Sandbox"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Secret Key</label>
                                        <p className="text-sm font-mono text-muted-foreground">
                                            {paymentSetting.secretKey ? maskKey(paymentSetting.secretKey) : "Not set"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Public Key</label>
                                        <p className="text-sm font-mono text-muted-foreground">
                                            {paymentSetting.publicKey ? maskKey(paymentSetting.publicKey) : "Not set"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                                        <div>
                                            <Badge variant={paymentSetting.status === 1 ? "default" : "outline"}>
                                                {paymentSetting.status === 1 ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(paymentSetting.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <Button onClick={handleEdit}>
                                        <Edit className="w-4 h-4 mr-2" /> Edit Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Payment Settings Configured</CardTitle>
                            <CardDescription>
                                Configure your payment provider settings to enable payment processing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    No payment settings found. Please create a payment setting to get started.
                                </AlertDescription>
                            </Alert>
                            <div className="mt-4">
                                <Button onClick={() => setIsModalOpen(true)}>
                                    <Edit className="w-4 h-4 mr-2" /> Create Payment Setting
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                <PaymentSettingsModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={paymentSetting}
                    onSuccess={handleSuccess}
                    allowCreate={!paymentSetting} // Only allow create if no setting exists
                />
            </div>
        </PageTransition>
    )
})

export default PaymentsComp

