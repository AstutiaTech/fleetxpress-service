"use client"

import { useEffect, useState } from "react"

import { buildImageUrl } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { usePathname } from "next/navigation"
import { useStore } from "@/providers/store.provider"

export const AppTitle = observer(() => {
  const { settingsStore } = useStore()
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState<string>("")

  // Load settings on mount if not already loaded
  useEffect(() => {
    if (!settingsStore.generalSettings && !settingsStore.isLoading) {
      settingsStore.fetchGeneralSettings()
    }
  }, [settingsStore])

  // Update document title with application name
  useEffect(() => {
    const appName = settingsStore.applicationName || "FleetXpress"
    if (pageTitle) {
      document.title = `${pageTitle} | ${appName}`
    } else {
      document.title = appName
    }
  }, [settingsStore.applicationName, pageTitle])

  // Extract page title from pathname
  useEffect(() => {
    if (!pathname) return

    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) {
      setPageTitle("Dashboard")
      return
    }

    // Get the last segment and format it
    const lastSegment = segments[segments.length - 1]
    const formattedTitle = lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    setPageTitle(formattedTitle)
  }, [pathname])

  // Update favicon - use the getter to ensure reactivity
  useEffect(() => {
    if (typeof document === "undefined") return

    const faviconFromSettings = settingsStore.favicon
    const faviconUrl = faviconFromSettings && faviconFromSettings !== "/images/logo_icon.png"
      ? buildImageUrl(faviconFromSettings)
      : "/images/logo_icon.png"

    const upsertLink = (key: string, attributes: Record<string, string>) => {
      let link = document.head?.querySelector<HTMLLinkElement>(`link[data-app-title="${key}"]`)

      if (!link) {
        link = document.createElement("link")
        link.dataset.appTitle = key
        document.head?.appendChild(link)
      }

      Object.entries(attributes).forEach(([attr, value]) => {
        link?.setAttribute(attr, value)
      })
    }

    // Remove existing favicon links first to ensure update
    document.head
      ?.querySelectorAll<HTMLLinkElement>('link[data-app-title="favicon"], link[data-app-title="apple-touch-icon"]')
      .forEach((link) => link.remove())

    upsertLink("favicon", {
      rel: "icon",
      type: "image/png",
      href: faviconUrl,
    })

    upsertLink("apple-touch-icon", {
      rel: "apple-touch-icon",
      href: faviconUrl,
    })

    // Also update any existing favicon links without our data attribute
    const existingFavicon = document.head?.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (existingFavicon && !existingFavicon.dataset.appTitle) {
      existingFavicon.href = faviconUrl
    }

    const existingAppleIcon = document.head?.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (existingAppleIcon && !existingAppleIcon.dataset.appTitle) {
      existingAppleIcon.href = faviconUrl
    }
  }, [settingsStore.favicon, settingsStore.generalSettings])

  return null
})

