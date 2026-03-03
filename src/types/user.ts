export interface User {
    id: string;
    userCode: string;
    username: string;
    fullName: string;
    phone: string | null;
    role: string;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface CreateUserPayload {
    username: string;
    fullName: string;
    phone: string;
    role: string;
    isActive: boolean;
}

export interface UpdateUserPayload {
    username: string;
    fullName: string;
    phone: string;
    role: string;
}

export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
}


export interface ApiResponse<T> {
    data: T;
    message?: string;
}