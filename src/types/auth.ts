import { MENU_LIST } from "@/config/menu-list";

// User roles
export type UserRole = "superadmin" | "admin" | "manager" | "agent" | "driver" | "customer"

// Permission types
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "reject"
export type PermissionResource = typeof MENU_LIST[keyof typeof MENU_LIST]

// Auth tokens type
export type AuthTokens = string

// Permission definition
export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[]
}

export interface OtpResponse {
  token: string;
}

export interface LoginResponse {
  access_token: string,
  user: User,
  profile: UserProfile
  staff: Staff
}

export interface User {
  id: string,
  email: string,
  userType: number,
  isEmailVerified: boolean,
  lastLoginAt: string,
  createdAt: string,
  updatedAt: string,
  status: number,
  ip_address: string | null,
  device_token: string | null
}

export interface Staff {
  id: string,
  role: string,
  createdAt: string,
  updatedAt: string,
  deletedAt: string | null
}

// User profile
export interface UserProfile {
  id: string,
  user_id: string,
  firstName: string,
  lastName: string,
  phone: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  country: string,
  profilePicture: string | null,
  createdAt: string,
  updatedAt: string,
  deletedAt: string | null
}

// Login credentials
export interface LoginCredentials {
  email: string;
}

export interface OTPCredentials {
  email: string;
  token: string;
}

export type CustomerUser = User & { profile: UserProfile }

export interface CreateCustomerPayload {
  firstName: string
  lastName: string
  phone: string
  profilePicture?: string
  email: string
  isEmailVerified?: boolean
  status?: number
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  tokens: string;
}
