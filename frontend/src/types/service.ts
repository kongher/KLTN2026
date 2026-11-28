export type CatalogStatus = "ACTIVE" | "INACTIVE";

export type ServiceCategory = {
  id: string;
  name: string;
  description: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { services: number };
};

export type SpaService = {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  image: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
  category?: Pick<ServiceCategory, "id" | "name" | "status">;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ServiceQuery = {
  search?: string;
  categoryId?: string;
  status?: CatalogStatus | "ALL";
  minPrice?: string;
  maxPrice?: string;
  sortBy?: "price" | "name" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};
