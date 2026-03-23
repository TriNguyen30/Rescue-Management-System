import { axiosInstance } from "@/lib/axios";
import {
  getMyRescueRequests,
  getRescueRequests,
  getAssignedTasks,
} from "@/services/rescue-request.service";
import { getRescueTeams } from "@/services/rescue-team.service";
import type { RescueRequest } from "@/types/rescue-requests";

export type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
  link?: string;
};

function normalizeNotification(raw: unknown): NotificationItem | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const id = String(obj["_id"] ?? obj["id"] ?? "");
  if (!id) return null;

  const title = typeof obj["title"] === "string" ? obj["title"] : undefined;
  const message =
    typeof obj["message"] === "string"
      ? obj["message"]
      : typeof obj["content"] === "string"
        ? obj["content"]
        : undefined;
  const createdAt =
    typeof obj["createdAt"] === "string"
      ? obj["createdAt"]
      : typeof obj["created_at"] === "string"
        ? obj["created_at"]
        : undefined;
  const read =
    typeof obj["read"] === "boolean"
      ? obj["read"]
      : typeof obj["isRead"] === "boolean"
        ? obj["isRead"]
        : undefined;
  const link =
    typeof obj["link"] === "string"
      ? obj["link"]
      : typeof obj["url"] === "string"
        ? obj["url"]
        : undefined;

  return { id, title, message, createdAt, read, link };
}

function getStoredAuthUser(): { id?: string; role?: string } | null {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser);
    return { id: parsed?.id, role: parsed?.role };
  } catch {
    return null;
  }
}

function getUserKey() {
  const stored = getStoredAuthUser();
  return stored?.id ? String(stored.id) : "anon";
}

function readIdsKey() {
  return `notif_read_ids_v1_${getUserKey()}`;
}

function lastReadAtKey() {
  return `notif_last_read_at_v1_${getUserKey()}`;
}

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(readIdsKey());
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.map((x) => String(x)));
    return new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(readIdsKey(), JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

function loadLastReadAt(): number {
  try {
    const raw = localStorage.getItem(lastReadAtKey());
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveLastReadAt(ts: number) {
  try {
    localStorage.setItem(lastReadAtKey(), String(ts));
  } catch {
    // ignore
  }
}

function getStatusTitle(req: RescueRequest) {
  const code = req.requestCode ? String(req.requestCode) : "Yêu cầu cứu hộ";
  const status = req.status ? String(req.status) : "—";
  return `${code} • ${status}`;
}

function getNotificationLink(role: string | undefined, requestId: string) {
  const r = role?.toUpperCase();
  if (r === "CITIZEN") return "/requests-history";
  if (r === "COORDINATOR") return `/coordinator/requests/${requestId}`;
  if (r === "MANAGER") return `/manager/requests/${requestId}`;
  if (r === "RESCUE_TEAM") return `/rescue-team/assigned-task/${requestId}`;
  // fallback for ADMIN or unknown roles
  return `/manager/requests/${requestId}`;
}

/**
 * Fetch notifications for the current user.
 * Expected endpoints (backend-dependent):
 * - GET /notifications
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await axiosInstance.get<unknown>("/notifications");
    const body = res.data;

    const maybeData =
      body && typeof body === "object" && "data" in body ? (body as Record<string, unknown>)["data"] : body;

    const maybeList =
      maybeData && typeof maybeData === "object" && "data" in (maybeData as Record<string, unknown>)
        ? (maybeData as Record<string, unknown>)["data"]
        : maybeData;

    const list = Array.isArray(maybeList) ? maybeList : [];
    const stored = getStoredAuthUser();
    const readIds = loadReadIds();
    const lastReadAt = loadLastReadAt();

    const mapped = (list.map(normalizeNotification).filter(Boolean) as NotificationItem[]).map((n) => {
      const createdAtTs = n.createdAt ? new Date(n.createdAt).getTime() : NaN;
      const computedRead =
        readIds.has(n.id) ||
        (Number.isFinite(createdAtTs) ? createdAtTs <= lastReadAt : false);

      return {
        ...n,
        read: typeof n.read === "boolean" ? n.read : computedRead,
        link: n.link ?? getNotificationLink(stored?.role, n.id),
      };
    });

    return mapped.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
  } catch {
    // Backend might not have /notifications yet; build notifications from other existing APIs.
    const stored = getStoredAuthUser();
    const role = stored?.role;
    const userId = stored?.id;
    const readIds = loadReadIds();
    const lastReadAt = loadLastReadAt();

    try {
      let requests: RescueRequest[] = [];

      if (role?.toUpperCase() === "CITIZEN") {
        requests = await getMyRescueRequests();
      } else if (role?.toUpperCase() === "RESCUE_TEAM") {
        const teams = await getRescueTeams();
        const team =
          teams.find((t) => t.leaderId?._id === userId) ??
          teams.find((t) => t.members?.some((m) => m._id === userId));

        if (team?._id) {
          requests = await getAssignedTasks(team._id);
        } else {
          requests = [];
        }
      } else {
        // COORDINATOR / MANAGER / ADMIN: show latest rescue requests
        requests = await getRescueRequests();
      }

      const notifications: NotificationItem[] = requests
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)
        .map((req) => {
          const createdAtTs = req.createdAt ? new Date(req.createdAt).getTime() : NaN;
          const computedRead = readIds.has(req._id) || (Number.isFinite(createdAtTs) ? createdAtTs <= lastReadAt : false);

          return {
            id: req._id,
            title: getStatusTitle(req),
            message: req.description,
            createdAt: req.createdAt,
            read: computedRead,
            link: getNotificationLink(role, req._id),
          };
        });

      return notifications;
    } catch (fallbackErr) {
      // If even the fallback APIs fail, keep UI functional.
      console.error("Failed to load notifications fallback:", fallbackErr);
      return [];
    }
  }
}

/**
 * Mark a single notification as read.
 * Expected endpoints (backend-dependent):
 * - PATCH /notifications/:id/read
 */
export async function markNotificationRead(id: string): Promise<void> {
  // Always update client-side read state so UI works without backend support.
  const ids = loadReadIds();
  ids.add(String(id));
  saveReadIds(ids);

  try {
    await axiosInstance.patch(`/notifications/${id}/read`);
  } catch {
    // no-op if not supported
  }
}

/**
 * Mark all notifications as read.
 * Expected endpoints (backend-dependent):
 * - PATCH /notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<void> {
  // Mark everything as read from now; new notifications will be unread.
  saveLastReadAt(Date.now());
  try {
    // Optional: keep readIds small by clearing them.
    localStorage.removeItem(readIdsKey());
  } catch {
    // ignore
  }

  try {
    await axiosInstance.patch("/notifications/read-all");
  } catch {
    // no-op if not supported
  }
}

