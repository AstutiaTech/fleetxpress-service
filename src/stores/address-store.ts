import { Address, AddressFilters, CreateAddressPayload, UpdateAddressPayload } from "@/types/addressTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import { QueryParams } from "@/lib/network"
import type { RootStore } from "./root-store"

export class AddressStore {
  rootStore: RootStore
  addresses: Address[]
  currentAddress: Address | null
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
  filters: AddressFilters

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.addresses = []
    this.currentAddress = null
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

  async fetchAllAddresses(filters?: AddressFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      const response = await ApiService.getAllAddresses(this.filters)
      
      if (response && response.meta && response.data) {
        runInAction(() => {
          this.addresses = response.data || []
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
        throw new Error("Failed to fetch addresses - invalid response structure")
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error)
      })
      toastUtils.error("Failed to fetch addresses", this.error || "An unknown error occurred")
      return { success: false, error: this.error }
    }
  }

  async fetchAddressById(id: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getAddressById(id)
      if (response.status && response.data) {
        runInAction(() => {
          this.currentAddress = response.data
          this.isLoading = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch address"
        throw new Error(errorMessage)
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error)
      })
      toastUtils.error("Failed to fetch address", this.error || "An unknown error occurred")
      return { success: false, error: this.error }
    }
  }

  async fetchUserAddresses(userId: string, params?: QueryParams) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getUserAddresses(userId, params)
      if (response.status && response.data) {
        runInAction(() => {
          this.addresses = response.data
          this.isLoading = false
        })
        return { success: true, data: response.data }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch user addresses"
        throw new Error(errorMessage)
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error)
      })
      toastUtils.error("Failed to fetch user addresses", this.error || "An unknown error occurred")
      return { success: false, error: this.error }
    }
  }

  async createAddress(payload: CreateAddressPayload): Promise<{ status: boolean; data?: Address; error?: string }> {
    this.isCreating = true
    this.error = null
    try {
      const response = await ApiService.createAddress(payload)
      if (response.status && response.data) {
        runInAction(() => {
          this.addresses.push(response.data)
          this.isCreating = false
        })
        toastUtils.success("Address Created", "The address has been created successfully.")
        return { status: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to create address"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create address", message)
      return { status: false, error: message }
    } finally {
      runInAction(() => {
        this.isCreating = false
      })
    }
  }

  async updateAddress(payload: UpdateAddressPayload): Promise<{ success: boolean; data?: Address; error?: string }> {
    this.isUpdating = true
    this.error = null
    try {
      const response = await ApiService.updateAddress(payload)
      if (response.status && response.data) {
        runInAction(() => {
          const index = this.addresses.findIndex((a) => a.id === payload.id)
          if (index !== -1) {
            this.addresses[index] = response.data
          }
          if (this.currentAddress?.id === payload.id) {
            this.currentAddress = response.data
          }
          this.isUpdating = false
        })
        toastUtils.success("Address Updated", "The address has been updated successfully.")
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to update address"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to update address", message)
      return { success: false, error: message }
    } finally {
      runInAction(() => {
        this.isUpdating = false
      })
    }
  }

  async deleteAddress(id: string): Promise<{ success: boolean; error?: string }> {
    this.isDeleting = true
    this.error = null
    try {
      const response = await ApiService.deleteAddress(id)
      if (response.status) {
        runInAction(() => {
          this.addresses = this.addresses.filter((a) => a.id !== id)
          if (this.currentAddress?.id === id) {
            this.currentAddress = null
          }
          this.isDeleting = false
        })
        toastUtils.success("Address Deleted", "The address has been deleted successfully.")
        return { success: true }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to delete address"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to delete address", message)
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

  setFilters(filters: AddressFilters) {
    this.filters = { ...this.filters, ...filters }
  }

  clearFilters() {
    this.filters = {}
  }

  clearCurrentAddress() {
    this.currentAddress = null
  }

  async hydrate() {
    return Promise.resolve()
  }
}

