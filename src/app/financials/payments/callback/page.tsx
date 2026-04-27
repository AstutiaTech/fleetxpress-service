"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { ApiService } from "@/lib/api"
import { PaymentTransaction } from "@/types/financialsTypes"
import { formatPrice } from "@/handlers/formatters"
import { PageTransition } from "@/providers/page-transition"

type PaymentCallbackStatus = "checking" | "success" | "failed" | "pending"

export default function PaymentCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<PaymentCallbackStatus>("checking")
    const [payment, setPayment] = useState<PaymentTransaction | null>(null)

    useEffect(() => {
        const checkPaymentStatus = async () => {
            try {
                // Get payment ID from URL or sessionStorage
                const paymentId = searchParams?.get("paymentId") || (typeof window !== "undefined" ? sessionStorage.getItem("pendingPaymentId") : null)

                if (!paymentId) {
                    setStatus("failed")
                    return
                }

                // Poll payment status
                const pollInterval = setInterval(async () => {
                    try {
                        const response = await ApiService.getPaymentById(paymentId)
                        if (response.status && response.data) {
                            const paymentData = response.data

                            setPayment(paymentData)

                            if (paymentData.status === "COMPLETED") {
                                clearInterval(pollInterval)
                                setStatus("success")
                                sessionStorage.removeItem("pendingPaymentId")

                                // Redirect after 3 seconds
                                setTimeout(() => {
                                    if (paymentData.receivableId) {
                                        router.push(`/financials/receivables/${paymentData.receivableId}`)
                                    } else if (paymentData.payableId) {
                                        router.push(`/financials/payables/${paymentData.payableId}`)
                                    } else {
                                        router.push(`/financials/payments/${paymentData.id}`)
                                    }
                                }, 3000)
                            } else if (paymentData.status === "FAILED" || paymentData.status === "CANCELLED") {
                                clearInterval(pollInterval)
                                setStatus("failed")
                            }
                        }
                    } catch (error) {
                        console.error("Error checking payment status:", error)
                    }
                }, 2000) // Poll every 2 seconds

                // Stop polling after 60 seconds
                setTimeout(() => {
                    clearInterval(pollInterval)
                    if (status === "checking") {
                        setStatus("pending")
                    }
                }, 60000)

                return () => clearInterval(pollInterval)
            } catch (error) {
                setStatus("failed")
            }
        }

        checkPaymentStatus()
    }, [searchParams, router, status])

    return (
        <PageTransition>
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                        <CardDescription>Verifying your payment...</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status === "checking" && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-center text-muted-foreground">Verifying payment status...</p>
                            </div>
                        )}

                        {status === "success" && payment && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                                <h2 className="text-2xl font-bold">Payment Successful!</h2>
                                <div className="w-full space-y-2 text-center">
                                    <p className="text-sm text-muted-foreground">Payment Reference:</p>
                                    <p className="font-mono font-medium">{payment.transactionReference}</p>
                                    <p className="text-sm text-muted-foreground">Amount:</p>
                                    <p className="text-2xl font-bold">{formatPrice(payment.amount)}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">Redirecting to invoice...</p>
                            </div>
                        )}

                        {status === "failed" && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <XCircle className="h-12 w-12 text-destructive" />
                                <h2 className="text-2xl font-bold">Payment Failed</h2>
                                <p className="text-center text-muted-foreground">
                                    Your payment could not be processed. Please try again.
                                </p>
                                <Button onClick={() => router.back()}>Go Back</Button>
                            </div>
                        )}

                        {status === "pending" && payment && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <Clock className="h-12 w-12 text-yellow-600" />
                                <h2 className="text-2xl font-bold">Payment Pending</h2>
                                <p className="text-center text-muted-foreground">
                                    Your payment is being processed. Please check back later.
                                </p>
                                <Button onClick={() => router.push(`/financials/payments/${payment.id}`)}>
                                    View Payment
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    )
}

