import { axiosInstance } from "@/lib/axios";
import type { RescueRequest } from "@/types/rescue-requests";

/**
 * [Coordinator] Lấy danh sách yêu cầu cứu hộ
 * GET /rescue-requests
 */
export const getRescueRequests = async (): Promise<RescueRequest[]> => {
    try {
        const response = await axiosInstance.get<RescueRequest[] | { data: RescueRequest[] }>("/rescue-requests");
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) return data.data;
        return [];
    } catch (error) {
        console.error("Error fetching rescue requests:", error);
        throw error;
    }
};
