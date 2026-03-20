export interface User {
  id: string;
  userCode: string;
  username: string;
  fullName: string;
  phone: string | null;
  role: string;
  avatarUrl?: string | null;
  avatar?: string | null;
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

export interface UpdateUserRolesPayload {
  role: string;
  id?: string;
  _id?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface DeleteUserPayload {
  id: string;
  _id: string;  
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
