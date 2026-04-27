import type { AuthTokens, Permission, PermissionAction, PermissionResource, Staff, User, UserProfile, UserRole } from "@/types/auth"
import { isHydrated, makePersistable } from "mobx-persist-store"
import { makeAutoObservable, runInAction } from "mobx"

import { ApiService } from "@/lib/api"
import { ROLE_PERMISSIONS } from "@/config/menu"
import type { RootStore } from "./root-store"
import { decrypt } from "@/lib/encryption"
import { getApiErrorMessage, getErrorMessage, toastUtils } from "@/utils/toast-utils"

export class AuthStore {
  rootStore: RootStore
  isAuthenticated: boolean
  user: User | null
  profile: UserProfile | null
  staff: Staff | null
  role: UserRole | null
  permissions: Permission[]
  tokens: AuthTokens | null
  isLoading: boolean
  error: string | null
  redirectAfterLogin: string
  pendingEmail: string | null
  otpSent: boolean
  otpVerifying: boolean
  email: string | null
  rememberMe: boolean

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.isAuthenticated = false
    this.user = null
    this.profile = null
    this.staff = null
    this.role = null
    this.permissions = []
    this.tokens = null
    this.isLoading = false
    this.error = ''
    this.redirectAfterLogin = "/"
    this.pendingEmail = null
    this.otpSent = false
    this.otpVerifying = false
    this.email = null
    this.rememberMe = false

    makeAutoObservable(this, {
      rootStore: false,
    })

    // Load rememberMe preference from localStorage
    if (typeof window !== "undefined") {
      const storedRememberMe = localStorage.getItem("rememberMe")
      this.rememberMe = storedRememberMe === "true"
    }

    // Create a custom storage adapter that routes based on rememberMe preference
    const storageAdapter = typeof window !== "undefined" ? this.createStorageAdapter() : undefined

    makePersistable(this, {
      name: "AuthStore",
      properties: ["isAuthenticated", "user", "profile", "staff", "role", "permissions", "tokens", "rememberMe"],
      storage: storageAdapter,
    })

    // Listen for storage changes from other tabs to sync auth state
    // Note: Storage events only fire for localStorage, not sessionStorage
    // This means cross-tab syncing only works when rememberMe is true (localStorage)
    // When rememberMe is false (sessionStorage), sessions are tab-specific (by design)
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        // Only sync if rememberMe is enabled (localStorage)
        const rememberMe = localStorage.getItem("rememberMe") === "true"
        if (!rememberMe) return // Skip syncing if using sessionStorage (tab-specific)
        
        if (e.key === "AuthStore") {
          if (e.newValue) {
            // Reload auth state from storage when it changes in another tab
            try {
              const storedData = JSON.parse(e.newValue)
              runInAction(() => {
                this.isAuthenticated = storedData.isAuthenticated ?? false
                this.user = storedData.user ?? null
                this.profile = storedData.profile ?? null
                this.staff = storedData.staff ?? null
                this.role = storedData.role ?? null
                this.permissions = storedData.permissions ?? []
                this.tokens = storedData.tokens ?? null
                this.rememberMe = storedData.rememberMe ?? false
              })
            } catch (error) {
              console.error("Error syncing auth state from storage:", error)
            }
          } else {
            // AuthStore was cleared (logout in another tab)
            runInAction(() => {
              this.isAuthenticated = false
              this.user = null
              this.profile = null
              this.staff = null
              this.role = null
              this.permissions = []
              this.tokens = null
            })
          }
        }
        // Also listen for auth_tokens changes
        if (e.key === "auth_tokens" && e.newValue) {
          try {
            const parsedTokens = JSON.parse(e.newValue)
            runInAction(() => {
              this.tokens = parsedTokens
            })
          } catch (error) {
            console.error("Error syncing tokens from storage:", error)
          }
        }
      })
    }
  }

  // Create a storage adapter that routes to localStorage or sessionStorage based on rememberMe
  private createStorageAdapter() {
    return {
      getItem: (key: string): string | null => {
        // Check rememberMe preference dynamically
        const rememberMe = typeof window !== "undefined" ? localStorage.getItem("rememberMe") === "true" : false
        const storage = rememberMe ? localStorage : sessionStorage
        return storage.getItem(key)
      },
      setItem: (key: string, value: string): void => {
        // Check rememberMe preference dynamically
        const rememberMe = typeof window !== "undefined" ? localStorage.getItem("rememberMe") === "true" : false
        const storage = rememberMe ? localStorage : sessionStorage
        storage.setItem(key, value)
      },
      removeItem: (key: string): void => {
        // Remove from both storages to be safe
        if (typeof window !== "undefined") {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        }
      },
    }
  }

  // Get the appropriate storage based on rememberMe preference
  private getStorage(): Storage | null {
    if (typeof window === "undefined") return null
    return this.rememberMe ? localStorage : sessionStorage
  }

  syncTokensWithStorage() {
    if (this.tokens && typeof window !== "undefined") {
      const storage = this.getStorage()
      if (storage) {
        storage.setItem("auth_tokens", JSON.stringify(this.tokens))
      }
    }
  }

  get isHydrated() {
    return isHydrated(this)
  }

  async hydrate() { }

  setRedirectAfterLogin(path: string) {
    this.redirectAfterLogin = path
  }

  async requestOTP(email: string) {
    this.isLoading = true
    this.error = null
    this.email = email;

    try {
      // Call ApiService.login with the email as credentials
      const response = await ApiService.login({ email })
      if (response.status) {
        runInAction(() => {
          this.pendingEmail = email
          this.otpSent = true
          this.isLoading = false
        })
        toastUtils.success("OTP Sent", `A verification code has been sent to ${email}`)
        return { success: true, token: response.data?.token }
      } else {
        // When status is false, extract message from data.message (most specific) or fallback to response.message
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Email not found. Please check your email address."
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred while requesting OTP")
      runInAction(() => {
        this.isLoading = false
        this.error = errorMessage
      })
      toastUtils.error("OTP Request Failed", errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async verifyOTP(otp: string, rememberMe: boolean = false) {
    if (!this.pendingEmail) {
      return { success: false, error: "No pending email verification" }
    }

    this.otpVerifying = true
    this.error = null

    try {
      const response = await ApiService.verifyOtp({
        email: this.email || "",
        token: otp
      })
      if (response.status) {
        const data = response.data;
        
        // Store rememberMe preference
        if (typeof window !== "undefined") {
          localStorage.setItem("rememberMe", rememberMe.toString())
        }
        
        // Determine role: if staff is null or userType is 2, treat as customer
        let role: UserRole = "customer";
        
        // Priority: userType 2 always means customer, then check staff
        if (data.user?.userType === 2) {
          // userType 2 indicates customer
          role = "customer";
        } else if (data.staff === null || data.staff === undefined) {
          // No staff record means customer
          role = "customer";
        } else if (data.staff?.role) {
          // Try to get role from staff
          const roleString = data.staff.role;
          const validRoles: UserRole[] = ["superadmin", "admin", "manager", "agent", "driver", "customer"];
          role = validRoles.includes(roleString as UserRole) 
            ? (roleString as UserRole) 
            : "customer";
        }
        
        // Map role to permissions from menu config
        const rolePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.customer;

        runInAction(() => {
          this.isAuthenticated = true
          this.email = null;
          this.isLoading = false;
          this.user = data.user
          this.profile = data.profile
          this.staff = data.staff || null
          this.role = role
          this.permissions = rolePermissions.map((p) => ({ ...p, actions: [...p.actions] }))
          this.tokens = data.access_token
          this.rememberMe = rememberMe
          this.pendingEmail = null
          this.otpSent = false
          this.otpVerifying = false
          this.error = null
          this.syncTokensWithStorage()
        })
        toastUtils.success(`Welcome back, ${data.profile.firstName}!`, "Login successful")
        return { success: true }
      } else {
        // When status is false, extract message from data.message (most specific) or fallback to response.message
        const errorMessage = getApiErrorMessage(response as any) || response.message || "Email not found. Please check your email address."
        throw new Error(errorMessage)
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // const decryptedResponse = JSON.parse(decrypt(error.response.data));
      // console.log('error', decryptedResponse)
      const errorMessage = getErrorMessage(error, "An error occurred while verifying OTP")
      runInAction(() => {
        this.otpVerifying = false
        this.error = errorMessage
      })
      toastUtils.error("Verification Failed", errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      runInAction(() => {
        this.otpVerifying = false
      })
    }
  }

  resetOTPFlow() {
    this.pendingEmail = null
    this.otpSent = false
    this.otpVerifying = false
    this.error = null
  }

  async logout() {
    try {
      this.isLoading = true
      await new Promise((resolve) => setTimeout(resolve, 500))
      runInAction(() => {
        this.isAuthenticated = false
        this.user = null
        this.profile = null
        this.staff = null
        this.role = null
        this.permissions = []
        this.tokens = null
        this.isLoading = false
        this.pendingEmail = null
        this.otpSent = false
        this.error = null
        this.redirectAfterLogin = "/dashboard" // Reset redirect path to prevent loops
        if (typeof window !== "undefined") {
          // Clear from both storages to be safe
          localStorage.removeItem("auth_tokens")
          sessionStorage.removeItem("auth_tokens")
          localStorage.removeItem("AuthStore")
          sessionStorage.removeItem("AuthStore")
        }
      })
      toastUtils.info("Logged Out", "You have been successfully logged out.")
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "An error occurred while logging out")
      this.isLoading = false
      runInAction(() => {
        this.error = errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  async checkSession() {
    return this.isAuthenticated && !!this.tokens
  }

  hasPermission(resource: PermissionResource, action: PermissionAction): boolean {
    if (!this.isAuthenticated || !this.role) {
      return false
    }
    // Superadmin has all permissions
    if (this.role === 'superadmin') {
      return true
    }
    // Check if user has the specific permission
    return this.permissions.some(
      (permission) =>
        permission.resource === resource && permission.actions.includes(action),
    )
  }

  hasRole(...roles: string[]): boolean {
    if (!this.isAuthenticated || !this.role) {
      return false
    }
    return roles.includes(this.role)
  }

  get fullName(): string {
    if (!this.profile) {
      return ""
    }
    return `${this.profile.firstName} ${this.profile.lastName}`
  }
}
