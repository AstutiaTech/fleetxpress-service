"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"
import { useTheme } from "next-themes"

export const ThemeToggle = observer(() => {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const { appStore } = useStore()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing theme to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync theme with app store when it changes
  useEffect(() => {
    if (mounted && theme) {
      if (theme === "light" || theme === "dark") {
        appStore.setTheme(theme)
      }
    }
  }, [mounted, theme, appStore])

  if (!mounted) {
    // Return a placeholder to prevent layout shift
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = theme || "light"
  const isDark = resolvedTheme === "dark"

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    appStore.setTheme(newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
          <Sun className={`h-4 w-4 absolute transition-all duration-200 ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
          <Moon className={`h-4 w-4 absolute transition-all duration-200 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4 text-primary-500" />
          <span>Light</span>
          {currentTheme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4 text-primary-500" />
          <span>Dark</span>
          {currentTheme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
