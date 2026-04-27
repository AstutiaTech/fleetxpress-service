export interface VehicleType {
    id: string;
    name: string;
    size: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreateVehicleTypePayload {
    name: string;
    size: string;
    status: number;
}

export interface UpdateVehicleTypePayload {
    name?: string;
    size?: string;
    status?: number;
}

