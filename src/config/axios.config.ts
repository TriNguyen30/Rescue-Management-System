import { API_BASE_URL } from "@/config/env";
import axios from "axios";

export const axiosConfig = {
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
};

export const api = axios.create(axiosConfig);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log("Token from localStorage:", token);
    console.log("Request URL:", config.url);
    console.log("Request method:", config.method);

    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
      console.log("Token added to headers:", config.headers.Authorization);
    } else {
      console.log("No token found in localStorage!");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log("401 Unauthorized - token might be expired");
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;