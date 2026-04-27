import { isHydrated, makePersistable } from "mobx-persist-store"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiService } from "@/lib/api"
import type { RootStore } from "./root-store"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"

export interface UploadProgress {
  uploadId: string
  progress: number
  status: "idle" | "uploading" | "success" | "error"
  error?: string
  result?: {
    url: string
    filename: string
    size: number
    [key: string]: unknown
  }
  results?: Array<{
    url: string
    filename: string
    size: number
    [key: string]: unknown
  }>
}

export class UploadStore {
  rootStore: RootStore
  uploads: Map<string, UploadProgress>
  isLoading: boolean

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.uploads = new Map()
    this.isLoading = false

    makeAutoObservable(this, {
      rootStore: false,
    })
  }

  get isHydrated() {
    return isHydrated(this)
  }

  async hydrate() {
    // No persistence needed for uploads
  }

  /**
   * Upload a file with progress tracking
   * @param file - The file to upload
   * @param uploadId - Unique identifier for this upload (optional, will be generated if not provided)
   * @param onProgress - Optional callback for progress updates
   * @returns Promise with upload result
   */
  async uploadFile(
    file: File,
    uploadId?: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; data?: UploadProgress["result"]; error?: string; uploadId: string }> {
    const id = uploadId || `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Initialize upload progress
    runInAction(() => {
      this.uploads.set(id, {
        uploadId: id,
        progress: 0,
        status: "uploading",
      })
    })

    try {
      // Create progress callback
      const progressCallback = (progress: number) => {
        runInAction(() => {
          const upload = this.uploads.get(id)
          if (upload) {
            upload.progress = progress
            this.uploads.set(id, upload)
          }
        })
        if (onProgress) {
          onProgress(progress)
        }
      }

      // Upload the file
      const response = await ApiService.uploadFile(file, progressCallback)

      if (response.status && response.data) {
        runInAction(() => {
          const upload = this.uploads.get(id)
          if (upload) {
            upload.status = "success"
            upload.progress = 100
            upload.result = response.data
            this.uploads.set(id, upload)
          }
        })
        return { success: true, data: response.data, uploadId: id }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Upload failed"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred during upload")
      runInAction(() => {
        const upload = this.uploads.get(id)
        if (upload) {
          upload.status = "error"
          upload.error = errorMessage
          this.uploads.set(id, upload)
        }
      })
      toastUtils.error("Upload Failed", errorMessage)
      return { success: false, error: errorMessage, uploadId: id }
    }
  }

  /**
   * Get upload progress by ID
   */
  getUploadProgress(uploadId: string): UploadProgress | undefined {
    return this.uploads.get(uploadId)
  }

  /**
   * Clear upload progress
   */
  clearUpload(uploadId: string) {
    this.uploads.delete(uploadId)
  }

  /**
   * Clear all uploads
   */
  clearAllUploads() {
    this.uploads.clear()
  }

  /**
   * Reset upload status (useful for retrying)
   */
  resetUpload(uploadId: string) {
    const upload = this.uploads.get(uploadId)
    if (upload) {
      runInAction(() => {
        upload.status = "idle"
        upload.progress = 0
        upload.error = undefined
        this.uploads.set(uploadId, upload)
      })
    }
  }

  /**
   * Upload multiple files with progress tracking
   * @param files - Array of files to upload
   * @param uploadId - Unique identifier for this upload (optional, will be generated if not provided)
   * @param onProgress - Optional callback for progress updates
   * @returns Promise with upload results
   */
  async uploadMultipleFiles(
    files: File[],
    uploadId?: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; data?: Array<UploadProgress["result"]>; error?: string; uploadId: string }> {
    const id = uploadId || `upload_multiple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Initialize upload progress
    runInAction(() => {
      this.uploads.set(id, {
        uploadId: id,
        progress: 0,
        status: "uploading",
      })
    })

    try {
      // Create progress callback
      const progressCallback = (progress: number) => {
        runInAction(() => {
          const upload = this.uploads.get(id)
          if (upload) {
            upload.progress = progress
            this.uploads.set(id, upload)
          }
        })
        if (onProgress) {
          onProgress(progress)
        }
      }

      // Upload the files
      const response = await ApiService.uploadMultipleFiles(files, progressCallback)

      if (response.status && response.data) {
        runInAction(() => {
          const upload = this.uploads.get(id)
          if (upload) {
            upload.status = "success"
            upload.progress = 100
            upload.results = response.data
            this.uploads.set(id, upload)
          }
        })
        return { success: true, data: response.data, uploadId: id }
      } else {
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Upload failed"
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred during upload")
      runInAction(() => {
        const upload = this.uploads.get(id)
        if (upload) {
          upload.status = "error"
          upload.error = errorMessage
          this.uploads.set(id, upload)
        }
      })
      toastUtils.error("Upload Failed", errorMessage)
      return { success: false, error: errorMessage, uploadId: id }
    }
  }
}

