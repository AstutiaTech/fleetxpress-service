import { CreateReceivablePayload, Receivable, ReceivableFilters, UpdateReceivablePayload } from "@/types/financialsTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import { QueryParams } from "@/lib/network"
import type { RootStore } from "./root-store"

export class ReceivablesStore {
  rootStore: RootStore
  receivables: Receivable[]
  currentReceivable: Receivable | null
  isLoading: boolean
  isCreatingReceivable: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    pages: number
    total: number
  }
  filters: ReceivableFilters

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.receivables = []
    this.currentReceivable = null
    this.isLoading = false
    this.isCreatingReceivable = false
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

  async fetchAllReceivables(filters?: ReceivableFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      const response = await ApiService.getAllReceivables(this.filters)
      
      if (response && response.status) {
        runInAction(() => {
          this.receivables = response.data || []
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
        const errorMessage = getApiErrorMessage(response as any) || "Failed to fetch receivables"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred")
      throw new Error(errorMessage)
    }
  }

  async fetchReceivableById(id: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getReceivableById(id)
      if (response.status && response.data) {
        runInAction(() => {
          this.currentReceivable = response.data
          this.isLoading = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch receivable"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch receivable")
      throw new Error(errorMessage)
    }
  }

  async createReceivable(payload: CreateReceivablePayload): Promise<{ success: boolean; data?: Receivable; error?: string }> {
    this.isCreatingReceivable = true
    this.error = null
    try {
      const response = await ApiService.createReceivable(payload)
      if (response.status && response.data) {
        toastUtils.success("Created", "Receivable created successfully.")
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || "Failed to create receivable"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create receivable", message)
      return { success: false, error: this.error }
    } finally {
      runInAction(() => {
        this.isCreatingReceivable = false
      })
    }
  }

  async updateReceivable(id: string, payload: UpdateReceivablePayload): Promise<{ success: boolean; data?: Receivable; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      const response = await ApiService.updateReceivable(id, payload)
      if (response.status && response.data) {
        runInAction(() => {
          if (this.currentReceivable?.id === id) {
            this.currentReceivable = response.data
          }
          const index = this.receivables.findIndex(r => r.id === id)
          if (index !== -1) {
            this.receivables[index] = response.data
          }
          this.isLoading = false
        })
        toastUtils.success("Updated", "Receivable updated successfully.")
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || "Failed to update receivable"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to update receivable", this.error || "An unknown error occurred")
      return { success: false, error: this.error }
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async deleteReceivable(id: string): Promise<{ success: boolean; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      const response = await ApiService.deleteReceivable(id)
      if (response.status) {
        runInAction(() => {
          this.receivables = this.receivables.filter(r => r.id !== id)
          if (this.currentReceivable?.id === id) {
            this.currentReceivable = null
          }
          this.isLoading = false
        })
        toastUtils.success("Deleted", "Receivable deleted successfully.")
        return { success: true }
      }
      const errorMessage = getApiErrorMessage(response as any) || "Failed to delete receivable"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to delete receivable", this.error || "An unknown error occurred")
      return { success: false, error: this.error }
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  setPage(page: number) {
    this.pagination.page = page
  }

  setPageLimit(limit: number) {
    this.pagination.limit = limit
    this.pagination.page = 1
  }

  setFilters(filters: ReceivableFilters) {
    this.filters = { ...this.filters, ...filters }
  }

  clearFilters() {
    this.filters = {}
  }

  clearCurrentReceivable() {
    this.currentReceivable = null
  }

  async hydrate() {
    return Promise.resolve()
  }
}

