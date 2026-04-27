import { City, Country, LGA, State } from "./geoTypes";
import { User, UserProfile } from "./auth";

import { Address } from "./addressTypes";
import { Costing } from "./costingTypes";
import { Driver } from "./driverTypes";
import { Parcel } from "./parcelTypes";
import { Recipient } from "./recipientTypes";
import { WareHouse } from "./warehousesType";

// Shipment Types
export type DeliveryOption = "home" | "pickup" | "same-day";
export type PaymentType = "cash" | "card" | "transfer";
export type PaymentMode = "prepaid" | "postpaid";
export type WhoPaysShippingFee = "sender" | "recipient";
export type ShipmentStatus = "pending" | "processing" | "assigned" | "failed";
export type DeliveryStatus = "picked-up" | "in-transit" | "at-warehouse" | "out-for-delivery" | "delivered" | "failed-delivery" | "returned" | "cancelled";
export type PaymentStatus = "unpaid" | "processing" | "paid";

export interface Shipment {
  id: string;
  // Legacy fields (for backward compatibility)
  destinationStateId?: number;
  destinationState?: State;
  destinationCityId?: number;
  destinationCity?: City;
  destinationLgaId?: number;
  destinationLga?: LGA;
  destinationCountryId?: number;
  destinationCountry?: Country;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientPhoneNumber?: string;
  recipientEmail?: string;
  recipientAddress?: string;
  senderStateId?: number;
  senderCityId?: number;
  senderLgaId?: number;
  senderCountryId?: number;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  // New fields (recipient and address modules)
  recipientId?: string;
  recipient?: Recipient;
  senderAddressId?: string;
  senderAddress?: Address;
  destinationAddressId?: string;
  destinationAddress?: Address;
  // Common fields
  senderId: string;
  sender: User & { profile: UserProfile };
  deliveryOption: DeliveryOption;
  isDoorPickup: boolean;
  pickupPointId: string;
  pickupPoint: WareHouse;
  trackingCode: string;
  insideCityCharge: number;
  outsideCityCharge: number;
  parcels: Parcel[];
  whoPaysShippingFee: WhoPaysShippingFee;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  note: string | null;
  isScheduled: boolean;
  scheduledDate: string;
  status: ShipmentStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  driverId?: string;
  driver?: Driver;
  countryId: number;
  country: Country;
  costing: Costing;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ShipmentParcelInput {
  packagingId?: number;
  length: number;
  weight?: number | null; // Optional if dimensions (length, width, height) are provided
  height: number;
  width: number;
  quantity: number;
  isRushHour: boolean;
  extraCost: number;
  declaredValue?: number | null; // Changed from string to number (monetary amount)
  description?: string | null; // Optional parcel description
}

// Legacy payload (for backward compatibility)
export interface CreateShipmentPayloadLegacy {
  destinationStateId: number;
  destinationCityId: number;
  destinationLgaId: number;
  destinationCountryId: number;
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhoneNumber: string;
  recipientEmail: string;
  recipientAddress: string;
  senderId: string;
  deliveryOption: DeliveryOption;
  isDoorPickup: boolean;
  pickupPointId: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  senderStateId: number;
  senderCityId: number;
  senderLgaId: number;
  senderCountryId: number;
  insideCityCharge: number | null;
  outsideCityCharge: number | null;
  parcels: ShipmentParcelInput[];
  whoPaysShippingFee: WhoPaysShippingFee;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  note?: string;
  isScheduled: boolean;
  scheduledDate: string | null;
  countryId: number;
}

// New payload (using recipient and address modules)
export interface CreateShipmentPayload {
  // Option A: Use existing recipient
  recipientId?: string;
  // Option B: Create recipient inline
  recipient?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string | null;
    address?: {
      street: string;
      addressLine?: string | null;
      cityId: number;
      stateId: number;
      lgaId: number;
      countryId: number;
      latitude?: number | null;
      longitude?: number | null;
      postalCode?: string | null;
      addressType?: "HOME" | "WORK" | "OTHER";
    };
  };
  // Address references
  senderAddressId?: string; // Required if not door pickup
  destinationAddressId?: string; // Will be set from recipient's address or created inline
  // Common fields
  senderId: string;
  deliveryOption: DeliveryOption;
  isDoorPickup: boolean;
  pickupPointId: string;
  insideCityCharge: number | null;
  outsideCityCharge: number | null;
  parcels: ShipmentParcelInput[];
  whoPaysShippingFee: WhoPaysShippingFee;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  note?: string;
  isScheduled: boolean;
  scheduledDate: string | null;
  countryId: number;
  applyInsurance?: boolean;
  insurance?: number;
  // Legacy fields (for backward compatibility - will be deprecated)
  destinationStateId?: number;
  destinationCityId?: number;
  destinationLgaId?: number;
  destinationCountryId?: number;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientPhoneNumber?: string;
  recipientEmail?: string;
  recipientAddress?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  senderStateId?: number;
  senderCityId?: number;
  senderLgaId?: number;
  senderCountryId?: number;
}

// Query filters for shipments
export interface ShipmentFilters {
  page?: number;
  limit?: number;
  filter?: string; // JSON string of filter conditions (e.g., '{"status":"pending"}')
  search?: string;
  // Helper properties for building filter JSON string
  status?: ShipmentStatus;
  deliveryStatus?: DeliveryStatus;
  paymentStatus?: PaymentStatus;
  trackingCode?: string;
  senderId?: string;
  driverId?: string;
}

