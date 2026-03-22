import { axiosInstance } from "@/lib/axios";
import {
    InventoryItem,
    CreateInventoryItemPayload,
    UpdateInventoryItemPayload,
    UpdateInventoryStockPayload,
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

export const getInventoryItem = async (id: string): Promise<InventoryItem> => {
    try {
        const response = await axiosInstance.get<InventoryItem>(`/inventories/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching inventory item:", id);
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
        const response = await axiosInstance.patch<InventoryItem>(`/inventories/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating inventory item:", error);
        throw error;
    }
};

export const updateInventoryStock = async (id: string, quantityChange: number): Promise<InventoryItem> => {
    try {
        const payload: UpdateInventoryStockPayload = { quantityChange };
        const response = await axiosInstance.patch<InventoryItem>(`/inventories/${id}/stock`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating inventory stock:", error);
        throw error;
    }
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/inventories/${id}`);
    } catch (error) {
        console.error("Error deleting inventory item:", id);
        throw error;
    }
};