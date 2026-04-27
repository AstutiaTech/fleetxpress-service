import { computed, makeAutoObservable, runInAction } from "mobx"
import { isHydrated, makePersistable } from "mobx-persist-store"

import type { RootStore } from "./root-store"

// Notification type
export interface Notification {
  id: string
  type: "transaction" | "security" | "system" | "account" | "loan" | "deposit"
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export class NotificationsStore {
  rootStore: RootStore
  notifications: Notification[]
  isOpen: boolean
  isLoading: boolean
  error: string | null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.notifications = []
    this.isOpen = false
    this.isLoading = false
    this.error = null

    makeAutoObservable(this, {
      rootStore: false,
      unreadCount: computed,
    })

    makePersistable(this, {
      name: "NotificationsStore",
      properties: ["notifications"],
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    })
  }

  get isHydrated() {
    return isHydrated(this)
  }

  get unreadCount(): number {
    return this.notifications.filter((notification) => !notification.isRead).length
  }

  async hydrate() {
    // This is intentionally empty as makePersistable handles hydration
    // But we need this method for consistency with other stores
  }

  setOpen(open: boolean) {
    this.isOpen = open
  }

  async fetchNotifications() {
    this.isLoading = true
    this.error = null

    try {
      // TODO: Replace with actual API call
      // const response = await ApiService.getNotifications()
      // const notifications = response.data

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      const mockNotifications: Notification[] = []
      
      runInAction(() => {
        this.notifications = mockNotifications
        this.isLoading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error, "Failed to fetch notifications")
        this.isLoading = false
      })
    }
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification && !notification.isRead) {
      notification.isRead = true
    }
  }

  markAllAsRead() {
    this.notifications.forEach((notification) => {
      if (!notification.isRead) {
        notification.isRead = true
      }
    })
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
  }

  clearAllNotifications() {
    this.notifications = []
  }

  addNotification(notification: Omit<Notification, "id" | "createdAt" | "isRead">) {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    }
    this.notifications.unshift(newNotification)
    return newNotification.id
  }
}

