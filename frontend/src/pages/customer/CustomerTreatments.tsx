import { useEffect, useState } from "react";
import { fetchCustomerTreatments } from "../../services/treatmentService";
import type { Treatment } from "../../types/treatment";
import type { Pagination } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function CustomerTreatments() {
  const [items, setItems] = useState<Treatment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCustomerTreatments(page, 10)
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
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Hồ sơ điều trị của tôi</h2>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="mb-3 text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-spa-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-spa-dark">
              {item.service?.name || "Dịch vụ"}
            </h3>
            <p className="mt-1 text-sm text-spa-muted">
              NV: {item.staff?.name || "—"} · Ngày: {item.booking?.bookingDate || "—"}
              {item.booking ? ` ${formatTime(item.booking.startTime)}` : ""}
            </p>
            {item.note ? <p className="mt-3 text-sm text-spa-text">{item.note}</p> : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase text-spa-muted">Before</p>
                {item.beforeImage ? (
                  <img
                    src={item.beforeImage}
                    alt="Before"
                    className="h-44 w-full rounded-xl object-cover"
                  />
                ) : (
                  <p className="text-sm text-spa-muted">Chưa có ảnh</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs uppercase text-spa-muted">After</p>
                {item.afterImage ? (
                  <img
                    src={item.afterImage}
                    alt="After"
                    className="h-44 w-full rounded-xl object-cover"
                  />
                ) : (
                  <p className="text-sm text-spa-muted">Chưa có ảnh</p>
                )}
              </div>
            </div>
          </article>
        ))}
        {!loading && items.length === 0 ? (
          <p className="text-spa-muted">Chưa có hồ sơ điều trị.</p>
        ) : null}
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
