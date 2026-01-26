import { API_BASE_URL } from "@/config/env";

export const axiosConfig = {
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
};