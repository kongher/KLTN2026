import { useEffect, useState } from "react";
import { fetchAdminBookings } from "../services/bookingService";
import type { StaffSchedule } from "../types/schedule";
import { formatDateVi, formatTimeHm } from "../utils/statusLabels";
import { buildShiftTimeSlots } from "../utils/timeSlots";
import { getErrorMessage } from "../utils/getErrorMessage";

type ScheduleDayDetailModalProps = {
  open: boolean;
  schedule: StaffSchedule | null;
  staffId: string;
  onClose: () => void;
};

export default function ScheduleDayDetailModal({
  open,
  schedule,
  staffId,
  onClose,
}: ScheduleDayDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slots, setSlots] = useState<ReturnType<typeof buildShiftTimeSlots>>([]);

  useEffect(() => {
    if (!open || !schedule || !staffId) {
      setSlots([]);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const result = await fetchAdminBookings({
          from: schedule.date,
          to: schedule.date,
          status: "ALL",
          limit: 100,
          page: 1,
        });
        if (cancelled) return;
        const dayBookings = result.data.filter((item) => item.staffId === staffId);
        setSlots(
          buildShiftTimeSlots(
            formatTimeHm(schedule.startTime),
            formatTimeHm(schedule.endTime),
            dayBookings
          )
        );
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Không tải được lịch hẹn trong ca làm"));
          setSlots([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, schedule, staffId]);

  if (!open || !schedule) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={loading ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-spa-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-black/5 px-6 py-4">
          <h3 className="text-lg font-semibold text-spa-dark">Chi tiết ca làm việc</h3>
          <p className="mt-1 text-sm text-spa-muted">
            Ngày {formatDateVi(schedule.date)} · {formatTimeHm(schedule.startTime)}–
            {formatTimeHm(schedule.endTime)}
          </p>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-spa-muted">Đang tải khung giờ...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-spa-muted">
              Không có khung giờ trong ca này (ca quá ngắn hoặc chưa cấu hình).
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => (
                <p
                  key={slot.label}
                  className={
                    slot.occupied
                      ? "rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm"
                      : "rounded-xl border border-black/10 bg-spa-bg px-4 py-3 text-sm"
                  }
                >
                  <span className="font-medium text-spa-dark">{slot.label}</span>
                  <br />
                  <span className={slot.occupied ? "text-emerald-800/90" : "text-spa-muted"}>
                    {slot.occupied ? "Có lịch hẹn" : "Trống"}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-black/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-5 py-2.5 text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}