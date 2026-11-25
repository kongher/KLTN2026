import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Pagination } from "../types/service";
import type {
  SchedulePayload,
  ScheduleQuery,
  ScheduleStatus,
  StaffSchedule,
} from "../types/schedule";

type PaginatedSchedules = ApiSuccess<StaffSchedule[]> & { pagination: Pagination };

function toParams(query: ScheduleQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params;
}

export async function fetchSchedules(query: ScheduleQuery = {}) {
  const { data } = await api.get<PaginatedSchedules>("/schedules", {
    params: toParams(query),
  });
  return data;
}

export async function fetchSchedule(id: string) {
  const { data } = await api.get<ApiSuccess<StaffSchedule>>(`/schedules/${id}`);
  return data.data;
}

export async function fetchStaffSchedules(staffId: string, query: ScheduleQuery = {}) {
  const { data } = await api.get<PaginatedSchedules>(`/staff/${staffId}/schedules`, {
    params: toParams(query),
  });
  return data;
}

export async function createSchedule(payload: SchedulePayload) {
  const { data } = await api.post<ApiSuccess<StaffSchedule>>("/schedules", payload);
  return data.data;
}

export async function updateSchedule(id: string, payload: Partial<SchedulePayload>) {
  const { data } = await api.put<ApiSuccess<StaffSchedule>>(`/schedules/${id}`, payload);
  return data.data;
}

export async function changeScheduleStatus(id: string, status: ScheduleStatus) {
  const { data } = await api.patch<ApiSuccess<StaffSchedule>>(`/schedules/${id}/status`, {
    status,
  });
  return data.data;
}

export async function deleteSchedule(id: string) {
  const { data } = await api.delete<ApiSuccess<null>>(`/schedules/${id}`);
  return data;
}
