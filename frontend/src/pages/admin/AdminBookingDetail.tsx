import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchAdminBooking } from "../../services/bookingService";
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

export default function AdminBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const bookingId = id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchAdminBooking(bookingId);
        if (!cancelled) {
          setBooking(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Không tải được lịch hẹn"));
          setBooking(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-spa-muted">Đang tải chi tiết lịch hẹn...</p>;
  }

  if (error && !booking) {
    return (
      <div>
        <p className="text-rose-700">{error}</p>
        <Link to="/admin/bookings" className="mt-4 inline-block text-spa-primary">
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
            Chế độ chỉ xem — nhân viên {booking.staff?.name || "phụ trách"} xử lý xác nhận và hủy lịch.
          </p>
        </div>
        <Link to="/admin/bookings" className="rounded-full border px-5 py-2.5 text-sm">
          Quay lại
        </Link>
      </div>

      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-sm ${statusClass(booking.status)}`}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </span>
          <p className="text-lg font-semibold text-spa-dark">{formatPrice(booking.totalPrice)}</p>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Mã lịch</dt>
            <dd className="mt-1 font-mono text-sm text-spa-dark">{booking.bookingCode}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Ngày</dt>
            <dd className="mt-1 text-spa-dark">{booking.bookingDate}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Giờ</dt>
            <dd className="mt-1 text-spa-dark">
              {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              {booking.service?.duration
                ? ` (${formatDuration(booking.service.duration)})`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Dịch vụ</dt>
            <dd className="mt-1 text-spa-dark">{booking.service?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Ghi chú</dt>
            <dd className="mt-1 text-spa-dark">{booking.note || "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Avatar name={booking.customer?.name || "Khách"} className="h-11 w-11" />
            <div>
              <p className="text-xs uppercase tracking-wide text-spa-muted">Khách hàng</p>
              <p className="font-medium text-spa-dark">{booking.customer?.name || "—"}</p>
              <p className="text-sm text-spa-muted">
                {[booking.customer?.phone, booking.customer?.email].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar
              name={booking.staff?.name || "NV"}
              src={booking.staff?.avatar}
              className="h-11 w-11"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-spa-muted">Nhân viên phụ trách</p>
              <p className="font-medium text-spa-dark">{booking.staff?.name || "—"}</p>
              <p className="text-sm text-spa-muted">
                {booking.staff?.specialization || "Chuyên viên spa"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
