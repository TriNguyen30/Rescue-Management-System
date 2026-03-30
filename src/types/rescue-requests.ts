export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RescueRequestStatus =
    | "PENDING"
    | "VERIFIED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    
export interface CreateRescueRequestPayload {
    description: string;
    latitude: number;
    longitude: number;
    images?: string[];
}

export interface RescueRequestUser {
    _id: string;
    fullName?: string;
    phone?: string;
}

export interface GeoPoint {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
}

export interface SupplyItemDto {
    inventoryId: string;
    quantity: number;
}

export interface AssignRequestPayload {
    teamId: string;
    vehicleId?: string;
    supplies?: SupplyItemDto[];
}

export interface RescueRequest {
    _id: string;
    requestCode: string;
    userId: RescueRequestUser;
    description: string;
    location: GeoPoint;
    images: string[];
    status: RescueRequestStatus | string;
    assignedTeamId?: {
        _id: string;
        teamName: string;
        currentLocation?: GeoPoint;
        leaderId?: string;
        members?: string[];
        vehicles?: string[];
        status?: string;
    };
    urgencyLevel?: UrgencyLevel;
    createdAt: string;
    updatedAt: string;
    evidenceImage?: string;
    cancelReason?: string;
}

export interface UpdateRescueRequestStatusPayload {
    status: RescueRequestStatus;
    evidenceImage?: string;
    cancelReason?: string;
}
