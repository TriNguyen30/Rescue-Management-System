import { axiosInstance } from "@/lib/axios";
import type { CreateRescueRequestPayload } from "@/types/rescue-requests";

/**
 * [Citizen] Gửi yêu cầu cứu hộ mới
 * POST /rescue-requests
 */
export const createRescueRequest = async (payload: CreateRescueRequestPayload) => {
    try {
        const response = await axiosInstance.post("/rescue-requests", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating rescue request:", error);
        throw error;
    }
};
