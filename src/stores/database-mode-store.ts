import { isHydrated, makePersistable } from "mobx-persist-store"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiService } from "@/lib/api"
import type { DatabaseMode, DatabaseModeResponse } from "@/types/databaseModeTypes"
import type { RootStore } from "./root-store"
import { getErrorMessage, toastUtils } from "@/utils/toast-utils"

export class DatabaseModeStore {
  rootStore: RootStore
  mode: DatabaseMode
  testDatabaseAvailable: boolean
  isLoading: boolean
  isSwitching: boolean
  error: string | null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.mode = 'live'
    this.testDatabaseAvailable = false
    this.isLoading = false
    this.isSwitching = false
    this.error = null

    makeAutoObservable(this, {
      rootStore: false,
    })

    makePersistable(this, {
      name: "DatabaseModeStore",
      properties: ["mode", "testDatabaseAvailable"],
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    })
  }

  get isHydrated() {
    return isHydrated(this)
  }

  async hydrate() {
    // Optionally fetch database mode on hydration
    await this.fetchDatabaseMode(true)
  }

  async fetchDatabaseMode(forceRefresh = false, silent = false) {
    // If mode exists and not forcing refresh, skip fetch
    if (this.mode && !forceRefresh && this.testDatabaseAvailable !== undefined) {
      return { success: true, data: { mode: this.mode, testDatabaseAvailable: this.testDatabaseAvailable } as DatabaseModeResponse }
    }

    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.getDatabaseMode()
      if (response.status && response.data) {
        runInAction(() => {
          this.mode = response.data.mode
          this.testDatabaseAvailable = response.data.testDatabaseAvailable
          this.isLoading = false
        })
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || "Failed to fetch database mode")
      }
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error = getErrorMessage(error, "An error occurred")
      })
      if (!silent && typeof window !== "undefined") {
        toastUtils.error("Failed to Load Database Mode", this.error)
      }
      return { success: false, error: this.error }
    }
  }

  async refreshDatabaseMode() {
    return this.fetchDatabaseMode(true)
  }

  async switchMode(newMode: DatabaseMode) {
    if (newMode === 'sandbox' && !this.testDatabaseAvailable) {
      const error = 'Test database is not available. Cannot switch to sandbox mode.'
      runInAction(() => {
        this.error = error
      })
      toastUtils.error("Switch Failed", error)
      return { success: false, error }
    }

    this.isSwitching = true
    this.error = null

    try {
      const response = await ApiService.setDatabaseMode(newMode)
      if (response.status && response.data) {
        runInAction(() => {
          this.mode = response.data.mode
          this.testDatabaseAvailable = response.data.testDatabaseAvailable
          this.isSwitching = false
        })
        toastUtils.success("Mode Switched", `Database mode switched to ${response.data.mode.toUpperCase()}`)
        
        // Logout user after successful database mode switch
        if (this.rootStore.authStore.isAuthenticated) {
          await this.rootStore.authStore.logout()
          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || "Failed to switch database mode")
      }
    } catch (error) {
      runInAction(() => {
        this.isSwitching = false
        this.error = getErrorMessage(error, "An error occurred")
      })
      toastUtils.error("Switch Failed", this.error)
      return { success: false, error: this.error }
    }
  }

  get isLive(): boolean {
    return this.mode === 'live'
  }

  get isSandbox(): boolean {
    return this.mode === 'sandbox'
  }
}

