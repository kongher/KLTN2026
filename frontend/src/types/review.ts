import type { ApiSuccess } from "./auth";
import type { Pagination } from "./service";

export type ReviewStatus = "VISIBLE" | "HIDDEN";

export type ServiceReview = {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  bookingId: string;
  bookingCode?: string | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerAvatar: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  serviceName: string | null;
  staffName: string | null;
  bookingDate: string | null;
  bookingStatus?: string | null;
  bookingStartTime?: string | null;
  bookingEndTime?: string | null;
};

export type ServiceReviewSummary = {
  averageRating: number;
  totalReviews: number;
};

export type PaginatedReviews = ApiSuccess<ServiceReview[]> & {
  pagination: Pagination;
  summary?: ServiceReviewSummary;
};