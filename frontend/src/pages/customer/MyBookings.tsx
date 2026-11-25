import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import { cancelBooking, fetchBookings } from "../../services/bookingService";
import type { Booking, BookingStatus } from "../../types/booking";
import type { Pagination } from "../../types/service";
import { formatPrice } from "../../utils/format";
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

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<"ALL" | BookingStatus>("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await fetchBookings({ status, page, limit: 10 });
      setBookings(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được lịch hẹn"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  async function handleCancel() {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await cancelBooking(pendingCancel.id);
      setMessage("Đã hủy lịch hẹn");
      setPendingCancel(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Lịch hẹn</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Lịch của tôi</h2>
        </div>
        <Link
          to="/customer/bookings/new"
          className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
        >
          Đặt lịch mới
        </Link>
      </div>

      <div className="mb-4">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "ALL" | BookingStatus);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-spa-primary">{message}</p> : null}
      {loading ? <p className="mb-3 text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Nhân viên</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Giờ</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Tạo lúc</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium text-spa-dark">
                  {booking.service?.name || "—"}
                </td>
                <td className="px-4 py-3">{booking.staff?.name || "—"}</td>
                <td className="px-4 py-3">{booking.bookingDate}</td>
                <td className="px-4 py-3">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </td>
                <td className="px-4 py-3">{formatPrice(booking.totalPrice)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${statusClass(booking.status)}`}>
                    {BOOKING_STATUS_LABEL[booking.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-spa-muted">
                  {new Date(booking.createdAt).toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/customer/bookings/${booking.id}`} className="text-spa-primary">
                      Chi tiết
                    </Link>
                    {booking.status === "PENDING" ? (
                      <button
                        type="button"
                        className="text-rose-700"
                        onClick={() => setPendingCancel(booking)}
                      >
                        Hủy
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && bookings.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-spa-muted">Chưa có lịch hẹn nào.</p>
            <Link
              to="/customer/bookings/new"
              className="mt-4 inline-flex rounded-full bg-spa-primary px-5 py-2.5 text-white"
            >
              Đặt lịch ngay
            </Link>
          </div>
        ) : null}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Trước
          </button>
          <span>
            {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Hủy lịch hẹn?"
        description={
          pendingCancel
            ? `Bạn chắc chắn muốn hủy lịch "${pendingCancel.service?.name || "dịch vụ"}" ngày ${pendingCancel.bookingDate}?`
            : ""
        }
        confirmLabel="Xác nhận hủy"
        cancelLabel="Hủy"
        tone="danger"
        loading={cancelling}
        onConfirm={() => void handleCancel()}
        onCancel={() => setPendingCancel(null)}
      />
    </section>
  );
}
