import { axiosInstance } from "@/lib/axios";

export interface Donation {
    amount: number;
    message: string;
}

export interface DonationResponse {
    paymentUrl: string;
}

export const createDonation = async (
    payload: Donation
): Promise<DonationResponse> => {
    try {
        const res = await axiosInstance.post<DonationResponse>(
            "/donations/vnpay-create",
            payload
        );

        const paymentUrl = res.data.paymentUrl;

        // Redirect sang VNPAY
        window.location.href = paymentUrl;

        return res.data;
    } catch (error) {
        console.error("Error creating donation:", error);
        throw error;
    }
};