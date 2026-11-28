import api from "./api";
import type { ApiSuccess } from "../types/auth";
import type { CustomerProfile, CustomerQuery } from "../types/customer";
import type { Pagination } from "../types/service";

type PaginatedCustomers = ApiSuccess<CustomerProfile[]> & { pagination: Pagination };

function toParams(query: CustomerQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params;
}

export async function fetchCustomerList(query: CustomerQuery = {}) {
  const { data } = await api.get<PaginatedCustomers>("/customers", {
    params: toParams(query),
  });
  return data;
}

export async function fetchCustomer(id: string) {
  const { data } = await api.get<ApiSuccess<CustomerProfile>>(`/customers/${id}`);
  return data.data;
}