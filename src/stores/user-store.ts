import { CreateCustomerPayload, CustomerUser } from "@/types/auth"

import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import { QueryParams } from "@/lib/network"
import type { RootStore } from "./root-store"
import { isHydrated } from "mobx-persist-store"
import { makeAutoObservable } from "mobx"
import { getErrorMessage, toastUtils } from "@/utils/toast-utils"

const ACTIVE_STATUS_FILTER = JSON.stringify({ status: 1 })

export class UserStore {
  rootStore: RootStore
  customers: CustomerUser[] = []
  isLoadingCustomers = false
  error: string | null = null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    makeAutoObservable(this, {
      rootStore: false,
    })
  }

  get isHydrated() {
    return isHydrated(this)
  }

  async hydrate() {
    // This is intentionally empty as makePersistable handles hydration
    // But we need this method for consistency with other stores
  }

  async fetchCustomers(params?: QueryParams): Promise<ApiPaginatedResponse<CustomerUser>> {
    this.isLoadingCustomers = true
    this.error = null
    try {
      const response = await ApiService.getCustomers({
        filter: ACTIVE_STATUS_FILTER,
        limit: 10,
        page: 1,
        ...params,
      })
      if (response.status && response.data) {
        this.customers = response.data
        return response
      }
      throw new Error("Failed to fetch customers")
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to fetch customers", message)
      throw error
    } finally {
      this.isLoadingCustomers = false
    }
  }

  async createCustomer(payload: CreateCustomerPayload): Promise<{ status: boolean; data?: CustomerUser; error?: string }> {
    this.isLoadingCustomers = true
    this.error = null
    try {
      const response = await ApiService.createCustomer(payload)
      if (response.status && response.data) {
        return { status: response.status, data: response.data }
      }
      throw new Error(response.message || "Failed to create customer")
    } catch (error) {
        console.log('error', error);
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create customer", message)
      return { status: false, error: message }
    } finally {
      this.isLoadingCustomers = false
    }
  }
}

