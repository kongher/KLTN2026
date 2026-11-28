import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import ConfirmDialog from "../../components/ConfirmDialog";
import { cancelBooking, fetchBooking } from "../../services/bookingService";
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

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchBooking(id)
      .then(setBooking)
      .catch((err) => setError(getErrorMessage(err, "Không tải được lịch hẹn")))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    try {
      const updated = await cancelBooking(booking.id);
      setBooking(updated);
      setMessage("Đã hủy lịch hẹn");
      setConfirmCancel(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <p className="text-spa-muted">Đang tải chi tiết lịch hẹn...</p>;
  }

  if (error && !booking) {
    return (
      <div>
        <p className="text-rose-700">{error}</p>
        <Link to="/customer/bookings" className="mt-4 inline-block text-spa-primary">
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
        </div>
        <Link to="/customer/bookings" className="rounded-full border px-5 py-2.5 text-sm">
          Quay lại
        </Link>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-spa-primary">{message}</p> : null}

      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-xs ${statusClass(booking.status)}`}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </span>
          <p className="text-sm text-spa-muted">
            Tạo lúc {new Date(booking.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        {booking.status === "PENDING" ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Lịch hẹn đang chờ Admin duyệt. Bạn có thể hủy trước khi được xác nhận.
          </p>
        ) : null}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Mã lịch</dt>
            <dd className="mt-1 font-mono text-sm text-spa-dark">{booking.bookingCode}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Dịch vụ</dt>
            <dd className="mt-1 font-medium text-spa-dark">{booking.service?.name}</dd>
            <dd className="text-sm text-spa-muted">
              {booking.service ? formatDuration(booking.service.duration) : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Giá</dt>
            <dd className="mt-1 text-lg text-spa-primary">{formatPrice(booking.totalPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Ngày</dt>
            <dd className="mt-1">{booking.bookingDate}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Giờ</dt>
            <dd className="mt-1">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/5 p-4">
          <Avatar
            name={booking.staff?.name || "NV"}
            src={booking.staff?.avatar}
            className="h-12 w-12"
          />
          <div>
            <p className="font-medium text-spa-dark">{booking.staff?.name}</p>
            <p className="text-sm text-spa-muted">
              {booking.staff?.specialization || "Chuyên viên spa"}
            </p>
          </div>
        </div>

        {booking.note ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-spa-muted">Ghi chú</p>
            <p className="mt-1 text-spa-dark">{booking.note}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {booking.status === "PENDING" ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="rounded-full border border-rose-200 px-5 py-2.5 text-rose-700"
            >
              Hủy lịch
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate("/customer/bookings/new")}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white"
          >
            Đặt lịch khác
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Hủy lịch hẹn?"
        description={
          booking.service?.name
            ? `Bạn chắc chắn muốn hủy lịch "${booking.service.name}" ngày ${booking.bookingDate}?`
            : "Bạn chắc chắn muốn hủy lịch hẹn này?"
        }
        confirmLabel="Xác nhận hủy"
        cancelLabel="Hủy"
        tone="danger"
        loading={cancelling}
        onConfirm={() => void handleCancel()}
        onCancel={() => setConfirmCancel(false)}
      />
    </section>
  );
}
