"use client"

import { Badge } from "@/components/ui/badge"
import { PaymentMethod } from "@/types/financialsTypes"
import { CreditCard, Wallet, Building2, Banknote, FileText } from "lucide-react"

interface PaymentMethodBadgeProps {
    method: PaymentMethod
}

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
    if (!method) {
        return (
            <Badge variant="outline" className="flex items-center w-fit">
                <Wallet className="h-3 w-3 mr-1" />
                Unknown
            </Badge>
        )
    }

    const methodConfig: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
        CASH: { label: "Cash", icon: <Banknote className="h-3 w-3 mr-1" /> },
        BANK_TRANSFER: { label: "Bank Transfer", icon: <Building2 className="h-3 w-3 mr-1" /> },
        PAYSTACK: { label: "Paystack", icon: <CreditCard className="h-3 w-3 mr-1" /> },
        CARD: { label: "Card", icon: <CreditCard className="h-3 w-3 mr-1" /> },
        CHEQUE: { label: "Cheque", icon: <FileText className="h-3 w-3 mr-1" /> },
    }

    const config = methodConfig[method] || { label: method.replace("_", " "), icon: <Wallet className="h-3 w-3 mr-1" /> }

    return (
        <Badge variant="outline" className="flex items-center w-fit">
            {config.icon}
            {config.label}
        </Badge>
    )
}

