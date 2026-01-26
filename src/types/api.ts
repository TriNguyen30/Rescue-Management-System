export interface AuthUser {
    id: string;
    username: string;
    email: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}
