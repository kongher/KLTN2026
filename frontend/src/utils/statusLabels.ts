import type { AccountStatus, StaffAccountRole, StaffStatus } from "../types/staff";
import type { ScheduleStatus } from "../types/schedule";
import type { BookingStatus } from "../types/booking";

export const STAFF_STATUS_LABEL: Record<StaffStatus, string> = {
  ACTIVE: "Đang làm việc",
  INACTIVE: "Ngưng làm việc",
};

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Vô hiệu hóa",
  LOCKED: "Đã khóa",
  BANNED: "Bị cấm",
};

export const ROLE_LABEL: Record<StaffAccountRole, string> = {
  STAFF: "Nhân viên",
  ADMIN: "Quản trị",
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  AVAILABLE: "Sẵn sàng",
  UNAVAILABLE: "Tạm ngưng",
  OFF: "Nghỉ",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối",
};

export function formatDateVi(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatTimeHm(value: string) {
  return value.slice(0, 5);
}
