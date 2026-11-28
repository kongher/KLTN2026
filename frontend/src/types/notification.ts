import type { ApiSuccess } from "./auth";
import type { Pagination } from "./service";

export type EmailTargetType = "ALL_STAFF" | "ALL_CUSTOMER" | "SPECIFIC";
export type EmailNotificationCategory = "OPERATIONAL" | "PROMOTIONAL";
export type EmailRecipientStatus = "PENDING" | "SENT" | "FAILED";

export type EmailNotification = {
  id: string;
  title: string;
  content: string;
  targetType: EmailTargetType;
  category: EmailNotificationCategory;
  createdById: string;
  sentSuccess: number;
  sentFailed: number;
  createdAt: string;
  createdByName: string | null;
  recipientCount?: number;
};

export type EmailNotificationRecipient = {
  id: string;
  notificationId: string;
  userId: string;
  email: string;
  status: EmailRecipientStatus;
  sentAt: string | null;
  errorMessage: string | null;
  userName: string | null;
  userRole: string | null;
};

export type RecipientSearchUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "STAFF" | "CUSTOMER";
  marketingEmailOptIn: boolean;
};

export type PaginatedNotifications = ApiSuccess<EmailNotification[]> & {
  pagination: Pagination;
};

export type PaginatedNotificationRecipients = ApiSuccess<EmailNotificationRecipient[]> & {
  pagination: Pagination;
};