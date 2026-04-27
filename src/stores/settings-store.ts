import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { isHydrated, makePersistable } from "mobx-persist-store"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiService } from "@/lib/api"
import type { GeneralSettings } from "@/types/settingsTypes"
import type { RootStore } from "./root-store"

export class SettingsStore {
  rootStore: RootStore
  generalSettings: GeneralSettings | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.generalSettings = null
    this.isLoading = false
    this.isUpdating = false
    this.error = null

    makeAutoObservable(this, {
      rootStore: false,
    })

    makePersistable(this, {
      name: "SettingsStore",
      properties: ["generalSettings"],
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    })
  }

  get isHydrated() {
    return isHydrated(this)
  }

  async hydrate() {
    // Optionally fetch settings on hydration
    // await this.fetchGeneralSettings()
  }

  async fetchGeneralSettings(forceRefresh = false, silent = false) {
    // If settings exist and not forcing refresh, skip fetch
    if (this.generalSettings && !forceRefresh) {
      return { success: true, data: this.generalSettings }
    }

    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getGeneralSettings()
      if (response.status && response.data) {
        runInAction(() => {
          this.generalSettings = response.data
          this.isLoading = false
        })
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || "Failed to fetch general settings")
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error, "An error occurred")
      })
      // Only show toast error if not silent and (forcing refresh or in browser)
      // Silent mode is used for server-side calls (like manifest route)
      if (!silent && forceRefresh && typeof window !== "undefined") {
        toastUtils.error("Failed to Load Settings", this.error)
      }
      return { success: false, error: this.error }
    }
  }

  async refreshGeneralSettings() {
    return this.fetchGeneralSettings(true)
  }

  async updateGeneralSettings(data: Partial<GeneralSettings>) {
    this.isUpdating = true
    this.error = null

    try {
      const response = await ApiService.updateGeneralSettings(data)
      if (response.status && response.data) {
        runInAction(() => {
          this.generalSettings = response.data
          this.isUpdating = false
        })
        toastUtils.success("Settings Updated", "General settings have been updated successfully")
        return { success: true, data: response.data }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to update general settings"
        throw new Error(errorMessage)
      }
    } catch (error) {
      runInAction(() => {
        this.isUpdating = false
        this.error = getErrorMessage(error, "An error occurred")
      })
      toastUtils.error("Update Failed", this.error)
      return { success: false, error: this.error }
    }
  }

  get applicationName(): string {
    return this.generalSettings?.applicationName || "FleetXpress"
  }

  get copyright(): string {
    return this.generalSettings?.copyright || "© 2024 FleetXpress. All rights reserved."
  }

  get logo(): string {
    return this.generalSettings?.logo || "/images/logo_full.png"
  }

  get favicon(): string {
    return this.generalSettings?.favicon || "/images/logo_icon.png"
  }

  get about(): string {
    return this.generalSettings?.about || "Connecting the world through efficient transportation"
  }
}

