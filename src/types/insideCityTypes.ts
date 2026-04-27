export interface InsideCity {
    id: number
    route: string
    category: string
    title?: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateInsideCityPayload {
    title: string
}
