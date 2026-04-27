"use client"

import { Account, AccountFilters, CreatePaymentPayload, Payable, PaymentMethod, PaymentType, Receivable } from "@/types/financialsTypes"
import { Card, CardContent } from "@/components/ui/card"
import { Controller, useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice, unformatCurrencyInput } from "@/handlers/formatters"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { toastUtils } from "@/utils/toast-utils"
import { useStore } from "@/providers/store.provider"

interface CreatePaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "PAYSTACK", "CARD", "CHEQUE"]

export function CreatePaymentModal({ open, onOpenChange, onSuccess }: CreatePaymentModalProps) {
    const { paymentsStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [accounts, setAccounts] = useState<{ id: string; code: string; name: string }[]>([])
    const [receivables, setReceivables] = useState<Receivable[]>([])
    const [payables, setPayables] = useState<Payable[]>([])
    const [loadingReceivables, setLoadingReceivables] = useState(false)
    const [loadingPayables, setLoadingPayables] = useState(false)
    const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)
    const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null)

    const { control, handleSubmit, reset, setValue, formState: { errors }, watch } = useForm<CreatePaymentPayload & { paymentType: PaymentType }>({
        defaultValues: {
            paymentType: "RECEIVABLE",
            receivableId: "",
            payableId: "",
            amount: 0,
            paymentMethod: "CASH",
            paymentDate: format(new Date(), "yyyy-MM-dd"),
            externalReference: "",
            accountId: "",
            notes: "",
        },
    })

    const watchedPaymentType = watch("paymentType")
    const watchedReceivableId = watch("receivableId")
    const watchedPayableId = watch("payableId")
    const watchedAmount = watch("amount")
    const watchedPaymentMethod = watch("paymentMethod")

    useEffect(() => {
        if (open) {
            console.log("Loading accounts")
            loadAccounts()
            if (watchedPaymentType === "RECEIVABLE") {
                loadReceivables()
            } else {
                loadPayables()
            }
        }
    }, [open, watchedPaymentType])

    useEffect(() => {
        if (watchedPaymentType === "RECEIVABLE" && watchedReceivableId) {
            const receivable = receivables.find(r => r.id === watchedReceivableId)
            setSelectedReceivable(receivable || null)
            if (receivable) {
                setValue("amount", receivable.balance)
            }
        } else {
            setSelectedReceivable(null)
        }
    }, [watchedReceivableId, receivables, watchedPaymentType, setValue])

    useEffect(() => {
        if (watchedPaymentType === "PAYABLE" && watchedPayableId) {
            const payable = payables.find(p => p.id === watchedPayableId)
            setSelectedPayable(payable || null)
            if (payable) {
                setValue("amount", payable.balance)
            }
        } else {
            setSelectedPayable(null)
        }
    }, [watchedPayableId, payables, watchedPaymentType, setValue])

    const loadAccounts = async () => {
        try {
            console.log('got here')
            // Fetch all accounts - handle pagination by fetching all pages
            let allAccounts: Account[] = []
            let page = 1
            const limit = 100
            let hasMore = true

            while (hasMore) {
                const response = await ApiService.getAllAccounts({ 
                    type: "ASSET", 
                    isActive: true,
                    page,
                    limit
                } as AccountFilters & { page?: number; limit?: number })
                
                if (response.status && response.data) {
                    // Handle both paginated and non-paginated responses
                    const accountsData: Account[] = Array.isArray(response.data) 
                        ? response.data 
                        : []
                    
                    allAccounts = [...allAccounts, ...accountsData]
                    
                    // Check if there are more pages (for paginated responses)
                    const meta = (response as { meta?: { total?: number } })?.meta
                    if (meta && meta.total) {
                        hasMore = page * limit < meta.total
                        page++
                    } else {
                        // Non-paginated response, we have all data
                        hasMore = false
                    }
                } else {
                    hasMore = false
                }
            }

            // Filter and map accounts
            setAccounts(allAccounts
                .filter((a: Account) => a.accountName && (a.accountName.toLowerCase().includes("cash") || a.accountName.toLowerCase().includes("bank")))
                .map((a: Account) => ({ id: a.id, code: a.accountCode, name: a.accountName })))
        } catch (error) {
            console.error("Failed to load accounts:", error)
        }
    }

    const loadReceivables = async () => {
        console.log('loading receivables')
        setLoadingReceivables(true)
        try {
            const response = await ApiService.getAllReceivables({ limit: 1000, status: "PENDING" })
            if (response.status && response.data) {
                setReceivables(response.data.filter(r => r.balance > 0))
            }
        } catch (error) {
            console.error("Failed to load receivables:", error)
            toastUtils.error("Error", "Failed to load invoices")
        } finally {
            setLoadingReceivables(false)
        }
    }

    const loadPayables = async () => {
        console.log('loading payables')
        setLoadingPayables(true)
        try {
            const response = await ApiService.getAllPayables({ limit: 1000, status: "PENDING" })
            if (response.status && response.data) {
                setPayables(response.data.filter(p => p.balance > 0))
            }
        } catch (error) {
            console.error("Failed to load payables:", error)
            toastUtils.error("Error", "Failed to load bills")
        } finally {
            setLoadingPayables(false)
        }
    }

    const onSubmit = async (values: CreatePaymentPayload & { paymentType: PaymentType }) => {
        const maxAmount = watchedPaymentType === "RECEIVABLE" 
            ? (selectedReceivable?.balance || 0)
            : (selectedPayable?.balance || 0)

        if (values.amount > maxAmount) {
            toastUtils.error("Invalid Amount", `Amount cannot exceed balance of ${formatPrice(maxAmount)}`)
            return
        }

        if (watchedPaymentType === "RECEIVABLE" && !values.receivableId) {
            toastUtils.error("Validation Error", "Please select an invoice")
            return
        }

        if (watchedPaymentType === "PAYABLE" && !values.payableId) {
            toastUtils.error("Validation Error", "Please select a bill")
            return
        }

        setIsSubmitting(true)
        try {
            const payload: CreatePaymentPayload = {
                paymentType: values.paymentType,
                receivableId: values.paymentType === "RECEIVABLE" ? values.receivableId : undefined,
                payableId: values.paymentType === "PAYABLE" ? values.payableId : undefined,
                amount: values.amount,
                paymentMethod: values.paymentMethod,
                paymentDate: values.paymentDate,
                externalReference: values.externalReference || undefined,
                accountId: values.accountId || undefined,
                notes: values.notes || undefined,
            }

            const response = await paymentsStore.createPayment(payload)
            if (response.success && response.data) {
                // If Paystack, redirect to payment gateway
                if (values.paymentMethod === "PAYSTACK" && selectedReceivable?.shipment) {
                    try {
                        const paystackResponse = await ApiService.initializePaystackPayment({
                            shipmentId: selectedReceivable.shipment.id,
                            customerEmail: selectedReceivable.customer?.email || "",
                            customerName: selectedReceivable.customer ? `${selectedReceivable.customer.firstName} ${selectedReceivable.customer.lastName}` : undefined,
                            callbackUrl: `${window.location.origin}/financials/payments/callback?paymentId=${response.data.id}`,
                        })
                        if (paystackResponse.status && paystackResponse.data) {
                            window.location.href = paystackResponse.data.authorizationUrl
                            return
                        }
                    } catch (error) {
                        console.error("Failed to initialize Paystack payment:", error)
                        toastUtils.error("Payment Error", "Failed to initialize Paystack payment")
                    }
                }
                toastUtils.success("Payment Recorded", "Payment has been recorded successfully.")
                onSuccess?.()
                onOpenChange(false)
                reset()
            }
        } catch (error) {
            console.error("Failed to record payment:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const currentBalance = watchedPaymentType === "RECEIVABLE" 
        ? (selectedReceivable?.balance || 0)
        : (selectedPayable?.balance || 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Create a new payment record for an invoice or bill
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Payment Type Selection */}
                    <div className="space-y-2">
                        <Label>Payment Type *</Label>
                        <Controller
                            control={control}
                            name="paymentType"
                            rules={{ required: "Payment type is required" }}
                            render={({ field }) => (
                                <>
                                    <Select value={field.value} onValueChange={(value) => {
                                        field.onChange(value)
                                        reset({
                                            ...watch(),
                                            paymentType: value as PaymentType,
                                            receivableId: "",
                                            payableId: "",
                                            amount: 0,
                                        })
                                        setSelectedReceivable(null)
                                        setSelectedPayable(null)
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RECEIVABLE">Receivable (Invoice)</SelectItem>
                                            <SelectItem value="PAYABLE">Payable (Bill)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.paymentType && (
                                        <p className="text-sm text-destructive">{errors.paymentType.message}</p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Invoice/Bill Selection */}
                    {watchedPaymentType === "RECEIVABLE" && (
                        <div className="space-y-2">
                            <Label>Invoice *</Label>
                            <Controller
                                control={control}
                                name="receivableId"
                                rules={{ required: "Invoice is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select 
                                            value={field.value || undefined} 
                                            onValueChange={field.onChange}
                                            disabled={loadingReceivables}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingReceivables ? "Loading invoices..." : "Select invoice"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {receivables.map((receivable) => (
                                                    <SelectItem key={receivable.id} value={receivable.id}>
                                                        {receivable.invoiceNumber} - {formatPrice(receivable.balance)} balance
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.receivableId && (
                                            <p className="text-sm text-destructive">{errors.receivableId.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    )}

                    {watchedPaymentType === "PAYABLE" && (
                        <div className="space-y-2">
                            <Label>Bill *</Label>
                            <Controller
                                control={control}
                                name="payableId"
                                rules={{ required: "Bill is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select 
                                            value={field.value || undefined} 
                                            onValueChange={field.onChange}
                                            disabled={loadingPayables}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingPayables ? "Loading bills..." : "Select bill"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {payables.map((payable) => (
                                                    <SelectItem key={payable.id} value={payable.id}>
                                                        {payable.billNumber} - {formatPrice(payable.balance)} balance
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.payableId && (
                                            <p className="text-sm text-destructive">{errors.payableId.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    )}

                    {/* Invoice/Bill Info Display */}
                    {selectedReceivable && (
                        <Card>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Invoice Number:</span>
                                        <p className="font-medium">{selectedReceivable.invoiceNumber}</p>
                                    </div>
                                    {selectedReceivable.customer && (
                                        <div>
                                            <span className="text-muted-foreground">Customer:</span>
                                            <p className="font-medium">{selectedReceivable.customer.firstName} {selectedReceivable.customer.lastName}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground">Total Amount:</span>
                                        <p className="font-medium">{formatPrice(selectedReceivable.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Paid Amount:</span>
                                        <p className="font-medium">{formatPrice(selectedReceivable.paidAmount)}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Balance:</span>
                                        <p className="font-medium text-destructive">{formatPrice(selectedReceivable.balance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedPayable && (
                        <Card>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Bill Number:</span>
                                        <p className="font-medium">{selectedPayable.billNumber}</p>
                                    </div>
                                    {selectedPayable.driver && (
                                        <div>
                                            <span className="text-muted-foreground">Driver:</span>
                                            <p className="font-medium">{selectedPayable.driver.name}</p>
                                        </div>
                                    )}
                                    {selectedPayable.vendor && (
                                        <div>
                                            <span className="text-muted-foreground">Vendor:</span>
                                            <p className="font-medium">{selectedPayable.vendor.name}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground">Total Amount:</span>
                                        <p className="font-medium">{formatPrice(selectedPayable.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Paid Amount:</span>
                                        <p className="font-medium">{formatPrice(selectedPayable.paidAmount)}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Balance:</span>
                                        <p className="font-medium text-destructive">{formatPrice(selectedPayable.balance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Controller
                            control={control}
                            name="amount"
                            rules={{
                                required: "Amount is required",
                                min: { value: 0.01, message: "Amount must be greater than 0" },
                                max: { value: currentBalance, message: `Amount cannot exceed ${formatPrice(currentBalance)}` },
                            }}
                            render={({ field }) => (
                                <>
                                    <Input
                                        type="text"
                                        value={formatPrice(field.value, "", 2).replace("₦", "").trim()}
                                        onChange={(e) => {
                                            const unformatted = unformatCurrencyInput(e.target.value)
                                            const amount = parseFloat(unformatted) || 0
                                            field.onChange(amount)
                                        }}
                                        placeholder="0.00"
                                        disabled={!selectedReceivable && !selectedPayable}
                                    />
                                    {errors.amount && (
                                        <p className="text-sm text-destructive">{errors.amount.message}</p>
                                    )}
                                    {currentBalance > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Maximum: {formatPrice(currentBalance)}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label>Payment Method *</Label>
                        <Controller
                            control={control}
                            name="paymentMethod"
                            rules={{ required: "Payment method is required" }}
                            render={({ field }) => (
                                <>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((method) => (
                                                <SelectItem key={method} value={method}>
                                                    {method.replace("_", " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.paymentMethod && (
                                        <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-2">
                        <Label>Payment Date *</Label>
                        <Controller
                            control={control}
                            name="paymentDate"
                            rules={{
                                required: "Payment date is required",
                                validate: (value) => {
                                    const selectedDate = new Date(value)
                                    const today = new Date()
                                    today.setHours(23, 59, 59, 999)
                                    if (selectedDate > today) {
                                        return "Payment date cannot be in the future"
                                    }
                                    return true
                                },
                            }}
                            render={({ field }) => (
                                <>
                                    <Input
                                        type="date"
                                        {...field}
                                        max={format(new Date(), "yyyy-MM-dd")}
                                    />
                                    {errors.paymentDate && (
                                        <p className="text-sm text-destructive">{errors.paymentDate.message}</p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* External Reference */}
                    {watchedPaymentMethod !== "PAYSTACK" && (
                        <div className="space-y-2">
                            <Label>
                                External Reference
                                {(watchedPaymentMethod === "BANK_TRANSFER" || watchedPaymentMethod === "CHEQUE") && (
                                    <span className="text-muted-foreground text-xs ml-1">(Recommended)</span>
                                )}
                            </Label>
                            <Controller
                                control={control}
                                name="externalReference"
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder={
                                            watchedPaymentMethod === "BANK_TRANSFER"
                                                ? "Bank transaction reference"
                                                : watchedPaymentMethod === "CHEQUE"
                                                ? "Cheque number"
                                                : "Reference number"
                                        }
                                    />
                                )}
                            />
                        </div>
                    )}

                    {/* Account Selection */}
                    <div className="space-y-2">
                        <Label>Account (Optional)</Label>
                        <Controller
                            control={control}
                            name="accountId"
                            render={({ field }) => (
                                <Select 
                                    value={field.value || undefined} 
                                    onValueChange={(value) => field.onChange(value || "")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select account (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.code} - {a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Controller
                            control={control}
                            name="notes"
                            render={({ field }) => (
                                <Textarea {...field} placeholder="Payment notes..." rows={3} />
                            )}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || (!selectedReceivable && !selectedPayable)}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {watchedPaymentMethod === "PAYSTACK" ? "Pay Now" : "Record Payment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

