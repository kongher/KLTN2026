export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "REJECTED";

export type BookingStaff = {
  id: string;
  specialization: string | null;
  status: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string | null;
};

export type BookingCustomer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
};

export type BookingService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  image: string | null;
  status: string;
};

export type Booking = {
  id: string;
  bookingCode: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  voucherId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  note: string | null;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  service?: BookingService;
  staff?: BookingStaff;
  customer?: BookingCustomer;
  hasReview?: boolean;
  reviewId?: string | null;
};

export type AvailableSlot = {
  startTime: string;
  endTime: string;
  label: string;
};

export type BookingQuery = {
  status?: BookingStatus | "ALL";
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateBookingPayload = {
  serviceId: string;
  staffId: string;
  bookingDate: string;
  startTime: string;
  note?: string;
  voucherId?: string;
  customerCouponId?: string;
};
