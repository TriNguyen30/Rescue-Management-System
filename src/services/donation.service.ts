import { axiosInstance } from "@/lib/axios";

export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}

export interface Donation {
    amount: number;
    message: string;
}

export interface DonationResponse {
    paymentUrl: string;
}

export interface DonationList {
    page?: number;
    limit?: number;
    status?: DonationStatus;
}

export type DonationStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface DonationItem {
    _id: string;
    orderId: string;
    amount: number;
    message: string;
    status: DonationStatus;
    vnp_TransactionNo?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DonationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DonationListResponse {
    data: DonationItem[];
    meta: DonationMeta;
}

export const createDonation = async (
    payload: Donation
): Promise<DonationResponse> => {
    try {
        const res = await axiosInstance.post<DonationResponse>(
            "/donations/vnpay-create",
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error creating donation:", error);
        throw error;
    }
};

export const getDonations = async (params: DonationList) => {
    const res = await axiosInstance.get<ApiResponse<DonationListResponse>>(
        "/donations",
        { params }
    );
    return res.data.data;
};

export const getDonationDetail = async (orderId: string): Promise<DonationItem> => {
    try {
        const res = await axiosInstance.get<{ data: DonationItem }>(
            `/donations/${orderId}`
        );
        return res.data.data;
    } catch (error) {
        console.error("Error fetching donation detail:", error);
        throw error;
    }
}