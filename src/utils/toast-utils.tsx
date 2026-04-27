import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react"

import type React from "react"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "@/components/ui/toast/use-toast"

type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

interface ToastOptions {
  duration?: number
  position?: ToastPosition
}

const defaultOptions: ToastOptions = {
  duration: 5000,
  position: "top-center",
}

/**
 * Extracts error message from API response when status is false
 * Handles the nested error structure: data.message > data.response.message > response.message > message
 */
export function getApiErrorMessage(response: { data?: any; response?: { message?: string }; message?: string }): string | null {
  // PRIORITY 1: response.data.message (most specific)
  if (response.data?.message && typeof response.data.message === "string") {
    return response.data.message
  }
  
  // PRIORITY 2: response.data.response.message (nested in data.response)
  if (response.data?.response?.message && typeof response.data.response.message === "string") {
    return response.data.response.message
  }
  
  // PRIORITY 3: response.response.message (less specific from root response)
  if (response.response?.message && typeof response.response.message === "string") {
    return response.response.message
  }
  
  // PRIORITY 4: response.message (fallback)
  if (response.message && typeof response.message === "string") {
    return response.message
  }
  
  return null
}

/**
 * Extracts error message from error object
 * Properly handles axios errors with API response structure
 * 
 * When API returns status: false, the response structure is:
 * {
 *   status: false,
 *   statusType: "BAD_REQUEST",
 *   response: {
 *     message: "Failed to create admin"  // Less specific
 *   },
 *   data: {
 *     message: "User with email agent@mailinator.com already exists",  // MOST SPECIFIC - Priority 1
 *     response: {
 *       message: "User with email agent@mailinator.com already exists"  // Also specific - Priority 2
 *     }
 *   }
 * }
 * 
 * For axios errors, this becomes error.response.data, so:
 * - error.response.data.data.message (most specific)
 * - error.response.data.data.response.message (nested in data.response)
 * - error.response.data.response.message (less specific from root response)
 * 
 * Priority order:
 * 1. error.response.data.data.message (MOST SPECIFIC - from data.message when status is false)
 * 2. error.response.data.data.response.message (from data.response.message)
 * 3. error.response.data.response.message (less specific - from root response.message)
 * 4. error.response.data.message (direct message if available)
 * 5. error.response.message (direct response message)
 * 6. error.message (Error instance message)
 * 7. error (if string)
 * 8. defaultMessage
 */
export function getErrorMessage(error: unknown, defaultMessage = "An error occurred"): string {
  if (!error) return defaultMessage
  
  // Handle string errors
  if (typeof error === "string") {
    return error
  }
  
  // Handle Error instances and objects (including axios errors)
  const errorObj = error as any
  
  // PRIORITY 1: Check error.response.data.data.message (MOST SPECIFIC)
  // This is the actual error message from data.message when status is false
  if (errorObj?.response?.data?.data?.message) {
    const message = errorObj.response.data.data.message
    if (message && typeof message === "string") {
      return message
    }
  }
  
  // PRIORITY 2: Check error.response.data.data.response.message (from data.response.message)
  // Nested response message in data.response
  if (errorObj?.response?.data?.data?.response?.message) {
    const message = errorObj.response.data.data.response.message
    if (message && typeof message === "string") {
      return message
    }
  }
  
  // PRIORITY 3: Check error.response.data.response.message (less specific - from root response)
  // This is the less specific message from response.message
  if (errorObj?.response?.data?.response?.message) {
    const message = errorObj.response.data.response.message
    if (message && typeof message === "string") {
      return message
    }
  }
  
  // PRIORITY 4: Check error.response.data.message (direct message if available)
  if (errorObj?.response?.data?.message) {
    const message = errorObj.response.data.message
    if (message && typeof message === "string") {
      return message
    }
  }
  
  // PRIORITY 5: Check error.response.message (direct response message)
  if (errorObj?.response?.message) {
    const message = errorObj.response.message
    if (message && typeof message === "string") {
      return message
    }
  }
  
  // PRIORITY 6: Check Error instance message
  if (error instanceof Error && error.message) {
    return error.message
  }
  
  // PRIORITY 7: Check root level message property
  if (errorObj?.message) {
    const message = errorObj.message
    if (message && typeof message === "string") {
      return message
    }
  }
  
  return defaultMessage
}

// Toast utility functions for consistent toast styling across the application
export const toastUtils = {
  success: (title: string, description?: string, options?: ToastOptions) => {
    const mergedOptions = { ...defaultOptions, ...options }
    toast({
      variant: "success",
      icon: (
        <div className="flex justify-center items-center w-8 h-8 rounded-full border-2 border-[rgba(34,197,94,0.16)] m-auto p-0.5">
          <div className="flex justify-center items-center w-full h-full rounded-full border border-[rgba(34,197,94,0.16)]" >
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
      ),
      title,
      description,
      duration: mergedOptions.duration,
    })
  },

  error: (title: string, description?: string, options?: ToastOptions) => {
    const mergedOptions = { ...defaultOptions, ...options }
    toast({
      variant: "destructive",
      icon: (
        <div className="flex justify-center items-center w-8 h-8 rounded-full bg-[rgba(239,68,68,0.08)] border-2 border-[rgba(239,68,68,0.16)] m-auto p-0.5">
          <div className="flex justify-center items-center w-full h-full rounded-full border border-[rgba(239,68,68,0.16)]" >
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      ),
      title,
      description,
      duration: mergedOptions.duration,
    })
  },

  warning: (title: string, description?: string, options?: ToastOptions) => {
    const mergedOptions = { ...defaultOptions, ...options }
    toast({
      variant: "warning",
      icon: (
        <div className="flex justify-center items-center w-8 h-8 rounded-full border-2 border-[rgba(251,191,36,0.16)] m-auto p-0.5">
          <div className="flex justify-center items-center w-full h-full rounded-full border border-[rgba(251,191,36,0.16)]" >
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      ),
      title,
      description,
      duration: mergedOptions.duration,
    })
  },

  info: (title: string, description?: string, options?: ToastOptions) => {
    const mergedOptions = { ...defaultOptions, ...options }
    toast({
      variant: "info",
      icon: (
        <div className="flex justify-center items-center w-8 h-8 rounded-full border-2 border-[rgba(59,130,246,0.16)] m-auto p-0.5">
          <div className="flex justify-center items-center w-full h-full rounded-full border border-[rgba(59,130,246,0.16)]" >
            <Info className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      ),
      title,
      description,
      duration: mergedOptions.duration,
    })
  },

  // For toasts with action buttons
  withAction: (
    title: string,
    description: string,
    actionComponent: any,
    variant: "default" | "destructive" | "success" | "warning" | "info" = "default",
    options?: ToastOptions,
  ) => {
    const mergedOptions = { ...defaultOptions, ...options }
    toast({
      variant,
      title,
      description,
      action: actionComponent,
      duration: mergedOptions.duration,
    })
  },

  // Configure global toast settings
  configure: (options: ToastOptions) => {
    Object.assign(defaultOptions, options)
  },
}
