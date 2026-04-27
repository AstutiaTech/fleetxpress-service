import { Packaging } from "./packagingType";

export interface Parcel {
    id: string;
    shipmentId: string;
    packagingId: number;
    packaging: Packaging;
    length: number;
    weight: number | null; // Optional if dimensions are provided
    height: number;
    width: number;
    quantity: number;
    isRushHour: boolean;
    extraCost: number;
    declaredValue: number | null; // Changed from string to number (monetary amount)
    description: string | null; // Optional parcel description
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface UpdateParcelPayload {
    packagingId?: number | null;
    length?: number;
    width?: number;
    height?: number;
    weight?: number | null; // Optional if dimensions are provided
    quantity?: number;
    isRushHour?: boolean;
    extraCost?: number;
    declaredValue?: number | null; // Changed from string to number (monetary amount)
    description?: string | null; // Optional parcel description
}