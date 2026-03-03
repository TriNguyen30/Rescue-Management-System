import { axiosInstance } from "@/lib/axios";

export const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    return axiosInstance.post("/upload/image", formData, {
        headers: {
        "Content-Type": "multipart/form-data",
        },
    });
}