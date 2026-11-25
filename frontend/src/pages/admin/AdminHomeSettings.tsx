import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import { useHomeContent } from "../../contexts/HomeContentContext";
import { DEFAULT_HOME_SETTINGS, mergeHomeSettings } from "../../data/customerHome";
import { updateHomeSettings } from "../../services/homeService";
import type { GalleryItem, HomePromotion, HomeSettings, HomeTestimonial } from "../../types/home";
import { getErrorMessage } from "../../utils/getErrorMessage";

const inputClass = "mt-1 w-full rounded-xl border border-black/10 bg-spa-white px-3 py-2";

function cloneSettings(value: HomeSettings): HomeSettings {
  return JSON.parse(JSON.stringify(mergeHomeSettings(value))) as HomeSettings;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-spa-muted">{label}</span>
      {children}
    </label>
  );
}

export default function AdminHomeSettings() {
  const { settings, refresh } = useHomeContent();
  const [form, setForm] = useState<HomeSettings>(() => cloneSettings(settings));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(cloneSettings(settings));
  }, [settings]);

  function patch<K extends keyof HomeSettings>(key: K, value: HomeSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateHomeSettings(form);
      await refresh();
      setMessage("Đã lưu cài đặt trang chủ.");
    } catch (err) {
      setError(getErrorMessage(err, "Không lưu được cài đặt"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-spa-white p-6 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Cài đặt</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Nội dung trang chủ</h2>
          <p className="mt-2 max-w-2xl text-sm text-spa-muted">
            Thay đổi thông tin, ảnh hero, gallery, đánh giá và ưu đãi. Bấm Xem trang chủ để kiểm tra
            giao diện khách mà không cần đăng nhập tài khoản khác.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/home"
            className="rounded-full border border-spa-primary/30 px-5 py-2.5 text-spa-dark hover:bg-spa-primary/10"
          >
            Xem trang chủ
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {message ? <p className="text-sm text-spa-primary">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-spa-dark">Thông tin spa & liên hệ</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Tên spa">
            <input className={inputClass} value={form.name} onChange={(e) => patch("name", e.target.value)} required />
          </Field>
          <Field label="Hotline">
            <input className={inputClass} value={form.phone} onChange={(e) => patch("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={form.email} onChange={(e) => patch("email", e.target.value)} />
          </Field>
          <Field label="Địa chỉ">
            <input className={inputClass} value={form.address} onChange={(e) => patch("address", e.target.value)} />
          </Field>
          <Field label="Giờ mở cửa (T2-T7)">
            <input
              className={inputClass}
              value={form.hoursWeekday}
              onChange={(e) => patch("hoursWeekday", e.target.value)}
            />
          </Field>
          <Field label="Giờ cuối tuần">
            <input
              className={inputClass}
              value={form.hoursWeekend}
              onChange={(e) => patch("hoursWeekend", e.target.value)}
            />
          </Field>
          <Field label="Facebook">
            <input className={inputClass} value={form.facebook} onChange={(e) => patch("facebook", e.target.value)} />
          </Field>
          <Field label="Instagram">
            <input
              className={inputClass}
              value={form.instagram}
              onChange={(e) => patch("instagram", e.target.value)}
            />
          </Field>
          <Field label="Zalo OA">
            <input className={inputClass} value={form.zalo} onChange={(e) => patch("zalo", e.target.value)} />
          </Field>
          <Field label="Link Google Maps (embed)">
            <input className={inputClass} value={form.mapSrc} onChange={(e) => patch("mapSrc", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-spa-dark">Hero / Phần mở đầu</h3>
        <div className="mt-4 grid gap-4">
          <Field label="Khẩu hiệu">
            <input className={inputClass} value={form.tagline} onChange={(e) => patch("tagline", e.target.value)} />
          </Field>
          <Field label="Mô tả ngắn">
            <textarea
              rows={3}
              className={inputClass}
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
            />
          </Field>
          <ImageUpload
            label="Ảnh hero"
            value={form.heroImage}
            folder="spa-home"
            onChange={(url) => patch("heroImage", url)}
          />
          <Field label="Video hero (URL, để trống nếu chỉ dùng ảnh)">
            <input
              className={inputClass}
              value={form.heroVideo}
              onChange={(e) => patch("heroVideo", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-spa-dark">Giới thiệu & con số uy tín</h3>
        <div className="mt-4 grid gap-4">
          <Field label="Tiêu đề">
            <input
              className={inputClass}
              value={form.aboutTitle}
              onChange={(e) => patch("aboutTitle", e.target.value)}
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              rows={3}
              className={inputClass}
              value={form.aboutDescription}
              onChange={(e) => patch("aboutDescription", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-6 space-y-4">
          {form.aboutPoints.map((point, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-black/5 p-4 md:grid-cols-2">
              <Field label={`Thế mạnh ${index + 1} - tiêu đề`}>
                <input
                  className={inputClass}
                  value={point.title}
                  onChange={(e) => {
                    const next = [...form.aboutPoints];
                    next[index] = { ...point, title: e.target.value };
                    patch("aboutPoints", next);
                  }}
                />
              </Field>
              <Field label="Nội dung">
                <input
                  className={inputClass}
                  value={point.text}
                  onChange={(e) => {
                    const next = [...form.aboutPoints];
                    next[index] = { ...point, text: e.target.value };
                    patch("aboutPoints", next);
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {form.aboutStats.map((stat, index) => (
            <div key={index} className="rounded-xl border border-black/5 p-4">
              <Field label={`Số ${index + 1}`}>
                <input
                  className={inputClass}
                  value={stat.value}
                  onChange={(e) => {
                    const next = [...form.aboutStats];
                    next[index] = { ...stat, value: e.target.value };
                    patch("aboutStats", next);
                  }}
                />
              </Field>
              <Field label="Nhãn">
                <input
                  className={inputClass}
                  value={stat.label}
                  onChange={(e) => {
                    const next = [...form.aboutStats];
                    next[index] = { ...stat, label: e.target.value };
                    patch("aboutStats", next);
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-spa-dark">Gallery không gian</h3>
          {form.gallery.length < 8 ? (
            <button
              type="button"
              onClick={() =>
                patch("gallery", [
                  ...form.gallery,
                  { src: "", alt: "", caption: "Không gian mới", note: "" } satisfies GalleryItem,
                ])
              }
              className="text-sm text-spa-primary hover:underline"
            >
              Thêm ảnh
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {form.gallery.map((item, index) => (
            <div key={index} className="rounded-xl border border-black/5 p-4">
              <ImageUpload
                label={`Ảnh ${index + 1}`}
                value={item.src}
                folder="spa-home"
                onChange={(url) => {
                  const next = [...form.gallery];
                  next[index] = { ...item, src: url };
                  patch("gallery", next);
                }}
              />
              <div className="mt-3 grid gap-3">
                <Field label="Tiêu đề">
                  <input
                    className={inputClass}
                    value={item.caption}
                    onChange={(e) => {
                      const next = [...form.gallery];
                      next[index] = { ...item, caption: e.target.value, alt: e.target.value };
                      patch("gallery", next);
                    }}
                  />
                </Field>
                <Field label="Mô tả ngắn">
                  <input
                    className={inputClass}
                    value={item.note}
                    onChange={(e) => {
                      const next = [...form.gallery];
                      next[index] = { ...item, note: e.target.value };
                      patch("gallery", next);
                    }}
                  />
                </Field>
              </div>
              {form.gallery.length > 1 ? (
                <button
                  type="button"
                  className="mt-3 text-sm text-rose-700 hover:underline"
                  onClick={() => patch("gallery", form.gallery.filter((_, i) => i !== index))}
                >
                  Xóa ảnh này
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-spa-dark">Đánh giá hiển thị trên trang chủ</h3>
          {form.testimonials.length < 8 ? (
            <button
              type="button"
              onClick={() =>
                patch("testimonials", [
                  ...form.testimonials,
                  {
                    id: `new-${Date.now()}`,
                    rating: 5,
                    comment: "",
                    customerName: "",
                    customerAvatar: "",
                    serviceName: "",
                  } satisfies HomeTestimonial,
                ])
              }
              className="text-sm text-spa-primary hover:underline"
            >
              Thêm đánh giá
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {form.testimonials.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-black/5 p-4">
              <ImageUpload
                label="Ảnh khách"
                value={item.customerAvatar}
                folder="spa-home"
                onChange={(url) => {
                  const next = [...form.testimonials];
                  next[index] = { ...item, customerAvatar: url };
                  patch("testimonials", next);
                }}
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Tên khách">
                  <input
                    className={inputClass}
                    value={item.customerName}
                    onChange={(e) => {
                      const next = [...form.testimonials];
                      next[index] = { ...item, customerName: e.target.value };
                      patch("testimonials", next);
                    }}
                  />
                </Field>
                <Field label="Dịch vụ">
                  <input
                    className={inputClass}
                    value={item.serviceName}
                    onChange={(e) => {
                      const next = [...form.testimonials];
                      next[index] = { ...item, serviceName: e.target.value };
                      patch("testimonials", next);
                    }}
                  />
                </Field>
                <Field label="Số sao (1-5)">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className={inputClass}
                    value={item.rating}
                    onChange={(e) => {
                      const next = [...form.testimonials];
                      next[index] = { ...item, rating: Number(e.target.value) || 5 };
                      patch("testimonials", next);
                    }}
                  />
                </Field>
              </div>
              <Field label="Nhận xét">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={item.comment}
                  onChange={(e) => {
                    const next = [...form.testimonials];
                    next[index] = { ...item, comment: e.target.value };
                    patch("testimonials", next);
                  }}
                />
              </Field>
              {form.testimonials.length > 1 ? (
                <button
                  type="button"
                  className="mt-3 text-sm text-rose-700 hover:underline"
                  onClick={() =>
                    patch(
                      "testimonials",
                      form.testimonials.filter((_, i) => i !== index)
                    )
                  }
                >
                  Xóa đánh giá
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-spa-dark">Ưu đãi / tin mới</h3>
          {form.promotions.length < 8 ? (
            <button
              type="button"
              onClick={() =>
                patch("promotions", [
                  ...form.promotions,
                  {
                    id: `promo-${Date.now()}`,
                    badge: "Ưu đãi",
                    title: "",
                    description: "",
                    code: "",
                    highlight: "",
                  } satisfies HomePromotion,
                ])
              }
              className="text-sm text-spa-primary hover:underline"
            >
              Thêm ưu đãi
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {form.promotions.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-black/5 p-4">
              <div className="grid gap-3">
                <Field label="Nhãn">
                  <input
                    className={inputClass}
                    value={item.badge}
                    onChange={(e) => {
                      const next = [...form.promotions];
                      next[index] = { ...item, badge: e.target.value };
                      patch("promotions", next);
                    }}
                  />
                </Field>
                <Field label="Tiêu đề">
                  <input
                    className={inputClass}
                    value={item.title}
                    onChange={(e) => {
                      const next = [...form.promotions];
                      next[index] = { ...item, title: e.target.value };
                      patch("promotions", next);
                    }}
                  />
                </Field>
                <Field label="Mô tả">
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={item.description}
                    onChange={(e) => {
                      const next = [...form.promotions];
                      next[index] = { ...item, description: e.target.value };
                      patch("promotions", next);
                    }}
                  />
                </Field>
                <Field label="Mã (nếu có)">
                  <input
                    className={inputClass}
                    value={item.code}
                    onChange={(e) => {
                      const next = [...form.promotions];
                      next[index] = { ...item, code: e.target.value };
                      patch("promotions", next);
                    }}
                  />
                </Field>
              </div>
              {form.promotions.length > 1 ? (
                <button
                  type="button"
                  className="mt-3 text-sm text-rose-700 hover:underline"
                  onClick={() =>
                    patch(
                      "promotions",
                      form.promotions.filter((_, i) => i !== index)
                    )
                  }
                >
                  Xóa ưu đãi
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setForm(cloneSettings(DEFAULT_HOME_SETTINGS))}
          className="rounded-full border px-5 py-2.5"
        >
          Khôi phục mẫu mặc định
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
