"use client"

import { cn } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { useSidebar } from "./ui/sidebar"
import { useStore } from "@/providers/store.provider"

export const Footer = observer(() => {
  const { appStore } = useStore()
  const currentYear = new Date().getFullYear()
  const { open, isMobile } = useSidebar()
  
  return (
    <footer
      data-app-footer
      className={cn(
        "fixed w-full z-10 px-0 bottom-0 border-t bg-background py-4",
        !open ? "w-full" : "md:w-[83%]"
      )}
    >
      <div className="mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-4">
            <p>© {currentYear} All rights reserved.</p>
            <p>Developed by Go Solutions Enterprises</p>
          </div>
          <p>v{appStore.appVersion}</p>
        </div>
      </div>
    </footer>
  )
})

