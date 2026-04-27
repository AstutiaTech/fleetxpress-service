"use client"

import { ArrowLeft, DollarSign, Download, Edit, ExternalLink, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { PaymentHistory } from "@/components/payments/payment-history"
import { Receivable } from "@/types/financialsTypes"
import { ReceivableModal } from "../components/receivable-modal"
import { RecordPaymentModal } from "../components/record-payment-modal"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"
import { useStore } from "@/providers/store.provider"

export default observer(function ReceivableDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { receivablesStore } = useStore()
    const [receivable, setReceivable] = useState<Receivable | null>(null)
    const [loading, setLoading] = useState(true)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)

    const receivableId = params.id as string

    useEffect(() => {
        if (receivableId) {
            loadReceivable()
        }
    }, [receivableId])

    const loadReceivable = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getReceivableById(receivableId)
            if (response.status && response.data) {
                setReceivable(response.data)
            } else {
                toastUtils.error("Error", response.message || "Failed to load invoice")
            }
        } catch (error) {
            console.error("Failed to load receivable:", error)
            toastUtils.error("Error", "Failed to load invoice")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!receivable) return
        if (confirm(`Are you sure you want to delete invoice ${receivable.invoiceNumber}?`)) {
            const result = await receivablesStore.deleteReceivable(receivable.id)
            if (result.success) {
                router.push("/financials/receivables")
            }
        }
    }

    if (loading) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading invoice details...</p>
                    </div>
                </div>
            </PageTransition>
        )
    }

    if (!receivable) {
        return (
            <PageTransition>
                <div className="flex flex-col gap-4 w-full max-w-full min-h-screen">
                    <DashboardHeader title="Invoice Not Found" />
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">The invoice you're looking for doesn't exist.</p>
                            <Button onClick={() => router.push("/financials/receivables")} className="mt-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Invoices
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </PageTransition>
        )
    }

    const isOverdue = new Date(receivable.dueDate) < new Date() && receivable.balance > 0
    const displayStatus = isOverdue ? "OVERDUE" : receivable.status

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/financials/receivables")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <DashboardHeader title={`Invoice ${receivable.invoiceNumber}`} />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPaymentModalOpen(true)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Record Payment
                        </Button>
                        {receivable.status !== "PAID" && (
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
                    {/* Invoice Header */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Information</CardTitle>
                            <CardDescription>Invoice details and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <Badge variant={displayStatus === "PAID" ? "default" : displayStatus === "OVERDUE" ? "destructive" : "outline"}>
                                    {displayStatus}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Invoice Number:</span>
                                <span className="font-medium">{receivable.invoiceNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Invoice Date:</span>
                                <span>{format(new Date(receivable.invoiceDate), "MMM dd, yyyy")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Due Date:</span>
                                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                                    {format(new Date(receivable.dueDate), "MMM dd, yyyy")}
                                </span>
                            </div>
                            {receivable.notes && (
                                <div className="pt-2 border-t">
                                    <span className="text-sm font-medium">Notes:</span>
                                    <p className="text-sm text-muted-foreground mt-1">{receivable.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer & Amounts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Amounts</CardTitle>
                            <CardDescription>Customer information and payment details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {receivable.customer && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Customer:</span>
                                        <span>{receivable.customer.firstName} {receivable.customer.lastName}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Email:</span>
                                        <span>{receivable.customer.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Phone:</span>
                                        <span>{receivable.customer.phone}</span>
                                    </div>
                                </>
                            )}
                            <div className="pt-2 border-t space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Amount:</span>
                                    <span className="font-medium">{formatPrice(receivable.totalAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Paid Amount:</span>
                                    <span className="text-green-600 font-medium">{formatPrice(receivable.paidAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Balance:</span>
                                    <span className={receivable.balance > 0 ? "text-destructive font-bold text-lg" : "text-green-600 font-bold text-lg"}>
                                        {formatPrice(receivable.balance)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shipment Info */}
                {receivable.shipment && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Linked Shipment</CardTitle>
                            <CardDescription>Shipment information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Tracking Code:</span>
                                <span className="font-mono">{receivable.shipment.trackingCode}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payment History */}
                {receivable.payments && receivable.payments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>All payments for this invoice</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentHistory payments={receivable.payments} />
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
                            <span className="text-sm text-muted-foreground">{format(new Date(receivable.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Updated At:</span>
                            <span className="text-sm text-muted-foreground">{format(new Date(receivable.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                        </div>
                    </CardContent>
                </Card>

                <ReceivableModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    item={receivable}
                    onSuccess={() => {
                        loadReceivable()
                        setEditModalOpen(false)
                    }}
                />

                <RecordPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    receivable={receivable}
                    onSuccess={() => {
                        loadReceivable()
                        setPaymentModalOpen(false)
                    }}
                />
            </div>
        </PageTransition>
    )
})

