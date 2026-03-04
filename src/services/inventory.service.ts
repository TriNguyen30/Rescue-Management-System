import { axiosInstance } from "@/lib/axios";
import {
    InventoryItem,
    CreateInventoryItemPayload,
    UpdateInventoryItemPayload,
} from "@/types/inventory";

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    try {
        const response = await axiosInstance.get<InventoryItem[]>("/inventories");
        return response.data;
    } catch (error) {
        console.error("Error fetching inventory items:", error);
        throw error;
    }
};

export const createInventoryItem = async (payload: CreateInventoryItemPayload): Promise<InventoryItem> => {
    try {
        const response = await axiosInstance.post<InventoryItem>("/inventories", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating inventory item:", error);
        throw error;
    }
};

export const updateInventoryItem = async (id: string, payload: UpdateInventoryItemPayload): Promise<InventoryItem> => {
    try {
        const response = await axiosInstance.put<InventoryItem>(`/inventories/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating inventory item:", error);
        throw error;
    }
};