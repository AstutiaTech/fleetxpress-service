export enum ActiveMode {
  LIVE = 'live',
  SANDBOX = 'sandbox'
}

export interface PaymentSettings {
  id: number
  provider: string
  secretKey?: string
  publicKey?: string
  activeMode: ActiveMode
  status: number // 0 = inactive, 1 = active
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreatePaymentSettingsPayload {
  provider: string
  secretKey?: string
  publicKey?: string
  activeMode?: ActiveMode
  status?: number
}

export interface UpdatePaymentSettingsPayload {
  provider?: string
  secretKey?: string
  publicKey?: string
  activeMode?: ActiveMode
  status?: number
}

