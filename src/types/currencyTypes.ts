export interface Currency {
    id: number
    name: string
    symbol: string
    exchangeRate: number
    status: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateCurrencyPayload {
    name: string
    symbol: string
    exchangeRate: number
    status: number
}

