import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchInbox, fetchUnreadInboxCount, markInboxRead } from "../services/inboxService";
import type { InboxNotification } from "../types/inbox";
import { getErrorMessage } from "../utils/getErrorMessage";

type NotificationBellProps = {
  inboxBasePath: string;
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell({ inboxBasePath }: NotificationBellProps) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const count = await fetchUnreadInboxCount();
      setUnreadCount(count);
    } catch {
      /* ignore when logged out */
    }
  }, []);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchInbox({ page: 1, limit: 8 });
      setItems(result.data);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (err) {
      console.error(getErrorMessage(err, "Không tải thông báo"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCount();
    const interval = window.setInterval(() => void refreshCount(), 45_000);
    const onFocus = () => void refreshCount();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    void loadPreview();
  }, [open, loadPreview]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function handleOpenItem(item: InboxNotification) {
    setOpen(false);
    if (!item.isRead) {
      try {
        await markInboxRead(item.id);
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        /* ignore */
      }
    }
    if (item.actionPath) {
      navigate(item.actionPath);
      return;
    }
    navigate(`${inboxBasePath}/${item.id}`);
  }

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-spa-primary/20 text-spa-dark transition hover:bg-spa-primary/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-black/5 bg-spa-white shadow-lg">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <p className="text-sm font-semibold text-spa-dark">Thông báo</p>
            {unreadCount > 0 ? (
              <span className="text-xs text-rose-600">{unreadCount} chưa đọc</span>
            ) : (
              <span className="text-xs text-spa-muted">Đã đọc hết</span>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading ? (
              <li className="px-4 py-6 text-center text-sm text-spa-muted">Đang tải...</li>
            ) : items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-spa-muted">Chưa có thông báo.</li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void handleOpenItem(item)}
                    className={`flex w-full flex-col gap-1 border-b border-black/5 px-4 py-3 text-left transition hover:bg-spa-bg/80 ${
                      !item.isRead ? "bg-spa-primary/5" : ""
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      {!item.isRead ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                      )}
                      <span className="flex-1 text-sm font-medium text-spa-dark">{item.title}</span>
                    </span>
                    <span className="line-clamp-2 pl-4 text-xs text-spa-muted">{item.message}</span>
                    <span className="pl-4 text-[11px] text-spa-muted">{formatWhen(item.createdAt)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-black/5 px-4 py-2">
            <Link
              to={inboxBasePath}
              onClick={() => setOpen(false)}
              className="block py-2 text-center text-sm text-spa-primary hover:underline"
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}