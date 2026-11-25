import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  cancelStaffBooking,
  completeStaffBooking,
  confirmStaffBooking,
  fetchStaffBooking,
  rejectStaffBooking,
} from "../../services/bookingService";
import type { Booking, BookingStatus } from "../../types/booking";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { BOOKING_STATUS_LABEL } from "../../utils/statusLabels";

function formatTime(value: string) {
  return value.slice(0, 5);
}

function statusClass(status: BookingStatus) {
  if (status === "PENDING") return "bg-amber-50 text-amber-800";
  if (status === "CONFIRMED") return "bg-spa-primary/10 text-spa-primary";
  if (status === "COMPLETED") return "bg-spa-dark/10 text-spa-dark";
  if (status === "CANCELLED") return "bg-black/5 text-spa-muted";
  return "bg-rose-50 text-rose-700";
}

type BookingAction = "confirm" | "reject" | "cancel" | "complete";

const ACTION_COPY: Record<
  BookingAction,
  { title: string; description: string; confirmLabel: string; tone: "default" | "warning" | "danger" }
> = {
  confirm: {
    title: "Xác nhận lịch hẹn?",
    description: "Khách hàng sẽ thấy trạng thái Đã xác nhận. Bạn chuẩn bị thực hiện dịch vụ theo ca này.",
    confirmLabel: "Xác nhận",
    tone: "default",
  },
  reject: {
    title: "Từ chối lịch hẹn?",
    description: "Khách hàng sẽ thấy trạng thái Từ chối. Chỉ từ chối khi bạn không thể nhận ca này.",
    confirmLabel: "Từ chối",
    tone: "danger",
  },
  cancel: {
    title: "Hủy lịch đã xác nhận?",
    description: "Lịch đã xác nhận sẽ bị hủy. Khách hàng sẽ không còn ca này.",
    confirmLabel: "Hủy lịch",
    tone: "warning",
  },
  complete: {
    title: "Hoàn thành lịch hẹn?",
    description: "Đánh dấu lịch hẹn đã hoàn tất sau khi khách đã sử dụng dịch vụ.",
    confirmLabel: "Hoàn thành",
    tone: "default",
  },
};

export default function StaffBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<BookingAction | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchStaffBooking(id);
      setBooking(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được lịch hẹn"));
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runPendingAction() {
    if (!booking || !pendingAction) return;
    setBusy(true);
    setMessage("");
    try {
      const runners = {
        confirm: confirmStaffBooking,
        reject: rejectStaffBooking,
        cancel: cancelStaffBooking,
        complete: completeStaffBooking,
      };
      const updated = await runners[pendingAction](booking.id);
      setBooking(updated);
      setMessage(`Đã ${ACTION_COPY[pendingAction].confirmLabel.toLowerCase()} lịch hẹn`);
      setError("");
      setPendingAction(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingAction(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-spa-muted">Đang tải chi tiết lịch hẹn...</p>;
  }

  if (error && !booking) {
    return (
      <div>
        <p className="text-rose-700">{error}</p>
        <Link to="/staff/bookings" className="mt-4 inline-block text-spa-primary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!booking) {
    return <p className="text-spa-muted">Không tìm thấy lịch hẹn.</p>;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Chi tiết</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">
            {booking.service?.name || "Lịch hẹn"}
          </h2>
          <p className="mt-2 text-sm text-spa-muted">
            Bạn là nhân viên phụ trách — xác nhận hoặc từ chối lịch mới, sau đó hoàn thành ca khi làm xong.
          </p>
        </div>
        <Link to="/staff/bookings" className="rounded-full border px-5 py-2.5 text-sm">
          Quay lại
        </Link>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-spa-primary">{message}</p> : null}

      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-sm ${statusClass(booking.status)}`}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </span>
          <p className="text-lg font-semibold text-spa-dark">{formatPrice(booking.totalPrice)}</p>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Khách hàng</dt>
            <dd className="mt-1 text-spa-dark">{booking.customer?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">SĐT</dt>
            <dd className="mt-1 text-spa-dark">{booking.customer?.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Dịch vụ</dt>
            <dd className="mt-1 text-spa-dark">{booking.service?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Thời gian</dt>
            <dd className="mt-1 text-spa-dark">
              {booking.bookingDate} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              {booking.service?.duration
                ? ` (${formatDuration(booking.service.duration)})`
                : ""}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Ghi chú</dt>
            <dd className="mt-1 text-spa-dark">{booking.note || "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-6">
          <Avatar name={booking.customer?.name || "Khách"} className="h-11 w-11" />
          <div>
            <p className="font-medium text-spa-dark">{booking.customer?.name || "—"}</p>
            <p className="text-sm text-spa-muted">
              {[booking.customer?.email, booking.customer?.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-black/5 pt-6">
          {booking.status === "PENDING" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingAction("confirm")}
                className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-50"
              >
                Xác nhận
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingAction("reject")}
                className="rounded-full border border-rose-200 px-5 py-2.5 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Từ chối
              </button>
            </>
          ) : null}
          {booking.status === "CONFIRMED" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingAction("complete")}
                className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-50"
              >
                Hoàn thành
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingAction("cancel")}
                className="rounded-full border px-5 py-2.5 disabled:opacity-50"
              >
                Hủy lịch
              </button>
            </>
          ) : null}
          {booking.status === "COMPLETED" ? (
            <Link
              to="/staff/treatments"
              className="rounded-full border border-spa-primary/30 px-5 py-2.5 text-spa-primary"
            >
              Tạo hồ sơ điều trị
            </Link>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction ? ACTION_COPY[pendingAction].title : ""}
        description={pendingAction ? ACTION_COPY[pendingAction].description : ""}
        confirmLabel={pendingAction ? ACTION_COPY[pendingAction].confirmLabel : "Xác nhận"}
        tone={pendingAction ? ACTION_COPY[pendingAction].tone : "default"}
        loading={busy}
        onConfirm={() => void runPendingAction()}
        onCancel={() => setPendingAction(null)}
      />
    </section>
  );
}
