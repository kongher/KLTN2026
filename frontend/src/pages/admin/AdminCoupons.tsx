import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import { fetchCoupons, patchCouponStatus } from "../../services/couponService";
import type { AdminCoupon } from "../../types/coupon";
import type { Pagination } from "../../types/service";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

function typeLabel(coupon: AdminCoupon) {
  if (coupon.type === "PERCENTAGE") {
    const cap =
      coupon.maxDiscountAmount != null ? `, tối đa ${formatPrice(coupon.maxDiscountAmount)}` : "";
    return `Giảm ${coupon.value}%${cap}`;
  }
  return `Giảm ${formatPrice(coupon.value)}`;
}

export default function AdminCoupons() {
  const [items, setItems] = useState<AdminCoupon[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusTarget, setStatusTarget] = useState<AdminCoupon | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await fetchCoupons({ page, limit: 10, search: search.trim() || undefined });
      setItems(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách mã giảm giá"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function confirmToggleStatus() {
    if (!statusTarget) return;
    const next = statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusUpdating(true);
    setError("");
    try {
      await patchCouponStatus(statusTarget.id, next);
      setStatusTarget(null);
      void load();
    } catch (err) {
      setError(getErrorMessage(err, "Không cập nhật được trạng thái"));
    } finally {
      setStatusUpdating(false);
    }
  }

  const turningOff = statusTarget?.status === "ACTIVE";

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Ưu đãi cá nhân</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Quản lý mã giảm giá</h2>
          <p className="mt-2 text-sm text-spa-muted">
            Tạo chương trình, cấp mã cho khách hàng qua email và theo dõi lượt sử dụng.
          </p>
        </div>
        <Link
          to="/admin/coupons/new"
          className="rounded-full bg-spa-primary px-5 py-2.5 text-sm text-white hover:bg-spa-dark"
        >
          Thêm mã giảm giá mới
        </Link>
      </div>

      <form
        className="mt-6 flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <input
          className="min-w-[220px] flex-1 rounded-xl border px-3 py-2 text-sm"
          placeholder="Tìm theo tên, mã, mô tả..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit" className="rounded-full border px-5 py-2 text-sm">
          Tìm kiếm
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b text-left text-spa-muted">
            <tr>
              <th className="px-4 py-3">Chương trình</th>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Giá trị</th>
              <th className="px-4 py-3">Hiệu lực</th>
              <th className="px-4 py-3">Khách được cấp</th>
              <th className="px-4 py-3">Đã dùng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-spa-muted">
                  Đang tải...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-spa-muted">
                  Chưa có mã giảm giá. Bấm &quot;Thêm mã giảm giá mới&quot; để bắt đầu.
                </td>
              </tr>
            ) : (
              items.map((coupon) => (
                <tr key={coupon.id} className="border-b border-black/5">
                  <td className="px-4 py-3 font-medium text-spa-dark">{coupon.name}</td>
                  <td className="px-4 py-3 tracking-wide text-spa-primary">{coupon.code}</td>
                  <td className="px-4 py-3">{typeLabel(coupon)}</td>
                  <td className="px-4 py-3 text-spa-muted">
                    {coupon.startDate.slice(0, 10)} → {coupon.endDate.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">{coupon.assignedCount}</td>
                  <td className="px-4 py-3">
                    {coupon.usedAssignments} / {coupon.usageLimit}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        coupon.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-black/5 text-spa-muted"
                      }`}
                    >
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/coupons/${coupon.id}`} className="text-spa-primary hover:underline">
                      Chi tiết
                    </Link>
                    <button
                      type="button"
                      className="ml-3 text-spa-muted hover:text-spa-dark"
                      onClick={() => setStatusTarget(coupon)}
                    >
                      {coupon.status === "ACTIVE" ? "Tắt" : "Bật"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((value) => value - 1)}
          >
            Trước
          </button>
          <span className="text-sm text-spa-muted">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
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

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={turningOff ? "Tắt mã giảm giá?" : "Bật mã giảm giá?"}
        description={
          statusTarget
            ? turningOff
              ? `Bạn có chắc muốn tắt mã "${statusTarget.code}" (${statusTarget.name})? Khách hàng sẽ không thể dùng mã cho đến khi bạn bật lại.`
              : `Bạn có chắc muốn bật mã "${statusTarget.code}" (${statusTarget.name})? Mã sẽ được khách áp dụng lại khi còn hiệu lực và đủ điều kiện.`
            : ""
        }
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        tone={turningOff ? "warning" : "default"}
        loading={statusUpdating}
        onConfirm={() => void confirmToggleStatus()}
        onCancel={() => {
          if (!statusUpdating) setStatusTarget(null);
        }}
      />
    </section>
  );
}