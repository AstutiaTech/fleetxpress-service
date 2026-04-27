import { User, UserProfile } from "./auth"

export interface StaffUser extends User {
    staff: {
        id: string;
        userId: string;
        role: string;
        createdAt: string;
        updatedAt: string;
    };
    profile: UserProfile;
}

export interface CreateStaffPayload {
    firstName: string;
    lastName: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    lga?: string;
    country?: string;
    profilePicture?: string;
    email: string;
    role: string;
    isEmailVerified?: boolean;
}
export interface UpdateStaffPayload {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    lga?: string;
    country?: string;
    profilePicture?: string;
    email: string;
    role: string;
    isEmailVerified?: boolean;
}

export type StaffRole = "superadmin" | "admin" | "manager" | "agent"

