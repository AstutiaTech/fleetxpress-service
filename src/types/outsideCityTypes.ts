export interface OutsideCity {
    id: number
    route: string
    category: string
    title?: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateOutsideCityPayload {
    title: string
}
