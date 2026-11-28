import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCoupon,
  fetchCouponRecipients,
  retryCouponEmails,
} from "../../services/couponService";
import type { AdminCoupon, CouponRecipient } from "../../types/coupon";
import type { Pagination } from "../../types/service";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function AdminCouponDetail() {
  const { id = "" } = useParams();
  const [coupon, setCoupon] = useState<AdminCoupon | null>(null);
  const [recipients, setRecipients] = useState<CouponRecipient[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void Promise.all([fetchCoupon(id), fetchCouponRecipients(id, { page, limit: 15 })])
      .then(([couponData, recipientData]) => {
        setCoupon(couponData);
        setRecipients(recipientData.data);
        setPagination(recipientData.pagination);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được chi tiết")))
      .finally(() => setLoading(false));
  }, [id, page]);

  async function handleRetryEmails() {
    if (!id) return;
    try {
      const result = await retryCouponEmails(id);
      setMessage(`Đã thử gửi lại ${result.retried} email.`);
      const recipientData = await fetchCouponRecipients(id, { page, limit: 15 });
      setRecipients(recipientData.data);
    } catch (err) {
      setError(getErrorMessage(err, "Không gửi lại được email"));
    }
  }

  if (loading) {
    return <p className="text-spa-muted">Đang tải...</p>;
  }

  if (!coupon) {
    return <p className="text-rose-700">{error || "Không tìm thấy mã giảm giá."}</p>;
  }

  return (
    <section>
      <Link to="/admin/coupons" className="text-sm text-spa-primary hover:underline">
        ← Danh sách mã giảm giá
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-spa-dark">{coupon.name}</h2>
          <p className="mt-1 tracking-wide text-spa-primary">{coupon.code}</p>
          {coupon.description ? (
            <p className="mt-2 max-w-2xl text-sm text-spa-muted">{coupon.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-full border px-4 py-2 text-sm"
          onClick={() => void handleRetryEmails()}
        >
          Gửi lại email lỗi
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <dl className="mt-6 grid gap-4 rounded-2xl bg-spa-white p-6 text-sm shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-spa-muted">Giá trị</dt>
          <dd className="font-medium">
            {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatPrice(coupon.value)}
          </dd>
        </div>
        <div>
          <dt className="text-spa-muted">Hiệu lực</dt>
          <dd>
            {coupon.startDate.slice(0, 10)} → {coupon.endDate.slice(0, 10)}
          </dd>
        </div>
        <div>
          <dt className="text-spa-muted">Khách được cấp</dt>
          <dd>{coupon.assignedCount}</dd>
        </div>
        <div>
          <dt className="text-spa-muted">Đã sử dụng / giới hạn</dt>
          <dd>
            {coupon.usedAssignments} / {coupon.usageLimit} (còn {coupon.availableRedemptions})
          </dd>
        </div>
      </dl>

      <h3 className="mt-8 text-lg font-semibold text-spa-dark">Danh sách khách nhận mã</h3>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b text-left text-spa-muted">
            <tr>
              <th className="px-4 py-3">Khách</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Trạng thái mã</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Booking</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((row) => (
              <tr key={row.id} className="border-b border-black/5">
                <td className="px-4 py-3">{row.customer.name}</td>
                <td className="px-4 py-3 text-spa-muted">{row.customer.email}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.emailStatus === "FAILED"
                        ? "text-rose-700"
                        : row.emailStatus === "SENT"
                          ? "text-emerald-700"
                          : "text-spa-muted"
                    }
                  >
                    {row.emailStatus}
                  </span>
                </td>
                <td className="px-4 py-3">{row.booking ? `${row.booking.status}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((value) => value - 1)}
          >
            Trước
          </button>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((value) => value + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}
    </section>
  );
}