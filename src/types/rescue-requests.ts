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

export interface RescueRequest {
    _id: string;
    requestCode: string;
    userId: RescueRequestUser;
    description: string;
    location: GeoPoint;
    images: string[];
    status: string;
    assignedTeamId: string | null;
    urgencyLevel?: string;
    createdAt: string;
    updatedAt: string;
}
