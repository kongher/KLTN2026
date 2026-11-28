import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createCoupon, searchCouponCustomers } from "../../services/couponService";
import type { CouponSearchCustomer } from "../../types/coupon";
import { getErrorMessage } from "../../utils/getErrorMessage";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminCouponCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("20");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("100000");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  const [usagePerCustomer, setUsagePerCustomer] = useState("1");
  const [assignAll, setAssignAll] = useState(false);
  const [selected, setSelected] = useState<CouponSearchCustomer[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CouponSearchCustomer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchCouponCustomers(userSearch.trim())
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [userSearch]);

  function toggleCustomer(customer: CouponSearchCustomer) {
    setSelected((current) => {
      if (current.some((item) => item.userId === customer.userId)) {
        return current.filter((item) => item.userId !== customer.userId);
      }
      return [...current, customer];
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        type,
        value: Number(value),
        maxDiscountAmount:
          type === "PERCENTAGE" && maxDiscountAmount.trim()
            ? Number(maxDiscountAmount)
            : undefined,
        minOrderAmount: minOrderAmount.trim() ? Number(minOrderAmount) : undefined,
        startDate,
        endDate,
        usageLimit: Number(usageLimit),
        usagePerCustomer: Number(usagePerCustomer),
        assignAllCustomers: assignAll,
        customerUserIds: assignAll ? undefined : selected.map((item) => item.userId),
      };
      const created = await createCoupon(payload);
      navigate(`/admin/coupons/${created.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Không tạo được mã giảm giá"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-3xl">
      <Link to="/admin/coupons" className="text-sm text-spa-primary hover:underline">
        ← Danh sách mã giảm giá
      </Link>
      <h2 className="mt-4 text-2xl font-semibold text-spa-dark">Tạo mã giảm giá mới</h2>
      <p className="mt-2 text-sm text-spa-muted">
        Sau khi lưu, hệ thống cấp mã cho khách đã chọn và gửi email thông báo (nếu SMTP hoạt động).
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-6">
        <hr className="opacity-0" />
        <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
          <h3 className="font-semibold text-spa-dark">Thông tin chương trình</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm md:col-span-2">
              Tên chương trình
              <input
                required
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Mã giảm giá
              <input
                required
                className="mt-1 w-full rounded-xl border px-3 py-2 uppercase tracking-wide"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Loại giảm
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={type}
                onChange={(event) => setType(event.target.value as "PERCENTAGE" | "FIXED")}
              >
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định</option>
              </select>
            </label>
            <label className="block text-sm">
              Giá trị giảm
              <input
                required
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </label>
            {type === "PERCENTAGE" ? (
              <label className="block text-sm">
                Giảm tối đa (đ)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={maxDiscountAmount}
                  onChange={(event) => setMaxDiscountAmount(event.target.value)}
                />
              </label>
            ) : null}
            <label className="block text-sm">
              Đơn tối thiểu (đ, tuỳ chọn)
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={minOrderAmount}
                onChange={(event) => setMinOrderAmount(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Ngày bắt đầu
              <input
                required
                type="date"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Ngày kết thúc
              <input
                required
                type="date"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Giới hạn lượt dùng (toàn hệ thống)
              <input
                required
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={usageLimit}
                onChange={(event) => setUsageLimit(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Lượt / khách
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={usagePerCustomer}
                onChange={(event) => setUsagePerCustomer(event.target.value)}
              />
            </label>
          </div>
          <label className="mt-4 block text-sm md:col-span-2">
            Mô tả
            <textarea
              rows={3}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>

        <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
          <h3 className="font-semibold text-spa-dark">Chọn khách hàng nhận mã</h3>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={assignAll}
              onChange={(event) => setAssignAll(event.target.checked)}
            />
            Cấp cho tất cả khách hàng (CUSTOMER)
          </label>

          {!assignAll ? (
            <>
              <input
                className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Tìm theo tên hoặc email..."
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
              {searchResults.length > 0 ? (
                <ul className="mt-2 max-h-40 overflow-auto rounded-xl border text-sm">
                  {searchResults.map((customer) => (
                    <li key={customer.userId}>
                      <button
                        type="button"
                        className="flex w-full justify-between px-3 py-2 text-left hover:bg-spa-bg"
                        onClick={() => toggleCustomer(customer)}
                      >
                        <span>
                          {customer.name} — {customer.email}
                        </span>
                        <span className="text-spa-primary">
                          {selected.some((item) => item.userId === customer.userId) ? "Đã chọn" : "Chọn"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {selected.length > 0 ? (
                <p className="mt-3 text-sm text-spa-muted">
                  Đã chọn {selected.length} khách: {selected.map((item) => item.name).join(", ")}
                </p>
              ) : (
                <p className="mt-3 text-sm text-spa-muted">Chưa chọn khách hàng nào.</p>
              )}
            </>
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-spa-primary px-6 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo và cấp mã"}
          </button>
          <Link to="/admin/coupons" className="rounded-full border px-6 py-2.5 text-sm">
            Hủy
          </Link>
        </div>
      </form>
    </section>
  );
}