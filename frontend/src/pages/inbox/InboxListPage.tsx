import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInbox, markAllInboxRead, markInboxRead } from "../../services/inboxService";
import type { InboxNotification } from "../../types/inbox";
import type { Pagination } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

type InboxListPageProps = {
  basePath: string;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

export default function InboxListPage({ basePath }: InboxListPageProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await fetchInbox({ page, limit: 15 });
      setItems(result.data);
      setPagination(result.pagination);
      setUnreadCount(result.unreadCount ?? 0);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được thông báo"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function openItem(item: InboxNotification) {
    if (!item.isRead) {
      try {
        await markInboxRead(item.id);
        setUnreadCount((count) => Math.max(0, count - 1));
        setItems((rows) =>
          rows.map((row) => (row.id === item.id ? { ...row, isRead: true } : row))
        );
      } catch {
        /* ignore */
      }
    }
    navigate(item.actionPath || `${basePath}/${item.id}`);
  }

  async function handleMarkAll() {
    try {
      await markAllInboxRead();
      void load();
    } catch (err) {
      setError(getErrorMessage(err, "Không cập nhật được"));
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Hộp thông báo</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Thông báo của bạn</h2>
          <p className="mt-2 text-sm text-spa-muted">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            className="rounded-full border px-4 py-2 text-sm hover:bg-spa-bg"
          >
            Đánh dấu tất cả đã đọc
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <ul className="mt-6 space-y-2">
        {loading ? (
          <li className="rounded-2xl bg-spa-white p-8 text-center text-sm text-spa-muted">Đang tải...</li>
        ) : items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-spa-muted">
            Chưa có thông báo nào.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void openItem(item)}
                className={`block w-full rounded-2xl border border-black/5 bg-spa-white px-5 py-4 text-left shadow-sm transition hover:border-spa-primary/30 ${
                  !item.isRead ? "border-spa-primary/25 bg-spa-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!item.isRead ? (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-spa-dark">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-spa-muted">{item.message}</p>
                    <p className="mt-2 text-xs text-spa-muted">{formatWhen(item.createdAt)}</p>
                  </div>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((v) => v - 1)}
          >
            Trước
          </button>
          <span className="px-2 py-2 text-sm text-spa-muted">
            {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((v) => v + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}
    </section>
  );
}