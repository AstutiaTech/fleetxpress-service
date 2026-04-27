import { City, Country, LGA, State } from "@/types/geoTypes"
import { CreateShipmentPayload, DeliveryStatus, PaymentStatus, Shipment, ShipmentFilters, ShipmentStatus } from "@/types/shipmentTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiPaginatedResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import { Costing } from "@/types/costingTypes"
import { CostingRate } from "@/types/costingTypes"
import { InsideCity } from "@/types/insideCityTypes"
import { OutsideCity } from "@/types/outsideCityTypes"
import { Packaging } from "@/types/packagingType"
import { Parcel } from "@/types/parcelTypes"
import { QueryParams } from "@/lib/network"
import type { RootStore } from "./root-store"
import { WareHouse } from "@/types/warehousesType"

const ACTIVE_STATUS_FILTER = JSON.stringify({ status: 1 })

export class ShipmentStore {
  rootStore: RootStore
  shipments: Shipment[]
  disabledShipments: Shipment[]
  currentShipment: Shipment | null
  shipmentParcels: Parcel[]
  shipmentCosting: Costing | null
  isLoading: boolean
  isLoadingParcels: boolean
  isLoadingCosting: boolean
  isCreatingShipment: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    pages: number
    total: number
  }
  filters: ShipmentFilters

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.shipments = []
    this.disabledShipments = []
    this.currentShipment = null
    this.shipmentParcels = []
    this.shipmentCosting = null
    this.isLoading = false
    this.isLoadingParcels = false
    this.isLoadingCosting = false
    this.isCreatingShipment = false
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

  async fetchAllShipments(filters?: ShipmentFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      // Build filter JSON string from filter properties
      const filterObj: Record<string, unknown> = {}
      if (this.filters.status) filterObj.status = this.filters.status
      if (this.filters.deliveryStatus) filterObj.deliveryStatus = this.filters.deliveryStatus
      if (this.filters.paymentStatus) filterObj.paymentStatus = this.filters.paymentStatus
      if (this.filters.trackingCode) filterObj.trackingCode = this.filters.trackingCode
      if (this.filters.senderId) filterObj.senderId = this.filters.senderId

      // Prepare API params
      const apiParams: ShipmentFilters = {
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

      const response = await ApiService.getAllShipments(apiParams)
      
      if (response && response.meta && response.data) {
        
        runInAction(() => {
          this.shipments = response.data || []
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
        throw new Error("Failed to fetch shipments - invalid response structure")
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An unknown error occurred")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch shipments", errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  async fetchAllDisabledShipments(filters?: ShipmentFilters) {
    this.isLoading = true
    this.error = null
    this.filters = { ...this.filters, ...filters }

    try {
      // Build filter JSON string from filter properties
      const filterObj: Record<string, unknown> = {}
      if (this.filters.status) filterObj.status = this.filters.status
      if (this.filters.trackingCode) filterObj.trackingCode = this.filters.trackingCode
      if (this.filters.senderId) filterObj.senderId = this.filters.senderId

      // Prepare API params
      const apiParams: ShipmentFilters = {
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

      const response = await ApiService.getAllDisabledShipments(apiParams)
      
      if (response && response.meta && response.data) {
        
        runInAction(() => {
          this.disabledShipments = response.data || []
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
        throw new Error("Failed to fetch disabled shipments - invalid response structure")
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An unknown error occurred")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch disabled shipments", errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async fetchShipmentById(id: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getShipmentById(id)
      if (response.status && response.data) {
        runInAction(() => {
          this.currentShipment = response.data
          this.isLoading = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch shipment"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An unknown error occurred")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch shipment", errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async fetchShipmentParcels(shipmentId: string) {
    this.isLoadingParcels = true
    this.error = null

    try {
      const response = await ApiService.getShipmentParcels(shipmentId)
      if (response.status && response.data) {
        runInAction(() => {
          this.shipmentParcels = response.data
          this.isLoadingParcels = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch parcels"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An unknown error occurred")
      runInAction(() => {
        this.isLoadingParcels = false
        this.error = errorMessage
      })
      toastUtils.error("Failed to fetch parcels", errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async fetchShipmentCosting(shipmentId: string) {
    this.isLoadingCosting = true
    this.error = null

    try {
      const response = await ApiService.getShipmentCosting(shipmentId)
      if (response.status && response.data) {
        runInAction(() => {
          this.shipmentCosting = response.data
          this.isLoadingCosting = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch costing"
        throw new Error(errorMessage)
      }
    } catch (error) {
      runInAction(() => {
        this.isLoadingCosting = false
        this.error = getErrorMessage(error, "An error occurred")
      })
      toastUtils.error("Failed to fetch costing", this.error || "An unknown error occurred")
      return { success: false, error: this.error }
    }
  }

  async fetchShipmentDetails(id: string) {
    // Fetch all details for a shipment in parallel
    const [shipmentResult, parcelsResult, costingResult] = await Promise.all([
      this.fetchShipmentById(id),
      this.fetchShipmentParcels(id),
      this.fetchShipmentCosting(id),
    ])

    return {
      success: shipmentResult.success && parcelsResult?.success && costingResult?.success,
      error: shipmentResult.error || parcelsResult?.error || costingResult?.error,
    }
  }

  setPage(page: number) {
    this.pagination.page = page
  }

  setPageLimit(limit: number) {
    this.pagination.limit = limit
    this.pagination.page = 1 // Reset to first page when changing page limit
  }

  setFilters(filters: ShipmentFilters) {
    this.filters = { ...this.filters, ...filters }
  }

  clearFilters() {
    this.filters = {}
  }

  clearCurrentShipment() {
    this.currentShipment = null
    this.shipmentParcels = []
    this.shipmentCosting = null
  }

  async hydrate() {
    // No persistence needed for shipment store
    return Promise.resolve()
  }

  async fetchCountries(params?: QueryParams): Promise<Country[]> {
    try {
      const response = await ApiService.getCountries(params)
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch countries"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      toastUtils.error("Failed to fetch countries", message)
      throw error
    }
  }

  async fetchStates(countryId: number, params?: QueryParams): Promise<State[]> {
    try {
      const response = await ApiService.getStates(countryId, params)
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch states"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      toastUtils.error("Failed to fetch states", message)
      throw error
    }
  }

  async fetchCities(stateId: number, params?: QueryParams): Promise<City[]> {
    try {
      const response = await ApiService.getCities(stateId, params)
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch cities"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      toastUtils.error("Failed to fetch cities", message)
      throw error
    }
  }

  async fetchLgas(stateId: number, params?: QueryParams): Promise<LGA[]> {
    try {
      const response = await ApiService.getLgas(stateId, params)
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch LGAs"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      toastUtils.error("Failed to fetch LGAs", message)
      throw error
    }
  }

  async fetchInsideCityCharges(params?: QueryParams): Promise<InsideCity[]> {
    try {
      const response = await ApiService.getInsideCityCharges(params)
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch inside city charges"
      throw new Error(errorMessage)
    } catch (error) {
      throw error
    }
  }

  async fetchOutsideCityCharges(params?: QueryParams): Promise<OutsideCity[]> {
    try {
      const response = await ApiService.getOutsideCityCharges(params)
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch outside city charges"
      throw new Error(errorMessage)
    } catch (error) {
      throw error
    }
  }

  async fetchPackagingOptions(params?: QueryParams): Promise<Packaging[]> {
    try {
      const response = await ApiService.getPackagingOptions(params)
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch packaging options"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      toastUtils.error("Failed to fetch packaging options", message)
      throw error
    }
  }

  async fetchCostings(): Promise<CostingRate[]> {
    try {
      const response = await ApiService.getCostings()
      if (response.status && response.data) {
        return response.data
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to fetch costings"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      toastUtils.error("Failed to fetch costings", message)
      throw error
    }
  }

  async fetchWarehouses(params?: QueryParams): Promise<ApiPaginatedResponse<WareHouse>> {
    try {
      return await ApiService.getWarehouses({
        filter: ACTIVE_STATUS_FILTER,
        limit: 10,
        page: 1,
        ...params,
      })
    } catch (error) {
      throw error
    }
  }

  async createShipment(payload: CreateShipmentPayload): Promise<{ success: boolean; data?: Shipment; error?: string }> {
    this.isCreatingShipment = true
    this.error = null
    try {
      const response = await ApiService.createShipment(payload)
      if (response.status && response.data) {
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to create shipment"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to create shipment", message)
      return { success: false, error: message }
    } finally {
      this.isCreatingShipment = false
    }
  }

  async updateShipment(id: string, payload: Partial<CreateShipmentPayload>): Promise<{ success: boolean; data?: Shipment; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      const response = await ApiService.updateShipment(id, payload)
      if (response.status && response.data) {
        // Update the shipment in the list if it exists
        const index = this.shipments.findIndex((s) => s.id === id)
        if (index !== -1) {
          runInAction(() => {
            this.shipments[index] = response.data
            if (this.currentShipment?.id === id) {
              this.currentShipment = response.data
            }
          })
        }
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to update shipment"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to update shipment", message)
      return { success: false, error: message }
    } finally {
      this.isLoading = false
    }
  }

  async updateShipmentStatuses(
    id: string,
    payload: { status?: ShipmentStatus; deliveryStatus?: DeliveryStatus; paymentStatus?: PaymentStatus }
  ): Promise<{ success: boolean; data?: Shipment; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      // Use the same endpoint as updateShipment but with status payload
      const response = await ApiService.updateShipmentStatuses(id, payload)
      if (response.status && response.data) {
        // Update the shipment in the list if it exists
        const index = this.shipments.findIndex((s) => s.id === id)
        if (index !== -1) {
          runInAction(() => {
            this.shipments[index] = response.data
            if (this.currentShipment?.id === id) {
              this.currentShipment = response.data
            }
          })
        }
        return { success: true, data: response.data }
      }
      const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to update shipment statuses"
      throw new Error(errorMessage)
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to update shipment statuses", message)
      return { success: false, error: message }
    } finally {
      this.isLoading = false
    }
  }

  async disableShipment(id: string): Promise<{ status: boolean; data?: Shipment; error?: string }> {
    this.isLoading = true
    this.error = null
    try {
      const response = await ApiService.disableShipment(id)
      if (response.status) {
        this.fetchAllShipments({ page: this.pagination.page, limit: this.pagination.limit, ...this.filters })
        return { status: true }
      }
      throw new Error(response.message || "Failed to disable shipment")
    } catch (error) {
      const message = getErrorMessage(error)
      this.error = message
      toastUtils.error("Failed to disable shipment", message)
      return { status: false, error: message }
    } finally {
      this.isLoading = false
    }
  }
}

