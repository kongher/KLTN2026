import type { AccountStatus } from "./staff";

export type CustomerProfile = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerQuery = {
  search?: string;
  accountStatus?: AccountStatus | "ALL";
  sortBy?: "createdAt" | "name";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};