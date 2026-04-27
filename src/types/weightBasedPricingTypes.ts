export type CityType = "inside_city" | "outside_city"

export interface WeightBasedPrice {
  id: number
  cityType: CityType
  category: string
  weightKg: number
  price: number
  createdAt: string
  updatedAt: string
}

export interface CreateWeightBasedPricePayload {
  cityType: CityType
  category: string
  weightKg: number
  price: number
}

export interface BulkCreateWeightBasedPricePayload {
  cityType: CityType
  category: string
  prices: Array<{
    weightKg: number
    price: number
  }>
}

export interface UpdateWeightBasedPricePayload {
  cityType?: CityType
  category?: string
  weightKg?: number
  price?: number
}

export interface CalculateShippingPriceRequest {
  cityType: CityType
  category: string
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
}

export interface PricingImportResult {
  insideCityRoutesCreated: number
  outsideCityRoutesCreated: number
  insideCityPricesImported: number
  outsideCityPricesImported: number
  totalPricesImported: number
  errors: string[]
}

export interface CalculateShippingPriceResponse {
  appliedPrice: number
  pricingBasis: "weightTier" | "volumetricOverride"
  appliedKg: number
  tierSource: CityType
  volumetricWeightKg?: number
  actualWeightKg: number
  usedFallback: boolean
}

