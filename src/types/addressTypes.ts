import { City, Country, LGA, State } from "./geoTypes"

export type AddressType = "HOME" | "WORK" | "OTHER"

export interface Address {
  id: string
  street: string
  addressLine: string | null
  cityId: number
  stateId: number
  lgaId: number
  countryId: number
  latitude: number | null
  longitude: number | null
  postalCode: string | null
  isDefault: boolean
  addressType: AddressType
  createdAt: string
  updatedAt: string
  // Populated relations
  city?: City
  state?: State
  lga?: LGA
  country?: Country
}

export interface CreateAddressPayload {
  street: string
  addressLine?: string | null
  cityId?: number // Made optional
  stateId?: number // Made optional
  lgaId?: number // Made optional
  countryId: number
  latitude?: number | null
  longitude?: number | null
  postalCode?: string | null
  isDefault?: boolean
  addressType?: AddressType
  userId?: string // Optional: for user addresses
}

export interface UpdateAddressPayload extends Partial<CreateAddressPayload> {
  id: string
}

export interface AddressFilters {
  page?: number
  limit?: number
  search?: string
  userId?: string
  addressType?: AddressType
  countryId?: number
  stateId?: number
  cityId?: number
}

