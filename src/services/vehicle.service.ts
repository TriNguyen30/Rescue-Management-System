import { axiosInstance } from "@/lib/axios";
import { VehicleItem, CreateVehicleItemPayload, UpdateInventoryItemPayload } from "@/types/vehicle";

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

export const updateVehicle = async (id: string, payload: UpdateInventoryItemPayload): Promise<VehicleItem> => {
    try {
        const response = await axiosInstance.put<VehicleItem>(`/vehicles/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating vehicle:", error);
        throw error;
    }
};