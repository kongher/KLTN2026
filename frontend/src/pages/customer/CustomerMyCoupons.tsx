import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyCoupons } from "../../services/couponService";
import type { CustomerCouponItem } from "../../types/coupon";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

function CouponCard({ coupon }: { coupon: CustomerCouponItem }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-spa-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">{coupon.programName}</p>
      <p className="mt-2 text-lg font-semibold text-spa-primary tracking-wide">{coupon.code}</p>
      <p className="mt-1 text-sm text-spa-dark">{coupon.discountLabel}</p>
      {coupon.description ? <p className="mt-2 text-sm text-spa-muted">{coupon.description}</p> : null}
      <p className="mt-3 text-xs text-spa-muted">
        Hết hạn: {coupon.endDate.slice(0, 10)}
        {coupon.minOrderAmount != null
          ? ` · Đơn tối thiểu ${formatPrice(coupon.minOrderAmount)}`
          : ""}
      </p>
      <p className="mt-2 text-xs font-medium text-spa-dark">Trạng thái: {coupon.status}</p>
    </article>
  );
}

function Section({ title, items }: { title: string; items: CustomerCouponItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-spa-dark">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} />
        ))}
      </div>
    </div>
  );
}

export default function CustomerMyCoupons() {
  const [groups, setGroups] = useState<{
    available: CustomerCouponItem[];
    used: CustomerCouponItem[];
    expired: CustomerCouponItem[];
    reserved: CustomerCouponItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchMyCoupons()
      .then((data) => setGroups(data.groups))
      .catch((err) => setError(getErrorMessage(err, "Không tải được ưu đãi")))
      .finally(() => setLoading(false));
  }, []);

  const empty =
    !groups ||
    (groups.available.length === 0 &&
      groups.used.length === 0 &&
      groups.expired.length === 0 &&
      groups.reserved.length === 0);

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Ưu đãi</p>
      <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Ưu đãi của tôi</h2>
      <p className="mt-2 text-sm text-spa-muted">
        Các mã được Lumina Spa cấp riêng cho bạn. Khi đặt lịch, chọn mã và nhấn Sử dụng — không cần
        nhập mã tay.
      </p>
      <Link
        to="/customer/bookings/new"
        className="mt-4 inline-flex rounded-full bg-spa-primary px-5 py-2 text-sm text-white"
      >
        Đặt lịch ngay
      </Link>

      {loading ? <p className="mt-8 text-spa-muted">Đang tải...</p> : null}
      {error ? <p className="mt-8 text-sm text-rose-700">{error}</p> : null}

      {empty && !loading ? (
        <p className="mt-8 rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-spa-muted">
          Bạn chưa có mã giảm giá nào. Khi spa gửi ưu đãi qua email, mã sẽ hiển thị tại đây.
        </p>
      ) : null}

      {groups ? (
        <>
          <Section title="Có thể sử dụng" items={groups.available} />
          <Section title="Đang giữ cho lịch hẹn" items={groups.reserved} />
          <Section title="Đã sử dụng" items={groups.used} />
          <Section title="Hết hạn / đã thu hồi" items={groups.expired} />
        </>
      ) : null}
    </section>
  );
}