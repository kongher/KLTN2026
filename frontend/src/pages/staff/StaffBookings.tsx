import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ActionDropdown from "../../components/ActionDropdown";
import BookingStatusSelect from "../../components/BookingStatusSelect";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  completeStaffBooking,
  confirmStaffBooking,
  fetchStaffBookings,
  rejectStaffBooking,
} from "../../services/bookingService";
import type { Booking, BookingStatus } from "../../types/booking";
import type { Pagination } from "../../types/service";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function StaffBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<"ALL" | BookingStatus>("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingComplete, setPendingComplete] = useState<Booking | null>(null);
  const [pendingAction, setPendingAction] = useState<
    { type: "confirm" | "reject"; booking: Booking } | null
  >(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await fetchStaffBookings({
        status,
        search: search || undefined,
        page,
        limit: 10,
      });
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
  }, [status, search, page]);

  async function runPendingAction() {
    if (!pendingAction) return;
    setBusy(true);
    try {
      const runner =
        pendingAction.type === "confirm" ? confirmStaffBooking : rejectStaffBooking;
      await runner(pendingAction.booking.id);
      setMessage(
        pendingAction.type === "confirm"
          ? "Đã xác nhận lịch hẹn."
          : "Đã từ chối lịch hẹn."
      );
      setPendingAction(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingAction(null);
    } finally {
      setBusy(false);
    }
  }

  async function runComplete() {
    if (!pendingComplete) return;
    setBusy(true);
    try {
      await completeStaffBooking(pendingComplete.id);
      setMessage("Đã đánh dấu hoàn thành lịch hẹn");
      setPendingComplete(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingComplete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Lịch hẹn</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Lịch hẹn cá nhân</h2>
        <p className="mt-2 text-sm text-spa-muted">
          Xác nhận hoặc từ chối lịch mới được gán cho bạn.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "ALL" | BookingStatus);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        >
          <option value="ALL">Tất cả</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="REJECTED">Từ chối</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm mã lịch, khách hàng..."
            className="min-w-[220px] rounded-xl border border-black/10 bg-spa-white px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-full bg-spa-primary px-4 py-2 text-sm text-white hover:bg-spa-dark"
          >
            Tìm
          </button>
        </form>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-spa-primary">{message}</p> : null}
      {loading ? <p className="mb-3 text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Mã lịch</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Giờ</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-mono text-xs text-spa-dark">{booking.bookingCode}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-spa-dark">{booking.customer?.name || "—"}</div>
                  <div className="text-xs text-spa-muted">{booking.customer?.phone || ""}</div>
                </td>
                <td className="px-4 py-3">{booking.service?.name || "—"}</td>
                <td className="px-4 py-3">{booking.bookingDate}</td>
                <td className="px-4 py-3">
                  {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                </td>
                <td className="px-4 py-3">{formatPrice(booking.totalPrice)}</td>
                <td className="px-4 py-3">
                  <BookingStatusSelect
                    status={booking.status}
                    onComplete={() => setPendingComplete(booking)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {booking.status === "PENDING" ? (
                      <ActionDropdown
                        items={[
                          {
                            label: "Xác nhận",
                            onClick: () => setPendingAction({ type: "confirm", booking }),
                          },
                          {
                            label: "Từ chối",
                            onClick: () => setPendingAction({ type: "reject", booking }),
                            tone: "danger",
                          },
                        ]}
                      />
                    ) : null}
                    <Link to={`/staff/bookings/${booking.id}`} className="text-spa-primary hover:underline">
                      Chi tiết
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-spa-muted">
                  Không có lịch hẹn phù hợp.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm text-spa-muted">
            Trang {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={
          pendingAction?.type === "confirm"
            ? "Xác nhận lịch hẹn?"
            : pendingAction?.type === "reject"
              ? "Từ chối lịch hẹn?"
              : ""
        }
        description={
          pendingAction
            ? pendingAction.type === "confirm"
              ? `Xác nhận lịch của ${pendingAction.booking.customer?.name || "khách"} — ${pendingAction.booking.service?.name || "dịch vụ"}.`
              : `Từ chối lịch của ${pendingAction.booking.customer?.name || "khách"}. Khách sẽ thấy trạng thái Từ chối.`
            : ""
        }
        confirmLabel={pendingAction?.type === "reject" ? "Từ chối" : "Xác nhận"}
        tone={pendingAction?.type === "reject" ? "danger" : "default"}
        loading={busy}
        onConfirm={() => void runPendingAction()}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingComplete)}
        title="Hoàn thành lịch hẹn?"
        description={
          pendingComplete
            ? `Đánh dấu lịch "${pendingComplete.service?.name || "dịch vụ"}" của ${pendingComplete.customer?.name || "khách"} đã hoàn tất sau khi làm xong dịch vụ.`
            : ""
        }
        confirmLabel="Hoàn thành"
        cancelLabel="Hủy"
        loading={busy}
        onConfirm={() => void runComplete()}
        onCancel={() => setPendingComplete(null)}
      />
    </section>
  );
}
