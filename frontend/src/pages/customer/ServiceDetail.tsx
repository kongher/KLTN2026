import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import ServiceImage from "../../components/ServiceImage";
import { fetchService } from "../../services/catalogService";
import { fetchServiceReviews } from "../../services/reviewService";
import type { ServiceReview, ServiceReviewSummary } from "../../types/review";
import type { SpaService } from "../../types/service";
import type { Pagination } from "../../types/service";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span className="text-[#C9A46C]">
      {"★".repeat(rounded)}
      <span className="text-black/15">{"★".repeat(Math.max(0, 5 - rounded))}</span>
    </span>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<SpaService | null>(null);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [summary, setSummary] = useState<ServiceReviewSummary>({ averageRating: 0, totalReviews: 0 });
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [reviewPage, setReviewPage] = useState(1);

  useEffect(() => {
    if (!id) return;
    fetchService(id)
      .then(setService)
      .catch((err) => setError(getErrorMessage(err, "Không tìm thấy dịch vụ")));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchServiceReviews(id, reviewPage, 5)
      .then((result) => {
        setReviews(result.data);
        setPagination(result.pagination);
        if (result.summary) setSummary(result.summary);
      })
      .catch(() => {
        setReviews([]);
      });
  }, [id, reviewPage]);

  if (error) {
    return <p className="text-rose-700">{error}</p>;
  }

  if (!service) {
    return <p className="text-spa-muted">Đang tải chi tiết liệu trình...</p>;
  }

  return (
    <section className="space-y-8">
      <article className="overflow-hidden rounded-2xl bg-spa-white shadow-sm lg:grid lg:grid-cols-2">
        <ServiceImage
          src={service.image}
          alt={service.name}
          className="h-72 w-full object-cover lg:h-full"
        />
        <div className="p-6 lg:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">
            {service.category?.name}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-spa-dark">{service.name}</h2>
          <p className="mt-4 leading-7 text-spa-muted">
            {service.description || "Liệu trình được thiết kế cho trải nghiệm thư giãn cao cấp."}
          </p>

          <div className="mt-6 rounded-2xl bg-spa-bg px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <StarDisplay value={summary.averageRating} />
              <p className="text-lg font-semibold text-spa-dark">{summary.averageRating || "—"}</p>
              <p className="text-sm text-spa-muted">({summary.totalReviews} đánh giá)</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-spa-muted">Giá</p>
              <p className="text-xl text-spa-primary">{formatPrice(service.price)}</p>
            </div>
            <div>
              <p className="text-sm text-spa-muted">Thời gian</p>
              <p className="text-xl text-spa-dark">{formatDuration(service.duration)}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/customer/bookings/new?serviceId=${service.id}`)}
              className="rounded-full bg-spa-primary px-6 py-3 text-white hover:bg-spa-dark"
            >
              Đặt lịch
            </button>
            <Link to="/customer/services" className="rounded-full border px-6 py-3 text-spa-dark">
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </article>

      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-spa-dark">Nhận xét từ khách hàng</h3>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-spa-muted">Chưa có đánh giá hiển thị cho dịch vụ này.</p>
        ) : null}
        {reviews.length > 0 ? (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-black/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={review.customerName} src={review.customerAvatar} className="h-10 w-10" />
                    <div>
                      <p className="font-medium text-spa-dark">{review.customerName}</p>
                      <p className="text-xs text-spa-muted">
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <StarDisplay value={review.rating} />
                </div>
                {review.comment ? (
                  <p className="mt-3 text-sm leading-7 text-spa-muted">“{review.comment}”</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-4 flex justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={reviewPage <= 1}
              onClick={() => setReviewPage((value) => value - 1)}
            >
              Trước
            </button>
            <span>
              {pagination.page}/{pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={reviewPage >= pagination.totalPages}
              onClick={() => setReviewPage((value) => value + 1)}
            >
              Sau
            </button>
          </div>
        ) : null}
      </section>
    </section>
  );
}