import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Pagination } from "../types/service";
import type { StaffMember, StaffPayload, StaffQuery, StaffServiceItem, StaffStatus } from "../types/staff";

type PaginatedStaff = ApiSuccess<StaffMember[]> & { pagination: Pagination };

function toParams(query: StaffQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params;
}

export async function fetchStaffList(query: StaffQuery = {}) {
  const { data } = await api.get<PaginatedStaff>("/staff", {
    params: toParams(query),
  });
  return data;
}

export async function fetchStaff(id: string) {
  const { data } = await api.get<ApiSuccess<StaffMember>>(`/staff/${id}`);
  return data.data;
}

export async function createStaff(payload: StaffPayload) {
  const { data } = await api.post<ApiSuccess<StaffMember>>("/staff", payload);
  return data.data;
}

export async function updateStaff(id: string, payload: Partial<StaffPayload>) {
  const { data } = await api.put<ApiSuccess<StaffMember>>(`/staff/${id}`, payload);
  return data.data;
}

export async function changeStaffStatus(
  id: string,
  payload: { status?: StaffStatus; locked?: boolean }
) {
  const { data } = await api.patch<ApiSuccess<StaffMember>>(`/staff/${id}/status`, payload);
  return data.data;
}

export async function deleteStaff(id: string) {
  const { data } = await api.delete<ApiSuccess<null>>(`/staff/${id}`);
  return data;
}

export async function fetchStaffServices(id: string) {
  const { data } = await api.get<ApiSuccess<StaffServiceItem[]>>(`/staff/${id}/services`);
  return data.data;
}

export async function assignStaffServices(id: string, serviceIds: string[]) {
  const { data } = await api.put<ApiSuccess<StaffServiceItem[]>>(`/staff/${id}/services`, {
    serviceIds,
  });
  return data.data;
}

export async function fetchStaffProfile() {
  const { data } = await api.get<ApiSuccess<StaffMember>>("/staff/profile");
  return data.data;
}

export async function updateStaffProfile(payload: Partial<StaffPayload>) {
  const { data } = await api.put<ApiSuccess<StaffMember>>("/staff/profile", payload);
  return data.data;
}
