export interface QuickQuoteRequest {
  pickupPointId?: string
  isDoorPickup?: boolean
  senderCityId?: number
  deliveryLat?: number
  deliveryLng?: number
  destinationCityId?: number
  insideCityCharge?: number
  outsideCityCharge?: number
  parcels: ParcelRequest[]
  applyInsurance?: boolean
  insurance?: number
}

export interface ParcelRequest {
  packagingId: number
  length?: number
  weight?: number | null // Optional if dimensions (length, width, height) are provided
  height?: number
  width?: number
  quantity?: number
  isRushHour?: boolean
  isLiquidFragile?: boolean
  extraCost?: number
  declaredValue?: number | null // Changed from string to number (monetary amount)
}

export interface QuickQuoteResponse {
  deliveryCharge: number
  extraVolume: number
  packagingCharge: number
  extraCost: number
  subtotal: number
  vat: number
  tax: number
  insurance: number
  totalAmount: number
  distanceInKm: number
  isOutsideCity: boolean
  vatRate: number
  taxRate: number
  insuranceRate: number
}

