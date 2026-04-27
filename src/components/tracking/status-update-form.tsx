"use client"

import { useState } from "react"
import { ApiService } from "@/lib/api"
import { UpdateStatusRequest } from "@/types/trackingTypes"
import { ShipmentStatus, DeliveryStatus } from "@/types/shipmentTypes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { toastUtils } from "@/utils/toast-utils"
import { useForm, Controller } from "react-hook-form"

interface StatusUpdateFormProps {
  shipmentId: string
  currentStatus: string
  currentDeliveryStatus?: string | null
  onUpdateSuccess?: () => void
}

export function StatusUpdateForm({
  shipmentId,
  currentStatus,
  currentDeliveryStatus,
  onUpdateSuccess,
}: StatusUpdateFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UpdateStatusRequest>({
    defaultValues: {
      status: currentStatus,
      deliveryStatus: currentDeliveryStatus || undefined,
      location: "",
      description: "",
    },
  })

  const onSubmit = async (values: UpdateStatusRequest) => {
    setError(null)
    setLoading(true)

    try {
      const response = await ApiService.updateShipmentStatus(shipmentId, values)
      if (response.status && response.data) {
        toastUtils.success("Updated", "Shipment status updated successfully.")
        if (onUpdateSuccess) {
          onUpdateSuccess()
        }
        // Reset form
        reset({
          status: values.status || currentStatus,
          deliveryStatus: values.deliveryStatus || currentDeliveryStatus || undefined,
          location: "",
          description: "",
        })
      } else {
        throw new Error(response.message || "Failed to update status")
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status"
      setError(errorMessage)
      toastUtils.error("Update Failed", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Status</CardTitle>
        <CardDescription>
          Update the shipment status and delivery information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Shipment Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ShipmentStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={ShipmentStatus.PROCESSING}>Processing</SelectItem>
                      <SelectItem value={ShipmentStatus.ASSIGNED}>Assigned</SelectItem>
                      <SelectItem value={ShipmentStatus.FAILED}>Failed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryStatus">Delivery Status</Label>
              <Controller
                control={control}
                name="deliveryStatus"
                render={({ field }) => (
                  <Select 
                    value={field.value || undefined} 
                    onValueChange={(value) => field.onChange(value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery status (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DeliveryStatus.PICKED_UP}>Picked Up</SelectItem>
                      <SelectItem value={DeliveryStatus.IN_TRANSIT}>In Transit</SelectItem>
                      <SelectItem value={DeliveryStatus.AT_WAREHOUSE}>At Warehouse</SelectItem>
                      <SelectItem value={DeliveryStatus.OUT_FOR_DELIVERY}>Out for Delivery</SelectItem>
                      <SelectItem value={DeliveryStatus.DELIVERED}>Delivered</SelectItem>
                      <SelectItem value={DeliveryStatus.FAILED_DELIVERY}>Failed Delivery</SelectItem>
                      <SelectItem value={DeliveryStatus.RETURNED}>Returned</SelectItem>
                      <SelectItem value={DeliveryStatus.CANCELLED}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <Input
                  {...field}
                  id="location"
                  placeholder="e.g., Lagos Warehouse"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="description"
                  placeholder="e.g., Package picked up from warehouse"
                  rows={3}
                />
              )}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

