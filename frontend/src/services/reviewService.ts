import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Pagination } from "../types/service";
import type { ServiceReview, ServiceReviewSummary } from "../types/review";

type PaginatedReviews = ApiSuccess<ServiceReview[]> & { pagination: Pagination };
type ServiceReviewsResponse = PaginatedReviews & { summary?: ServiceReviewSummary };

export async function createReview(payload: {
  bookingId: string;
  rating: number;
  comment?: string;
}) {
  const { data } = await api.post<ApiSuccess<ServiceReview>>("/reviews", payload);
  return data.data;
}

export async function updateReview(
  id: string,
  payload: { rating?: number; comment?: string }
) {
  const { data } = await api.put<ApiSuccess<ServiceReview>>(`/reviews/${id}`, payload);
  return data.data;
}

export async function fetchMyReviews(page = 1, limit = 10) {
  const { data } = await api.get<PaginatedReviews>("/reviews/my-reviews", {
    params: { page, limit },
  });
  return data;
}

export async function fetchServiceReviews(serviceId: string, page = 1, limit = 10) {
  const { data } = await api.get<ServiceReviewsResponse>(`/reviews/service/${serviceId}`, {
    params: { page, limit },
  });
  return data;
}

export async function fetchStaffReviews(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const { data } = await api.get<PaginatedReviews>("/reviews/staff-assigned", { params });
  return data;
}

export async function fetchAdminReviews(query: {
  page?: number;
  limit?: number;
  search?: string;
  serviceId?: string;
  rating?: number;
  status?: "VISIBLE" | "HIDDEN" | "ALL";
}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "ALL") {
      params.set(key, String(value));
    }
  });
  const { data } = await api.get<PaginatedReviews>("/reviews", { params });
  return data;
}

export async function fetchReview(id: string) {
  const { data } = await api.get<ApiSuccess<ServiceReview>>(`/reviews/${id}`);
  return data.data;
}

export async function patchReviewStatus(id: string, status: "VISIBLE" | "HIDDEN") {
  const { data } = await api.patch<ApiSuccess<ServiceReview>>(`/reviews/${id}/status`, {
    status,
  });
  return data.data;
}