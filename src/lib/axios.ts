import axios from "axios"
import { rootStore } from "@/stores/root-store"
import { toastUtils } from "@/utils/toast-utils"

// Create a storage service that uses localStorage or sessionStorage based on rememberMe preference
const storageService = {
  getStorage: (): Storage | null => {
    if (typeof window === "undefined") return null
    const rememberMe = localStorage.getItem("rememberMe") === "true"
    return rememberMe ? localStorage : sessionStorage
  },

  getToken: () => {
    if (typeof window === "undefined") return null
    const storage = storageService.getStorage()
    if (!storage) return null
    const tokens = storage.getItem("auth_tokens")
    return tokens ? JSON.parse(tokens) : null
  },

  setToken: (tokens: string) => {
    if (typeof window === "undefined") return
    const storage = storageService.getStorage()
    if (!storage) return
    storage.setItem("auth_tokens", JSON.stringify(tokens))
  },

  clearToken: () => {
    if (typeof window === "undefined") return
    // Clear from both storages to be safe
    localStorage.removeItem("auth_tokens")
    sessionStorage.removeItem("auth_tokens")
  },
}

const url =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_LIVE_URL

// Create axios instance
const axiosInstance = axios.create({
  baseURL: `${url}/api/` || "#",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    let token: string | null = null
    
    // First try to get token from localStorage
    const storedToken = storageService.getToken()
    if (storedToken) {
      // Handle both string token and object with access_token property
      if (typeof storedToken === 'string') {
        token = storedToken
      } else if (typeof storedToken === 'object' && storedToken !== null) {
        const tokenObj = storedToken as { access_token?: string; token?: string }
        token = tokenObj?.access_token || tokenObj?.token || null
      }
    }
    
    // Fallback: try to get token from authStore if storage doesn't have it
    if (!token) {
      try {
        const authStore = rootStore.authStore
        if (authStore.tokens) {
          if (typeof authStore.tokens === 'string') {
            token = authStore.tokens
          } else if (typeof authStore.tokens === 'object' && authStore.tokens !== null) {
            const tokenObj = authStore.tokens as { access_token?: string; token?: string }
            token = tokenObj?.access_token || tokenObj?.token || null
          }
        }
      } catch {
        // AuthStore might not be available, ignore
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for handling token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If error is 401 Unauthorized and we haven't tried to refresh the token yet
    if (error.response?.status === 401) {
      // Only handle logout/redirect if we're not already on the login page
      // This prevents redirect loops
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      // log the user out
      rootStore.authStore.logout()
      toastUtils.error("Session Expired", "Please log in again")
      storageService.clearToken()
        // Use replace instead of href to avoid adding to history
        window.location.replace("/login")
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with an error status
      // Error message can be accessed via error.response.data?.detail if needed
    } else if (error.request) {
      // Request was made but no response received
      toastUtils.error("Network Error", "No response received from server")
    } else {
      // Error in setting up the request
      toastUtils.error("Error", error.message)
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
