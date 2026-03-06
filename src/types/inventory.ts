export interface InventoryItem {
    id?: string;
    _id?: string;
    itemName: string;
    quantity: number;
    unit: string;
    category: string;
    description?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface CreateInventoryItemPayload {
    itemName: string;
    quantity: number;
    unit: string;
    category: string;
    description?: string;
}

export interface UpdateInventoryItemPayload {
    itemName?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    description?: string;
}

export interface UpdateInventoryStockPayload {
    amount: number;
}