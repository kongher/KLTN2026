import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Pagination } from "../types/service";
import type {
  AvailableSlot,
  Booking,
  BookingQuery,
  BookingStaff,
  CreateBookingPayload,
} from "../types/booking";

type PaginatedBookings = ApiSuccess<Booking[]> & { pagination: Pagination };

function toParams(query: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params;
}

export async function fetchBookings(query: BookingQuery = {}) {
  const { data } = await api.get<PaginatedBookings>("/bookings", {
    params: toParams(query),
  });
  return data;
}

export async function fetchBooking(id: string) {
  const { data } = await api.get<ApiSuccess<Booking>>(`/bookings/${id}`);
  return data.data;
}

export async function createBooking(payload: CreateBookingPayload) {
  const { data } = await api.post<ApiSuccess<Booking>>("/bookings", payload);
  return data.data;
}

export async function cancelBooking(id: string) {
  const { data } = await api.patch<ApiSuccess<Booking>>(`/bookings/${id}/cancel`);
  return data.data;
}

export async function fetchAvailableStaff(serviceId: string, bookingDate?: string) {
  const { data } = await api.get<ApiSuccess<BookingStaff[]>>("/bookings/available-staff", {
    params: toParams({ serviceId, bookingDate }),
  });
  return data.data;
}

export async function fetchAvailableSlots(
  serviceId: string,
  staffId: string,
  bookingDate: string
) {
  const { data } = await api.get<ApiSuccess<AvailableSlot[]>>("/bookings/available-slots", {
    params: toParams({ serviceId, staffId, bookingDate }),
  });
  return data.data;
}

export async function fetchStaffBookings(query: BookingQuery = {}) {
  const { data } = await api.get<PaginatedBookings>("/staff/bookings", {
    params: toParams(query),
  });
  return data;
}

export async function fetchStaffBooking(id: string) {
  const { data } = await api.get<ApiSuccess<Booking>>(`/staff/bookings/${id}`);
  return data.data;
}

export async function completeStaffBooking(id: string) {
  const { data } = await api.patch<ApiSuccess<Booking>>(`/staff/bookings/${id}/complete`);
  return data.data;
}

export async function confirmStaffBooking(id: string) {
  const { data } = await api.patch<ApiSuccess<Booking>>(`/staff/bookings/${id}/confirm`);
  return data.data;
}

export async function rejectStaffBooking(id: string) {
  const { data } = await api.patch<ApiSuccess<Booking>>(`/staff/bookings/${id}/reject`);
  return data.data;
}

export async function cancelStaffBooking(id: string) {
  const { data } = await api.patch<ApiSuccess<Booking>>(`/staff/bookings/${id}/cancel`);
  return data.data;
}

export async function fetchStaffPendingBookingsCount() {
  const { data } = await api.get<ApiSuccess<{ count: number }>>("/staff/bookings/pending-count");
  return data.data.count;
}

export async function fetchAdminPendingBookingsCount() {
  const { data } = await api.get<ApiSuccess<{ count: number }>>("/admin/bookings/pending-count");
  return data.data.count;
}

export async function fetchAdminBookings(query: BookingQuery = {}) {
  const { data } = await api.get<PaginatedBookings>("/admin/bookings", {
    params: toParams(query),
  });
  return data;
}

export async function fetchAdminBooking(id: string) {
  const { data } = await api.get<ApiSuccess<Booking>>(`/admin/bookings/${id}`);
  return data.data;
}

