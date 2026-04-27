"use client"

import { Badge } from "@/components/ui/badge"
import { PaymentStatus } from "@/types/financialsTypes"

interface PaymentStatusBadgeProps {
    status: PaymentStatus
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
    const statusConfig: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        PENDING: { label: "Pending", variant: "outline" },
        PROCESSING: { label: "Processing", variant: "secondary" },
        COMPLETED: { label: "Completed", variant: "default" },
        FAILED: { label: "Failed", variant: "destructive" },
        CANCELLED: { label: "Cancelled", variant: "destructive" },
    }

    const config = statusConfig[status] || { label: status, variant: "outline" }

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    )
}

