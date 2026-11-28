import type { ApiSuccess } from "./auth";
import type { Pagination } from "./service";

export type CouponType = "PERCENTAGE" | "FIXED";
export type CouponStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
export type CustomerCouponStatus = "AVAILABLE" | "RESERVED" | "USED" | "EXPIRED" | "REVOKED";

export type AdminCoupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: CouponType;
  value: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usagePerCustomer: number;
  usedCount: number;
  status: CouponStatus;
  assignedCount: number;
  usedAssignments: number;
  availableRedemptions: number;
  createdAt: string;
  updatedAt: string;
};

export type CouponSearchCustomer = {
  userId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
};

export type CouponRecipient = {
  id: string;
  status: CustomerCouponStatus;
  assignedAt: string;
  usedAt: string | null;
  emailStatus: "PENDING" | "SENT" | "FAILED";
  emailSentAt: string | null;
  emailError: string | null;
  customer: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
  };
  booking: { id: string; status: string } | null;
};

export type CustomerCouponItem = {
  id: string;
  status: CustomerCouponStatus;
  assignedAt: string;
  programName: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  startDate: string;
  endDate: string;
  discountLabel: string;
  voucherStatus: CouponStatus;
};

export type CouponPricing = {
  originalAmount: number;
  discountAmount: number;
  totalAmount: number;
};

export type AvailableBookingCoupon = CustomerCouponItem & {
  pricing: CouponPricing;
};

export type ApplyCouponResult = CouponPricing & {
  customerCouponId: string;
  couponCode: string;
  programName: string;
  discountLabel: string;
};

export type PaginatedCoupons = ApiSuccess<AdminCoupon[]> & { pagination: Pagination };
export type PaginatedCouponRecipients = ApiSuccess<CouponRecipient[]> & { pagination: Pagination };

export type MyCouponsResponse = {
  coupons: CustomerCouponItem[];
  groups: {
    available: CustomerCouponItem[];
    used: CustomerCouponItem[];
    expired: CustomerCouponItem[];
    reserved: CustomerCouponItem[];
  };
};