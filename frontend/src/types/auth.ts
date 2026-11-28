export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "BANNED";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ProfileUser = AuthUser & {
  phone: string;
  avatar: string | null;
  status: UserStatus;
  marketingEmailOptIn?: boolean;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
};
