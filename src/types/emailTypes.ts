export interface EmailSettings {
    id: number
    provider: string
    mailFromName: string
    mailFromEmail: string
    apiKey: string
    mailUser: string
    mailPassword: string
    mailHost: string
    status: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateEmailSettingsPayload {
    provider: string
    mailFromName: string
    mailFromEmail: string
    apiKey: string
    mailUser: string
    mailPassword: string
    mailHost: string
    status: number
}

