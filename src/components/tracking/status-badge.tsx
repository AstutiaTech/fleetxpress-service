"use client"

import { Badge } from "@/components/ui/badge"
import { StatusLabels, StatusColors } from "@/types/trackingTypes"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  type?: "shipment" | "delivery"
  className?: string
}

export function StatusBadge({ status, type = "delivery", className }: StatusBadgeProps) {
  const label = StatusLabels[status] || status
  const color = StatusColors[status] || "#6c757d"

  return (
    <Badge
      className={cn("text-xs font-medium", className)}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: color,
      }}
    >
      {label}
    </Badge>
  )
}

