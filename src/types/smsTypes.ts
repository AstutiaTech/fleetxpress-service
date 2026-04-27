export interface SmsSettings {
    id: number
    provider: string
    secretKey: string
    publicKey: string
    apiKey: string
    apiUrl: string
    applicationToken: string
    applicationId: string
    username: string
    password: string
    status: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateSmsSettingsPayload {
    provider: string
    secretKey: string
    publicKey: string
    apiKey: string
    apiUrl: string
    applicationToken: string
    applicationId: string
    username: string
    password: string
    status: number
}

