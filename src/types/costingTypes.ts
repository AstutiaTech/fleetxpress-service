// Costing Types
export interface Costing {
    id: string
    shipmentId: string
    amount: number
    vat: number
    tax: number
    insurance: number
    extraCost: number
    extraVolume: number
    deliveryCharge: number
    packagingCharge: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CostingRate {
    id: number
    name: string
    slug: string
    status: number
    insideCharge: number
    outsideCharge: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateCostingRatePayload {
    name: string
    slug: string
    status: number
    insideCharge: number
    outsideCharge: number
}
