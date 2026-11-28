import { Link } from "react-router-dom";

export default function AdminHomeSettingsHub() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Cài đặt</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Cài đặt trang chủ</h2>
        <p className="mt-2 max-w-2xl text-sm text-spa-muted">
          Chọn mục bạn muốn chỉnh: nội dung văn bản và liên hệ, hoặc slideshow banner đầu trang.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/admin/settings/content"
          className="rounded-2xl border border-black/5 bg-spa-white p-6 shadow-sm transition hover:border-spa-primary/30 hover:bg-spa-primary/5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Nội dung</p>
          <h3 className="mt-2 text-lg font-semibold text-spa-dark">Nội dung trang chủ</h3>
          <p className="mt-2 text-sm text-spa-muted">
            Tên spa, liên hệ, khẩu hiệu, giới thiệu, gallery và thống kê hiển thị.
          </p>
        </Link>
        <Link
          to="/admin/settings/banner"
          className="rounded-2xl border border-black/5 bg-spa-white p-6 shadow-sm transition hover:border-spa-primary/30 hover:bg-spa-primary/5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Banner</p>
          <h3 className="mt-2 text-lg font-semibold text-spa-dark">Slideshow banner</h3>
          <p className="mt-2 text-sm text-spa-muted">
            Tải ảnh banner, đặt thứ tự hiển thị (không trùng). Ảnh chạy tự động trên trang chủ.
          </p>
        </Link>
      </div>

      <Link to="/home" className="inline-block text-sm text-spa-primary hover:underline">
        Xem trang chủ công khai
      </Link>
    </section>
  );
}