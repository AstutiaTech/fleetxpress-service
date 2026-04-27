import { CreatePayablePayload, Payable, PayableFilters, UpdatePayablePayload } from "@/types/financialsTypes"
import { makeAutoObservable, runInAction } from "mobx"
import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import type { RootStore } from "./root-store"
import { getErrorMessage, toastUtils } from "@/utils/toast-utils"

export class PayablesStore {
  rootStore: RootStore
  payables: Payable[]
  currentPayable: Payable | null
  isLoading: boolean
  isCreatingPayable: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    pages: number
    total: number
  }
  filters: PayableFilters

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.payables = []
    this.currentPayable = null
    this.isLoading = false
    this.isCreatingPayable = false
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

  async fetchAllPayables(filters?: PayableFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      const response = await ApiService.getAllPayables(this.filters)
      
      if (response && response.status) {
        runInAction(() => {
          this.payables = response.data || []
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
        runInAction(() => {
          this.isLoading = false
          this.error = response?.message || "Failed to fetch payables"
        })
        return { success: false, error: this.error }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch payables")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch payables", errorMessage)
      return { success: false, error: this.error }
    }
  }

  async fetchPayableById(id: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getPayableById(id)
      if (response.status && response.data) {
        runInAction(() => {
          this.currentPayable = response.data
          this.isLoading = false
        })
        return { success: true }
      } else {
        throw new Error(response.message || "Failed to fetch payable")
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch payable")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch payable", errorMessage)
      return { success: false, error: this.error }
    }
  }

  async createPayable(payload: CreatePayablePayload): Promise<{ success: boolean; data?: Payable; error?: string }> {
    this.isCreatingPayable = true
    this.error = null
    try {
      const response = await ApiService.createPayable(payload)
      if (response.status && response.data) {
        toastUtils.success("Created", "Payable created successfully.")
        return { success: true, data: response.data }
      }
      throw new Error(response.message || "Failed to create payable")
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create payable", message)
      return { success: false, error: message }
    } finally {
      runInAction(() => {
        this.isCreatingPayable = false
      })
    }
  }

  async updatePayable(id: string, payload: UpdatePayablePayload): Promise<{ success: boolean; data?: Payable; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      const response = await ApiService.updatePayable(id, payload)
      if (response.status && response.data) {
        runInAction(() => {
          if (this.currentPayable?.id === id) {
            this.currentPayable = response.data
          }
          const index = this.payables.findIndex(p => p.id === id)
          if (index !== -1) {
            this.payables[index] = response.data
          }
          this.isLoading = false
        })
        toastUtils.success("Updated", "Payable updated successfully.")
        return { success: true, data: response.data }
      }
      throw new Error(response.message || "Failed to update payable")
    } catch (error) {
      const message = getErrorMessage(error)
      runInAction(() => {
        this.isLoading = false
        this.error = message
      })
      toastUtils.error("Failed to update payable", message)
      return { success: false, error: message }
    }
  }

  async deletePayable(id: string): Promise<{ success: boolean; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      const response = await ApiService.deletePayable(id)
      if (response.status) {
        runInAction(() => {
          this.payables = this.payables.filter(p => p.id !== id)
          if (this.currentPayable?.id === id) {
            this.currentPayable = null
          }
          this.isLoading = false
        })
        toastUtils.success("Deleted", "Payable deleted successfully.")
        return { success: true }
      }
      throw new Error(response.message || "Failed to delete payable")
    } catch (error) {
      const message = getErrorMessage(error)
      runInAction(() => {
        this.isLoading = false
        this.error = message
      })
      toastUtils.error("Failed to delete payable", message)
      return { success: false, error: message }
    }
  }

  setPage(page: number) {
    this.pagination.page = page
  }

  setPageLimit(limit: number) {
    this.pagination.limit = limit
    this.pagination.page = 1
  }

  setFilters(filters: PayableFilters) {
    this.filters = { ...this.filters, ...filters }
  }

  clearFilters() {
    this.filters = {}
  }

  clearCurrentPayable() {
    this.currentPayable = null
  }

  async hydrate() {
    return Promise.resolve()
  }
}

