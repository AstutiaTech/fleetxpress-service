"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AppHeader } from "@/components/header"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { DatabaseModeBadge } from "@/components/database-mode-badge"
import { Footer } from "./footer"
import type { ReactNode } from "react"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { ScrollBar } from "./ui/scroll-area"
import { observer } from "mobx-react-lite"
import { usePathname } from "next/navigation"
import { useStore } from "@/providers/store.provider"

interface AppLayoutProps {
  children: ReactNode
}

export const AppLayout = observer(({ children }: AppLayoutProps) => {
  const pathname = usePathname()
  const { authStore } = useStore()
  const isAuthenticated = authStore.isAuthenticated

  // For login page or unauthenticated users (except shipment-tracking), render without sidebar/header
  // Shipment-tracking should show sidebar/header for authenticated users
  if (pathname === "/login" || (!isAuthenticated && pathname !== "/shipment-tracking")) {
    return <>{children}</>
  }

  // For authenticated routes, render with sidebar and header
  const { appStore } = useStore()

  return (
    <SidebarProvider defaultOpen={!appStore.sidebarCollapsed}>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen overflow-x-auto overflow-y-hidden">
        <AppHeader />
        <DatabaseModeBadge position="top-right" showTooltip={true} />
        <ScrollArea className="mt-16 overflow-auto h-screen p-4">
          {children}
          <ScrollBar orientation="vertical" />
        </ScrollArea>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
})

