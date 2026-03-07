import { axiosInstance } from "@/lib/axios";

import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
  UpdateUserRolesPayload,
  DeleteUserPayload,
  ApiResponse,
} from "@/types/user";

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await axiosInstance.get<ApiResponse<User[]> | User[]>("/users");

    const body = res.data;

    const mapToUser = (item: any): User => ({
      ...item,
      id: item.userCode || item.id || item.UserCode || "",
      userCode: item.userCode || item.id || "",
      username: item.username || "",
      fullName: item.fullName || item.username || "Unknown",
      phone: item.phone || null,
      role: item.role || "CITIZEN",
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    });
    if (body && typeof body === "object" && "data" in body) {
      return body.data.map(mapToUser);
    }
    if (Array.isArray(body)) {
      return body.map(mapToUser);
    }
    console.warn("getUsers: unexpected response shape", body);
    return [];
  } catch (error) {
    console.error("Error in getUsers:", error);
    throw error;
  }
};

export const getUserByUsername = async (
  username: string,
): Promise<User | null> => {
  console.log("getUserById called with username:", username);
  const res = await axiosInstance.get<ApiResponse<User> | User>(
    `/users/${username}`,
  );
  console.log("getUserById response:", res.data);
  const body = res.data;

  const mapToUser = (item: any): User => ({
    ...item,
    id: item.userCode || item.id || item.UserCode || "",
    userCode: item.userCode || item.id || "",
    username: item.username || "",
    fullName: item.fullName || item.username || "Unknown",
    phone: item.phone || null,
    role: item.role || "CITIZEN",
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  });

  if (body && typeof body === "object" && "data" in body && body.data) {
    return mapToUser(body.data);
  }
  if (body && typeof body === "object") {
    return mapToUser(body);
  }
  console.warn("getUserByUsername: unexpected response shape", body);
  return null;
};

export const updateUser = async (payload: UpdateUserPayload): Promise<User> => {
  console.log("Calling PATCH /users/profile with payload:", payload);

  const res = await axiosInstance.patch<ApiResponse<User>>(
    "/users/profile",
    payload,
  );

  console.log("patchUser response:", res.data);

  const body = res.data;

  if (!body || !body.data) {
    console.warn("patchUser: unexpected response shape", body);
    throw new Error("Unexpected response shape");
  }

  const item = body.data;

  return {
    ...item,
    id: item.userCode ?? item.id ?? "",
    userCode: item.userCode ?? item.id ?? "",
    username: item.username ?? "",
    fullName: item.fullName ?? item.username ?? "Unknown",
    phone: item.phone ?? null,
    role: item.role ?? "CITIZEN",
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
};

export const updateUserRole = async (
  id: string,
  payload: UpdateUserRolesPayload,
): Promise<User> => {
  try {
    const response = await axiosInstance.patch<User>(
      `/users/${id}/role`,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", { id, payload });
    throw error;
  }
};

export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<void> => {
  console.log("Calling PATCH /users/change-password with payload:", payload);
  await axiosInstance.patch("/users/change-password", payload);
};

export const deleteUser = async (id: string): Promise<void> => {
  console.log("Calling DELETE /users with id:", id);
  await axiosInstance.delete(`/users/${id}`);
};
