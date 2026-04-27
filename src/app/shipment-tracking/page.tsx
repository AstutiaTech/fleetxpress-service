"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Loader2, MapPin, MessageSquare, Phone, Search, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusLabels, TrackingInfo } from "@/types/trackingTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { useCallback, useEffect, useState } from "react"

import { ActivityTimeline } from "@/components/tracking/activity-timeline"
import { ApiService } from "@/lib/api"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/providers/page-transition"
import { ProgressBar } from "@/components/tracking/progress-bar"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/tracking/status-badge"
import { TrackingMap } from "@/components/tracking/tracking-map"
import { format } from "date-fns"
import { observer } from "mobx-react-lite"
import { useSearchParams } from "next/navigation"
import { useStore } from "@/providers/store.provider"

export default observer(function TrackingPage() {
  const { authStore } = useStore()
  const searchParams = useSearchParams()
  const [trackingCode, setTrackingCode] = useState("")
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAutoTracked, setHasAutoTracked] = useState(false)

  const performTrack = useCallback(async (code: string, showToast: boolean = true) => {
    setError(null)
    setTrackingInfo(null)
    setLoading(true)

    try {
      if (!code.trim()) {
        throw new Error("Please enter a tracking code")
      }

      const response = await ApiService.trackShipmentByCode(code.trim().toUpperCase())
      if (response.status && response.data) {
        setTrackingInfo(response.data)
        if (showToast) {
          toastUtils.success("Found", "Shipment tracking information retrieved successfully.")
        }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to track shipment"
        throw new Error(errorMessage)
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Failed to track shipment. Please check your tracking code.")
      setError(errorMessage)
      if (showToast) {
        toastUtils.error("Tracking Failed", errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-track when code parameter is present
  useEffect(() => {
    const codeParam = searchParams.get("code")
    if (codeParam && !hasAutoTracked) {
      const trimmedCode = codeParam.trim().toUpperCase()
      setTrackingCode(trimmedCode)
      setHasAutoTracked(true)
      // Auto-track the shipment (without toast notification)
      performTrack(trimmedCode, false)
    }
  }, [searchParams, hasAutoTracked, performTrack])

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    await performTrack(trackingCode, true)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }
      return format(date, "dd MMM yyyy 'at' hh:mm a")
    } catch {
      return "Invalid date"
    }
  }

  // Calculate estimated delivery (mock - in real app this would come from API)
  const getEstimatedDelivery = () => {
    if (!trackingInfo) return ""
    if (trackingInfo.deliveryStatus === "delivered") return "Delivered"
    
    const createdDate = new Date(trackingInfo.createdAt)
    const estimatedDate = new Date(createdDate)
    estimatedDate.setDate(estimatedDate.getDate() + 3)
    
    const today = new Date()
    const diffTime = estimatedDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    return `In ${diffDays} Days`
  }

  return (
    <PageTransition>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-background pb-14">
        {/* Top Search Bar */}
        <div className="bg-background border-b px-6 py-4 flex flex-col md:flex-row items-center gap-6">
          {!authStore?.isAuthenticated && <BrandLogo />}
          <form onSubmit={handleTrack} className="flex gap-2 max-w-md">
            <Input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="Enter tracking code"
              className="flex-1"
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !trackingCode.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Track
                </>
              )}
            </Button>
          </form>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-4 max-w-md">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content - Side by Side */}
        {trackingInfo ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side - Map */}
            <div className="flex-1 relative">
              <TrackingMap trackingInfo={trackingInfo} />
            </div>

            {/* Right Side - Details Panel */}
            <div className="w-96 bg-card border-l overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Order Number */}
                <div className="flex flex-wrap">
                  <p className="text-sm text-muted-foreground mb-1">ORDER</p>
                  <h1 className="text-lg font-bold">#{trackingInfo.trackingCode}</h1>
                </div>

                {/* Details Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <ProgressBar trackingInfo={trackingInfo} />

                    {/* Addresses */}
                    <div className="space-y-3">
                      {trackingInfo.pickupDetails && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Start:</p>
                          <p className="text-sm font-medium">{trackingInfo.pickupDetails.address}</p>
                        </div>
                      )}
                      {trackingInfo.deliveryLocation && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Finish:</p>
                          <p className="text-sm font-medium">{trackingInfo.deliveryLocation}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">
                        {trackingInfo.deliveryStatus 
                          ? StatusLabels[trackingInfo.deliveryStatus] || trackingInfo.deliveryStatus
                          : StatusLabels[trackingInfo.status] || trackingInfo.status}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Customer Name</span>
                    </div>

                    {/* Dispatch Time */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(trackingInfo.createdAt)}</span>
                    </div>

                    {/* Vehicle Number */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vehicle Number</p>
                      <p className="text-sm font-medium">N/A</p>
                    </div>

                    {/* Estimated Delivery */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estimated Delivery</p>
                      <p className="text-sm font-medium">{getEstimatedDelivery()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityTimeline trackingInfo={trackingInfo} />
                  </CardContent>
                </Card>

                {/* Courier Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Courier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Courier Name</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Enter a tracking code to view shipment details</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
})
