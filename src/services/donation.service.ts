import { axiosInstance } from "@/lib/axios";

export interface Donation {
    amount: number;
    message: string;
}

export interface DonationResponse {
    paymentUrl: string;
}

export interface DonationList {
    page: number;
    limit: number;
    status: number;
}

export interface DonationItem {
    id: string;
    _id: string;
    orderId: string;
    amount: number;
    message: string;
    status: string;
    vnp_TransactionNo: string;
    createdAt: string;
    updatedAt: string;
}

export interface DonationListResponse {
    data: DonationItem[];
    total: number;
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

export const getDonations = async (
    params: DonationList
): Promise<DonationListResponse> => {
    const res = await axiosInstance.get("/donations", { params });
    return res.data;
};

export const getDonationDetail = async (orderId: string): Promise<DonationItem> => {
    try {
        const res = await axiosInstance.get<DonationItem>(`/donations/${orderId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching donation detail:", error);
        throw error;
    }
}