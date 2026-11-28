import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type {
  EmailNotification,
  EmailTargetType,
  EmailNotificationCategory,
  PaginatedNotificationRecipients,
  PaginatedNotifications,
  RecipientSearchUser,
} from "../types/notification";

export async function sendNotification(payload: {
  title: string;
  content: string;
  targetType: EmailTargetType;
  category?: EmailNotificationCategory;
  userIds?: string[];
}) {
  const { data } = await api.post<
    ApiSuccess<{ notification: EmailNotification; stats: { success: number; failed: number } }>
  >("/notifications", payload);
  return data.data;
}

export async function fetchNotifications(page = 1, limit = 10) {
  const { data } = await api.get<PaginatedNotifications>("/notifications", {
    params: { page, limit },
  });
  return data;
}

export async function fetchNotification(id: string) {
  const { data } = await api.get<ApiSuccess<EmailNotification>>(`/notifications/${id}`);
  return data.data;
}

export async function fetchNotificationRecipients(
  id: string,
  query: { page?: number; limit?: number; status?: string } = {}
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const { data } = await api.get<PaginatedNotificationRecipients>(
    `/notifications/${id}/recipients`,
    { params }
  );
  return data;
}

export async function retryNotification(id: string) {
  const { data } = await api.post<ApiSuccess<EmailNotification>>(`/notifications/${id}/retry`);
  return data.data;
}

export async function searchNotificationRecipients(search: string, role?: "STAFF" | "CUSTOMER") {
  const { data } = await api.get<ApiSuccess<RecipientSearchUser[]>>(
    "/notifications/recipients/search",
    { params: { search, role } }
  );
  return data.data;
}

export async function previewNotificationEmail(title: string, content: string) {
  return { title, content };
}