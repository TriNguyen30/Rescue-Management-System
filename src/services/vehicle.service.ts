import { axiosInstance } from "@/lib/axios";
import { VehicleItem, CreateVehicleItemPayload, UpdateVehicleItemPayload, UpdateVehicleStatusPayload } from "@/types/vehicle";

export const getVehicles = async (): Promise<VehicleItem[]> => {
    try {
        const response = await axiosInstance.get<VehicleItem[]>("/vehicles");
        return response.data;
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        throw error;
    }
};

export const createVehicle = async (payload: CreateVehicleItemPayload): Promise<VehicleItem> => {
    try {
        const response = await axiosInstance.post<VehicleItem>("/vehicles", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating vehicle:", error);
        throw error;
    }
};

export const updateVehicleStatus = async (id: string, payload: UpdateVehicleStatusPayload): Promise<VehicleItem> => {
    try {
        const response = await axiosInstance.patch<VehicleItem>(`/vehicles/${id}/status`, payload);  
        return response.data;
    } catch (error) {
        console.error("Error updating vehicle status:", payload);
        throw error;
    }
};