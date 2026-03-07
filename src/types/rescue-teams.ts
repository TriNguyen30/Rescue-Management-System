export interface GeoPoint {
    type: "Point";
    coordinates: [number, number];
}

export interface RescueTeamLeader {
    _id: string;
    fullName: string;
    phone: string;
}

export interface RescueTeamMember {
    _id: string;
    fullName: string;
    phone: string;
}

export type VehicleType = "BOAT" | "TRUCK" | "AMBULANCE";
export type VehicleStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";

export interface Vehicle {
    _id: string;
    plateNumber: string;
    type: VehicleType;
    capacity: number;
    status: VehicleStatus;
    assignedTeamId: string | null;
    createdAt: string;
    updatedAt: string;
}

export type RescueTeamStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

export interface RescueTeam {
    _id: string;
    teamName: string;

    leaderId: RescueTeamLeader;

    members: RescueTeamMember[];

    vehicles: Vehicle[];

    currentLocation: GeoPoint;

    status: RescueTeamStatus;

    createdAt: string;
    updatedAt: string;
}

export interface UpdateRescueTeamLocationPayload {
    latitude: number;
    longitude: number;
}

export interface CreateRescueTeamPayload {
    teamName: string;
    leaderId: string;
    members: string[];
    vehicles: string[];
}

export interface UpdateRescueTeamPayload {
    teamName?: string;
    leaderId?: string;
    members?: string[];
    vehicles?: string[];
    currentLocation?: string;
    status?: string;
}