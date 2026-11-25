import { useEffect, useState } from "react";
import { fetchAdminTreatments } from "../../services/treatmentService";
import type { Treatment } from "../../types/treatment";
import type { Pagination } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function AdminTreatments() {
  const [items, setItems] = useState<Treatment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAdminTreatments(page, 12)
      .then((result) => {
        setItems(result.data);
        setPagination(result.pagination);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được hồ sơ điều trị")))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Treatment</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Hồ sơ điều trị (xem)</h2>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="mb-3 text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Nhân viên</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Ghi chú</th>
              <th className="px-4 py-3">Ảnh</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-black/5 align-top">
                <td className="px-4 py-3">{item.customer?.name || "—"}</td>
                <td className="px-4 py-3">{item.service?.name || "—"}</td>
                <td className="px-4 py-3">{item.staff?.name || "—"}</td>
                <td className="px-4 py-3">
                  {item.booking?.bookingDate || "—"}
                  {item.booking ? ` ${formatTime(item.booking.startTime)}` : ""}
                </td>
                <td className="max-w-xs px-4 py-3 text-spa-muted">{item.note || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {item.beforeImage ? (
                      <img
                        src={item.beforeImage}
                        alt="Before"
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : null}
                    {item.afterImage ? (
                      <img
                        src={item.afterImage}
                        alt="After"
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : null}
                    {!item.beforeImage && !item.afterImage ? "—" : null}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-spa-muted">
                  Chưa có hồ sơ điều trị.
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
