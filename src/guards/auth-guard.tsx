"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { Loader } from "@/components/loader"
import type React from "react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"

interface AuthGuardProps {
  children: React.ReactNode
}

// Routes that don't require authentication
const publicRoutes = ["/login", "/shipment-tracking"]

// Routes that require authentication
const protectedRoutes = (pathname: string): boolean => {
  return !publicRoutes.includes(pathname)
}

export const AuthGuard = observer(({ children }: AuthGuardProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const { authStore } = useStore()
  const [isChecking, setIsChecking] = useState(true)
  const redirectingRef = useRef(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Skip if already redirecting to prevent loops
      if (redirectingRef.current) {
        return
      }

      setIsChecking(true)

      // Wait for store hydration
      if (!authStore.isHydrated) {
        await authStore.hydrate()
      }

      const isPublicRoute = publicRoutes.includes(pathname)
      const isProtectedRoute = protectedRoutes(pathname)

      // Check if session is valid
      const isSessionValid = await authStore.checkSession()

      if (isProtectedRoute && !isSessionValid) {
        // Save the current path to redirect back after login (only if not already on login)
        if (pathname !== "/login") {
          authStore.setRedirectAfterLogin(pathname)
        }
        redirectingRef.current = true
        router.replace("/login")
        setIsChecking(false)
        return
      }

      if (isSessionValid && isPublicRoute && pathname === "/login") {
        // If user is logged in and tries to access login page, redirect to dashboard
        // But allow authenticated users to access shipment-tracking
        const redirectTo = authStore.redirectAfterLogin !== "/login"
          ? (authStore.redirectAfterLogin || "/dashboard")
          : "/dashboard"
        authStore.setRedirectAfterLogin("/dashboard")
        redirectingRef.current = true
        router.replace(redirectTo)
        setIsChecking(false)
        return
      }

      // Reset redirect flag if we reach here (no redirect needed)
      redirectingRef.current = false
      setIsChecking(false)
    }

    // Reset redirect flag when pathname changes
    redirectingRef.current = false
    checkAuth()
  }, [pathname, router, authStore])

  if (isChecking) {
    return <Loader />
  }

  // If it's a public route or user is authenticated, render children
  if (publicRoutes.includes(pathname) || authStore.isAuthenticated) {
    return <>{children}</>
  }

  // This should not be reached due to the redirect in useEffect
  return null
})
