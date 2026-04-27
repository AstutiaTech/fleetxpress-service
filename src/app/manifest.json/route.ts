import { NextResponse } from "next/server"
import { rootStore } from "@/stores/root-store"

export async function GET() {
  // Always fetch fresh settings for manifest to ensure it's up to date
  // This ensures the manifest reflects the latest settings
  // Use silent mode to avoid trying to show toast notifications on server-side
  try {
    await rootStore.settingsStore.fetchGeneralSettings(true, true)
  } catch (error) {
    // If fetch fails, use cached settings or defaults
    console.error("Failed to fetch settings for manifest:", error)
  }

  const settings = rootStore.settingsStore.generalSettings
  const appName = settings?.applicationName || "FleetXpress"

  const manifest = {
    name: appName,
    short_name: appName,
    description: settings?.about || "",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: settings?.primaryColor || "#000000",
    icons: [
      {
        src: settings?.logo || "/images/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: settings?.logo || "/images/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/images/screenshot-wide.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: appName,
      },
      {
        src: "/images/screenshot-mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        label: appName,
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  })
}

