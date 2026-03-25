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

export const getVehicleById = async (id: string): Promise<VehicleItem> => {
    try {
        const response = await axiosInstance.get<VehicleItem>(`/vehicles/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching vehicle:", id);
        throw error;
    }
};

export const getVehiclesAvailable = async (): Promise<VehicleItem[]> => {
    try {
        const response = await axiosInstance.get<VehicleItem[]>("/vehicles/available");
        return response.data;
    } catch (error) {
        console.error("Error fetching vehicles available:", error);
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

export const updateVehicle = async (id: string, payload: UpdateVehicleItemPayload): Promise<VehicleItem> => {
    try {
        const response = await axiosInstance.patch<VehicleItem>(`/vehicles/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating vehicle:", payload);
        throw error;
    }
};

export const deleteVehicle = async (id: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/vehicles/${id}`);
    } catch (error) {
        console.error("Error deleting vehicle:", id);
        throw error;
    }
};