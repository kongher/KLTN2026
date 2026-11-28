import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type {
  AdminCoupon,
  ApplyCouponResult,
  AvailableBookingCoupon,
  CouponSearchCustomer,
  MyCouponsResponse,
  PaginatedCouponRecipients,
  PaginatedCoupons,
} from "../types/coupon";

export async function fetchCoupons(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const { data } = await api.get<PaginatedCoupons>("/coupons", { params });
  return data;
}

export async function fetchCoupon(id: string) {
  const { data } = await api.get<ApiSuccess<AdminCoupon>>(`/coupons/${id}`);
  return data.data;
}

export async function createCoupon(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<AdminCoupon>>("/coupons", payload);
  return data.data;
}

export async function updateCoupon(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<AdminCoupon>>(`/coupons/${id}`, payload);
  return data.data;
}

export async function patchCouponStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  const { data } = await api.patch<ApiSuccess<AdminCoupon>>(`/coupons/${id}/status`, { status });
  return data.data;
}

export async function fetchCouponRecipients(
  id: string,
  params: { page?: number; limit?: number; search?: string; status?: string } = {}
) {
  const { data } = await api.get<PaginatedCouponRecipients>(`/coupons/${id}/customers`, { params });
  return data;
}

export async function retryCouponEmails(id: string) {
  const { data } = await api.post<ApiSuccess<{ retried: number }>>(`/coupons/${id}/retry-emails`);
  return data.data;
}

export async function searchCouponCustomers(search: string) {
  const { data } = await api.get<ApiSuccess<CouponSearchCustomer[]>>("/coupons/customers/search", {
    params: { search },
  });
  return data.data;
}

export async function fetchMyCoupons() {
  const { data } = await api.get<ApiSuccess<MyCouponsResponse>>("/coupons/my-coupons");
  return data.data;
}

export async function fetchAvailableBookingCoupons(serviceId: string) {
  const { data } = await api.get<ApiSuccess<AvailableBookingCoupon[]>>("/coupons/available", {
    params: { serviceId },
  });
  return data.data;
}

export async function applyBookingCoupon(customerCouponId: string, serviceId: string) {
  const { data } = await api.post<ApiSuccess<ApplyCouponResult>>("/coupons/apply", {
    customerCouponId,
    serviceId,
  });
  return data.data;
}