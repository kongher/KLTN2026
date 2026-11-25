import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminPendingBookingsCount } from "../../services/bookingService";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminPendingBookingsCount()
      .then((count) => {
        if (!cancelled) setPendingCount(count);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản trị</p>
        <h2 className="mt-2 text-2xl font-semibold text-spa-dark">Quản trị spa</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/settings"
          className="rounded-2xl bg-spa-white p-5 shadow-sm hover:bg-spa-primary/5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Cài đặt</p>
          <h3 className="mt-2 text-lg font-semibold text-spa-dark">Nội dung trang chủ</h3>
          <p className="mt-2 text-sm text-spa-muted">
            Sửa slogan, địa chỉ, đăng ảnh hero/gallery và cập nhật đánh giá, ưu đãi.
          </p>
        </Link>
        <Link
          to="/admin/bookings"
          className="rounded-2xl bg-spa-white p-5 shadow-sm hover:bg-spa-primary/5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Lịch hẹn</p>
          <h3 className="mt-2 flex items-center text-lg font-semibold text-spa-dark">
            Quản lý Lịch hẹn
            <CountBadge count={pendingCount} />
          </h3>
          <p className="mt-2 text-sm text-spa-muted">
            Theo dõi lịch chờ nhân viên xác nhận và lịch đã xác nhận — chỉ xem, không duyệt thay nhân viên.
          </p>
        </Link>
        <Link to="/admin/staff" className="rounded-2xl bg-spa-white p-5 shadow-sm hover:bg-spa-primary/5">
          <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Task 1</p>
          <h3 className="mt-2 text-lg font-semibold text-spa-dark">Quản lý nhân viên</h3>
          <p className="mt-2 text-sm text-spa-muted">
            Danh sách, thêm mới, xem chi tiết và sửa thông tin cá nhân/chuyên môn.
          </p>
        </Link>
        <Link
          to="/admin/schedules"
          className="rounded-2xl bg-spa-white p-5 shadow-sm hover:bg-spa-primary/5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Task 2</p>
          <h3 className="mt-2 text-lg font-semibold text-spa-dark">Lịch làm việc</h3>
          <p className="mt-2 text-sm text-spa-muted">
            Xem lịch từng nhân viên, xếp lịch mới, sửa hoặc xóa ca làm việc.
          </p>
        </Link>
        <Link
          to="/admin/accounts"
          className="rounded-2xl bg-spa-white p-5 shadow-sm hover:bg-spa-primary/5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Task 3</p>
          <h3 className="mt-2 text-lg font-semibold text-spa-dark">Tài khoản & Bảo mật</h3>
          <p className="mt-2 text-sm text-spa-muted">
            Khóa/mở khóa, xóa tài khoản và đổi email, mật khẩu, quyền.
          </p>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/services" className="rounded-full border px-5 py-2.5">
          Dịch vụ
        </Link>
        <Link to="/admin/treatments" className="rounded-full border px-5 py-2.5">
          Điều trị
        </Link>
        <Link to="/admin/categories" className="rounded-full border px-5 py-2.5">
          Danh mục
        </Link>
      </div>
    </section>
  );
}
