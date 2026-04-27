"use client"

import { TrackingInfo } from "@/types/trackingTypes"
import { Truck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  trackingInfo: TrackingInfo
}

export function ProgressBar({ trackingInfo }: ProgressBarProps) {
  // Calculate progress based on delivery status
  const getProgress = () => {
    if (!trackingInfo.deliveryStatus) return 0
    
    const statusOrder = [
      "picked-up",
      "in-transit",
      "at-warehouse",
      "out-for-delivery",
      "delivered",
    ]
    
    const currentIndex = statusOrder.indexOf(trackingInfo.deliveryStatus)
    if (currentIndex === -1) return 0
    
    return ((currentIndex + 1) / statusOrder.length) * 100
  }

  const progress = getProgress()

  return (
    <div className="relative w-full">
      {/* Progress line */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Start circle */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
        <div className="w-4 h-4 rounded-full bg-primary border-2 border-background" />
      </div>

      {/* Truck icon (current position) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
        style={{ left: `${progress}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
          <Truck className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>

      {/* Finish circle */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
        <div className="w-4 h-4 rounded-full bg-muted border-2 border-background" />
      </div>
    </div>
  )
}

