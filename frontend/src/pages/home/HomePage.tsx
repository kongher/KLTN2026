import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import ServiceImage from "../../components/ServiceImage";
import { useAuth } from "../../contexts/AuthContext";
import { useHomeContent } from "../../contexts/HomeContentContext";
import { formatVoucherValue } from "../../data/customerHome";
import { fetchServices } from "../../services/catalogService";
import type { HomeReview } from "../../types/home";
import type { SpaService } from "../../types/service";
import { formatDuration, formatPrice } from "../../utils/format";

type HomePageProps = {
  variant?: "customer" | "public";
};

function mergeReviews(apiReviews: HomeReview[], fallback: HomeReview[]) {
  const fromApi = apiReviews.filter((item) => item.comment?.trim());
  const extras = fallback.filter(
    (item) => !fromApi.some((review) => review.customerName === item.customerName)
  );
  return [...fromApi, ...extras].slice(0, 3);
}

function StarRating({ value }: { value: number }) {
  const stars = Math.min(5, Math.max(1, Math.round(value)));
  return (
    <p className="text-sm tracking-wide text-spa-accent" aria-label={`${stars} trên 5 sao`}>
      {"★".repeat(stars)}
      <span className="text-black/15">{"★".repeat(Math.max(0, 5 - stars))}</span>
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold text-spa-dark">{title}</h2>
      {description ? <p className="mt-3 leading-7 text-spa-muted">{description}</p> : null}
    </div>
  );
}

export default function HomePage({ variant = "public" }: HomePageProps) {
  const { user } = useAuth();
  const { settings, reviews: apiReviews, vouchers } = useHomeContent();
  const [services, setServices] = useState<SpaService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const isCustomer = variant === "customer" || user?.role === "CUSTOMER";

  useEffect(() => {
    fetchServices({ status: "ACTIVE", limit: 6, sortBy: "createdAt", order: "desc" })
      .then((result) => setServices(result.data))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, []);

  const reviews = useMemo(
    () =>
      mergeReviews(
        apiReviews,
        settings.testimonials.map((item) => ({
          ...item,
          createdAt: new Date().toISOString(),
        }))
      ),
    [apiReviews, settings.testimonials]
  );

  const promotions = useMemo(() => {
    const fromVouchers = vouchers.slice(0, 3).map((voucher) => ({
      id: voucher.id,
      badge: "Ưu đãi",
      title: formatVoucherValue(voucher.type, voucher.value),
      description: `Áp dụng khi đặt lịch với mã ${voucher.code}. Số lượt còn lại: ${Math.max(
        0,
        voucher.usageLimit - voucher.usedCount
      )}.`,
      code: voucher.code,
      highlight: voucher.code,
    }));

    if (fromVouchers.length >= 3) return fromVouchers;
    const extras = settings.promotions.filter(
      (item) => !fromVouchers.some((promo) => promo.code && promo.code === item.code)
    );
    return [...fromVouchers, ...extras].slice(0, 3);
  }, [vouchers, settings.promotions]);

  const bookingTo = isCustomer ? "/customer/bookings/new" : "/login";
  const servicesTo = isCustomer ? "/customer/services" : "#services";
  const serviceDetailTo = (id: string) =>
    isCustomer ? `/customer/services/${id}` : "/login";
  const quickBookTo = (id: string) =>
    isCustomer ? `/customer/bookings/new?serviceId=${id}` : "/login";

  return (
    <div>
      <section className="relative isolate min-h-[78vh] overflow-hidden">
        {settings.heroVideo ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={settings.heroImage}
          >
            <source src={settings.heroVideo} type="video/mp4" />
          </video>
        ) : null}
        <img
          src={settings.heroImage}
          alt={`Không gian liệu trình tại ${settings.name}`}
          className={`absolute inset-0 h-full w-full object-cover ${settings.heroVideo ? "-z-10" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-spa-dark/85 via-spa-dark/55 to-spa-dark/20" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-20 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-spa-accent">
            {settings.name}
            {user?.name ? ` · Xin chào, ${user.name}` : ""}
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            {settings.tagline}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            {settings.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={bookingTo}
              className="rounded-full bg-spa-accent px-6 py-3 text-sm font-semibold text-spa-dark hover:bg-white"
            >
              Đặt lịch ngay
            </Link>
            <Link
              to={servicesTo}
              className="rounded-full border border-white/40 px-6 py-3 text-sm text-white hover:bg-white/10"
            >
              Xem bảng dịch vụ
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow="Về chúng tôi"
          title={settings.aboutTitle}
          description={settings.aboutDescription}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {settings.aboutPoints.map((point) => (
            <article key={point.title} className="rounded-2xl bg-spa-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-spa-dark">{point.title}</h3>
              <p className="mt-3 leading-7 text-spa-muted">{point.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-spa-dark px-4 py-8 text-center text-white sm:grid-cols-4">
          {settings.aboutStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold text-spa-accent">{stat.value}</p>
              <p className="mt-1 text-sm text-white/75">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="bg-spa-white/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="Dịch vụ mũi nhọn"
            title="Liệu trình được khách chọn nhiều nhất"
            description="Giá hiển thị theo từng dịch vụ. Bạn có thể xem chi tiết hoặc đặt lịch nhanh ngay từ trang chủ."
          />
          {loadingServices ? (
            <p className="mt-10 text-center text-spa-muted">Đang tải dịch vụ...</p>
          ) : null}
          {!loadingServices && services.length === 0 ? (
            <div className="mt-10 rounded-2xl bg-spa-white p-8 text-center shadow-sm">
              <p className="text-spa-muted">Hiện chưa có dịch vụ để hiển thị.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="overflow-hidden rounded-2xl bg-spa-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <ServiceImage
                    src={service.image}
                    alt={service.name}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wide text-spa-accent">
                      {service.category?.name}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-spa-dark">{service.name}</h3>
                    <p className="mt-3 text-spa-primary">Từ {formatPrice(service.price)}</p>
                    <p className="text-sm text-spa-muted">{formatDuration(service.duration)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={serviceDetailTo(service.id)}
                        className="rounded-full bg-spa-primary px-4 py-2 text-sm text-white hover:bg-spa-dark"
                      >
                        Xem chi tiết
                      </Link>
                      <Link
                        to={quickBookTo(service.id)}
                        className="rounded-full border border-spa-primary/25 px-4 py-2 text-sm text-spa-dark hover:bg-spa-primary/10"
                      >
                        Đặt lịch nhanh
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {isCustomer ? (
            <div className="mt-8 text-center">
              <Link to="/customer/services" className="text-sm font-medium text-spa-primary hover:underline">
                Xem tất cả dịch vụ
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow="Trải nghiệm"
          title="Không gian, ánh sáng và hương thơm trước khi bạn đến"
          description="Hình ảnh thực tế về phòng ốc giúp bạn hình dung mức độ thư giãn của buổi liệu trình."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {settings.gallery.map((item, index) => (
            <figure
              key={`${item.src}-${index}`}
              className={`relative overflow-hidden rounded-2xl ${
                index === 0 || index === settings.gallery.length - 1
                  ? "h-72 sm:col-span-2 sm:h-80"
                  : "h-64"
              }`}
            >
              <img src={item.src} alt={item.alt || item.caption} className="h-full w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-spa-dark/80 to-transparent p-4 text-white">
                <p className="font-medium">{item.caption}</p>
                {item.note ? <p className="mt-1 text-xs text-white/80">{item.note}</p> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-spa-white/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="Khách hàng nói gì"
            title="Đánh giá thực tế sau liệu trình"
            description="Những lời nhận xét từ khách đã sử dụng dịch vụ, giúp bạn yên tâm hơn trước khi đặt lịch."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl bg-spa-white p-6 shadow-sm">
                <StarRating value={review.rating} />
                <p className="mt-4 leading-7 text-spa-dark">“{review.comment}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar
                    name={review.customerName}
                    src={review.customerAvatar}
                    className="h-11 w-11"
                  />
                  <div>
                    <p className="font-medium text-spa-dark">{review.customerName}</p>
                    <p className="text-xs text-spa-muted">{review.serviceName || `Khách hàng ${settings.name}`}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow="Ưu đãi & cập nhật"
          title="Combo, mã giảm giá và quà tặng khách mới"
          description="Chọn ưu đãi phù hợp rồi đặt lịch ngay để giữ suất với chuyên viên."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {promotions.map((promo) => (
            <article key={promo.id} className="flex flex-col rounded-2xl bg-spa-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">{promo.badge}</p>
              <h3 className="mt-2 text-xl font-semibold text-spa-dark">{promo.title}</h3>
              <p className="mt-3 flex-1 leading-7 text-spa-muted">{promo.description}</p>
              {promo.code ? (
                <p className="mt-4 rounded-xl bg-spa-bg px-3 py-2 text-sm text-spa-dark">
                  Mã: <span className="font-semibold tracking-wide">{promo.code}</span>
                </p>
              ) : (
                <p className="mt-4 text-sm text-spa-primary">{promo.highlight}</p>
              )}
              <Link
                to={bookingTo}
                className="mt-5 inline-flex justify-center rounded-full bg-spa-primary px-4 py-2.5 text-sm text-white hover:bg-spa-dark"
              >
                Đặt lịch nhận ưu đãi
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
