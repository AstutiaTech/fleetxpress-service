import { CreatePaymentPayload, PaymentFilters, PaymentTransaction, UpdatePaymentStatusPayload } from "@/types/financialsTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import type { RootStore } from "./root-store"

export class PaymentsStore {
  rootStore: RootStore
  payments: PaymentTransaction[]
  currentPayment: PaymentTransaction | null
  isLoading: boolean
  isCreatingPayment: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    pages: number
    total: number
  }
  filters: PaymentFilters

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.payments = []
    this.currentPayment = null
    this.isLoading = false
    this.isCreatingPayment = false
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

  async fetchAllPayments(filters?: PaymentFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      const response = await ApiService.getAllPayments(this.filters)
      
      if (response && response.status) {
        runInAction(() => {
          this.payments = response.data || []
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
          const errorMessage = getApiErrorMessage(response as any) || "Failed to fetch payments"
          this.error = errorMessage
          throw new Error(errorMessage)
        })
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch payments")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch payments", errorMessage)
      return { success: false, error: this.error }
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async fetchPaymentById(id: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getPaymentById(id)
      if (response.status && response.data) {
        runInAction(() => {
          this.currentPayment = response.data
          this.isLoading = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch payment"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch payment")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch payment", errorMessage)
      return { success: false, error: this.error }
    }
  }

  async createPayment(payload: CreatePaymentPayload): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    this.isCreatingPayment = true
    this.error = null
    try {
      const response = await ApiService.createPayment(payload)
      if (response.status && response.data) {
        toastUtils.success("Created", "Payment created successfully.")
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to create payment"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create payment", message)
      return { success: false, error: message }
    } finally {
      runInAction(() => {
        this.isCreatingPayment = false
      })
    }
  }

  async updatePaymentStatus(id: string, payload: UpdatePaymentStatusPayload): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      const response = await ApiService.updatePaymentStatus(id, payload)
      if (response.status && response.data) {
        runInAction(() => {
          if (this.currentPayment?.id === id) {
            this.currentPayment = response.data
          }
          const index = this.payments.findIndex(p => p.id === id)
          if (index !== -1) {
            this.payments[index] = response.data
          }
          this.isLoading = false
        })
        toastUtils.success("Updated", "Payment status updated successfully.")
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to update payment status"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to update payment status", this.error || "An unknown error occurred")
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

  setFilters(filters: PaymentFilters) {
    this.filters = { ...this.filters, ...filters }
  }

  clearFilters() {
    this.filters = {}
  }

  clearCurrentPayment() {
    this.currentPayment = null
  }

  async hydrate() {
    return Promise.resolve()
  }
}

