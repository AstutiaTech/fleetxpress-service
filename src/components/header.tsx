"use client"

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"

import { BreadcrumbResponsive } from "@/components/breadcrumb-header"
import { Notifications } from "@/components/notifications"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"

export const AppHeader = observer(() => {
  const { authStore, appStore } = useStore()
  const { user } = authStore
  const { open, isMobile } = useSidebar()

  if (!user) {
    return null
  }

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4",
        !open ? "w-full" : "md:w-[83%]"
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="-ml-1" />
        {/* <SidebarRail /> */}
        <BreadcrumbResponsive />
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Notifications />
        {/* <UserProfileMenu /> */}
      </div>
    </header>
  )
})

