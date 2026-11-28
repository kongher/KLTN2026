import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import HeroBannerCarousel from "../../components/HeroBannerCarousel";
import TypewriterText from "../../components/TypewriterText";
import ServiceImage from "../../components/ServiceImage";
import { useAuth } from "../../contexts/AuthContext";
import { useHomeContent } from "../../contexts/HomeContentContext";
import { fetchServices } from "../../services/catalogService";
import type { SpaService } from "../../types/service";
import { formatDuration, formatPrice } from "../../utils/format";

type HomePageProps = {
  variant?: "customer" | "public";
};

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
  const { settings, reviews: apiReviews } = useHomeContent();
  const [services, setServices] = useState<SpaService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const isCustomer = variant === "customer" || user?.role === "CUSTOMER";

  useEffect(() => {
    fetchServices({ status: "ACTIVE", limit: 6, sortBy: "createdAt", order: "desc" })
      .then((result) => setServices(result.data))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, []);

  const bannerSlides = useMemo(
    () =>
      (settings.bannerSlides || [])
        .filter((item) => item.image?.trim())
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [settings.bannerSlides]
  );

  const galleryItems = useMemo(
    () => settings.gallery.filter((item) => item.src?.trim()),
    [settings.gallery]
  );

  const aboutPoints = useMemo(
    () => settings.aboutPoints.filter((item) => item.title?.trim() || item.text?.trim()),
    [settings.aboutPoints]
  );

  const aboutStats = useMemo(
    () => settings.aboutStats.filter((item) => item.value?.trim() || item.label?.trim()),
    [settings.aboutStats]
  );

  const reviews = useMemo(
    () => apiReviews.filter((item) => item.comment?.trim()).slice(0, 3),
    [apiReviews]
  );

  const bookingTo = isCustomer ? "/customer/bookings/new" : "/login";
  const servicesTo = isCustomer ? "/customer/services" : "#services";
  const serviceDetailTo = (id: string) =>
    isCustomer ? `/customer/services/${id}` : "/login";
  const quickBookTo = (id: string) =>
    isCustomer ? `/customer/bookings/new?serviceId=${id}` : "/login";

  const heroEyebrow = useMemo(
    () => `${settings.name}${user?.name ? ` · Xin chào, ${user.name}` : ""}`,
    [settings.name, user?.name]
  );

  return (
    <div>
      <section className="relative isolate min-h-[78vh] overflow-hidden">
        {bannerSlides.length > 0 ? (
          <HeroBannerCarousel slides={bannerSlides} />
        ) : settings.heroVideo ? (
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
        {bannerSlides.length === 0 && settings.heroImage ? (
          <img
            src={settings.heroImage}
            alt={`Không gian liệu trình tại ${settings.name}`}
            className={`absolute inset-0 h-full w-full object-cover ${settings.heroVideo ? "-z-10" : ""}`}
          />
        ) : null}
        {bannerSlides.length === 0 && !settings.heroImage && !settings.heroVideo ? (
          <div
            className={`absolute inset-0 bg-gradient-to-br from-spa-dark via-spa-primary/80 to-spa-dark ${
              settings.heroVideo ? "-z-10" : ""
            }`}
            aria-hidden
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-spa-dark/85 via-spa-dark/55 to-spa-dark/20" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-20 text-white">
          <TypewriterText
            text={heroEyebrow}
            charDelayMs={55}
            pauseMs={2000}
            className="text-xs uppercase tracking-[0.35em] text-spa-accent"
          />
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            {settings.tagline || "Chào mừng đến với không gian chăm sóc của bạn"}
          </h2>
          {settings.description ? (
            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              {settings.description}
            </p>
          ) : null}
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

      {settings.aboutTitle || settings.aboutDescription || aboutPoints.length > 0 || aboutStats.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            eyebrow="Về chúng tôi"
            title={settings.aboutTitle || "Về chúng tôi"}
            description={settings.aboutDescription}
          />
          {aboutPoints.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {aboutPoints.map((point, index) => (
                <article key={`${point.title}-${index}`} className="rounded-2xl bg-spa-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-spa-dark">{point.title}</h3>
                  <p className="mt-3 leading-7 text-spa-muted">{point.text}</p>
                </article>
              ))}
            </div>
          ) : null}
          {aboutStats.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-spa-dark px-4 py-8 text-center text-white sm:grid-cols-4">
              {aboutStats.map((stat, index) => (
                <div key={`${stat.label}-${index}`}>
                  <p className="text-3xl font-semibold text-spa-accent">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/75">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

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

      {galleryItems.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            eyebrow="Trải nghiệm"
            title="Không gian, ánh sáng và hương thơm trước khi bạn đến"
            description="Hình ảnh thực tế về phòng ốc giúp bạn hình dung mức độ thư giãn của buổi liệu trình."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {galleryItems.map((item, index) => (
              <figure
                key={`${item.src}-${index}`}
                className={`relative overflow-hidden rounded-2xl ${
                  index === 0 || index === galleryItems.length - 1
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
      ) : null}

      {reviews.length > 0 ? (
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
                      <p className="text-xs text-spa-muted">
                        {review.serviceName || `Khách hàng ${settings.name}`}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

    </div>
  );
}
