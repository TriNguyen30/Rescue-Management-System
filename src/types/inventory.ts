export interface InventoryItem {
    id?: string;
    _id?: string;
    itemName: string;
    quantity: number;
    unit: string;
    category: string;
    lowStockThreshold?: number;
    description?: string;
    expirationDate?: string;
    isActive?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface CreateInventoryItemPayload {
    itemName: string;
    quantity: number;
    unit: string;
    category: string;
    description?: string;
    lowStockThreshold?: number;
    expirationDate?: string;
    isActive?: boolean;
}

export interface UpdateInventoryItemPayload {
    itemName?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    lowStockThreshold?: number;
    description?: string;
    expirationDate?: string;
    isActive?: boolean;
}

export interface UpdateInventoryStockPayload {
    quantityChange: number;
}