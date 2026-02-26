import { axiosInstance } from "@/lib/axios";
import type { LoginPayload, RegisterPayload } from "@/types/api";

export const login = (payload: LoginPayload) => {
    return axiosInstance.post("/auth/login", payload);
};

export const register = (payload: RegisterPayload) => {
    return axiosInstance.post("/auth/register", payload);
}