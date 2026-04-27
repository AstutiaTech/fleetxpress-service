import { API_URL } from "@/utils/constants"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Builds a full URL for images from the API
 * @param apiUrl - The URL returned from the API (may or may not start with /)
 * @returns Full URL with base URL prepended, or the original URL if it's already a full URL
 */
export function buildImageUrl(apiUrl: string | null | undefined): string {
  if (!apiUrl) return ""
  
  // If it's already a full URL (starts with http:// or https://), return as is
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    return apiUrl
  }
  
  // Get the base URL from environment variables
  // Use the same pattern as axios.ts
  const baseUrl = process.env.NODE_ENV === "development" 
    ? process.env.NEXT_PUBLIC_DEV_URL 
    : process.env.NEXT_PUBLIC_LIVE_URL
  
  // If baseUrl is not defined, return the apiUrl as is (fallback)
  if (!baseUrl) {
    console.warn('Base URL not found in environment variables. Returning API URL as is.')
    return apiUrl.startsWith("/") ? apiUrl : `/${apiUrl}`
  }
  // Clean up the URLs
  // Ensure apiUrl starts with / if it doesn't already
  const cleanApiUrl = apiUrl.startsWith("/") ? apiUrl : `/${apiUrl}`
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  
  return `${cleanBaseUrl}${cleanApiUrl}`
}
