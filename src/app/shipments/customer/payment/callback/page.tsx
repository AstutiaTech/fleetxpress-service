"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { ApiService } from "@/lib/api"
import { PaymentTransaction, PaymentStatus } from "@/types/financialsTypes"
import { PageTransition } from "@/providers/page-transition"
import { DashboardHeader } from "@/components/dashboard-header"
import { formatPrice } from "@/handlers/formatters"
import { toastUtils } from "@/utils/toast-utils"

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [payment, setPayment] = useState<PaymentTransaction | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const paymentId = searchParams.get("paymentId")
        const reference = searchParams.get("reference")

        if (paymentId) {
            checkPaymentStatus(paymentId)
        } else if (reference) {
            // If we only have reference, we might need to search for the payment
            // For now, show an error
            setError("Payment ID not found in callback URL")
            setLoading(false)
        } else {
            setError("Invalid payment callback")
            setLoading(false)
        }
    }, [searchParams])

    const checkPaymentStatus = async (paymentId: string) => {
        try {
            const response = await ApiService.getPaymentById(paymentId)
            if (response.status && response.data) {
                setPayment(response.data)
                if (response.data.status === "COMPLETED") {
                    toastUtils.success("Payment Successful", "Your payment has been processed successfully.")
                } else if (response.data.status === "FAILED") {
                    toastUtils.error("Payment Failed", "Your payment could not be processed.")
                }
            } else {
                setError(response.message || "Failed to retrieve payment status")
            }
        } catch (error) {
            console.error("Failed to check payment status:", error)
            setError("An error occurred while checking payment status")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <PageTransition>
                <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                    <DashboardHeader title="Processing Payment" />
                    <section className="w-full max-w-full">
                        <Card className="max-w-2xl mx-auto">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Checking payment status...</p>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </PageTransition>
        )
    }

    if (error) {
        return (
            <PageTransition>
                <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                    <DashboardHeader title="Payment Error" />
                    <section className="w-full max-w-full">
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <XCircle className="h-5 w-5" />
                                    Payment Error
                                </CardTitle>
                                <CardDescription>{error}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={() => router.push("/shipments/customer/create")}>
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </PageTransition>
        )
    }

    if (!payment) {
        return null
    }

    const isSuccess = payment.status === "COMPLETED"
    const shipment = payment.receivable?.shipment

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title={isSuccess ? "Payment Successful" : "Payment Status"} />
                <section className="w-full max-w-full">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {isSuccess ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        Payment Successful
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        Payment {payment.status}
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {isSuccess
                                    ? "Your payment has been processed successfully."
                                    : `Payment status: ${payment.status}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Transaction Reference</p>
                                <p className="font-mono">{payment.transactionReference}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Amount</p>
                                <p className="text-2xl font-bold">{formatPrice(payment.amount)}</p>
                            </div>
                            {shipment && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Tracking Code</p>
                                    <p className="font-mono text-lg font-bold">{shipment.trackingCode}</p>
                                </div>
                            )}
                            {payment.externalReference && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">External Reference</p>
                                    <p className="font-mono">{payment.externalReference}</p>
                                </div>
                            )}
                            <div className="flex gap-4 pt-4">
                                {isSuccess && shipment && (
                                    <Button onClick={() => router.push(`/shipment-management/shipments/${shipment.id}`)}>
                                        View Shipment
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PageTransition>
    )
}

