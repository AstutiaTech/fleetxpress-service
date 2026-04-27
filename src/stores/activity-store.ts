import { Activity, ActivityFilters } from "@/types/activityTypes"
import { ApiPaginatedResponse, ApiResponse } from "@/types/apiTypes"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiService } from "@/lib/api"
import type { RootStore } from "./root-store"

export class ActivityStore {
    rootStore: RootStore
    activities: Activity[]
    currentActivity: Activity | null
    isLoading: boolean
    error: string | null
    pagination: {
        page: number
        limit: number
        pages: number
        total: number
    }
    filters: ActivityFilters

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore
        this.activities = []
        this.currentActivity = null
        this.isLoading = false
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

    async fetchAllActivities(filters?: ActivityFilters) {
        this.isLoading = true
        this.error = null
        this.filters = { ...this.filters, ...filters }

        try {
            const response = await ApiService.getAllActivities(this.filters)

            if (response && response.status) {
                runInAction(() => {
                    const data: any = response.data;
                    this.activities = data.data || []
                    const meta = data.data
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
                const errorMessage = getApiErrorMessage(response as any) || "Failed to fetch activities"
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

    async fetchActivityById(id: string) {
        this.isLoading = true
        this.error = null

        try {
            const response = await ApiService.getActivityById(id)

            if (response && response.status) {
                runInAction(() => {
                    this.currentActivity = response.data
                    this.isLoading = false
                })
                return { success: true }
            } else {
                const errorMessage = getApiErrorMessage(response as any) || "Failed to fetch activity"
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

    clearCurrentActivity() {
        this.currentActivity = null
    }

    clearFilters() {
        this.filters = {}
    }

    async hydrate() {
        // No hydration needed for activities
        return Promise.resolve()
    }
}

