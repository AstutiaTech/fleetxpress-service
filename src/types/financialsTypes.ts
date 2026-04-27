// Financials Types

// ==================== Receivables (Invoices) ====================
export type ReceivableStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED"

export interface ReceivableItem {
  description: string
  quantity: number
  unitPrice: number
  tax?: number
  discount?: number
}

export interface CreateReceivablePayload {
  customerId: string
  shipmentId?: string
  shipmentIds?: string[] // For batch invoices
  invoiceDate: string
  dueDate: string
  totalAmount: number
  items?: ReceivableItem[]
  notes?: string
  terms?: string
}

export interface CreateBatchInvoicePayload {
  customerId: string
  shipmentIds: string[]
  invoiceDate?: string
  dueDate?: string
  notes?: string
}

export interface UpdateReceivablePayload extends Partial<CreateReceivablePayload> {
  status?: ReceivableStatus
}

export interface InvoiceShipment {
  id: string
  invoiceId: string
  shipmentId: string
  amount: number
  shipment?: {
    id: string
    trackingCode?: string
    status: string
    deliveryStatus?: string
    paymentStatus: string
  }
  createdAt: string
  updatedAt: string
}

export interface EligibleShipment {
  id: string
  trackingCode?: string
  status: string
  deliveryStatus?: string
  paymentStatus: string
  amount: number
  createdAt: string
}

export interface EligibleShipmentsResponse {
  shipments: EligibleShipment[]
  totalAmount: number
  count: number
}

export interface Receivable extends CreateReceivablePayload {
  id: string
  invoiceNumber: string
  paidAmount: number
  balance: number
  status: ReceivableStatus
  customer?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  shipment?: {
    id: string
    trackingCode: string
  }
  invoiceShipments?: InvoiceShipment[] // For batch invoices
  payments?: PaymentTransaction[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface ReceivableFilters {
  page?: number
  limit?: number
  status?: ReceivableStatus
  customerId?: string
  shipmentId?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  search?: string
}

// ==================== Payables (Bills) ====================
export type PayableStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED"

export interface PayableItem {
  description: string
  quantity: number
  unitPrice: number
  tax?: number
  discount?: number
}

export interface CreatePayablePayload {
  driverId?: string
  vendorId?: string
  billDate: string
  dueDate: string
  totalAmount: number
  items?: PayableItem[]
  notes?: string
  terms?: string
}

export interface UpdatePayablePayload extends Partial<CreatePayablePayload> {
  status?: PayableStatus
}

export interface Payable extends CreatePayablePayload {
  id: string
  billNumber: string
  paidAmount: number
  balance: number
  status: PayableStatus
  driver?: {
    id: string
    name: string
    email: string
    phoneNumber1: string
  }
  vendor?: {
    id: string
    name: string
    email: string
    phone: string
  }
  payments?: PaymentTransaction[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface PayableFilters {
  page?: number
  limit?: number
  status?: PayableStatus
  driverId?: string
  vendorId?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  search?: string
}

// ==================== Payments ====================
export type PaymentType = "RECEIVABLE" | "PAYABLE"
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "PAYSTACK" | "CARD" | "CHEQUE"
export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"

export interface CreatePaymentPayload {
  paymentType: PaymentType
  receivableId?: string
  payableId?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  externalReference?: string
  accountId?: string
  notes?: string
}

export interface UpdatePaymentStatusPayload {
  status: PaymentStatus
  externalReference?: string
}

export interface InitializePaystackPaymentPayload {
  shipmentId: string
  customerEmail: string
  customerName?: string
  callbackUrl?: string
}

export interface PaystackPaymentResponse {
  payment: PaymentTransaction
  authorizationUrl: string
  reference: string
}

export interface CreatePaystackPaymentLinkPayload {
  amount?: number
  successMessage?: string
  name?: string
  description: string
  metadata?: Record<string, any>
}

export interface PaystackPaymentLinkResponse {
  paymentUrl: string
  pageSlug: string
  reference: string
  accessCode: string
  shipmentId: string
  trackingCode: string
}

export interface PaymentTransaction extends CreatePaymentPayload {
  id: string
  transactionReference: string
  status: PaymentStatus
  receivable?: Receivable
  payable?: Payable
  account?: {
    id: string
    code: string
    name: string
    type: string
  }
  createdBy?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface PaymentFilters {
  page?: number
  limit?: number
  paymentType?: PaymentType
  status?: PaymentStatus
  paymentMethod?: PaymentMethod
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  receivableId?: string
  payableId?: string
  search?: string
}

// ==================== General Ledger ====================
export type TransactionType = "DEBIT" | "CREDIT"
export type TransactionSource = "SHIPMENT" | "DRIVER_PAYMENT" | "MANUAL" | "SYSTEM" | "PAYMENT" | "INVOICE"

export interface LedgerTransaction {
  id: string
  accountId: string
  account: {
    id: string
    code: string
    name: string
    type: string
    category: string
  }
  transactionType: TransactionType
  amount: number
  description?: string
}

export interface LedgerEntry {
  id: string
  entryNumber: string
  transactionDate: string
  description: string
  referenceNumber?: string
  transactionType?: string
  source: TransactionSource
  totalAmount: number
  transactions: LedgerTransaction[]
  isReversed: boolean
  reversedBy?: string
  reversedAt?: string
  createdBy?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface LedgerFilters {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  accountId?: string
  source?: TransactionSource
  transactionType?: string
  search?: string
}

// ==================== Chart of Accounts ====================
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
export type AccountCategory = "CURRENT_ASSET" | "FIXED_ASSET" | "CURRENT_LIABILITY" | "LONG_TERM_LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"

export interface CreateAccountPayload {
  accountCode: string
  accountName: string
  accountType: AccountType
  accountCategory: AccountCategory
  parentAccountId?: string | null
  description?: string
  status: number // 1 for active, 0 for inactive
  openingBalance?: string
}

export interface UpdateAccountPayload extends Partial<CreateAccountPayload> {
  status?: number
}

export interface Account {
  id: string
  accountCode: string
  accountName: string
  accountType: AccountType
  accountCategory: AccountCategory
  parentAccountId?: string | null
  openingBalance: string
  status: number // 1 for active, 0 for inactive
  description?: string | null
  parentAccount?: Account | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface AccountFilters {
  page?: number
  limit?: number
  accountType?: AccountType
  accountCategory?: AccountCategory
  search?: string
  status?: number
}

// ==================== Financial Reports ====================
export interface TrialBalanceItem {
  accountCode: string
  accountName: string
  debitBalance: number
  creditBalance: number
}

export interface TrialBalanceReport {
  asOfDate: string
  items: TrialBalanceItem[]
  totalDebits: number
  totalCredits: number
}

export interface BalanceSheetItem {
  accountCode: string
  accountName: string
  balance: number
  type: AccountType
  category: AccountCategory
}

export interface BalanceSheetReport {
  asOfDate: string
  assets: BalanceSheetItem[]
  liabilities: BalanceSheetItem[]
  equity: BalanceSheetItem[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
}

export interface ProfitLossItem {
  accountCode: string
  accountName: string
  amount: number
  type: "REVENUE" | "EXPENSE"
}

export interface ProfitLossReport {
  startDate: string
  endDate: string
  revenue: ProfitLossItem[]
  expenses: ProfitLossItem[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
}

export interface ProfitLossReportType {
  netIncome: number
  revenue: ProfitLossReportRevenueType
  expenses: ProfitLossReportExpenseType
}

export interface ProfitLossReportExpenseType {
  cogs: number
  operatingExpenses: number
  financialExpenses: number
  depreciation: number
  totalExpenses: number
}

export interface ProfitLossReportRevenueType {
  operatingRevenue: number
  otherRevenue: number
  totalRevenue: number
}

export interface AgingBucket {
  "0-30": number
  "31-60": number
  "61-90": number
  "90+": number
  total: number
}

export interface ReceivableAgingItem {
  customerId: string
  customerName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  balance: number
  aging: AgingBucket
}

export interface ReceivableAgingReport {
  asOfDate: string
  items: ReceivableAgingItem[]
  summary: AgingBucket
}

export interface PayableAgingItem {
  driverId?: string
  vendorId?: string
  driverName?: string
  vendorName?: string
  billNumber: string
  billDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  balance: number
  aging: AgingBucket
}

export interface PayableAgingReport {
  asOfDate: string
  items: PayableAgingItem[]
  summary: AgingBucket
}

// ==================== Customer Shipment ====================
export interface CreateCustomerShipmentPayload {
  recipientId: string
  destinationAddressId?: string | null
  destinationCountryId: number
  deliveryAddress: string
  postalCode?: string
  deliveryLat?: number | null
  deliveryLng?: number | null
  deliveryOption: DeliveryOption
  isDoorPickup: boolean
  pickupPointId: string
  senderAddressId?: string | null
  parcels: ShipmentParcelInput[]
  whoPaysShippingFee: WhoPaysShippingFee
  paymentMode: PaymentMode
  paymentType?: string
  note?: string
  isScheduled?: boolean
  scheduledDate?: string
}

export interface CustomerShipmentResponse {
  shipment: Shipment
  costing: {
    amount: number
    deliveryCharge: number
    packagingCharge: number
    extraCost: number
    extraVolume: number
    vat: number
  }
}

// Re-export from shipmentTypes
import { DeliveryOption, PaymentMode, Shipment, ShipmentParcelInput, WhoPaysShippingFee } from "./shipmentTypes"
