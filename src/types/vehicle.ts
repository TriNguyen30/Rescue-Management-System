export interface VehicleItem {
    id?: string;
    _id?: string;
    plateNumber: string;
    type: string;
    capacity: number;
    status: string;
    assignedTeam?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface CreateVehicleItemPayload {
    plateNumber: string;
    type: string;
    capacity: number;
    status: string;
    assignedTeam?: string;
}

export interface UpdateInventoryItemPayload {
    plateNumber?: string;
    type?: string;
    capacity?: number;
    status?: string;
    assignedTeam?: string;
}
