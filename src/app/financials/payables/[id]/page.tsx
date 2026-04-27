"use client"

import { ArrowLeft, DollarSign, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { Payable } from "@/types/financialsTypes"
import { PayableModal } from "../components/payable-modal"
import { PaymentHistory } from "@/components/payments/payment-history"
import { RecordPayablePaymentModal } from "../components/record-payable-payment-modal"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"
import { useStore } from "@/providers/store.provider"

export default observer(function PayableDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { payablesStore } = useStore()
    const [payable, setPayable] = useState<Payable | null>(null)
    const [loading, setLoading] = useState(true)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)

    const payableId = params.id as string

    useEffect(() => {
        if (payableId) {
            loadPayable()
        }
    }, [payableId])

    const loadPayable = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getPayableById(payableId)
            if (response.status && response.data) {
                setPayable(response.data)
            } else {
                toastUtils.error("Error", response.message || "Failed to load bill")
            }
        } catch (error) {
            console.error("Failed to load payable:", error)
            toastUtils.error("Error", "Failed to load bill")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!payable) return
        if (confirm(`Are you sure you want to delete bill ${payable.billNumber}?`)) {
            const result = await payablesStore.deletePayable(payable.id)
            if (result.success) {
                router.push("/financials/payables")
            }
        }
    }

    if (loading) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading bill details...</p>
                    </div>
                </div>
            </PageTransition>
        )
    }

    if (!payable) {
        return (
            <PageTransition>
                <div className="flex flex-col gap-4 w-full max-w-full min-h-screen">
                    <DashboardHeader title="Bill Not Found" />
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">The bill you're looking for doesn't exist.</p>
                            <Button onClick={() => router.push("/financials/payables")} className="mt-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Bills
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </PageTransition>
        )
    }

    const isOverdue = new Date(payable.dueDate) < new Date() && payable.balance > 0
    const displayStatus = isOverdue ? "OVERDUE" : payable.status

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/financials/payables")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <DashboardHeader title={`Bill ${payable.billNumber}`} />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPaymentModalOpen(true)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Record Payment
                        </Button>
                        {payable.status !== "PAID" && (
                            <>
                                <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button variant="outline" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Bill Header */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Bill Information</CardTitle>
                            <CardDescription>Bill details and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <Badge variant={displayStatus === "PAID" ? "default" : displayStatus === "OVERDUE" ? "destructive" : "outline"}>
                                    {displayStatus}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Bill Number:</span>
                                <span className="font-medium">{payable.billNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Bill Date:</span>
                                <span>{format(new Date(payable.billDate), "MMM dd, yyyy")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Due Date:</span>
                                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                                    {format(new Date(payable.dueDate), "MMM dd, yyyy")}
                                </span>
                            </div>
                            {payable.notes && (
                                <div className="pt-2 border-t">
                                    <span className="text-sm font-medium">Notes:</span>
                                    <p className="text-sm text-muted-foreground mt-1">{payable.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Driver/Vendor & Amounts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Driver/Vendor & Amounts</CardTitle>
                            <CardDescription>Driver/vendor information and payment details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {payable.driver && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Driver:</span>
                                        <span>{payable.driver.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Email:</span>
                                        <span>{payable.driver.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Phone:</span>
                                        <span>{payable.driver.phoneNumber1}</span>
                                    </div>
                                </>
                            )}
                            {payable.vendor && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Vendor:</span>
                                        <span>{payable.vendor.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Email:</span>
                                        <span>{payable.vendor.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Phone:</span>
                                        <span>{payable.vendor.phone}</span>
                                    </div>
                                </>
                            )}
                            <div className="pt-2 border-t space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Amount:</span>
                                    <span className="font-medium">{formatPrice(payable.totalAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Paid Amount:</span>
                                    <span className="text-green-600 font-medium">{formatPrice(payable.paidAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Balance:</span>
                                    <span className={payable.balance > 0 ? "text-destructive font-bold text-lg" : "text-green-600 font-bold text-lg"}>
                                        {formatPrice(payable.balance)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment History */}
                {payable.payments && payable.payments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>All payments for this bill</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentHistory payments={payable.payments} />
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
                            <span className="text-sm text-muted-foreground">{format(new Date(payable.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Updated At:</span>
                            <span className="text-sm text-muted-foreground">{format(new Date(payable.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                        </div>
                    </CardContent>
                </Card>

                <PayableModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    item={payable}
                    onSuccess={() => {
                        loadPayable()
                        setEditModalOpen(false)
                    }}
                />

                <RecordPayablePaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    payable={payable}
                    onSuccess={() => {
                        loadPayable()
                        setPaymentModalOpen(false)
                    }}
                />
            </div>
        </PageTransition>
    )
})

