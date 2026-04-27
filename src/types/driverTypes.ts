import { VehicleType } from "./vehicleTypeTypes"
import { WareHouse } from "./warehousesType"

export interface Driver {
    id: string;
    name: string;
    email: string;
    picture: string;
    phoneNumber1: string;
    phoneNumber2: string;
    status: number;
    vehicleTypeId: string;
    vehicleType: VehicleType;
    warehouseId: string;
    warehouse: WareHouse;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreateDriverPayload {
    name: string;
    email: string;
    picture: string;
    phoneNumber1: string;
    phoneNumber2: string;
    vehicleTypeId: string;
    warehouseId: string;
    status: number;
}

export interface UpdateDriverPayload {
    name?: string;
    email?: string;
    picture?: string;
    phoneNumber1?: string;
    phoneNumber2?: string;
    vehicleTypeId?: string;
    warehouseId?: string;
    status?: number;
}

