import type { BookingStatus } from "../types/booking";
import { BOOKING_STATUS_LABEL } from "../utils/statusLabels";

function statusClass(status: BookingStatus) {
  if (status === "PENDING") return "bg-amber-50 text-amber-800";
  if (status === "CONFIRMED") return "bg-spa-primary/10 text-spa-primary";
  if (status === "COMPLETED") return "bg-spa-dark/10 text-spa-dark";
  if (status === "CANCELLED") return "bg-black/5 text-spa-muted";
  return "bg-rose-50 text-rose-700";
}

type Props = {
  status: BookingStatus;
  onComplete?: () => void;
};

export default function BookingStatusSelect({ status, onComplete }: Props) {
  const canComplete = status === "CONFIRMED" && Boolean(onComplete);

  if (!canComplete) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusClass(status)}`}>
        {BOOKING_STATUS_LABEL[status]}
      </span>
    );
  }

  return (
    <span className="relative inline-flex">
      <select
        aria-label="Đổi trạng thái lịch hẹn"
        className={`cursor-pointer appearance-none rounded-full border-0 py-1 pl-2.5 pr-6 text-xs outline-none ${statusClass(status)}`}
        value={status}
        onChange={(event) => {
          if (event.target.value === "COMPLETED") {
            onComplete?.();
          }
          event.target.value = status;
        }}
      >
        <option value="CONFIRMED">{BOOKING_STATUS_LABEL.CONFIRMED}</option>
        <option value="COMPLETED">{BOOKING_STATUS_LABEL.COMPLETED}</option>
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[10px] opacity-70">
        ▾
      </span>
    </span>
  );
}
