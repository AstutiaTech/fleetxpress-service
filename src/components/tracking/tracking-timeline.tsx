"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"
import { StatusColors, StatusLabels } from "@/types/trackingTypes"

import { TrackingEvent } from "@/types/trackingTypes"
import { format } from "date-fns"

interface TrackingTimelineProps {
  events: TrackingEvent[]
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, "MMM dd, yyyy"),
      time: format(date, "hh:mm a"),
    }
  }

  const getEventDescription = (event: TrackingEvent) => {
    if (event.description) {
      return event.description
    }

    if (event.deliveryStatus) {
      return StatusLabels[event.deliveryStatus] || event.deliveryStatus
    }

    if (event.status) {
      return StatusLabels[event.status] || event.status
    }

    return "Status updated"
  }

  const getEventColor = (event: TrackingEvent) => {
    if (event.deliveryStatus) {
      return StatusColors[event.deliveryStatus] || "#6c757d"
    }
    if (event.status) {
      return StatusColors[event.status] || "#6c757d"
    }
    return "#6c757d"
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>No tracking events available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {events.map((event, index) => {
        const { date, time } = formatDate(event.createdAt)
        const isLast = index === events.length - 1
        const color = getEventColor(event)
        const description = getEventDescription(event)

        return (
          <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline line */}
            {!isLast && (
              <div
                className="absolute left-3 top-8 w-0.5 h-full bg-border"
                style={{ backgroundColor: `${color}40` }}
              />
            )}

            {/* Timeline marker */}
            <div
              className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background"
              style={{ borderColor: color }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>

            {/* Timeline content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-sm font-semibold">{description}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  <span>{date} at {time}</span>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium"
                    >
                      <strong className="mr-1">{key}:</strong> {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

