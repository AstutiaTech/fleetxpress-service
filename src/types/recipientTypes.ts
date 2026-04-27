import { Address } from "./addressTypes"

export interface Recipient {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string | null
  addressLine: string | null // Optional recipient address line
  addressId: string | null
  address: Address | null
  createdAt: string
  updatedAt: string
}

export interface CreateRecipientPayload {
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string | null
  addressLine?: string | null // Optional recipient address line
  addressId?: string | null
  // Inline address creation (for shipment form)
  address?: {
    street: string
    addressLine?: string | null
    cityId: number
    stateId: number
    lgaId: number
    countryId: number
    latitude?: number | null
    longitude?: number | null
    postalCode?: string | null
    addressType?: "HOME" | "WORK" | "OTHER"
  }
}

export interface UpdateRecipientPayload {
  id: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  email?: string | null
  addressLine?: string | null // Optional recipient address line
  addressId?: string | null
}

export interface RecipientFilters {
  page?: number
  limit?: number
  search?: string
}

