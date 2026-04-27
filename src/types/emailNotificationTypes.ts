export interface EmailNotificationPreferences {
  id: number;
  shipmentTriggers: string[];
  shipmentReceivers: string[];
  staffAccountCreation: number;
  customerAccountCreation: number;
  accountDisabled: number;
  accountReEnabled: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UpdateEmailNotificationPreferencesDto {
  shipmentTriggers?: string[];
  shipmentReceivers?: string[];
  staffAccountCreation?: number;
  customerAccountCreation?: number;
  accountDisabled?: number;
  accountReEnabled?: number;
}

export enum ShipmentTrigger {
  ON_CREATION = "on_creation",
  ON_PICKUP = "on_pickup",
  ON_IN_TRANSIT = "on_in_transit",
  ON_DELIVERED = "on_delivered",
  ON_CANCELLED = "on_cancelled",
  ON_PAYMENT_RECEIVED = "on_payment_received",
  ON_PAYMENT_PENDING = "on_payment_pending",
}

export enum ShipmentReceiver {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  CUSTOMER = "customer",
}

