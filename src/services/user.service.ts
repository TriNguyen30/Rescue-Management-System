import { axiosInstance } from "@/lib/axios";

import {
  User,
  CreateUserPayload,
  ChangePasswordPayload,
  UpdateUserRolesPayload,
  DeleteUserPayload,
  ApiResponse,
} from "@/types/user";

// Preserve BOTH the real backend id AND the userCode display field
const mapToUser = (item: any): User => ({
  ...item,
  // Use backend _id (MongoDB) or id for API calls; userCode is display-only.
  id: item.id || item._id || item.userCode || item.UserCode || "",
  userCode: item.userCode || item.UserCode || item.id || item._id || "",
  username: item.username || "",
  fullName: item.fullName || item.username || "Unknown",
  phone: item.phone || null,
  role: item.role || "CITIZEN",
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await axiosInstance.get<ApiResponse<User[]> | User[]>("/users");
    const body = res.data;

    if (body && typeof body === "object" && "data" in body) {
      return (body as ApiResponse<User[]>).data.map(mapToUser);
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
  const res = await axiosInstance.get<ApiResponse<User> | User>(
    `/users/${username}`,
  );
  const body = res.data;

  if (body && typeof body === "object" && "data" in body && (body as ApiResponse<User>).data) {
    return mapToUser((body as ApiResponse<User>).data);
  }
  if (body && typeof body === "object") {
    return mapToUser(body);
  }
  console.warn("getUserByUsername: unexpected response shape", body);
  return null;
};

/**
 * Update only the role for a specific user.
 * Uses PATCH /users/:id/role
 */
export const updateUserRole = async (
  id: string,
  payload: UpdateUserRolesPayload,
): Promise<User> => {
  console.log(`Calling PATCH /users/${id}/role with payload:`, payload);
  try {
    const res = await axiosInstance.patch<ApiResponse<User> | User>(
      `/users/${id}/role`,
      payload,
    );
    const body = res.data;

    if (body && typeof body === "object" && "data" in body) {
      return mapToUser((body as ApiResponse<User>).data);
    }
    if (body && typeof body === "object") {
      return mapToUser(body);
    }
    throw new Error("Unexpected response shape");
  } catch (error) {
    console.error("Error updating user role:", { id, payload });
    throw error;
  }
};

/**
 * Change the currently-authenticated user's own password.
 * Uses PATCH /users/change-password
 */
export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<void> => {
  console.log("Calling PATCH /users/change-password with payload:", payload);
  await axiosInstance.patch("/users/change-password", payload);
};

/**
 * Delete a user by their backend id.
 * Uses DELETE /users/:id
 */
export const deleteUser = async (id: string): Promise<void> => {
  console.log("Calling DELETE /users/:id with id:", id);
  await axiosInstance.delete(`/users/${id}`);
};