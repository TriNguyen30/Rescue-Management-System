import { axiosInstance } from "@/lib/axios";
import type { LoginPayload } from "@/types/api";

export const login = (payload: LoginPayload) => {
    return axiosInstance.post("/auth/login", payload);
};
