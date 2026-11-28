import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminReviews, patchReviewStatus } from "../../services/reviewService";
import type { ServiceReview } from "../../types/review";
import type { Pagination } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function AdminReviews() {
  const [items, setItems] = useState<ServiceReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState<"ALL" | "VISIBLE" | "HIDDEN">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await fetchAdminReviews({
        page,
        limit: 10,
        search: search || undefined,
        rating: rating ? Number(rating) : undefined,
        status,
      });
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
  }, [page, search, rating, status]);

  async function toggleStatus(review: ServiceReview) {
    try {
      await patchReviewStatus(review.id, review.status === "VISIBLE" ? "HIDDEN" : "VISIBLE");
      setMessage(review.status === "VISIBLE" ? "Đã ẩn đánh giá" : "Đã hiển thị lại đánh giá");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Đánh giá</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Quản lý đánh giá dịch vụ</h2>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl bg-spa-white p-4 shadow-sm">
        <input
          className="min-w-[200px] flex-1 rounded-xl border px-3 py-2"
          placeholder="Tìm tên khách hàng..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setSearch(searchInput), setPage(1))}
        />
        <button
          type="button"
          className="rounded-full border px-4 py-2 text-sm"
          onClick={() => {
            setSearch(searchInput);
            setPage(1);
          }}
        >
          Tìm
        </button>
        <select
          className="rounded-xl border px-3 py-2"
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} sao
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border px-3 py-2"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="VISIBLE">Đang hiển thị</option>
          <option value="HIDDEN">Đã ẩn</option>
        </select>
      </div>

      {message ? <p className="text-sm text-spa-primary">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-spa-muted">
            <tr>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Mã lịch</th>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Sao</th>
              <th className="px-4 py-3">Nhận xét</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((review) => (
              <tr key={review.id} className="border-t">
                <td className="px-4 py-3">{review.customerName}</td>
                <td className="px-4 py-3 font-mono text-xs text-spa-muted">
                  {review.bookingCode || "—"}
                </td>
                <td className="px-4 py-3">{review.serviceName}</td>
                <td className="px-4 py-3 text-[#C9A46C]">{"★".repeat(review.rating)}</td>
                <td className="max-w-xs px-4 py-3 text-spa-muted">{review.comment || "—"}</td>
                <td className="px-4 py-3">{review.status === "VISIBLE" ? "Hiển thị" : "Ẩn"}</td>
                <td className="px-4 py-3">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <Link to={`/admin/reviews/${review.id}`} className="text-spa-primary hover:underline">
                      Chi tiết
                    </Link>
                    <button
                      type="button"
                      className="text-spa-muted hover:text-spa-dark"
                      onClick={() => void toggleStatus(review)}
                    >
                      {review.status === "VISIBLE" ? "Ẩn" : "Hiển thị"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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