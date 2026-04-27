export interface GeneralSettings {
  id: number;
  applicationName: string;
  copyright: string;
  phone1: string;
  phone2: string;
  logo: string;
  emailAddress: string;
  favicon: string;
  primaryAddress: string;
  location: string;
  about: string;
  currency: string;
  orderTrackingPrefix: string;
  orderInvoicePrefix: string;
  invoicePrefix: string;
  primaryColor: string;
  textColor: string;
  vat: number;
  tax: number;
  insurance: number;
  insuranceThreshold?: number;
  insuranceCalculationMethod?: "declaredValue" | "subtotal" | "both";
  // Volumetric Weight Settings
  volumetricDivisor?: number;
  maxSupportedKg?: number;
  overMaxWeightPolicy?: "useHighestTier" | "reject" | "manualOverride";
  missingTierPolicy?: "useNearestLower" | "useNearestHigher" | "error";
  thresholdComparison?: ">" | ">=";
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
}