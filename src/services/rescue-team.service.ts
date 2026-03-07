import { axiosInstance } from "@/lib/axios";
import type {
    RescueTeam,
    CreateRescueTeamPayload,
    UpdateRescueTeamPayload,
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

export const getResuceTeamById = async (id: string): Promise<RescueTeam> => {
    try {
        const response = await axiosInstance.get<RescueTeam>(`/rescue-teams/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching rescue team by id:", id);
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