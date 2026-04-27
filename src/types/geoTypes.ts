// Geo Types (State, City, Country, LGA)
export interface Country {
    id: number
    name: string
    code: string
    isoCode: string
    capital: string
    longitude: number
    latitude: number
    status: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateCountryPayload {
    name: string
    code: string
    isoCode: string
    capital: string
    longitude: number
    latitude: number
    status: number
}

export interface State {
    id: number
    countryId: number
    name: string
    capital: string
    longitude: number
    latitude: number
    status: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateStatePayload {
    countryId: number
    name: string
    capital: string
    longitude: number
    latitude: number
    status: number
}

export interface City {
    id: number
    stateId: number
    name: string
    longitude: number
    latitude: number
    status: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateCityPayload {
    stateId: number
    name: string
    longitude: number
    latitude: number
    status: number
}

export interface LGA {
    id: number
    stateId: number
    name: string
    longitude: number
    latitude: number
    status: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CreateLGAPayload {
    stateId: number
    name: string
    longitude: number
    latitude: number
    status: number
}
