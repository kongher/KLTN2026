const BOOKING_OCCUPIED_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
]);

export function toMinutes(time: string) {
  const normalized = time.trim().slice(0, 5);
  const [hour, minute] = normalized.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
}

export function minutesToTime(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

export type ShiftTimeSlot = {
  startTime: string;
  endTime: string;
  label: string;
  occupied: boolean;
};

export function buildShiftTimeSlots(
  shiftStart: string,
  shiftEnd: string,
  bookings: { startTime: string; endTime: string; status: string }[],
  slotMinutes = 90
): ShiftTimeSlot[] {
  const start = toMinutes(shiftStart);
  const end = toMinutes(shiftEnd);
  const activeBookings = bookings.filter((item) =>
    BOOKING_OCCUPIED_STATUSES.has(item.status)
  );
  const slots: ShiftTimeSlot[] = [];

  for (let cursor = start; cursor + slotMinutes <= end; cursor += slotMinutes) {
    const slotStart = minutesToTime(cursor);
    const slotEnd = minutesToTime(cursor + slotMinutes);
    const occupied = activeBookings.some((booking) =>
      rangesOverlap(slotStart, slotEnd, booking.startTime, booking.endTime)
    );
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      label: `${slotStart}–${slotEnd}`,
      occupied,
    });
  }

  return slots;
}