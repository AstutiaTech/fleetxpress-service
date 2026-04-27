"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, ExternalLink } from "lucide-react"
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge"
import { PaymentMethodBadge } from "@/components/payments/payment-method-badge"
import { PaymentTypeBadge } from "@/components/payments/payment-type-badge"
import { formatPrice } from "@/handlers/formatters"
import { format } from "date-fns"
import { PaymentTransaction } from "@/types/financialsTypes"
import { UpdatePaymentStatusModal } from "../components/update-payment-status-modal"
import { PaymentHistory } from "@/components/payments/payment-history"

export default observer(function PaymentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { paymentsStore } = useStore()
    const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false)
    const paymentId = params.id as string

    useEffect(() => {
        if (paymentId) {
            paymentsStore.fetchPaymentById(paymentId)
        }
    }, [paymentId, paymentsStore])

    const payment = paymentsStore.currentPayment

    if (paymentsStore.isLoading) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading payment details...</p>
                    </div>
                </div>
            </PageTransition>
        )
    }

    if (!payment) {
        return (
            <PageTransition>
                <div className="flex flex-col gap-4 w-full max-w-full min-h-screen">
                    <DashboardHeader title="Payment Not Found" />
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">The payment you're looking for doesn't exist.</p>
                            <Button onClick={() => router.push("/financials/payments")} className="mt-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Payments
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/financials/payments")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <DashboardHeader title={`Payment ${payment.transactionReference}`} />
                    </div>
                    <div className="flex gap-2">
                        {(payment.status === "PENDING" || payment.status === "PROCESSING") && (
                            <Button onClick={() => setUpdateStatusModalOpen(true)}>
                                Update Status
                            </Button>
                        )}
                        {payment.receivable && (
                            <Button variant="outline" onClick={() => router.push(`/financials/receivables/${payment.receivable?.id}`)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Invoice
                            </Button>
                        )}
                        {payment.payable && (
                            <Button variant="outline" onClick={() => router.push(`/financials/payables/${payment.payable?.id}`)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Bill
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Payment Header */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                            <CardDescription>Transaction details and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <PaymentStatusBadge status={payment.status} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Type:</span>
                                <PaymentTypeBadge type={payment.paymentType} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Amount:</span>
                                <span className="text-lg font-bold">{formatPrice(payment.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Payment Method:</span>
                                <PaymentMethodBadge method={payment.paymentMethod} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Payment Date:</span>
                                <span>
                                    {payment.paymentDate ? (() => {
                                        const date = new Date(payment.paymentDate)
                                        return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy")
                                    })() : "-"}
                                </span>
                            </div>
                            {payment.externalReference && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">External Reference:</span>
                                    <span className="font-mono text-sm">{payment.externalReference}</span>
                                </div>
                            )}
                            {payment.account && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Account:</span>
                                    <span>{payment.account.code} - {payment.account.name}</span>
                                </div>
                            )}
                            {payment.notes && (
                                <div className="pt-2 border-t">
                                    <span className="text-sm font-medium">Notes:</span>
                                    <p className="text-sm text-muted-foreground mt-1">{payment.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Linked Invoice/Bill */}
                    {payment.receivable && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Linked Invoice</CardTitle>
                                <CardDescription>Invoice details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Invoice Number:</span>
                                    <span className="font-medium">{payment.receivable.invoiceNumber}</span>
                                </div>
                                {payment.receivable.customer && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Customer:</span>
                                        <span>{payment.receivable.customer.firstName} {payment.receivable.customer.lastName}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Amount:</span>
                                    <span>{formatPrice(payment.receivable.totalAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Paid Amount:</span>
                                    <span>{formatPrice(payment.receivable.paidAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Balance:</span>
                                    <span className={payment.receivable.balance > 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                                        {formatPrice(payment.receivable.balance)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status:</span>
                                    <Badge variant={payment.receivable.status === "PAID" ? "default" : payment.receivable.status === "OVERDUE" ? "destructive" : "outline"}>
                                        {payment.receivable.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {payment.payable && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Linked Bill</CardTitle>
                                <CardDescription>Bill details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Bill Number:</span>
                                    <span className="font-medium">{payment.payable.billNumber}</span>
                                </div>
                                {payment.payable.driver && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Driver:</span>
                                        <span>{payment.payable.driver.name}</span>
                                    </div>
                                )}
                                {payment.payable.vendor && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Vendor:</span>
                                        <span>{payment.payable.vendor.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Amount:</span>
                                    <span>{formatPrice(payment.payable.totalAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Paid Amount:</span>
                                    <span>{formatPrice(payment.payable.paidAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Balance:</span>
                                    <span className={payment.payable.balance > 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                                        {formatPrice(payment.payable.balance)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status:</span>
                                    <Badge variant={payment.payable.status === "PAID" ? "default" : payment.payable.status === "OVERDUE" ? "destructive" : "outline"}>
                                        {payment.payable.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Payment History */}
                {(payment.receivable?.payments || payment.payable?.payments) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>All payments for this invoice/bill</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentHistory payments={payment.receivable?.payments || payment.payable?.payments || []} />
                        </CardContent>
                    </Card>
                )}

                {/* Timestamps */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Created At:</span>
                            <span className="text-sm text-muted-foreground">{format(new Date(payment.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Updated At:</span>
                            <span className="text-sm text-muted-foreground">{format(new Date(payment.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                        </div>
                        {payment.createdBy && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Created By:</span>
                                <span className="text-sm text-muted-foreground">{payment.createdBy.name}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <UpdatePaymentStatusModal
                    open={updateStatusModalOpen}
                    onOpenChange={setUpdateStatusModalOpen}
                    payment={payment}
                    onSuccess={() => {
                        paymentsStore.fetchPaymentById(paymentId)
                        paymentsStore.fetchAllPayments()
                    }}
                />
            </div>
        </PageTransition>
    )
})

