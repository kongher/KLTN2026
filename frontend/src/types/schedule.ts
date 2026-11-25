export type ScheduleStatus = "AVAILABLE" | "UNAVAILABLE" | "OFF";

export type StaffSchedule = {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    specialization: string | null;
    status: string;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
  };
};

export type ScheduleQuery = {
  staffId?: string;
  date?: string;
  from?: string;
  to?: string;
  status?: ScheduleStatus | "ALL";
  page?: number;
  limit?: number;
};

export type SchedulePayload = {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: ScheduleStatus;
};
