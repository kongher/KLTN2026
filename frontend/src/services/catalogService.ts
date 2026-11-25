import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type {
  Pagination,
  ServiceCategory,
  ServiceQuery,
  SpaService,
} from "../types/service";

type PaginatedServices = ApiSuccess<SpaService[]> & { pagination: Pagination };

function toParams(query: ServiceQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params;
}

export async function fetchCategories(status?: string) {
  const { data } = await api.get<ApiSuccess<ServiceCategory[]>>("/categories", {
    params: status ? { status } : undefined,
  });
  return data.data;
}

export async function fetchCategory(id: string) {
  const { data } = await api.get<ApiSuccess<ServiceCategory>>(`/categories/${id}`);
  return data.data;
}

export async function createCategory(payload: {
  name: string;
  description?: string;
  status?: string;
}) {
  const { data } = await api.post<ApiSuccess<ServiceCategory>>("/categories", payload);
  return data.data;
}

export async function updateCategory(
  id: string,
  payload: { name?: string; description?: string; status?: string }
) {
  const { data } = await api.put<ApiSuccess<ServiceCategory>>(`/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete<ApiSuccess<null>>(`/categories/${id}`);
  return data;
}

export async function fetchServices(query: ServiceQuery = {}) {
  const { data } = await api.get<PaginatedServices>("/services", {
    params: toParams(query),
  });
  return data;
}

export async function fetchService(id: string) {
  const { data } = await api.get<ApiSuccess<SpaService>>(`/services/${id}`);
  return data.data;
}

export async function createService(payload: Partial<SpaService>) {
  const { data } = await api.post<ApiSuccess<SpaService>>("/services", payload);
  return data.data;
}

export async function updateService(id: string, payload: Partial<SpaService>) {
  const { data } = await api.put<ApiSuccess<SpaService>>(`/services/${id}`, payload);
  return data.data;
}

export async function changeServiceStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  const { data } = await api.patch<ApiSuccess<SpaService>>(`/services/${id}/status`, {
    status,
  });
  return data.data;
}

export async function deleteService(id: string) {
  const { data } = await api.delete<ApiSuccess<null>>(`/services/${id}`);
  return data;
}
