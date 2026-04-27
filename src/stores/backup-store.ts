import { Backup, CreateBackupResponse, BackupListResponse, CleanupResponse } from "@/types/backupTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiResponse } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import type { RootStore } from "./root-store"

export class BackupStore {
  rootStore: RootStore
  backups: Backup[]
  isLoading: boolean
  isCreating: boolean
  createProgress: number
  error: string | null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.backups = []
    this.isLoading = false
    this.isCreating = false
    this.createProgress = 0
    this.error = null

    makeAutoObservable(this, {
      rootStore: false,
    })
  }

  async fetchAllBackups() {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.listBackups()
      
      if (response && response.status) {
        runInAction(() => {
          this.backups = response.data || []
          this.isLoading = false
        })
        return { success: true }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || "Failed to fetch backups"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred")
      runInAction(() => {
        this.error = errorMessage
        this.isLoading = false
      })
      toastUtils.error("Error", errorMessage)
      throw new Error(errorMessage)
    }
  }

  async createBackup() {
    this.isCreating = true
    this.createProgress = 0
    this.error = null

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        runInAction(() => {
          if (this.createProgress < 90) {
            this.createProgress += 10
          }
        })
      }, 500)

      const response = await ApiService.createBackup()
      
      if (response && response.status) {
        clearInterval(progressInterval)
        runInAction(() => {
          this.createProgress = 100
        })
        
        // Refresh backups list
        await this.fetchAllBackups()
        
        toastUtils.success("Success", "Backup created successfully!")
        
        // Reset progress after a short delay
        setTimeout(() => {
          runInAction(() => {
            this.isCreating = false
            this.createProgress = 0
          })
        }, 1000)
        
        return { success: true, data: response.data }
      } else {
        clearInterval(progressInterval)
        const errorMessage = getApiErrorMessage(response as any) || "Failed to create backup"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred")
      runInAction(() => {
        this.error = errorMessage
        this.isCreating = false
        this.createProgress = 0
      })
      toastUtils.error("Error", errorMessage)
      throw new Error(errorMessage)
    }
  }

  async downloadBackup(filename: string) {
    try {
      const blob = await ApiService.downloadBackup(filename)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toastUtils.success("Success", "Backup downloaded successfully")
      return { success: true }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to download backup")
      toastUtils.error("Error", errorMessage)
      throw new Error(errorMessage)
    }
  }

  handleDirectDownload(backup: Backup) {
    // Use the public download URL
    const url = `${window.location.origin}${backup.downloadUrl}`
    window.open(url, '_blank')
  }

  async cleanupBackups() {
    this.isLoading = true
    this.error = null

    try {
      const response = await ApiService.cleanupBackups()
      
      if (response && response.status) {
        runInAction(() => {
          this.isLoading = false
        })
        
        // Refresh backups list
        await this.fetchAllBackups()
        
        toastUtils.success(
          "Success", 
          `Successfully deleted ${response.data.deletedCount} old backup(s)`
        )
        return { success: true, data: response.data }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || "Failed to cleanup backups"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred")
      runInAction(() => {
        this.error = errorMessage
        this.isLoading = false
      })
      toastUtils.error("Error", errorMessage)
      throw new Error(errorMessage)
    }
  }

  async hydrate() {
    // No hydration needed for backups
    return Promise.resolve()
  }
}

