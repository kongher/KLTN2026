import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { InboxNotification, PaginatedInbox } from "../types/inbox";

export async function fetchUnreadInboxCount() {
  const { data } = await api.get<ApiSuccess<{ count: number }>>("/inbox/unread-count");
  return data.data.count;
}

export async function fetchInbox(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { data } = await api.get<PaginatedInbox>("/inbox", {
    params: {
      page: params?.page,
      limit: params?.limit,
      unreadOnly: params?.unreadOnly ? "true" : undefined,
    },
  });
  return data;
}

export async function fetchInboxItem(id: string) {
  const { data } = await api.get<ApiSuccess<InboxNotification>>(`/inbox/${id}`);
  return data.data;
}

export async function markInboxRead(id: string) {
  const { data } = await api.patch<ApiSuccess<InboxNotification>>(`/inbox/${id}/read`);
  return data.data;
}

export async function markAllInboxRead() {
  const { data } = await api.patch<ApiSuccess<{ updated: number }>>("/inbox/read-all");
  return data.data;
}