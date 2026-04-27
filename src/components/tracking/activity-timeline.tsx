"use client"

import { TrackingInfo } from "@/types/trackingTypes"
import { StatusLabels } from "@/types/trackingTypes"
import { format } from "date-fns"
import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityTimelineProps {
  trackingInfo: TrackingInfo
}

export function ActivityTimeline({ trackingInfo }: ActivityTimelineProps) {
  // Create timeline events from tracking info
  const events = [
    {
      date: trackingInfo.createdAt,
      status: "Shipped",
      description: "Shipment created",
      completed: true,
    },
    {
      date: trackingInfo.createdAt,
      status: trackingInfo.deliveryStatus || "In Transit",
      description: StatusLabels[trackingInfo.deliveryStatus || "in-transit"] || "In Transit",
      completed: trackingInfo.deliveryStatus === "delivered",
    },
    {
      date: null,
      status: "Delivered",
      description: "Delivered to recipient",
      completed: trackingInfo.deliveryStatus === "delivered",
    },
  ]

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return "-|-"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "-|-"
      return format(date, "hh:mm a")
    } catch {
      return "-|-"
    }
  }

  const formatEventDateFull = (dateString: string | null) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      return format(date, "dd MMM yyyy")
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="mt-1">
            {event.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {formatEventDateFull(event.date)} {event.status}
                </p>
                <p className="text-xs text-muted-foreground">{event.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatEventDate(event.date)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

