import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import { useHomeContent } from "../../contexts/HomeContentContext";
import { createHomeLayoutTemplate, normalizeHomeSettings } from "../../utils/homeSettings";
import { updateHomeSettings } from "../../services/homeService";
import type { GalleryItem, HomeSettings } from "../../types/home";
import { getErrorMessage } from "../../utils/getErrorMessage";

const inputClass = "mt-1 w-full rounded-xl border border-black/10 bg-spa-white px-3 py-2";

function cloneSettings(value: HomeSettings): HomeSettings {
  return JSON.parse(JSON.stringify(normalizeHomeSettings(value))) as HomeSettings;
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
          <Link to="/admin/settings" className="text-sm text-spa-primary hover:underline">
            ← Cài đặt trang chủ
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-spa-accent">Cài đặt</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Nội dung trang chủ</h2>
          <p className="mt-2 max-w-2xl text-sm text-spa-muted">
            Tải ảnh và nhập nội dung hiển thị trên trang chủ (dữ liệu lấy từ API sau khi lưu). Dùng
            &quot;Tạo khung bố cục&quot; nếu cần khung trống (3 thế mạnh, 4 con số), rồi upload và
            điền thông tin.
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-spa-dark">Hero / Phần mở đầu</h3>
          <Link to="/admin/settings/banner" className="text-sm text-spa-primary hover:underline">
            Quản lý slideshow Banner →
          </Link>
        </div>
        <p className="mt-2 text-sm text-spa-muted">
          Nếu đã cấu hình ảnh trong Banner, slideshow sẽ thay ảnh hero đơn bên dưới trên trang chủ.
        </p>
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
        {form.aboutPoints.length === 0 ? (
          <button
            type="button"
            onClick={() =>
              patch("aboutPoints", [
                { title: "", text: "" },
                { title: "", text: "" },
                { title: "", text: "" },
              ])
            }
            className="mt-4 text-sm text-spa-primary hover:underline"
          >
            Thêm 3 ô thế mạnh
          </button>
        ) : null}
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
        {form.aboutStats.length === 0 ? (
          <button
            type="button"
            onClick={() =>
              patch("aboutStats", [
                { value: "", label: "" },
                { value: "", label: "" },
                { value: "", label: "" },
                { value: "", label: "" },
              ])
            }
            className="mt-4 text-sm text-spa-primary hover:underline"
          >
            Thêm 4 chỉ số
          </button>
        ) : null}
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
          {form.gallery.length === 0 ? (
            <button
              type="button"
              onClick={() =>
                patch("gallery", [{ src: "", alt: "", caption: "", note: "" } satisfies GalleryItem])
              }
              className="text-sm text-spa-primary hover:underline"
            >
              Thêm ảnh đầu tiên
            </button>
          ) : null}
          {form.gallery.length > 0 && form.gallery.length < 8 ? (
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
              <button
                type="button"
                className="mt-3 text-sm text-rose-700 hover:underline"
                onClick={() => patch("gallery", form.gallery.filter((_, i) => i !== index))}
              >
                Xóa ảnh này
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Tạo khung bố cục trống trong form? Bạn vẫn cần bấm Lưu để áp dụng lên trang chủ."
              )
            ) {
              setForm(cloneSettings(createHomeLayoutTemplate()));
            }
          }}
          className="rounded-full border px-5 py-2.5"
        >
          Tạo khung bố cục (trống)
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
