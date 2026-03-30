import { axiosInstance } from "@/lib/axios";
import type {
    CreateRescueRequestPayload,
    RescueRequest,
    UrgencyLevel,
    AssignRequestPayload,
    RescueRequestStatus,
    UpdateRescueRequestStatusPayload,
} from "@/types/rescue-requests";

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

/**
 * [Coordinator] Lấy danh sách yêu cầu cứu hộ
 * GET /rescue-requests
 */
export const getRescueRequests = async (): Promise<RescueRequest[]> => {
    try {
        const response = await axiosInstance.get<RescueRequest[] | { data: RescueRequest[] }>("/rescue-requests");
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && typeof data === "object" && "data" in data && Array.isArray((data as any).data)) return (data as any).data;
        return [];
    } catch (error) {
        console.error("Error fetching rescue requests:", error);
        throw error;
    }
};

/**
 * [Coordinator] Lấy chi tiết yêu cầu cứu hộ theo ID
 * GET /rescue-requests/:id
 */
export const getRescueRequestById = async (id: string): Promise<RescueRequest> => {
    try {
        const response = await axiosInstance.get<RescueRequest | { data: RescueRequest }>(`/rescue-requests/${id}`);
        const data = response.data;
        if (data && typeof data === "object" && "data" in (data as any) && (data as any).data) return (data as any).data;
        return data as RescueRequest;
    } catch (error) {
        console.error("Error fetching rescue request:", error);
        throw error;
    }
};

/**
 * [Coordinator] Xác minh yêu cầu & phân loại mức độ khẩn cấp
 * PATCH /rescue-requests/:id/verify
 */
export const verifyRescueRequest = async (id: string, urgencyLevel: UrgencyLevel): Promise<RescueRequest> => {
    try {
        const response = await axiosInstance.patch<RescueRequest | { data: RescueRequest }>(
            `/rescue-requests/${id}/verify`,
            { urgencyLevel },
        );
        const data = response.data;
        if (data && typeof data === "object" && "data" in (data as any) && (data as any).data) return (data as any).data;
        return data as RescueRequest;
    } catch (error) {
        console.error("Error verifying rescue request:", error);
        throw error;
    }
};

/**
 * [Coordinator] Điều phối: gán đội, phương tiện, vật tư cho yêu cầu
 * PATCH /rescue-requests/:id/assign
 */
export const assignRescueRequest = async (id: string, payload: AssignRequestPayload): Promise<RescueRequest> => {
    try {
        const response = await axiosInstance.patch<RescueRequest | { data: RescueRequest }>(
            `/rescue-requests/${id}/assign`,
            payload,
        );
        const data = response.data;
        if (data && typeof data === "object" && "data" in (data as any) && (data as any).data) return (data as any).data;
        return data as RescueRequest;
    } catch (error) {
        console.error("Error assigning rescue request:", error);
        throw error;
    }
};

/**
 * [Team] Cập nhật tiến độ yêu cầu cứu hộ được giao
 * PATCH /rescue-requests/:id/status
 */
export const updateRescueRequestStatus = async (
    id: string,
    payload: UpdateRescueRequestStatusPayload,
): Promise<RescueRequest> => {
    try {
        const response = await axiosInstance.patch<RescueRequest | { data: RescueRequest }>(
            `/rescue-requests/${id}/status`,
            payload,
        );
        const data = response.data;
        if (data && typeof data === "object" && "data" in (data as any) && (data as any).data) {
            return (data as any).data;
        }
        return data as RescueRequest;
    } catch (error) {
        console.error("Error updating rescue request status:", error);
        throw error;
    }
};

/**
 * [Team] Xem các nhiệm vụ được điều phối viên phân công cho một đội
 * GET /rescue-requests/assigned-tasks?teamId=...
 */
export const getAssignedTasks = async (teamId: string): Promise<RescueRequest[]> => {
    try {
        const response = await axiosInstance.get<RescueRequest[] | { data: RescueRequest[] }>(
            "/rescue-requests/assigned-tasks",
            { params: { teamId } },
        );
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && typeof data === "object" && "data" in (data as any) && Array.isArray((data as any).data)) {
            return (data as any).data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching assigned tasks:", error);
        throw error;
    }
};

/**
 * [Citizen] Xem lịch sử yêu cầu cứu hộ của chính mình
 * GET /rescue-requests/my-requests
 */
export const getMyRescueRequests = async (): Promise<RescueRequest[]> => {
    try {
        const response = await axiosInstance.get<RescueRequest[] | { data: RescueRequest[] }>(
            "/rescue-requests/my-requests",
        );
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && typeof data === "object" && "data" in (data as any) && Array.isArray((data as any).data)) {
            return (data as any).data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching my rescue requests:", error);
        throw error;
    }
};

/**
 * [Citizen] Xác nhận đã an toàn (Đóng đơn)
 * PATCH /rescue-requests/:id/confirm-rescued
 */
export const confirmRescuedRescueRequest = async (id: string): Promise<RescueRequest> => {
    try {
        const response = await axiosInstance.patch<RescueRequest | { data: RescueRequest }>(
            `/rescue-requests/${id}/confirm-rescued`,
        );
        const data = response.data;
        if (data && typeof data === "object" && "data" in (data as any) && (data as any).data) return (data as any).data;
        return data as RescueRequest;
    } catch (error) {
        console.error("Error confirming rescued request:", error);
        throw error;
    }
};

/**
 * [Team] Tìm yêu cầu cứu hộ xung quanh
 * GET /rescue-requests/nearby?latitude=...&longitude=...&radius=...
 */
export const getNearbyRescueRequests = async (
    latitude: number,
    longitude: number,
    radius: number,
): Promise<RescueRequest[]> => {
    try {
        const response = await axiosInstance.get<RescueRequest[] | { data: RescueRequest[] }>(
            "/rescue-requests/nearby",
            { params: { latitude, longitude, radius } },
        );

        const data = response.data;
        if (Array.isArray(data)) return data;
        if (
            data &&
            typeof data === "object" &&
            "data" in (data as any) &&
            Array.isArray((data as any).data)
        ) {
            return (data as any).data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching nearby rescue requests:", error);
        throw error;
    }
};
