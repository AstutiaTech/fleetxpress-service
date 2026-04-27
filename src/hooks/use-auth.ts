"use client"

import { PermissionAction, PermissionResource } from "@/types/auth"

import { useStore } from "@/providers/store.provider"

export function useAuth() {
  const { authStore } = useStore()

  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    isLoading: authStore.isLoading,
    error: authStore.error,
    login: authStore.verifyOTP.bind(authStore),
    logout: authStore.logout.bind(authStore),
    hasPermission: (resource: PermissionResource, action: PermissionAction) =>
      authStore.hasPermission(resource, action),
    hasRole: (...roles: string[]) => authStore.hasRole(...roles),
    fullName: authStore.fullName,
    checkSession: authStore.checkSession.bind(authStore),
    accessToken: authStore.tokens?.access_token ?? null,
  }
}
