import { CreateRecipientPayload, Recipient, RecipientFilters, UpdateRecipientPayload } from "@/types/recipientTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import type { RootStore } from "./root-store"

export class RecipientStore {
  rootStore: RootStore
  recipients: Recipient[]
  currentRecipient: Recipient | null
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    pages: number
    total: number
  }
  filters: RecipientFilters

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.recipients = []
    this.currentRecipient = null
    this.isLoading = false
    this.isCreating = false
    this.isUpdating = false
    this.isDeleting = false
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

  async fetchAllRecipients(filters?: RecipientFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      const response = await ApiService.getAllRecipients(this.filters)
      
      if (response && response.meta && response.data) {
        runInAction(() => {
          this.recipients = response.data || []
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
        throw new Error("Failed to fetch recipients - invalid response structure")
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error)
      })
      toastUtils.error("Failed to fetch recipients", this.error)
      return { success: false, error: this.error }
    }
  }

  async fetchRecipientById(id: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getRecipientById(id)
      if (response.status && response.data) {
        runInAction(() => {
          this.currentRecipient = response.data
          this.isLoading = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch recipient"
        throw new Error(errorMessage)
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error)
      })
      toastUtils.error("Failed to fetch recipient", this.error)
      return { success: false, error: this.error }
    }
  }

  async createRecipient(payload: CreateRecipientPayload): Promise<{ status: boolean; data?: Recipient; error?: string }> {
    this.isCreating = true
    this.error = null
    try {
      // Remove keys with an empty string in payload before sending to API
      const filteredPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== "")
      )
      const response = await ApiService.createRecipient(filteredPayload as CreateRecipientPayload)
      if (response.status && response.data) {
        runInAction(() => {
          this.recipients.push(response.data)
          this.isCreating = false
        })
        toastUtils.success("Recipient Created", "The recipient has been created successfully.")
        return { status: true, data: response.data }
      }
      throw new Error(response.message || "Failed to create recipient")
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create recipient", message)
      return { status: false, error: message }
    } finally {
      runInAction(() => {
        this.isCreating = false
      })
    }
  }

  async updateRecipient(payload: UpdateRecipientPayload): Promise<{ success: boolean; data?: Recipient; error?: string }> {
    this.isUpdating = true
    this.error = null
    try {
      const response = await ApiService.updateRecipient(payload)
      if (response.status && response.data) {
        runInAction(() => {
          const index = this.recipients.findIndex((r) => r.id === payload.id)
          if (index !== -1) {
            this.recipients[index] = response.data
          }
          if (this.currentRecipient?.id === payload.id) {
            this.currentRecipient = response.data
          }
          this.isUpdating = false
        })
        toastUtils.success("Recipient Updated", "The recipient has been updated successfully.")
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to update recipient"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to update recipient", message)
      return { success: false, error: message }
    } finally {
      runInAction(() => {
        this.isUpdating = false
      })
    }
  }

  async deleteRecipient(id: string): Promise<{ success: boolean; error?: string }> {
    this.isDeleting = true
    this.error = null
    try {
      const response = await ApiService.deleteRecipient(id)
      if (response.status) {
        runInAction(() => {
          this.recipients = this.recipients.filter((r) => r.id !== id)
          if (this.currentRecipient?.id === id) {
            this.currentRecipient = null
          }
          this.isDeleting = false
        })
        toastUtils.success("Recipient Deleted", "The recipient has been deleted successfully.")
        return { success: true }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to delete recipient"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to delete recipient", message)
      return { success: false, error: message }
    } finally {
      runInAction(() => {
        this.isDeleting = false
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

  setFilters(filters: RecipientFilters) {
    this.filters = { ...this.filters, ...filters }
  }

  clearFilters() {
    this.filters = {}
  }

  clearCurrentRecipient() {
    this.currentRecipient = null
  }

  async hydrate() {
    return Promise.resolve()
  }
}

