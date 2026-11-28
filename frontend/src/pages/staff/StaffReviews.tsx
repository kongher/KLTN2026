import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStaffReviews } from "../../services/reviewService";
import type { ServiceReview } from "../../types/review";
import type { Pagination } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function StaffReviews() {
  const [items, setItems] = useState<ServiceReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await fetchStaffReviews({ page, limit: 10 });
      setItems(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được đánh giá"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Đánh giá</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Đánh giá về bạn</h2>
        <p className="mt-2 text-sm text-spa-muted">
          Chỉ hiển thị đánh giá từ các lịch hẹn do bạn phụ trách.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Sao</th>
              <th className="px-4 py-3">Nhận xét</th>
              <th className="px-4 py-3">Mã lịch</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Lịch hẹn</th>
            </tr>
          </thead>
          <tbody>
            {items.map((review) => (
              <tr key={review.id} className="border-t border-black/5">
                <td className="px-4 py-3">{review.customerName}</td>
                <td className="px-4 py-3">{review.serviceName || "—"}</td>
                <td className="px-4 py-3">
                  {review.rating}/5 {"⭐".repeat(review.rating)}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-spa-muted">
                  {review.comment || "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-spa-muted">
                  {review.bookingCode || "—"}
                </td>
                <td className="px-4 py-3 text-spa-muted">
                  {new Date(review.createdAt).toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/staff/bookings/${review.bookingId}`} className="text-spa-primary">
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 ? (
          <p className="px-4 py-10 text-center text-spa-muted">Chưa có đánh giá nào.</p>
        ) : null}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex justify-center gap-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            Trước
          </button>
          <span>
            {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((v) => v + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}
    </section>
  );
}