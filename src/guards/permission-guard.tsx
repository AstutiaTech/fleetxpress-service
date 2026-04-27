"use client"

import { PermissionAction, PermissionResource } from "@/types/auth"

import type { ReactNode } from "react"
import { observer } from "mobx-react-lite"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface PermissionGuardProps {
  resource: PermissionResource
  action: PermissionAction
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}

export const PermissionGuard = observer(({ 
  resource, 
  action, 
  children, 
  fallback = null,
  showError = false 
}: PermissionGuardProps) => {
  const { hasPermission } = useAuth()

  if (hasPermission(resource, action)) {
    return <>{children}</>
  }

  if (showError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this resource. Please contact your administrator.
        </AlertDescription>
      </Alert>
    )
  }

  return <>{fallback}</>
})
