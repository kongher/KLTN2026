export type Treatment = {
  id: string;
  customerId: string;
  bookingId: string;
  serviceId: string;
  staffId: string;
  note: string | null;
  beforeImage: string | null;
  afterImage: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
  };
  staff?: {
    id: string;
    specialization?: string | null;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
    image: string | null;
    status: string;
  };
  booking?: {
    id: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    totalPrice: number;
  };
};

export type CompletedBookingOption = {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  customer: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
};

export type CreateTreatmentPayload = {
  bookingId: string;
  note?: string;
  beforeImage?: string;
  afterImage?: string;
};

export type UpdateTreatmentPayload = {
  note?: string;
  beforeImage?: string;
  afterImage?: string;
};
