export interface Packaging {
    id: number
    name: string
    price: number
    status: number
    image: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreatePackagingPayload {
    name: string
    price: number
    status: number
    image: string
}
