export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  tax: number
  discount: number
}

export interface CreateInvoicePayload {
  customerId: string
  shipmentId: string
  invoiceDate: string
  dueDate: string
  tax: number
  discount: number
  items: InvoiceItem[]
  notes?: string
  terms?: string
}

export type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED"

export interface Invoice extends CreateInvoicePayload {
  id: string
  invoiceNumber: string
  totalAmount: number
  subtotal: number
  status?: InvoiceStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface InvoiceFilters {
  page?: number
  limit?: number
  filter?: string // JSON string of filter conditions
  search?: string
  customerId?: string
  shipmentId?: string
  invoiceDate?: string
  dueDate?: string
}
