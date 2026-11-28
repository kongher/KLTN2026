import { useEffect, useState, type FormEvent } from "react";
import {
  fetchNotification,
  fetchNotificationRecipients,
  fetchNotifications,
  retryNotification,
  searchNotificationRecipients,
  sendNotification,
} from "../../services/notificationService";
import type {
  EmailNotification,
  EmailNotificationRecipient,
  EmailTargetType,
  RecipientSearchUser,
} from "../../types/notification";
import type { Pagination } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

const TARGET_LABEL: Record<EmailTargetType, string> = {
  ALL_STAFF: "Tất cả nhân viên",
  ALL_CUSTOMER: "Tất cả khách hàng",
  SPECIFIC: "Người nhận cụ thể",
};

export default function AdminNotifications() {
  const [tab, setTab] = useState<"list" | "create">("list");
  const [items, setItems] = useState<EmailNotification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<EmailTargetType>("ALL_CUSTOMER");
  const [category, setCategory] = useState<"OPERATIONAL" | "PROMOTIONAL">("OPERATIONAL");
  const [selectedUsers, setSelectedUsers] = useState<RecipientSearchUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<RecipientSearchUser[]>([]);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<EmailNotificationRecipient[]>([]);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientPagination, setRecipientPagination] = useState<Pagination | null>(null);
  const [detailNotification, setDetailNotification] = useState<EmailNotification | null>(null);

  async function loadList() {
    setLoading(true);
    try {
      const result = await fetchNotifications(page, 10);
      setItems(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được thông báo"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "list" && !detailId) void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, detailId]);

  useEffect(() => {
    if (!detailId) return;
    void fetchNotification(detailId).then(setDetailNotification);
    void fetchNotificationRecipients(detailId, { page: recipientPage, limit: 15 }).then((result) => {
      setRecipients(result.data);
      setRecipientPagination(result.pagination);
    });
  }, [detailId, recipientPage]);

  useEffect(() => {
    if (targetType !== "SPECIFIC" || userSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchNotificationRecipients(userSearch.trim()).then(setSearchResults).catch(() => {
        setSearchResults([]);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [userSearch, targetType]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    setMessage("");
    try {
      const result = await sendNotification({
        title: title.trim(),
        content: content.trim(),
        targetType,
        category,
        userIds: targetType === "SPECIFIC" ? selectedUsers.map((user) => user.id) : undefined,
      });
      setMessage(
        `Đã gửi: ${result.stats.success} thành công, ${result.stats.failed} thất bại.`
      );
      setTitle("");
      setContent("");
      setSelectedUsers([]);
      setTab("list");
      setPage(1);
      await loadList();
    } catch (err) {
      setError(getErrorMessage(err, "Không gửi được thông báo"));
    } finally {
      setSending(false);
    }
  }

  function addUser(user: RecipientSearchUser) {
    if (selectedUsers.some((item) => item.id === user.id)) return;
    setSelectedUsers((current) => [...current, user]);
  }

  async function handleRetry() {
    if (!detailId) return;
    try {
      await retryNotification(detailId);
      setMessage("Đã thử gửi lại email thất bại");
      setRecipientPage(1);
      setDetailNotification(await fetchNotification(detailId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (detailId && detailNotification) {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-spa-white p-6 shadow-sm">
          <div>
            <button
              type="button"
              className="text-sm text-spa-primary hover:underline"
              onClick={() => {
                setDetailId(null);
                setDetailNotification(null);
              }}
            >
              ← Quay lại danh sách
            </button>
            <h2 className="mt-2 text-2xl font-semibold text-spa-dark">{detailNotification.title}</h2>
            <p className="mt-1 text-sm text-spa-muted">
              {TARGET_LABEL[detailNotification.targetType]} · Gửi lúc{" "}
              {new Date(detailNotification.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-spa-primary">Thành công: {detailNotification.sentSuccess}</p>
            <p className="text-rose-700">Thất bại: {detailNotification.sentFailed}</p>
            {detailNotification.sentFailed > 0 ? (
              <button
                type="button"
                className="mt-2 rounded-full bg-[#C9A46C] px-4 py-2 text-white"
                onClick={() => void handleRetry()}
              >
                Gửi lại thất bại
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
          <h3 className="font-semibold text-spa-dark">Nội dung</h3>
          <p className="mt-3 whitespace-pre-wrap text-spa-muted">{detailNotification.content}</p>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b text-spa-muted">
              <tr>
                <th className="px-4 py-3 text-left">Người nhận</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Gửi lúc</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">{row.userName}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    {row.sentAt ? new Date(row.sentAt).toLocaleString("vi-VN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recipientPagination && recipientPagination.totalPages > 1 ? (
          <div className="flex justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={recipientPage <= 1}
              onClick={() => setRecipientPage((v) => v - 1)}
            >
              Trước
            </button>
            <span>
              {recipientPagination.page}/{recipientPagination.totalPages}
            </span>
            <button
              type="button"
              disabled={recipientPage >= recipientPagination.totalPages}
              onClick={() => setRecipientPage((v) => v + 1)}
            >
              Sau
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Email</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Quản lý thông báo Email</h2>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("list")}
            className={`rounded-full px-4 py-2 text-sm ${tab === "list" ? "bg-[#C9A46C] text-white" : "border"}`}
          >
            Lịch sử gửi
          </button>
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`rounded-full px-4 py-2 text-sm ${tab === "create" ? "bg-[#C9A46C] text-white" : "border"}`}
          >
            Tạo & gửi mới
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-spa-primary">{message}</p> : null}

      {tab === "list" ? (
        <>
          {loading ? <p className="text-sm text-spa-muted">Đang tải...</p> : null}
          <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b text-spa-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Tiêu đề</th>
                  <th className="px-4 py-3 text-left">Đối tượng</th>
                  <th className="px-4 py-3 text-left">Thành công</th>
                  <th className="px-4 py-3 text-left">Thất bại</th>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3">{TARGET_LABEL[item.targetType]}</td>
                    <td className="px-4 py-3 text-spa-primary">{item.sentSuccess}</td>
                    <td className="px-4 py-3 text-rose-700">{item.sentFailed}</td>
                    <td className="px-4 py-3">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-spa-primary hover:underline"
                        onClick={() => setDetailId(item.id)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={(event) => void handleSend(event)} className="space-y-4 rounded-2xl bg-spa-white p-6 shadow-sm">
          <label className="block text-sm">
            Tiêu đề
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label className="block text-sm">
            Nội dung
            <textarea
              rows={6}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              maxLength={5000}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              Đối tượng
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as EmailTargetType)}
              >
                <option value="ALL_STAFF">Tất cả nhân viên</option>
                <option value="ALL_CUSTOMER">Tất cả khách hàng</option>
                <option value="SPECIFIC">Người nhận cụ thể</option>
              </select>
            </label>
            <label className="block text-sm">
              Loại thông báo
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as "OPERATIONAL" | "PROMOTIONAL")
                }
              >
                <option value="OPERATIONAL">Nghiệp vụ</option>
                <option value="PROMOTIONAL">Khuyến mãi / tiếp thị</option>
              </select>
            </label>
          </div>

          {targetType === "SPECIFIC" ? (
            <div className="rounded-xl border border-black/5 p-4">
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Tìm tên, email, SĐT..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {searchResults.length > 0 ? (
                <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
                  {searchResults.map((user) => (
                    <li key={user.id} className="flex items-center justify-between border-t py-2">
                      <span>
                        {user.name} · {user.email} ({user.role})
                      </span>
                      <button
                        type="button"
                        className="text-[#C9A46C]"
                        onClick={() => addUser(user)}
                      >
                        Chọn
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {selectedUsers.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="rounded-full bg-spa-bg px-3 py-1 text-xs"
                    >
                      {user.name}
                      <button
                        type="button"
                        className="ml-2 text-rose-700"
                        onClick={() =>
                          setSelectedUsers((current) =>
                            current.filter((item) => item.id !== user.id)
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border px-4 py-2 text-sm"
              onClick={() => setShowPreview((value) => !value)}
            >
              {showPreview ? "Ẩn xem trước" : "Xem trước"}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-full bg-[#C9A46C] px-5 py-2.5 text-sm text-white disabled:opacity-60"
            >
              {sending ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </div>

          {showPreview ? (
            <div className="rounded-2xl border border-[#C9A46C]/30 bg-spa-bg p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#C9A46C]">Lumina Spa</p>
              <h3 className="mt-2 text-lg font-semibold text-spa-dark">{title || "Tiêu đề"}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm text-spa-muted">
                {content || "Nội dung thông báo..."}
              </p>
            </div>
          ) : null}
        </form>
      )}

      {tab === "list" && pagination && pagination.totalPages > 1 ? (
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