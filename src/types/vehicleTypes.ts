import { VehicleType } from "./vehicleTypeTypes"
import { Driver } from "./driverTypes"

export interface Vehicle {
    id: string;
    vehicleTypeId: string;
    vehicleType: VehicleType;
    registrationNumber: string;
    capacity: number;
    baseLocation: string;
    status: number;
    driverId: string;
    driver: Driver;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreateVehiclePayload {
    vehicleTypeId: string;
    registrationNumber: string;
    capacity: number;
    baseLocation: string;
    driverId: string;
    status: number;
}

export interface UpdateVehiclePayload {
    vehicleTypeId?: string;
    registrationNumber?: string;
    capacity?: number;
    baseLocation?: string;
    driverId?: string;
    status?: number;
}

