import { WarehouseType } from "./warehouseTypeTypes"

export interface WarehouseManager {
    id: string;
    userId: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface WareHouse {
    id: string;
    name: string;
    capacity: number;
    spaceUsed: number;
    city: string;
    state: string;
    lga: string;
    hubTypeId: string;
    hubType: WarehouseType;
    phoneNumber: string;
    managerId: string;
    manager: WarehouseManager;
    longitude: number;
    latitude: number;
    emailAddress: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreateWarehousePayload {
    name: string;
    capacity: number;
    spaceUsed: number;
    city: string;
    state: string;
    lga: string;
    hubTypeId: string;
    phoneNumber: string;
    managerId: string;
    longitude: number;
    latitude: number;
    emailAddress: string;
    status: number;
}