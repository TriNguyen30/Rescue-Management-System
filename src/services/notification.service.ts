import { axiosInstance } from "@/lib/axios";

export type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
  link?: string;
};

function normalizeNotification(raw: any): NotificationItem | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw._id ?? raw.id ?? "");
  if (!id) return null;
  return {
    id,
    title: typeof raw.title === "string" ? raw.title : undefined,
    message: typeof raw.message === "string" ? raw.message : (typeof raw.content === "string" ? raw.content : undefined),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : (typeof raw.created_at === "string" ? raw.created_at : undefined),
    read: typeof raw.read === "boolean" ? raw.read : (typeof raw.isRead === "boolean" ? raw.isRead : undefined),
    link: typeof raw.link === "string" ? raw.link : (typeof raw.url === "string" ? raw.url : undefined),
  };
}

/**
 * Fetch notifications for the current user.
 * Expected endpoints (backend-dependent):
 * - GET /notifications
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await axiosInstance.get("/notifications");
    const data = (res as any)?.data;
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    return list.map(normalizeNotification).filter(Boolean) as NotificationItem[];
  } catch (e) {
    // Backend might not have this endpoint yet; keep UI functional.
    return [];
  }
}

/**
 * Mark a single notification as read.
 * Expected endpoints (backend-dependent):
 * - PATCH /notifications/:id/read
 */
export async function markNotificationRead(id: string): Promise<void> {
  try {
    await axiosInstance.patch(`/notifications/${id}/read`);
  } catch (e) {
    // no-op if not supported
  }
}

/**
 * Mark all notifications as read.
 * Expected endpoints (backend-dependent):
 * - PATCH /notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    await axiosInstance.patch("/notifications/read-all");
  } catch (e) {
    // no-op if not supported
  }
}

