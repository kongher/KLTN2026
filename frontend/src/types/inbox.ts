import type { ApiSuccess } from "./auth";
import type { Pagination } from "./service";

export type InboxNotification = {
  id: string;
  title: string;
  message: string;
  actionLabel: string | null;
  actionPath: string | null;
  isRead: boolean;
  createdAt: string;
};

export type PaginatedInbox = ApiSuccess<InboxNotification[]> & {
  pagination: Pagination;
  unreadCount: number;
};