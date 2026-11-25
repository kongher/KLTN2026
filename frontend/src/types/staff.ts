export type StaffStatus = "ACTIVE" | "INACTIVE";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "BANNED";
export type StaffAccountRole = "STAFF" | "ADMIN";

export type StaffServiceItem = {
  id: string;
  name: string;
  status: StaffStatus;
  duration?: number;
  price?: number;
  image?: string | null;
  categoryId?: string;
};

export type StaffMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  specialization: string | null;
  status: StaffStatus;
  accountStatus: AccountStatus;
  role: StaffAccountRole;
  services: StaffServiceItem[];
  createdAt: string;
  updatedAt: string;
};

export type StaffQuery = {
  search?: string;
  status?: StaffStatus | "ALL";
  accountStatus?: AccountStatus | "ALL";
  sortBy?: "createdAt" | "name" | "specialization";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type StaffPayload = {
  name: string;
  email: string;
  phone: string;
  password?: string;
  specialization?: string;
  avatar?: string;
  status?: StaffStatus;
  role?: StaffAccountRole;
};
