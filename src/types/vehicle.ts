export interface VehicleItem {
    id?: string;
    _id?: string;
    name?: string;
    plateNumber: string;
    type: string;
    capacity: number;
    status: string;
    assignedTeamId: {
        _id: string;
        teamName: string;
    } | null;
    isActive?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface CreateVehicleItemPayload {
    name?: string;
    plateNumber: string;
    type: string;
    capacity: number;
}

export interface UpdateVehicleItemPayload {
    name?: string;
    plateNumber?: string;
    type?: string;
    capacity?: number;
    status?: string;
    assignedTeamId?: string | null;
    teamName?: string | null;
}

export interface UpdateVehicleStatusPayload {
    status: string;
}