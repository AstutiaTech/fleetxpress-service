import { CreateInvoicePayload, Invoice, InvoiceFilters } from "@/types/invoiceTypes"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import { QueryParams } from "@/lib/network"
import type { RootStore } from "./root-store"
import { getErrorMessage, toastUtils } from "@/utils/toast-utils"

export class InvoiceStore {
  rootStore: RootStore
  invoices: Invoice[]
  currentInvoice: Invoice | null
  isLoading: boolean
  isCreatingInvoice: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    pages: number
    total: number
  }
  filters: InvoiceFilters

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.invoices = []
    this.currentInvoice = null
    this.isLoading = false
    this.isCreatingInvoice = false
    this.error = null
    this.pagination = {
      page: 1,
      limit: 10,
      pages: 1,
      total: 0,
    }
    this.filters = {}

    makeAutoObservable(this, {
      rootStore: false,
    })
  }

  async fetchAllInvoices(filters?: InvoiceFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      // Build filter JSON string from filter properties
      const filterObj: Record<string, unknown> = {}
      if (this.filters.customerId) filterObj.customerId = this.filters.customerId
      if (this.filters.shipmentId) filterObj.shipmentId = this.filters.shipmentId
      if (this.filters.invoiceDate) filterObj.invoiceDate = this.filters.invoiceDate
      if (this.filters.dueDate) filterObj.dueDate = this.filters.dueDate

      // Prepare API params
      const apiParams: InvoiceFilters = {
        page: this.filters.page || this.pagination.page,
        limit: this.filters.limit || this.pagination.limit,
        search: this.filters.search,
      }

      // Add filter as JSON string if there are filter conditions
      if (Object.keys(filterObj).length > 0) {
        apiParams.filter = JSON.stringify(filterObj)
      } else if (this.filters.filter) {
        // Use provided filter string if no individual filter properties
        apiParams.filter = this.filters.filter
      }

      const response = await ApiService.getAllInvoices(apiParams)
      
      if (response && response.meta && response.data) {
        runInAction(() => {
          this.invoices = response.data || []
          const meta = response.meta
          this.pagination = {
            page: meta?.page || 1,
            limit: meta?.limit || 10,
            pages: meta?.total ? Math.ceil(meta.total / (meta.limit || 10)) : 1,
            total: meta?.total || 0,
          }
          this.isLoading = false
        })
        return { success: true }
      } else {
        console.error("Invalid response structure:", response)
        throw new Error("Failed to fetch invoices - invalid response structure")
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error, "An error occurred")
      })
      toastUtils.error("Failed to fetch invoices", this.error)
      return { success: false, error: this.error }
    }
  }

  async fetchInvoiceById(id: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getInvoiceById(id)
      if (response.status && response.data) {
        runInAction(() => {
          this.currentInvoice = response.data
          this.isLoading = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch invoice"
        throw new Error(errorMessage)
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error, "An error occurred")
      })
      toastUtils.error("Failed to fetch invoice", this.error)
      return { success: false, error: this.error }
    }
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    this.isCreatingInvoice = true
    this.error = null
    try {
      const response = await ApiService.createInvoice(payload)
      if (response.status && response.data) {
        return { success: true, data: response.data }
      }
      throw new Error(response.message || "Failed to create invoice")
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create invoice", message)
      return { success: false, error: message }
    } finally {
      this.isCreatingInvoice = false
    }
  }

  setPage(page: number) {
    this.pagination.page = page
  }

  setPageLimit(limit: number) {
    this.pagination.limit = limit
    this.pagination.page = 1 // Reset to first page when changing page limit
  }

  setFilters(filters: InvoiceFilters) {
    this.filters = { ...this.filters, ...filters }
  }

  clearFilters() {
    this.filters = {}
  }

  clearCurrentInvoice() {
    this.currentInvoice = null
  }

  async hydrate() {
    // No persistence needed for invoice store
    return Promise.resolve()
  }
}

