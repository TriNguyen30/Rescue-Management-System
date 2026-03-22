import { axiosInstance } from "@/lib/axios";
import type {
    RescueTeam,
    CreateRescueTeamPayload,
    UpdateRescueTeamPayload,
    AssignMemberToRescueTeamPayload,
    AssignVehicleToRescueTeamPayload,
} from "@/types/rescue-teams";

export const getRescueTeams = async (): Promise<RescueTeam[]> => {
    try {
        const response = await axiosInstance.get<RescueTeam[]>("/rescue-teams");
        return response.data;
    } catch (error) {
        console.error("Error fetching rescue teams:", error);
        throw error;
    }
};

export const getResuceTeamById = async (id: string): Promise<RescueTeam> => {
    try {
        const response = await axiosInstance.get<RescueTeam>(`/rescue-teams/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching rescue team by id:", id);
        throw error;
    }
};

export const getRescueTeamsAvailable = async (): Promise<RescueTeam[]> => {
    try {
        const response = await axiosInstance.get<RescueTeam[]>("/rescue-teams/available");
        return response.data;
    } catch (error) {
        console.error("Error fetching available rescue teams:", error);
        throw error;
    }
}

export const createRescueTeam = async (payload: CreateRescueTeamPayload): Promise<RescueTeam> => {
    try {
        const response = await axiosInstance.post<RescueTeam>("/rescue-teams", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating rescue team:", payload);
        throw error;
    }
};

export const updateRescueTeam = async (id: string, payload: UpdateRescueTeamPayload): Promise<RescueTeam> => {
    try {
        const response = await axiosInstance.patch<RescueTeam>(`/rescue-teams/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating rescue team:", payload);
        throw error;
    }
};

export const updateRescueTeamLocation = async (id: string, latitude: number, longitude: number): Promise<RescueTeam> => {
    try {
        const response = await axiosInstance.patch<RescueTeam>(`/rescue-teams/${id}/location`, {
            latitude,
            longitude,
        });
        return response.data;
    } catch (error) {
        console.error("Error updating rescue team location:", { id, latitude, longitude });
        throw error;
    }
}

export const deleteRescueTeam = async (id: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/rescue-teams/${id}`);
    } catch (error) {
        console.error("Error deleting rescue team:", id);
        throw error;
    }
}

export const assignMemberToRescueTeam = async (payload: AssignMemberToRescueTeamPayload): Promise<RescueTeam> => {
    try {
        const id = payload.id || payload._id;
        const userId = payload.userId;
        const response = await axiosInstance.post<RescueTeam>(`/rescue-teams/${id}/members/${userId}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error assigning member to rescue team:", payload);
        throw error;
    }
}

export const removeMemberFromRescueTeam = async (payload: AssignMemberToRescueTeamPayload): Promise<RescueTeam> => {
    try {
        const id = payload.id || payload._id;
        const userId = payload.userId;
        const response = await axiosInstance.delete(`/rescue-teams/${id}/members/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error removing member from rescue team:", payload);
        throw error;
    }
}

export const assignVehicleToRescueTeam = async (payload: AssignVehicleToRescueTeamPayload): Promise<RescueTeam> => {
    try {
        const id = payload.id || payload._id;
        const vehicleId = payload.vehicleId;
        const response = await axiosInstance.post<RescueTeam>(`/rescue-teams/${id}/vehicles/${vehicleId}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error assigning vehicle to rescue team:", payload);
        throw error;
    };
}

export const removeVehicleFromRescueTeam = async (payload: AssignVehicleToRescueTeamPayload): Promise<RescueTeam> => {
    try {
        const id = payload.id || payload._id;
        const vehicleId = payload.vehicleId;
        const response = await axiosInstance.delete(`/rescue-teams/${id}/vehicles/${vehicleId}`);
        return response.data;
    } catch (error) {
        console.error("Error removing vehicle from rescue team:", payload);
        throw error;
    }
}