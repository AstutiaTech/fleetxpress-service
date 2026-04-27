export interface TrackingEvent {
  id: string
  status?: string | null
  deliveryStatus?: string | null
  location?: string | null
  description?: string | null
  createdAt: string
  metadata?: Record<string, any> | null
}

export interface PickupDetails {
  id: string
  name: string
  city: string
  state: string
  address: string
  latitude: number
  longitude: number
  phoneNumber: string
  emailAddress: string
}

export interface TrackingInfo {
  trackingCode: string
  status: string
  deliveryStatus?: string | null
  pickupLocation?: string
  pickupDetails?: PickupDetails
  deliveryLocation?: string
  deliveryLat?: number
  deliveryLng?: number
  createdAt: string
  events: TrackingEvent[]
}

export interface UpdateStatusRequest {
  status?: string
  deliveryStatus?: string
  location?: string
  description?: string
  metadata?: Record<string, any>
}

export const StatusLabels: Record<string, string> = {
  // Shipment Status
  pending: "Pending",
  processing: "Processing",
  assigned: "Assigned",
  failed: "Failed",
  // Delivery Status
  "picked-up": "Picked Up",
  "in-transit": "In Transit",
  "at-warehouse": "At Warehouse",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  "failed-delivery": "Failed Delivery",
  returned: "Returned",
  cancelled: "Cancelled",
}

export const StatusColors: Record<string, string> = {
  // Shipment Status
  pending: "#6c757d",
  processing: "#007bff",
  assigned: "#17a2b8",
  failed: "#dc3545",
  // Delivery Status
  "picked-up": "#28a745",
  "in-transit": "#007bff",
  "at-warehouse": "#ffc107",
  "out-for-delivery": "#17a2b8",
  delivered: "#28a745",
  "failed-delivery": "#dc3545",
  returned: "#fd7e14",
  cancelled: "#6c757d",
}

