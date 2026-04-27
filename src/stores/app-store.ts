import { isHydrated, makePersistable } from "mobx-persist-store"

import type { RootStore } from "./root-store"
import { makeAutoObservable } from "mobx"

export class AppStore {
  rootStore: RootStore
  appName = "Logistics"
  appFullName = "Logistics System"
  appVersion = "0.1.2"
  isInitialized = false
  theme: "light" | "dark" | "system" = "light"
  sidebarCollapsed = false

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    makeAutoObservable(this, {
      rootStore: false,
    })

    makePersistable(this, {
      name: "AppStore",
      properties: ["theme", "sidebarCollapsed"],
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    })
  }

  get isHydrated() {
    return isHydrated(this)
  }

  async hydrate() {
    // This is intentionally empty as makePersistable handles hydration
    // But we need this method for consistency with other stores
  }

  setTheme(theme: "light" | "dark" | "system") {
    this.theme = theme
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed
  }

  setSidebarCollapsed(collapsed: boolean) {
    this.sidebarCollapsed = collapsed
  }

  setInitialized(initialized: boolean) {
    this.isInitialized = initialized
  }
}
