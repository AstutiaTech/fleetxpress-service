"use client"

import {
  Account,
  AccountFilters,
  BalanceSheetReport,
  CreateAccountPayload,
  CreateBatchInvoicePayload,
  CreateCustomerShipmentPayload,
  CreatePayablePayload,
  CreatePaymentPayload,
  CreatePaystackPaymentLinkPayload,
  CreateReceivablePayload,
  CustomerShipmentResponse,
  EligibleShipment,
  EligibleShipmentsResponse,
  InitializePaystackPaymentPayload,
  InvoiceShipment,
  LedgerEntry,
  LedgerFilters,
  Payable,
  PayableAgingReport,
  PayableFilters,
  PaymentFilters,
  PaymentTransaction,
  PaystackPaymentLinkResponse,
  PaystackPaymentResponse,
  ProfitLossReport,
  ProfitLossReportType,
  Receivable,
  ReceivableAgingReport,
  ReceivableFilters,
  TrialBalanceReport,
  UpdateAccountPayload,
  UpdatePayablePayload,
  UpdatePaymentStatusPayload,
  UpdateReceivablePayload,
} from "@/types/financialsTypes"
import { Address, AddressFilters, CreateAddressPayload, UpdateAddressPayload } from "@/types/addressTypes"
import { ApiPaginatedResponse, ApiResponse } from "@/types/apiTypes"
import {
  BulkCreateWeightBasedPricePayload,
  CalculateShippingPriceRequest,
  CalculateShippingPriceResponse,
  CityType,
  CreateWeightBasedPricePayload,
  PricingImportResult,
  UpdateWeightBasedPricePayload,
  WeightBasedPrice,
} from "@/types/weightBasedPricingTypes"
import { City, Country, CreateCityPayload, CreateCountryPayload, CreateLGAPayload, CreateStatePayload, LGA, State } from "@/types/geoTypes"
import { CostingRate, CreateCostingRatePayload } from "@/types/costingTypes"
import { CreateCurrencyPayload, Currency } from "@/types/currencyTypes"
import { CreateCustomerPayload, CustomerUser, LoginCredentials, LoginResponse, OTPCredentials, OtpResponse } from "@/types/auth"
import { CreateDriverPayload, Driver, UpdateDriverPayload } from "@/types/driverTypes"
import { CreateEmailSettingsPayload, EmailSettings } from "@/types/emailTypes"
import { CreateInsideCityPayload, InsideCity } from "@/types/insideCityTypes"
import { CreateInvoicePayload, Invoice, InvoiceFilters } from "@/types/invoiceTypes"
import { CreateNotificationSettingsPayload, NotificationSettings } from "@/types/notificationTypes"
import { CreateOutsideCityPayload, OutsideCity } from "@/types/outsideCityTypes"
import { CreatePackagingPayload, Packaging } from "@/types/packagingType"
import { CreatePaymentSettingsPayload, PaymentSettings, UpdatePaymentSettingsPayload } from "@/types/paymentTypes"
import { CreateRecipientPayload, Recipient, RecipientFilters, UpdateRecipientPayload } from "@/types/recipientTypes"
import { CreateShipmentPayload, DeliveryStatus, PaymentStatus, Shipment, ShipmentFilters, ShipmentStatus } from "@/types/shipmentTypes"
import { CreateSmsSettingsPayload, SmsSettings } from "@/types/smsTypes"
import { CreateStaffPayload, StaffUser, UpdateStaffPayload } from "@/types/staffTypes"
import { CreateVehiclePayload, UpdateVehiclePayload, Vehicle } from "@/types/vehicleTypes"
import { CreateVehicleTypePayload, UpdateVehicleTypePayload, VehicleType } from "@/types/vehicleTypeTypes"
import { CreateWarehouseTypePayload, WarehouseType } from "@/types/warehouseTypeTypes"
import {
  DashboardSummary,
  PaymentData,
  RevenueExpensesData,
  ShipmentByLocationData,
  ShipmentByMonthData,
} from "@/types/dashboardTypes"
import { DatabaseModeResponse, SetDatabaseModeRequest } from "@/types/databaseModeTypes"
import {
  EmailNotificationPreferences,
  UpdateEmailNotificationPreferencesDto,
} from "@/types/emailNotificationTypes"
import NetworkUtils, { QueryParams } from "./network"
import axiosInstance from "./axios"
import { Parcel, UpdateParcelPayload } from "@/types/parcelTypes"
import { QuickQuoteRequest, QuickQuoteResponse } from "@/types/quickQuoteTypes"
import { TrackingEvent, TrackingInfo, UpdateStatusRequest } from "@/types/trackingTypes"
import { Activity, ActivityFilters } from "@/types/activityTypes"
import { Backup, CreateBackupResponse, BackupListResponse, CleanupResponse } from "@/types/backupTypes"
import {
  activitiesEndpoint,
  addUserAddress,
  addressesEndpoint,
  assignShipmentToDriver,
  backupEndpoint,
  backupListEndpoint,
  cleanupBackupsEndpoint,
  downloadBackupEndpoint,
  authSendUserTokenEmail,
  authVerifyUserToken,
  balanceSheetReportEndpoint,
  bulkCreateWeightBasedPricesEndpoint,
  calculateShippingPriceEndpoint,
  chartOfAccountsEndpoint,
  createBatchInvoice,
  createPaystackPaymentLinkEndpoint,
  currencySettingsEndpoint,
  customerShipmentEndpoint,
  customersEndpoint,
  dashboardPaymentsEndpoint,
  dashboardRevenueExpensesEndpoint,
  dashboardShipmentsByLocationEndpoint,
  dashboardShipmentsByMonthEndpoint,
  dashboardSummaryEndpoint,
  databaseModeEndpoint,
  deleteAccount,
  deletePayable,
  deletePaymentSettings,
  deleteReceivable,
  deleteShipment,
  deleteWeightBasedPrice,
  disabledShipmentsEndpoint,
  driversEndpoint,
  emailNotificationPreferencesEndpoint,
  emailSettingsEndpoint,
  generalSettingsEndpoint,
  geoCitiesEndpoint,
  geoCountriesEndpoint,
  geoLgasEndpoint,
  geoStatesEndpoint,
  getAccountBalance,
  getAccountByCode,
  getAccountById,
  getActivityById,
  getAccountsByCategory,
  getAccountsByType,
  getAddressById,
  getEligibleShipments,
  getInvoiceById,
  getInvoiceShipments,
  getLedgerEntryById,
  getPayableById,
  getPaymentById,
  getPaymentSettingsById,
  getReceivableById,
  getRecipientById,
  getShipmentById,
  getShipmentCosting,
  getShipmentParcels,
  getTrackingHistory,
  getUserAddresses,
  getWeightBasedPriceById,
  importPricingEndpoint,
  initializePaystackPaymentEndpoint,
  insideCityShippingRoutesEndpoint,
  invoicesEndpoint,
  ledgerEndpoint,
  notificationSettingsEndpoint,
  outsideCityShippingRoutesEndpoint,
  payableAgingReportEndpoint,
  payablesEndpoint,
  paymentSettingsEndpoint,
  paymentsEndpoint,
  profitLossReportEndpoint,
  quickQuoteEndpoint,
  receivableAgingReportEndpoint,
  receivablesEndpoint,
  recipientsEndpoint,
  reverseLedgerEntry,
  shipmentsEndpoint,
  shippingCostingsEndpoint,
  shippingInsideCityEndpoint,
  shippingOutsideCityEndpoint,
  shippingPackagingEndpoint,
  smsSettingsEndpoint,
  staffEndpoint,
  trackShipmentByCode,
  trialBalanceReportEndpoint,
  unassignShipmentFromDriver,
  updateAccount,
  updateCity,
  updateCosting,
  updateCountry,
  updateDriver,
  updateInsideCity,
  updateLGA,
  updateOutsideCity,
  updatePackage,
  updateParcel,
  updatePayable,
  updatePaymentSettings,
  updatePaymentStatus,
  updateReceivable,
  updateShipment,
  updateShipmentStatus,
  updateState,
  updateVehicle,
  updateVehicleType,
  updateWarehouse,
  updateWarehouseType,
  updateWeightBasedPrice,
  uploadFileEndpoint,
  uploadMultipleFilesEndpoint,
  vehicleTypesEndpoint,
  vehiclesEndpoint,
  warehouseTypesEndpoint,
  warehousesEndpoint,
  weightBasedPricesEndpoint,
} from "./endpoints"

import { Costing } from "@/types/costingTypes"
import { CreateWarehousePayload } from "@/types/warehousesType"
import { GeneralSettings } from "@/types/settingsTypes"
import { WareHouse } from "@/types/warehousesType"

// API service class with typed methods for reqres.in
export class ApiService {
  // Authentication endpoints
  static async login(credentials: LoginCredentials): Promise<ApiResponse<OtpResponse>> {
    return NetworkUtils.post<ApiResponse<OtpResponse>>(authSendUserTokenEmail, credentials)
  }

  static async verifyOtp(credentials: OTPCredentials): Promise<ApiResponse<LoginResponse>> {
    return NetworkUtils.post<ApiResponse<LoginResponse>>(authVerifyUserToken, credentials)
  }

  static async getGeneralSettings(): Promise<ApiResponse<GeneralSettings>> {
    return NetworkUtils.get<ApiResponse<GeneralSettings>>(generalSettingsEndpoint)
  }

  static async updateGeneralSettings(data: Partial<GeneralSettings>): Promise<ApiResponse<GeneralSettings>> {
    return NetworkUtils.put<ApiResponse<GeneralSettings>, Partial<GeneralSettings>>(generalSettingsEndpoint, data)
  }

  // Database Mode endpoints
  static async getDatabaseMode(): Promise<ApiResponse<DatabaseModeResponse>> {
    return NetworkUtils.get<ApiResponse<DatabaseModeResponse>>(databaseModeEndpoint)
  }

  static async setDatabaseMode(mode: 'live' | 'sandbox'): Promise<ApiResponse<DatabaseModeResponse>> {
    return NetworkUtils.put<ApiResponse<DatabaseModeResponse>, SetDatabaseModeRequest>(databaseModeEndpoint, { mode })
  }

  // Upload endpoints
  static async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string; filename: string; size: number; [key: string]: unknown }>> {
    return NetworkUtils.uploadFile<ApiResponse<{ url: string; filename: string; size: number; [key: string]: unknown }>>(
      uploadFileEndpoint,
      file,
      onProgress
    )
  }

  static async uploadMultipleFiles(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<Array<{ url: string; filename: string; size: number; [key: string]: unknown }>>> {
    return NetworkUtils.uploadMultipleFiles<ApiResponse<Array<{ url: string; filename: string; size: number; [key: string]: unknown }>>>(
      uploadMultipleFilesEndpoint,
      files,
      onProgress
    )
  }

  // Shipment endpoints
  static async getAllShipments(filters?: ShipmentFilters): Promise<ApiPaginatedResponse<Shipment>> {
    return NetworkUtils.get<ApiPaginatedResponse<Shipment>>(
      shipmentsEndpoint, 
      filters as QueryParams
    )
  }
  
  static async getAllDisabledShipments(filters?: ShipmentFilters): Promise<ApiPaginatedResponse<Shipment>> {
    return NetworkUtils.get<ApiPaginatedResponse<Shipment>>(
      disabledShipmentsEndpoint, 
      filters as QueryParams
    )
  }

  static async getShipmentById(id: string): Promise<ApiResponse<Shipment>> {
    return NetworkUtils.get<ApiResponse<Shipment>>(getShipmentById(id))
  }

  static async getShipmentParcels(shipmentId: string): Promise<ApiResponse<Parcel[]>> {
    return NetworkUtils.get<ApiResponse<Parcel[]>>(getShipmentParcels(shipmentId))
  }

  static async updateParcel(
    parcelId: string,
    payload: UpdateParcelPayload
  ): Promise<ApiResponse<Parcel>> {
    return NetworkUtils.put<ApiResponse<Parcel>, UpdateParcelPayload>(
      updateParcel(parcelId),
      payload
    )
  }

  static async getShipmentCosting(shipmentId: string): Promise<ApiResponse<Costing>> {
    return NetworkUtils.get<ApiResponse<Costing>>(getShipmentCosting(shipmentId))
  }

  static async createShipment(payload: CreateShipmentPayload): Promise<ApiResponse<Shipment>> {
    return NetworkUtils.post<ApiResponse<Shipment>, CreateShipmentPayload>(shipmentsEndpoint, payload)
  }

  static async updateShipment(
    id: string,
    payload: Partial<CreateShipmentPayload & { status?: ShipmentStatus; deliveryStatus?: DeliveryStatus; paymentStatus?: PaymentStatus }>
  ): Promise<ApiResponse<Shipment>> {
    return NetworkUtils.put<ApiResponse<Shipment>, Partial<CreateShipmentPayload & { status?: ShipmentStatus; deliveryStatus?: DeliveryStatus; paymentStatus?: PaymentStatus }>>(
      updateShipment(id),
      payload
    )
  }

  static async assignShipmentToDriver(shipmentId: string, driverId: string): Promise<ApiResponse<Shipment>> {
    return NetworkUtils.patch<ApiResponse<Shipment>>(assignShipmentToDriver(shipmentId, driverId))
  }

  static async unassignShipmentFromDriver(shipmentId: string): Promise<ApiResponse<Shipment>> {
    return NetworkUtils.patch<ApiResponse<Shipment>>(unassignShipmentFromDriver(shipmentId))
  }

  static async updateShipmentStatuses(
    id: string,
    payload: { status?: ShipmentStatus; deliveryStatus?: DeliveryStatus; paymentStatus?: PaymentStatus }
  ): Promise<ApiResponse<Shipment>> {
    // Use the same endpoint as updateShipment
    return NetworkUtils.put<ApiResponse<Shipment>, { status?: ShipmentStatus; deliveryStatus?: DeliveryStatus; paymentStatus?: PaymentStatus }>(
      updateShipment(id),
      payload
    )
  }

  static async disableShipment(id: string): Promise<ApiResponse<Shipment>> {
    // Disable by setting deletedAt or status, depending on backend implementation
    // Using updateShipment endpoint with deletedAt field
    return NetworkUtils.delete<ApiResponse<Shipment>>(deleteShipment(id))
  }

  static async getCountries(params?: QueryParams): Promise<ApiResponse<Country[]>> {
    return NetworkUtils.get<ApiResponse<Country[]>>(geoCountriesEndpoint, params)
  }

  static async getStates(countryId: number, params?: QueryParams): Promise<ApiResponse<State[]>> {
    return NetworkUtils.get<ApiResponse<State[]>>(geoStatesEndpoint, { countryId, ...params })
  }

  static async getCities(stateId: number, params?: QueryParams): Promise<ApiResponse<City[]>> {
    return NetworkUtils.get<ApiResponse<City[]>>(geoCitiesEndpoint, { stateId, ...params })
  }

  static async getLgas(stateId: number, params?: QueryParams): Promise<ApiResponse<LGA[]>> {
    return NetworkUtils.get<ApiResponse<LGA[]>>(geoLgasEndpoint, { stateId, ...params })
  }

  static async getInsideCityCharges(params?: QueryParams): Promise<ApiResponse<InsideCity[]>> {
    return NetworkUtils.get<ApiResponse<InsideCity[]>>(shippingInsideCityEndpoint, params)
  }

  static async getOutsideCityCharges(params?: QueryParams): Promise<ApiResponse<OutsideCity[]>> {
    return NetworkUtils.get<ApiResponse<OutsideCity[]>>(shippingOutsideCityEndpoint, params)
  }

  static async getPackagingOptions(params?: QueryParams): Promise<ApiResponse<Packaging[]>> {
    return NetworkUtils.get<ApiResponse<Packaging[]>>(shippingPackagingEndpoint, params)
  }

  static async getCostings(): Promise<ApiResponse<CostingRate[]>> {
    return NetworkUtils.get<ApiResponse<CostingRate[]>>(shippingCostingsEndpoint)
  }

  static async getWarehouses(params?: QueryParams): Promise<ApiPaginatedResponse<WareHouse>> {
    return NetworkUtils.get<ApiPaginatedResponse<WareHouse>>(warehousesEndpoint, params)
  }

  static async getCustomers(params?: QueryParams): Promise<ApiPaginatedResponse<CustomerUser>> {
    return NetworkUtils.get<ApiPaginatedResponse<CustomerUser>>(customersEndpoint, params)
  }

  static async createCustomer(payload: CreateCustomerPayload): Promise<ApiResponse<CustomerUser>> {
    return NetworkUtils.post<ApiResponse<CustomerUser>, CreateCustomerPayload>(customersEndpoint, payload)
  }

  // Address endpoints
  static async getAllAddresses(filters?: AddressFilters): Promise<ApiPaginatedResponse<Address>> {
    return NetworkUtils.get<ApiPaginatedResponse<Address>>(addressesEndpoint, filters as QueryParams)
  }

  static async getAddressById(id: string): Promise<ApiResponse<Address>> {
    return NetworkUtils.get<ApiResponse<Address>>(getAddressById(id))
  }

  static async createAddress(payload: CreateAddressPayload): Promise<ApiResponse<Address>> {
    return NetworkUtils.post<ApiResponse<Address>, CreateAddressPayload>(addressesEndpoint, payload)
  }

  static async updateAddress(payload: UpdateAddressPayload): Promise<ApiResponse<Address>> {
    return NetworkUtils.put<ApiResponse<Address>, UpdateAddressPayload>(getAddressById(payload.id), payload)
  }

  static async deleteAddress(id: string): Promise<ApiResponse<void>> {
    return NetworkUtils.delete<ApiResponse<void>>(getAddressById(id))
  }

  static async getUserAddresses(userId: string, params?: QueryParams): Promise<ApiResponse<Address[]>> {
    return NetworkUtils.get<ApiResponse<Address[]>>(addressesEndpoint, { userId, ...params })
  }

  static async addUserAddress(userId: string, addressId: string): Promise<ApiResponse<Address>> {
    return NetworkUtils.post<ApiResponse<Address>, { addressId: string }>(addUserAddress(userId), { addressId })
  }

  // Recipient endpoints
  static async getAllRecipients(filters?: RecipientFilters): Promise<ApiPaginatedResponse<Recipient>> {
    return NetworkUtils.get<ApiPaginatedResponse<Recipient>>(recipientsEndpoint, filters as QueryParams)
  }

  static async getRecipientById(id: string): Promise<ApiResponse<Recipient>> {
    return NetworkUtils.get<ApiResponse<Recipient>>(getRecipientById(id))
  }

  static async createRecipient(payload: CreateRecipientPayload): Promise<ApiResponse<Recipient>> {
    return NetworkUtils.post<ApiResponse<Recipient>, CreateRecipientPayload>(recipientsEndpoint, payload)
  }

  static async updateRecipient(payload: UpdateRecipientPayload): Promise<ApiResponse<Recipient>> {
    return NetworkUtils.put<ApiResponse<Recipient>, UpdateRecipientPayload>(getRecipientById(payload.id), payload)
  }

  static async deleteRecipient(id: string): Promise<ApiResponse<void>> {
    return NetworkUtils.delete<ApiResponse<void>>(getRecipientById(id))
  }

  // Invoice endpoints
  static async getAllInvoices(filters?: InvoiceFilters): Promise<ApiPaginatedResponse<Invoice>> {
    return NetworkUtils.get<ApiPaginatedResponse<Invoice>>(invoicesEndpoint, filters as QueryParams)
  }

  static async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    return NetworkUtils.get<ApiResponse<Invoice>>(getInvoiceById(id))
  }

  static async createInvoice(payload: CreateInvoicePayload): Promise<ApiResponse<Invoice>> {
    return NetworkUtils.post<ApiResponse<Invoice>, CreateInvoicePayload>(invoicesEndpoint, payload)
  }

  // Settings endpoints - Inside City Routes (simplified - only id and title)
  static async getAllInsideCity(): Promise<ApiResponse<InsideCity[]>> {
    return NetworkUtils.get<ApiResponse<InsideCity[]>>(insideCityShippingRoutesEndpoint)
  }

  static async createInsideCity(payload: CreateInsideCityPayload): Promise<ApiResponse<InsideCity>> {
    return NetworkUtils.post<ApiResponse<InsideCity>, CreateInsideCityPayload>(insideCityShippingRoutesEndpoint, payload)
  }

  static async updateInsideCity(id: number, payload: CreateInsideCityPayload): Promise<ApiResponse<InsideCity>> {
    return NetworkUtils.put<ApiResponse<InsideCity>, CreateInsideCityPayload>(updateInsideCity(id), payload)
  }

  // Settings endpoints - Outside City Routes (simplified - only id and title)
  static async getAllOutsideCity(): Promise<ApiResponse<OutsideCity[]>> {
    return NetworkUtils.get<ApiResponse<OutsideCity[]>>(outsideCityShippingRoutesEndpoint)
  }

  static async createOutsideCity(payload: CreateOutsideCityPayload): Promise<ApiResponse<OutsideCity>> {
    return NetworkUtils.post<ApiResponse<OutsideCity>, CreateOutsideCityPayload>(outsideCityShippingRoutesEndpoint, payload)
  }

  static async updateOutsideCity(id: number, payload: CreateOutsideCityPayload): Promise<ApiResponse<OutsideCity>> {
    return NetworkUtils.put<ApiResponse<OutsideCity>, CreateOutsideCityPayload>(updateOutsideCity(id), payload)
  }

  // Settings endpoints - Costings
  static async getAllCostings(): Promise<ApiResponse<CostingRate[]>> {
    return NetworkUtils.get<ApiResponse<CostingRate[]>>(shippingCostingsEndpoint)
  }

  static async updateCosting(id: number, payload: CreateCostingRatePayload): Promise<ApiResponse<CostingRate>> {
    return NetworkUtils.put<ApiResponse<CostingRate>, CreateCostingRatePayload>(updateCosting(id), payload)
  }

  // Settings endpoints - Packages
  static async getAllPackages(): Promise<ApiResponse<Packaging[]>> {
    return NetworkUtils.get<ApiResponse<Packaging[]>>(shippingPackagingEndpoint)
  }

  static async createPackage(payload: CreatePackagingPayload): Promise<ApiResponse<Packaging>> {
    return NetworkUtils.post<ApiResponse<Packaging>, CreatePackagingPayload>(shippingPackagingEndpoint, payload)
  }

  static async updatePackage(id: number, payload: CreatePackagingPayload): Promise<ApiResponse<Packaging>> {
    return NetworkUtils.put<ApiResponse<Packaging>, CreatePackagingPayload>(updatePackage(id), payload)
  }

  // Settings endpoints - SMS
  static async getAllSmsSettings(): Promise<ApiResponse<SmsSettings[]>> {
    return NetworkUtils.get<ApiResponse<SmsSettings[]>>(smsSettingsEndpoint)
  }

  static async createSmsSettings(payload: CreateSmsSettingsPayload): Promise<ApiResponse<SmsSettings>> {
    return NetworkUtils.post<ApiResponse<SmsSettings>, CreateSmsSettingsPayload>(smsSettingsEndpoint, payload)
  }

  static async updateSmsSettings(id: number, payload: CreateSmsSettingsPayload): Promise<ApiResponse<SmsSettings>> {
    return NetworkUtils.put<ApiResponse<SmsSettings>, CreateSmsSettingsPayload>(`${smsSettingsEndpoint}/${id}`, payload)
  }

  // Settings endpoints - Notifications
  static async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return NetworkUtils.get<ApiResponse<NotificationSettings>>(notificationSettingsEndpoint)
  }

  static async updateNotificationSettings(payload: CreateNotificationSettingsPayload): Promise<ApiResponse<NotificationSettings>> {
    return NetworkUtils.put<ApiResponse<NotificationSettings>, CreateNotificationSettingsPayload>(notificationSettingsEndpoint, payload)
  }

  // Settings endpoints - Payments
  static async getAllPaymentSettings(): Promise<ApiResponse<PaymentSettings[]>> {
    return NetworkUtils.get<ApiResponse<PaymentSettings[]>>(paymentSettingsEndpoint)
  }

  static async createPaymentSettings(payload: CreatePaymentSettingsPayload): Promise<ApiResponse<PaymentSettings>> {
    return NetworkUtils.post<ApiResponse<PaymentSettings>, CreatePaymentSettingsPayload>(paymentSettingsEndpoint, payload)
  }

  static async getPaymentSettingsById(id: number): Promise<ApiResponse<PaymentSettings>> {
    return NetworkUtils.get<ApiResponse<PaymentSettings>>(getPaymentSettingsById(id))
  }

  static async updatePaymentSettings(id: number, payload: UpdatePaymentSettingsPayload): Promise<ApiResponse<PaymentSettings>> {
    return NetworkUtils.put<ApiResponse<PaymentSettings>, UpdatePaymentSettingsPayload>(updatePaymentSettings(id), payload)
  }

  static async deletePaymentSettings(id: number): Promise<ApiResponse<null>> {
    return NetworkUtils.delete<ApiResponse<null>>(deletePaymentSettings(id))
  }

  // Settings endpoints - Email
  static async getAllEmailSettings(): Promise<ApiResponse<EmailSettings[]>> {
    return NetworkUtils.get<ApiResponse<EmailSettings[]>>(emailSettingsEndpoint)
  }

  static async createEmailSettings(payload: CreateEmailSettingsPayload): Promise<ApiResponse<EmailSettings>> {
    return NetworkUtils.post<ApiResponse<EmailSettings>, CreateEmailSettingsPayload>(emailSettingsEndpoint, payload)
  }

  static async updateEmailSettings(id: number, payload: CreateEmailSettingsPayload): Promise<ApiResponse<EmailSettings>> {
    return NetworkUtils.put<ApiResponse<EmailSettings>, CreateEmailSettingsPayload>(`${emailSettingsEndpoint}/${id}`, payload)
  }

  // Settings endpoints - Email Notification Preferences
  static async getEmailNotificationPreferences(): Promise<ApiResponse<EmailNotificationPreferences>> {
    return NetworkUtils.get<ApiResponse<EmailNotificationPreferences>>(emailNotificationPreferencesEndpoint)
  }

  static async updateEmailNotificationPreferences(
    payload: UpdateEmailNotificationPreferencesDto
  ): Promise<ApiResponse<EmailNotificationPreferences>> {
    return NetworkUtils.put<ApiResponse<EmailNotificationPreferences>, UpdateEmailNotificationPreferencesDto>(
      emailNotificationPreferencesEndpoint,
      payload
    )
  }

  // Settings endpoints - Currencies
  static async getAllCurrencies(): Promise<ApiResponse<Currency[]>> {
    return NetworkUtils.get<ApiResponse<Currency[]>>(currencySettingsEndpoint)
  }

  static async createCurrency(payload: CreateCurrencyPayload): Promise<ApiResponse<Currency>> {
    return NetworkUtils.post<ApiResponse<Currency>, CreateCurrencyPayload>(currencySettingsEndpoint, payload)
  }

  static async updateCurrency(id: number, payload: CreateCurrencyPayload): Promise<ApiResponse<Currency>> {
    return NetworkUtils.put<ApiResponse<Currency>, CreateCurrencyPayload>(`${currencySettingsEndpoint}/${id}`, payload)
  }

  // Geo endpoints - Countries
  static async createCountry(payload: CreateCountryPayload): Promise<ApiResponse<Country>> {
    return NetworkUtils.post<ApiResponse<Country>, CreateCountryPayload>(geoCountriesEndpoint, payload)
  }

  static async updateCountry(id: number, payload: CreateCountryPayload): Promise<ApiResponse<Country>> {
    return NetworkUtils.put<ApiResponse<Country>, CreateCountryPayload>(updateCountry(id), payload)
  }

  // Geo endpoints - States
  static async createState(payload: CreateStatePayload): Promise<ApiResponse<State>> {
    return NetworkUtils.post<ApiResponse<State>, CreateStatePayload>(geoStatesEndpoint, payload)
  }

  static async updateState(id: number, payload: CreateStatePayload): Promise<ApiResponse<State>> {
    return NetworkUtils.put<ApiResponse<State>, CreateStatePayload>(updateState(id), payload)
  }

  // Geo endpoints - Cities
  static async createCity(payload: CreateCityPayload): Promise<ApiResponse<City>> {
    return NetworkUtils.post<ApiResponse<City>, CreateCityPayload>(geoCitiesEndpoint, payload)
  }

  static async updateCity(id: number, payload: CreateCityPayload): Promise<ApiResponse<City>> {
    return NetworkUtils.put<ApiResponse<City>, CreateCityPayload>(updateCity(id), payload)
  }

  // Geo endpoints - LGAs
  static async createLGA(payload: CreateLGAPayload): Promise<ApiResponse<LGA>> {
    return NetworkUtils.post<ApiResponse<LGA>, CreateLGAPayload>(geoLgasEndpoint, payload)
  }

  static async updateLGA(id: number, payload: CreateLGAPayload): Promise<ApiResponse<LGA>> {
    return NetworkUtils.put<ApiResponse<LGA>, CreateLGAPayload>(updateLGA(id), payload)
  }

  // Warehouse Types endpoints
  static async getAllWarehouseTypes(): Promise<ApiResponse<WarehouseType[]>> {
    return NetworkUtils.get<ApiResponse<WarehouseType[]>>(warehouseTypesEndpoint)
  }

  static async createWarehouseType(payload: CreateWarehouseTypePayload): Promise<ApiResponse<WarehouseType>> {
    return NetworkUtils.post<ApiResponse<WarehouseType>, CreateWarehouseTypePayload>(warehouseTypesEndpoint, payload)
  }

  static async updateWarehouseType(id: string, payload: CreateWarehouseTypePayload): Promise<ApiResponse<WarehouseType>> {
    return NetworkUtils.put<ApiResponse<WarehouseType>, CreateWarehouseTypePayload>(updateWarehouseType(id), payload)
  }

  // Warehouse endpoints
  static async getAllWarehouses(): Promise<ApiResponse<WareHouse[]>> {
    return NetworkUtils.get<ApiResponse<WareHouse[]>>(warehousesEndpoint)
  }

  static async createWarehouse(payload: CreateWarehousePayload): Promise<ApiResponse<WareHouse>> {
    return NetworkUtils.post<ApiResponse<WareHouse>, CreateWarehousePayload>(warehousesEndpoint, payload)
  }

  static async updateWarehouse(id: string, payload: CreateWarehousePayload): Promise<ApiResponse<WareHouse>> {
    return NetworkUtils.put<ApiResponse<WareHouse>, CreateWarehousePayload>(updateWarehouse(id), payload)
  }

  // Vehicle Types endpoints
  static async getAllVehicleTypes(): Promise<ApiResponse<VehicleType[]>> {
    return NetworkUtils.get<ApiResponse<VehicleType[]>>(vehicleTypesEndpoint)
  }

  static async createVehicleType(payload: CreateVehicleTypePayload): Promise<ApiResponse<VehicleType>> {
    return NetworkUtils.post<ApiResponse<VehicleType>, CreateVehicleTypePayload>(vehicleTypesEndpoint, payload)
  }

  static async updateVehicleType(id: string, payload: UpdateVehicleTypePayload): Promise<ApiResponse<VehicleType>> {
    return NetworkUtils.put<ApiResponse<VehicleType>, UpdateVehicleTypePayload>(updateVehicleType(id), payload)
  }

  // Driver endpoints
  static async getAllDrivers(): Promise<ApiResponse<Driver[]>> {
    return NetworkUtils.get<ApiResponse<Driver[]>>(driversEndpoint)
  }

  static async createDriver(payload: CreateDriverPayload): Promise<ApiResponse<Driver>> {
    return NetworkUtils.post<ApiResponse<Driver>, CreateDriverPayload>(driversEndpoint, payload)
  }

  static async updateDriver(id: string, payload: UpdateDriverPayload): Promise<ApiResponse<Driver>> {
    return NetworkUtils.put<ApiResponse<Driver>, UpdateDriverPayload>(updateDriver(id), payload)
  }

  // Vehicle endpoints
  static async getAllVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return NetworkUtils.get<ApiResponse<Vehicle[]>>(vehiclesEndpoint)
  }

  static async createVehicle(payload: CreateVehiclePayload): Promise<ApiResponse<Vehicle>> {
    return NetworkUtils.post<ApiResponse<Vehicle>, CreateVehiclePayload>(vehiclesEndpoint, payload)
  }

  static async updateVehicle(id: string, payload: UpdateVehiclePayload): Promise<ApiResponse<Vehicle>> {
    return NetworkUtils.put<ApiResponse<Vehicle>, UpdateVehiclePayload>(updateVehicle(id), payload)
  }

  // Staff endpoints
  static async getAllStaff(params?: QueryParams): Promise<ApiResponse<StaffUser[]>> {
    return NetworkUtils.get<ApiResponse<StaffUser[]>>(staffEndpoint, params)
  }

  static async createStaff(payload: CreateStaffPayload): Promise<ApiResponse<StaffUser>> {
    return NetworkUtils.post<ApiResponse<StaffUser>, CreateStaffPayload>(staffEndpoint, payload)
  }
  
  static async updateStaff(id: string, payload: CreateStaffPayload): Promise<ApiResponse<StaffUser>> {
    return NetworkUtils.put<ApiResponse<StaffUser>, CreateStaffPayload>(`${staffEndpoint}/${id}`, payload)
  }

  // ==================== Financials - Receivables ====================
  static async getAllReceivables(params?: ReceivableFilters): Promise<ApiPaginatedResponse<Receivable>> {
    return NetworkUtils.get<ApiPaginatedResponse<Receivable>>(receivablesEndpoint, params as QueryParams)
  }

  static async getReceivableById(id: string): Promise<ApiResponse<Receivable>> {
    return NetworkUtils.get<ApiResponse<Receivable>>(getReceivableById(id))
  }

  static async createReceivable(payload: CreateReceivablePayload): Promise<ApiResponse<Receivable>> {
    return NetworkUtils.post<ApiResponse<Receivable>, CreateReceivablePayload>(receivablesEndpoint, payload)
  }

  static async getEligibleShipments(customerId: string): Promise<ApiResponse<EligibleShipmentsResponse>> {
    return NetworkUtils.get<ApiResponse<EligibleShipmentsResponse>>(getEligibleShipments(customerId))
  }

  static async createBatchInvoice(payload: CreateBatchInvoicePayload): Promise<ApiResponse<Receivable>> {
    return NetworkUtils.post<ApiResponse<Receivable>, CreateBatchInvoicePayload>(createBatchInvoice(), payload)
  }

  static async getInvoiceShipments(invoiceId: string): Promise<ApiResponse<InvoiceShipment[]>> {
    return NetworkUtils.get<ApiResponse<InvoiceShipment[]>>(getInvoiceShipments(invoiceId))
  }

  static async updateReceivable(id: string, payload: UpdateReceivablePayload): Promise<ApiResponse<Receivable>> {
    return NetworkUtils.put<ApiResponse<Receivable>, UpdateReceivablePayload>(updateReceivable(id), payload)
  }

  static async deleteReceivable(id: string): Promise<ApiResponse<void>> {
    return NetworkUtils.delete<ApiResponse<void>>(deleteReceivable(id))
  }

  // ==================== Financials - Payables ====================
  static async getAllPayables(params?: PayableFilters): Promise<ApiPaginatedResponse<Payable>> {
    return NetworkUtils.get<ApiPaginatedResponse<Payable>>(payablesEndpoint, params as QueryParams)
  }

  static async getPayableById(id: string): Promise<ApiResponse<Payable>> {
    return NetworkUtils.get<ApiResponse<Payable>>(getPayableById(id))
  }

  static async createPayable(payload: CreatePayablePayload): Promise<ApiResponse<Payable>> {
    return NetworkUtils.post<ApiResponse<Payable>, CreatePayablePayload>(payablesEndpoint, payload)
  }

  static async updatePayable(id: string, payload: UpdatePayablePayload): Promise<ApiResponse<Payable>> {
    return NetworkUtils.put<ApiResponse<Payable>, UpdatePayablePayload>(updatePayable(id), payload)
  }

  static async deletePayable(id: string): Promise<ApiResponse<void>> {
    return NetworkUtils.delete<ApiResponse<void>>(deletePayable(id))
  }

  // ==================== Financials - Payments ====================
  static async getAllPayments(params?: PaymentFilters): Promise<ApiPaginatedResponse<PaymentTransaction>> {
    return NetworkUtils.get<ApiPaginatedResponse<PaymentTransaction>>(paymentsEndpoint, params as QueryParams)
  }

  static async getPaymentById(id: string): Promise<ApiResponse<PaymentTransaction>> {
    return NetworkUtils.get<ApiResponse<PaymentTransaction>>(getPaymentById(id))
  }

  static async createPayment(payload: CreatePaymentPayload): Promise<ApiResponse<PaymentTransaction>> {
    return NetworkUtils.post<ApiResponse<PaymentTransaction>, CreatePaymentPayload>(paymentsEndpoint, payload)
  }

  static async updatePaymentStatus(id: string, payload: UpdatePaymentStatusPayload): Promise<ApiResponse<PaymentTransaction>> {
    return NetworkUtils.patch<ApiResponse<PaymentTransaction>, UpdatePaymentStatusPayload>(updatePaymentStatus(id), payload)
  }

  static async initializePaystackPayment(payload: InitializePaystackPaymentPayload): Promise<ApiResponse<PaystackPaymentResponse>> {
    return NetworkUtils.post<ApiResponse<PaystackPaymentResponse>, InitializePaystackPaymentPayload>(initializePaystackPaymentEndpoint, payload)
  }

  static async createPaystackPaymentLink(shipmentId: string, payload: CreatePaystackPaymentLinkPayload): Promise<ApiResponse<PaystackPaymentLinkResponse>> {
    return NetworkUtils.post<ApiResponse<PaystackPaymentLinkResponse>, CreatePaystackPaymentLinkPayload>(createPaystackPaymentLinkEndpoint(shipmentId), payload)
  }

  // ==================== Financials - Ledger ====================
  static async getAllLedgerEntries(params?: LedgerFilters): Promise<ApiPaginatedResponse<LedgerEntry>> {
    return NetworkUtils.get<ApiPaginatedResponse<LedgerEntry>>(ledgerEndpoint, params as QueryParams)
  }

  static async getLedgerEntryById(id: string): Promise<ApiResponse<LedgerEntry>> {
    return NetworkUtils.get<ApiResponse<LedgerEntry>>(getLedgerEntryById(id))
  }

  static async reverseLedgerEntry(id: string): Promise<ApiResponse<LedgerEntry>> {
    return NetworkUtils.post<ApiResponse<LedgerEntry>>(reverseLedgerEntry(id))
  }

  static async getAccountBalance(id: string, asOfDate?: string): Promise<ApiResponse<{ debit: number; credit: number; netBalance: number }>> {
    return NetworkUtils.get<ApiResponse<{ debit: number; credit: number; netBalance: number }>>(getAccountBalance(id), asOfDate ? { asOfDate } : undefined)
  }

  // ==================== Financials - Chart of Accounts ====================
  static async getAllAccounts(params?: AccountFilters): Promise<ApiPaginatedResponse<Account>> {
    return NetworkUtils.get<ApiPaginatedResponse<Account>>(chartOfAccountsEndpoint, params as QueryParams)
  }

  static async getAccountById(id: string): Promise<ApiResponse<Account>> {
    return NetworkUtils.get<ApiResponse<Account>>(getAccountById(id))
  }

  static async getAccountByCode(code: string): Promise<ApiResponse<Account>> {
    return NetworkUtils.get<ApiResponse<Account>>(getAccountByCode(code))
  }

  static async getAccountsByType(type: string): Promise<ApiResponse<Account[]>> {
    return NetworkUtils.get<ApiResponse<Account[]>>(getAccountsByType(type))
  }

  static async getAccountsByCategory(category: string): Promise<ApiResponse<Account[]>> {
    return NetworkUtils.get<ApiResponse<Account[]>>(getAccountsByCategory(category))
  }

  static async createAccount(payload: CreateAccountPayload): Promise<ApiResponse<Account>> {
    return NetworkUtils.post<ApiResponse<Account>, CreateAccountPayload>(chartOfAccountsEndpoint, payload)
  }

  static async updateAccount(id: string, payload: UpdateAccountPayload): Promise<ApiResponse<Account>> {
    return NetworkUtils.put<ApiResponse<Account>, UpdateAccountPayload>(updateAccount(id), payload)
  }

  static async deleteAccount(id: string): Promise<ApiResponse<void>> {
    return NetworkUtils.delete<ApiResponse<void>>(deleteAccount(id))
  }

  // ==================== Financials - Reports ====================
  static async getTrialBalance(asOfDate?: string): Promise<ApiResponse<TrialBalanceReport>> {
    return NetworkUtils.get<ApiResponse<TrialBalanceReport>>(trialBalanceReportEndpoint, asOfDate ? { asOfDate } : undefined)
  }

  static async getBalanceSheet(asOfDate?: string): Promise<ApiResponse<BalanceSheetReport>> {
    return NetworkUtils.get<ApiResponse<BalanceSheetReport>>(balanceSheetReportEndpoint, asOfDate ? { asOfDate } : undefined)
  }

  static async getProfitLoss(startDate: string, endDate: string): Promise<ApiResponse<ProfitLossReportType>> {
    return NetworkUtils.get<ApiResponse<ProfitLossReportType>>(profitLossReportEndpoint, { startDate, endDate })
  }

  static async getReceivableAging(customerId?: string, asOfDate?: string): Promise<ApiResponse<ReceivableAgingReport>> {
    const params: QueryParams = {}
    if (customerId) params.customerId = customerId
    if (asOfDate) params.asOfDate = asOfDate
    return NetworkUtils.get<ApiResponse<ReceivableAgingReport>>(receivableAgingReportEndpoint, params)
  }

  static async getPayableAging(driverId?: string, vendorId?: string, asOfDate?: string): Promise<ApiResponse<PayableAgingReport>> {
    const params: QueryParams = {}
    if (driverId) params.driverId = driverId
    if (vendorId) params.vendorId = vendorId
    if (asOfDate) params.asOfDate = asOfDate
    return NetworkUtils.get<ApiResponse<PayableAgingReport>>(payableAgingReportEndpoint, params)
  }

  // ==================== Customer Shipment ====================
  static async createCustomerShipment(payload: CreateCustomerShipmentPayload): Promise<ApiResponse<CustomerShipmentResponse>> {
    return NetworkUtils.post<ApiResponse<CustomerShipmentResponse>, CreateCustomerShipmentPayload>(customerShipmentEndpoint, payload)
  }

  // ==================== Quick Quote ====================
  static async getQuickQuote(payload: QuickQuoteRequest): Promise<ApiResponse<QuickQuoteResponse>> {
    return NetworkUtils.post<ApiResponse<QuickQuoteResponse>, QuickQuoteRequest>(quickQuoteEndpoint, payload)
  }

  // ==================== Shipment Tracking ====================
  static async trackShipmentByCode(trackingCode: string): Promise<ApiResponse<TrackingInfo>> {
    return NetworkUtils.get<ApiResponse<TrackingInfo>>(trackShipmentByCode(trackingCode))
  }

  static async getTrackingHistory(shipmentId: string): Promise<ApiResponse<TrackingEvent[]>> {
    return NetworkUtils.get<ApiResponse<TrackingEvent[]>>(getTrackingHistory(shipmentId))
  }

  static async updateShipmentStatus(
    shipmentId: string,
    payload: UpdateStatusRequest
  ): Promise<ApiResponse<{ id: string; status?: string; deliveryStatus?: string }>> {
    return NetworkUtils.patch<ApiResponse<{ id: string; status?: string; deliveryStatus?: string }>, UpdateStatusRequest>(updateShipmentStatus(shipmentId), payload)
  }

  // ==================== Dashboard ====================
  static async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    return NetworkUtils.get<ApiResponse<DashboardSummary>>(dashboardSummaryEndpoint)
  }

  static async getRevenueExpenses(params?: { timeRange?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<RevenueExpensesData[]>> {
    return NetworkUtils.get<ApiResponse<RevenueExpensesData[]>>(dashboardRevenueExpensesEndpoint, params)
  }

  static async getShipmentsByMonth(params?: { months?: number; startMonth?: string; endMonth?: string }): Promise<ApiResponse<ShipmentByMonthData[]>> {
    return NetworkUtils.get<ApiResponse<ShipmentByMonthData[]>>(dashboardShipmentsByMonthEndpoint, params)
  }

  static async getPayments(params?: { currency?: string; days?: number; startDate?: string; endDate?: string }): Promise<ApiResponse<PaymentData[]>> {
    return NetworkUtils.get<ApiResponse<PaymentData[]>>(dashboardPaymentsEndpoint, params)
  }

  static async getShipmentsByLocation(params?: { months?: number; startDate?: string; endDate?: string; limit?: number }): Promise<ApiResponse<ShipmentByLocationData[]>> {
    return NetworkUtils.get<ApiResponse<ShipmentByLocationData[]>>(dashboardShipmentsByLocationEndpoint, params)
  }

  // ==================== Weight-Based Pricing ====================
  static async getWeightBasedPrices(params?: { cityType?: CityType; category?: string; page?: number; limit?: number }): Promise<ApiResponse<WeightBasedPrice[]> | ApiPaginatedResponse<WeightBasedPrice>> {
    return NetworkUtils.get<ApiResponse<WeightBasedPrice[]> | ApiPaginatedResponse<WeightBasedPrice>>(weightBasedPricesEndpoint, params as QueryParams)
  }

  static async getWeightBasedPriceById(id: number): Promise<ApiResponse<WeightBasedPrice>> {
    return NetworkUtils.get<ApiResponse<WeightBasedPrice>>(getWeightBasedPriceById(id))
  }

  static async createWeightBasedPrice(payload: CreateWeightBasedPricePayload): Promise<ApiResponse<WeightBasedPrice>> {
    return NetworkUtils.post<ApiResponse<WeightBasedPrice>, CreateWeightBasedPricePayload>(weightBasedPricesEndpoint, payload)
  }

  static async bulkCreateWeightBasedPrices(payload: BulkCreateWeightBasedPricePayload): Promise<ApiResponse<WeightBasedPrice[]>> {
    return NetworkUtils.post<ApiResponse<WeightBasedPrice[]>, BulkCreateWeightBasedPricePayload>(bulkCreateWeightBasedPricesEndpoint, payload)
  }

  static async updateWeightBasedPrice(id: number, payload: UpdateWeightBasedPricePayload): Promise<ApiResponse<WeightBasedPrice>> {
    return NetworkUtils.put<ApiResponse<WeightBasedPrice>, UpdateWeightBasedPricePayload>(updateWeightBasedPrice(id), payload)
  }

  static async deleteWeightBasedPrice(id: number): Promise<ApiResponse<void>> {
    return NetworkUtils.delete<ApiResponse<void>>(deleteWeightBasedPrice(id))
  }

  static async calculateShippingPrice(payload: CalculateShippingPriceRequest): Promise<ApiResponse<CalculateShippingPriceResponse>> {
    return NetworkUtils.post<ApiResponse<CalculateShippingPriceResponse>, CalculateShippingPriceRequest>(calculateShippingPriceEndpoint, payload)
  }

  // ==================== Pricing Import ====================
  static async importPricing(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<PricingImportResult>> {
    return NetworkUtils.uploadFile<ApiResponse<PricingImportResult>>(importPricingEndpoint, file, onProgress)
  }

  // ==================== Activities ====================
  static async getAllActivities(filters?: ActivityFilters): Promise<ApiPaginatedResponse<Activity>> {
    // Build query params, handling filter as JSON string if provided
    const params: QueryParams = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
    }
    
    if (filters?.search) {
      params.search = filters.search
    }
    
    // Build filter object for JSON stringification
    const filterObj: Record<string, unknown> = {}
    if (filters?.activityType) filterObj.activityType = filters.activityType
    if (filters?.userId) filterObj.userId = filters.userId
    if (filters?.status !== undefined) filterObj.status = filters.status
    
    if (Object.keys(filterObj).length > 0) {
      params.filter = JSON.stringify(filterObj)
    }
    
    return NetworkUtils.get<ApiPaginatedResponse<Activity>>(activitiesEndpoint, params)
  }

  static async getActivityById(id: string): Promise<ApiResponse<Activity>> {
    return NetworkUtils.get<ApiResponse<Activity>>(getActivityById(id))
  }

  // ==================== Backups ====================
  static async createBackup(): Promise<CreateBackupResponse> {
    return NetworkUtils.post<CreateBackupResponse>(backupEndpoint)
  }

  static async listBackups(): Promise<BackupListResponse> {
    return NetworkUtils.get<BackupListResponse>(backupListEndpoint)
  }

  static async downloadBackup(filename: string): Promise<Blob> {
    const response = await axiosInstance.get(downloadBackupEndpoint(filename), {
      responseType: 'blob',
    })
    return response.data
  }

  static async cleanupBackups(): Promise<CleanupResponse> {
    return NetworkUtils.post<CleanupResponse>(cleanupBackupsEndpoint)
  }
}

