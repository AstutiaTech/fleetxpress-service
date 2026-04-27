"use client"

import { useEffect, useState } from "react"

import Image from "next/image"
import { buildImageUrl } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { rootStore } from "@/stores/root-store"

interface LoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
  showPulse?: boolean
}

export const Loader = observer(({ 
  className, 
  size = "md", 
  fullScreen = true,
  showPulse = true 
}: LoaderProps) => {
  const [imageError, setImageError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Use rootStore directly - it's always available as a singleton
  // This works even when the StoreProvider context is not yet available
  
  // Only set mounted after client-side hydration to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get logo from settings or use default
  // Only use settings logo after mount to prevent hydration mismatch
  const logoFromSettings = isMounted ? rootStore.settingsStore.generalSettings?.favicon : null
  const logoUrl = logoFromSettings ? buildImageUrl(logoFromSettings) : "/images/icon-512x512.png"

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  const imageSizes = {
    sm: 32,
    md: 48,
    lg: 64,
  }

  const borderSizes = {
    sm: "border-2",
    md: "border-[3px]",
    lg: "border-4",
  }

  const containerClass = fullScreen
    ? "flex h-screen items-center justify-center bg-background"
    : "flex items-center justify-center p-4"

  return (
    <div className={cn(containerClass, className)}>
      <div className="relative flex items-center justify-center">
        {/* Spinning loader - image or fallback spinner */}
        <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
          {!imageError ? (
            <Image
              src={logoUrl}
              alt="Loading..."
              width={imageSizes[size]}
              height={imageSizes[size]}
              className="animate-spin rounded-full"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            // Fallback spinner if image doesn't exist
            <div
              className={cn(
                "rounded-full border-solid border-gray-200 dark:border-gray-700 border-t-purple-600 dark:border-t-purple-500 animate-spin",
                sizeClasses[size],
                borderSizes[size]
              )}
            />
          )}
        </div>
        
        {/* Optional: Pulsing background circle */}
        {showPulse && (
          <div
            className={cn(
              "absolute -inset-1/2 rounded-full bg-purple-100 dark:bg-purple-900/20 animate-ping opacity-20",
              sizeClasses[size]
            )}
          />
        )}
      </div>
    </div>
  )
})
