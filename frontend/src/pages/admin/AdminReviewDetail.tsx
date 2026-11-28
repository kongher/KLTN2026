import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchReview, patchReviewStatus } from "../../services/reviewService";
import type { ServiceReview } from "../../types/review";
import { getErrorMessage } from "../../utils/getErrorMessage";
import type { BookingStatus } from "../../types/booking";
import { BOOKING_STATUS_LABEL } from "../../utils/statusLabels";

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  return value.slice(0, 5);
}

export default function AdminReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState<ServiceReview | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void fetchReview(id)
      .then((data) => {
        setReview(data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được đánh giá")))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleStatus() {
    if (!review) return;
    try {
      const next = review.status === "VISIBLE" ? "HIDDEN" : "VISIBLE";
      const updated = await patchReviewStatus(review.id, next);
      setReview(updated);
      setMessage(next === "HIDDEN" ? "Đã ẩn đánh giá" : "Đã hiển thị lại đánh giá");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <p className="text-spa-muted">Đang tải chi tiết đánh giá...</p>;
  }

  if (error && !review) {
    return (
      <div>
        <p className="text-rose-700">{error}</p>
        <Link to="/admin/reviews" className="mt-4 inline-block text-spa-primary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!review) {
    return <p className="text-spa-muted">Không tìm thấy đánh giá.</p>;
  }

  const staffDisplay = review.staffName?.trim() || "Chưa phân công nhân viên";

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Đánh giá</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Chi tiết đánh giá dịch vụ</h2>
        </div>
        <Link to="/admin/reviews" className="rounded-full border px-5 py-2.5 text-sm">
          Quay lại
        </Link>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-spa-primary">{message}</p> : null}

      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
          <p className="text-lg font-semibold text-[#C9A46C]">
            {review.rating}/5 {"⭐".repeat(review.rating)}
          </p>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-spa-muted">
            {review.status === "VISIBLE" ? "Đang hiển thị" : "Đã ẩn"}
          </span>
        </div>

        <p className="mt-4 text-sm leading-7 text-spa-dark">
          {review.comment?.trim() || "Khách không để lại nhận xét."}
        </p>
        <p className="mt-3 text-xs text-spa-muted">
          Thời gian đánh giá: {new Date(review.createdAt).toLocaleString("vi-VN")}
        </p>

        <dl className="mt-6 grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Mã Booking</dt>
            <dd className="mt-1 font-mono text-sm text-spa-dark">{review.bookingCode || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Ngày hẹn</dt>
            <dd className="mt-1 text-spa-dark">
              {review.bookingDate || "—"}
              {review.bookingStartTime
                ? ` · ${formatTime(review.bookingStartTime)} – ${formatTime(review.bookingEndTime)}`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Trạng thái lịch</dt>
            <dd className="mt-1 text-spa-dark">
              {review.bookingStatus
                ? BOOKING_STATUS_LABEL[review.bookingStatus as BookingStatus]
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Dịch vụ</dt>
            <dd className="mt-1 text-spa-dark">{review.serviceName || "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Avatar
              name={review.customerName}
              src={review.customerAvatar}
              className="h-11 w-11"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-spa-muted">Khách hàng</p>
              <p className="font-medium text-spa-dark">{review.customerName}</p>
              <p className="text-sm text-spa-muted">
                {[review.customerPhone, review.customerEmail].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={staffDisplay} className="h-11 w-11" />
            <div>
              <p className="text-xs uppercase tracking-wide text-spa-muted">Nhân viên thực hiện</p>
              <p className="font-medium text-spa-dark">{staffDisplay}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-black/5 pt-6">
          {review.bookingId ? (
            <Link
              to={`/admin/bookings/${review.bookingId}`}
              className="rounded-full border border-spa-primary/30 px-5 py-2.5 text-sm text-spa-primary"
            >
              Xem lịch hẹn
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void toggleStatus()}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-sm text-white hover:bg-spa-dark"
          >
            {review.status === "VISIBLE" ? "Ẩn đánh giá" : "Hiển thị lại"}
          </button>
        </div>
      </div>
    </section>
  );
}