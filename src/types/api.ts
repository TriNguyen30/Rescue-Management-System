export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  message: string;
  errors: string[] | null;
  statusCode: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  userCode?: string;
  role: string;
  phone: string;
  avatarUrl?: string | null;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  username: string;
  phone: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  roles: string[];
}
