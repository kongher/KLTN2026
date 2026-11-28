import { useEffect, useState, type FormEvent } from "react";
import StarRatingInput from "./StarRatingInput";
import { createReview, updateReview } from "../services/reviewService";
import type { Booking } from "../types/booking";
import type { ServiceReview } from "../types/review";
import { getErrorMessage } from "../utils/getErrorMessage";

type ReviewBookingModalProps = {
  booking: Booking;
  existingReview?: ServiceReview | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ReviewBookingModal({
  booking,
  existingReview,
  onClose,
  onSaved,
}: ReviewBookingModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(existingReview?.rating || 5);
    setComment(existingReview?.comment || "");
  }, [existingReview]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Vui lòng chọn số sao từ 1 đến 5");
      return;
    }
    setSubmitting(true);
    try {
      if (existingReview) {
        await updateReview(existingReview.id, {
          rating,
          comment: comment.trim() || undefined,
        });
      } else {
        await createReview({
          bookingId: booking.id,
          rating,
          comment: comment.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Không gửi được đánh giá"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-spa-dark">
          {existingReview ? "Chỉnh sửa đánh giá" : "Đánh giá dịch vụ"}
        </h2>
        <p className="mt-1 text-sm text-spa-muted">
          {booking.service?.name || "Dịch vụ"} · {booking.bookingDate}
          {booking.bookingCode ? ` · ${booking.bookingCode}` : ""}
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4">
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <div>
            <p className="mb-2 text-sm text-spa-muted">Số sao</p>
            <StarRatingInput value={rating} onChange={setRating} disabled={submitting} />
          </div>

          <label className="block text-sm">
            Nhận xét
            <textarea
              rows={4}
              maxLength={1000}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)"
              disabled={submitting}
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full border px-4 py-2 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#C9A46C] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting
                ? "Đang gửi..."
                : existingReview
                  ? "Lưu thay đổi"
                  : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}