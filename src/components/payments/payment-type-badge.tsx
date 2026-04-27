"use client"

import { Badge } from "@/components/ui/badge"
import { PaymentType } from "@/types/financialsTypes"

interface PaymentTypeBadgeProps {
    type: PaymentType
}

export function PaymentTypeBadge({ type }: PaymentTypeBadgeProps) {
    const typeConfig: Record<PaymentType, { label: string; variant: "default" | "secondary" }> = {
        RECEIVABLE: { label: "Receivable", variant: "default" },
        PAYABLE: { label: "Payable", variant: "secondary" },
    }

    const config = typeConfig[type] || { label: type, variant: "default" }

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    )
}

