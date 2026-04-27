"use client"

import { PaymentTransaction } from "@/types/financialsTypes"
import { formatPrice } from "@/handlers/formatters"
import { format } from "date-fns"
import { PaymentStatusBadge } from "./payment-status-badge"
import { PaymentMethodBadge } from "./payment-method-badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface PaymentHistoryProps {
    payments: PaymentTransaction[]
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
    const router = useRouter()

    if (payments.length === 0) {
        return <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
    }

    const totalPaid = payments
        .filter(p => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0)

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>External Reference</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.transactionReference}</TableCell>
                            <TableCell>{format(new Date(payment.createdAt), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-medium">{formatPrice(payment.amount)}</TableCell>
                            <TableCell>
                                {payment.paymentMethod ? (
                                    <PaymentMethodBadge method={payment.paymentMethod} />
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <PaymentStatusBadge status={payment.status} />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                                {payment.externalReference || "-"}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/financials/payments/${payment.id}`)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Paid:</p>
                    <p className="text-lg font-bold">{formatPrice(totalPaid)}</p>
                </div>
            </div>
        </div>
    )
}

