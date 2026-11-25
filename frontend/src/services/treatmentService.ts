import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Pagination } from "../types/service";
import type {
  CompletedBookingOption,
  CreateTreatmentPayload,
  Treatment,
  UpdateTreatmentPayload,
} from "../types/treatment";

type PaginatedTreatments = ApiSuccess<Treatment[]> & { pagination: Pagination };

export async function fetchCustomerTreatments(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedTreatments>("/customer/treatments", {
    params: { page, limit },
  });
  return data;
}

export async function fetchStaffTreatments(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedTreatments>("/staff/treatments", {
    params: { page, limit },
  });
  return data;
}

export async function fetchAdminTreatments(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedTreatments>("/admin/treatments", {
    params: { page, limit },
  });
  return data;
}

export async function fetchTreatment(id: string) {
  const { data } = await api.get<ApiSuccess<Treatment>>(`/treatments/${id}`);
  return data.data;
}

export async function fetchCompletedBookingsWithoutTreatment() {
  const { data } = await api.get<ApiSuccess<CompletedBookingOption[]>>(
    "/treatments/completed-bookings"
  );
  return data.data;
}

export async function createTreatment(payload: CreateTreatmentPayload) {
  const { data } = await api.post<ApiSuccess<Treatment>>("/treatments", payload);
  return data.data;
}

export async function updateTreatment(id: string, payload: UpdateTreatmentPayload) {
  const { data } = await api.put<ApiSuccess<Treatment>>(`/treatments/${id}`, payload);
  return data.data;
}
