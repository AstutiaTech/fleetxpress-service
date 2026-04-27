export interface NotificationSettings {
    id: number
    firebaseServerKey?: string | null
    firebaseProjectId?: string | null
    createdAt?: string
    updatedAt?: string
    deletedAt: string | null
}

export interface CreateNotificationSettingsPayload {
    firebaseServerKey?: string
    firebaseProjectId?: string
}

