"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { configure } from "mobx"
import { observer } from "mobx-react-lite"
import { rootStore, RootStore } from "@/stores/root-store"
import { Loader } from "@/components/loader"

// Configure MobX
configure({
  enforceActions: "never", // Allow direct mutations in development
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: false,
})

// Create context
const StoreContext = createContext<RootStore | undefined>(undefined)

// Hook to use the store
export const useStore = () => {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error("useStore must be used within StoreProvider")
  }
  return context
}

// Provider component
export const StoreProvider = observer(({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeStores = async () => {
      try {
        setIsInitializing(true)
        // Hydrate all stores
        await rootStore.hydrate()
        
        // Always fetch fresh settings on app initialization
        // This ensures we have the latest settings even if cached
        await rootStore.settingsStore.fetchGeneralSettings(true)
        
        // Mark app as initialized
        rootStore.appStore.setInitialized(true)
        
        setIsHydrated(true)
      } catch (error) {
        console.error("Failed to initialize stores:", error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeStores()
  }, [])

  if (isInitializing || !isHydrated) {
    return <Loader />
  }

  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
})
