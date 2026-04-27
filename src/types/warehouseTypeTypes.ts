export interface WarehouseType {
    id: string;
    name: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreateWarehouseTypePayload {
    name: string;
    status: number;
}

