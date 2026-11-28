import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchInboxItem, markInboxRead } from "../../services/inboxService";
import type { InboxNotification } from "../../types/inbox";
import { getErrorMessage } from "../../utils/getErrorMessage";

type InboxDetailPageProps = {
  listPath: string;
};

export default function InboxDetailPage({ listPath }: InboxDetailPageProps) {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [item, setItem] = useState<InboxNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void fetchInboxItem(id)
      .then(async (data) => {
        setItem(data);
        if (!data.isRead) {
          const updated = await markInboxRead(id);
          setItem(updated);
        }
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được thông báo")))
      .finally(() => setLoading(false));
  }, [id]);

  function closeDetail() {
    navigate(listPath);
  }

  return (
    <section className="max-w-2xl">
      {loading ? (
        <p className="text-spa-muted">Đang tải...</p>
      ) : error ? (
        <div className="relative rounded-2xl border border-black/5 bg-spa-white p-6 shadow-sm">
          <button
            type="button"
            onClick={closeDetail}
            aria-label="Đóng"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-spa-muted transition hover:bg-black/5 hover:text-spa-dark"
          >
            <span className="text-xl leading-none">×</span>
          </button>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
        </div>
      ) : item ? (
        <article className="relative rounded-2xl border border-black/5 bg-spa-white p-6 pr-14 shadow-sm">
          <button
            type="button"
            onClick={closeDetail}
            aria-label="Đóng"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-spa-muted transition hover:bg-black/5 hover:text-spa-dark"
          >
            <span className="text-xl leading-none">×</span>
          </button>
          <p className="text-xs text-spa-muted">
            {new Date(item.createdAt).toLocaleString("vi-VN")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-spa-dark">{item.title}</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-spa-text">{item.message}</div>
          {item.actionPath && item.actionLabel ? (
            <button
              type="button"
              onClick={() => navigate(item.actionPath!)}
              className="mt-6 rounded-full bg-spa-primary px-6 py-2.5 text-sm text-white hover:bg-spa-dark"
            >
              {item.actionLabel}
            </button>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}