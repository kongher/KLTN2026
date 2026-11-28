import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookingStatusSelect from "../../components/BookingStatusSelect";
import { fetchAdminBookings } from "../../services/bookingService";
import type { Booking, BookingStatus } from "../../types/booking";
import type { Pagination } from "../../types/service";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function AdminBookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<"ALL" | BookingStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const result = await fetchAdminBookings({
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

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Booking</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Theo dõi Lịch hẹn</h2>
        <p className="mt-2 max-w-2xl text-sm text-spa-muted">
          Admin chỉ xem và theo dõi. Nhân viên phụ trách sẽ trực tiếp xác nhận hoặc từ chối lịch mới.
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
          <option value="PENDING">Chờ nhân viên xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="REJECTED">Từ chối</option>
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
            placeholder="Tìm mã lịch, khách, SĐT, dịch vụ..."
            className="min-w-[240px] rounded-xl border border-black/10 bg-spa-white px-3 py-2"
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
      {loading ? <p className="mb-3 text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Mã lịch</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">SĐT</th>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Nhân viên</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Giờ</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-mono text-xs text-spa-dark">{booking.bookingCode}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-spa-dark">{booking.customer?.name || "—"}</div>
                  <div className="text-xs text-spa-muted">{booking.customer?.email || ""}</div>
                </td>
                <td className="px-4 py-3">{booking.customer?.phone || "—"}</td>
                <td className="px-4 py-3">{booking.service?.name || "—"}</td>
                <td className="px-4 py-3">{booking.staff?.name || "—"}</td>
                <td className="px-4 py-3">{booking.bookingDate}</td>
                <td className="px-4 py-3">
                  {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                </td>
                <td className="px-4 py-3">{formatPrice(booking.totalPrice)}</td>
                <td className="px-4 py-3">
                  <BookingStatusSelect status={booking.status} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/admin/bookings/${booking.id}`}
                    className="text-spa-primary hover:underline"
                  >
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && bookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-spa-muted">
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
    </section>
  );
}
