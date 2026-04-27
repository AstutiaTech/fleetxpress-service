"use client"

import { Account, AccountFilters, CreatePaymentPayload, Payable, PaymentMethod } from "@/types/financialsTypes"
import { Controller, useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice, unformatCurrencyInput } from "@/handlers/formatters"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { toastUtils } from "@/utils/toast-utils"
import { useStore } from "@/providers/store.provider"

interface RecordPayablePaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    payable: Payable | null
    onSuccess?: () => void
}

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE"]

export function RecordPayablePaymentModal({ open, onOpenChange, payable, onSuccess }: RecordPayablePaymentModalProps) {
    const { paymentsStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [accounts, setAccounts] = useState<{ id: string; code: string; name: string }[]>([])

    const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<CreatePaymentPayload>({
        defaultValues: {
            paymentType: "PAYABLE",
            payableId: "",
            amount: 0,
            paymentMethod: "CASH",
            paymentDate: format(new Date(), "yyyy-MM-dd"),
            externalReference: "",
            accountId: "",
            notes: "",
        },
    })

    const watchedPaymentMethod = watch("paymentMethod")

    useEffect(() => {
        if (open && payable) {
            reset({
                paymentType: "PAYABLE",
                payableId: payable.id,
                amount: payable.balance,
                paymentMethod: "CASH",
                paymentDate: format(new Date(), "yyyy-MM-dd"),
                externalReference: "",
                accountId: "",
                notes: "",
            })
            loadAccounts()
        }
    }, [open, payable, reset])

    const loadAccounts = async () => {
        try {
            const { ApiService } = await import("@/lib/api")
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
                .filter((a: Account) => a.name && (a.name.toLowerCase().includes("cash") || a.name.toLowerCase().includes("bank")))
                .map((a: Account) => ({ id: a.id, code: a.code, name: a.name })))
        } catch (error) {
            console.error("Failed to load accounts:", error)
        }
    }

    const onSubmit = async (values: CreatePaymentPayload) => {
        if (!payable) return

        if (values.amount > payable.balance) {
            toastUtils.error("Invalid Amount", `Amount cannot exceed balance of ${formatPrice(payable.balance)}`)
            return
        }

        setIsSubmitting(true)
        try {
            const response = await paymentsStore.createPayment(values)
            if (response.success) {
                toastUtils.success("Payment Recorded", "Payment has been recorded successfully.")
                onSuccess?.()
            }
        } catch (error) {
            console.error("Failed to record payment:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!payable) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for bill {payable.billNumber}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Bill Info Display */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <h3 className="font-semibold">Bill Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Bill Number:</span>
                                <p className="font-medium">{payable.billNumber}</p>
                            </div>
                            {payable.driver && (
                                <div>
                                    <span className="text-muted-foreground">Driver:</span>
                                    <p className="font-medium">{payable.driver.name}</p>
                                </div>
                            )}
                            {payable.vendor && (
                                <div>
                                    <span className="text-muted-foreground">Vendor:</span>
                                    <p className="font-medium">{payable.vendor.name}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">Total Amount:</span>
                                <p className="font-medium">{formatPrice(payable.totalAmount)}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Paid Amount:</span>
                                <p className="font-medium">{formatPrice(payable.paidAmount)}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Balance:</span>
                                <p className="font-medium text-destructive">{formatPrice(payable.balance)}</p>
                            </div>
                            {payable.dueDate && (
                                <div>
                                    <span className="text-muted-foreground">Due Date:</span>
                                    <p className="font-medium">{format(new Date(payable.dueDate), "MMM dd, yyyy")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Controller
                            control={control}
                            name="amount"
                            rules={{
                                required: "Amount is required",
                                min: { value: 0.01, message: "Amount must be greater than 0" },
                                max: { value: payable.balance, message: `Amount cannot exceed ${formatPrice(payable.balance)}` },
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
                                    />
                                    {errors.amount && (
                                        <p className="text-sm text-destructive">{errors.amount.message}</p>
                                    )}
                                </>
                            )}
                        />
                    </div>
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
                    {(watchedPaymentMethod === "BANK_TRANSFER" || watchedPaymentMethod === "CHEQUE") && (
                        <div className="space-y-2">
                            <Label>
                                External Reference
                                <span className="text-muted-foreground text-xs ml-1">(Recommended)</span>
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
                                                : "Cheque number"
                                        }
                                    />
                                )}
                            />
                        </div>
                    )}
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
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

