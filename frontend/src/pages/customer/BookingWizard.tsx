import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import {
  createBooking,
  fetchAvailableSlots,
  fetchAvailableStaff,
} from "../../services/bookingService";
import { fetchService, fetchServices } from "../../services/catalogService";
import type { AvailableSlot, BookingStaff } from "../../types/booking";
import type { SpaService } from "../../types/service";
import {
  applyBookingCoupon,
  fetchAvailableBookingCoupons,
} from "../../services/couponService";
import type { ApplyCouponResult, AvailableBookingCoupon } from "../../types/coupon";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

const STEPS = ["Dịch vụ", "Nhân viên", "Ngày", "Giờ", "Xác nhận"] as const;

function formatTime(value: string) {
  return value.slice(0, 5);
}

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingWizard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const presetServiceId = params.get("serviceId") || "";

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<SpaService[]>([]);
  const [serviceId, setServiceId] = useState(presetServiceId);
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const [staffList, setStaffList] = useState<BookingStaff[]>([]);
  const [staffId, setStaffId] = useState("");
  const [bookingDate, setBookingDate] = useState(todayLocal());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [startTime, setStartTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<AvailableBookingCoupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const selectedStaff = useMemo(
    () => staffList.find((item) => item.id === staffId) || null,
    [staffList, staffId]
  );
  const selectedSlot = useMemo(
    () => slots.find((item) => item.startTime === startTime) || null,
    [slots, startTime]
  );

  useEffect(() => {
    setLoading(true);
    fetchServices({ status: "ACTIVE", limit: 50, sortBy: "name", order: "asc" })
      .then((result) => setServices(result.data))
      .catch((err) => setError(getErrorMessage(err, "Không tải được dịch vụ")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!serviceId) {
      setSelectedService(null);
      return;
    }
    fetchService(serviceId)
      .then(setSelectedService)
      .catch((err) => setError(getErrorMessage(err, "Không tải được dịch vụ")));
  }, [serviceId]);

  useEffect(() => {
    if (presetServiceId) {
      setServiceId(presetServiceId);
      setStep(1);
    }
  }, [presetServiceId]);

  async function loadStaff() {
    if (!serviceId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchAvailableStaff(serviceId);
      setStaffList(data);
      if (!data.some((item) => item.id === staffId)) {
        setStaffId("");
        setStartTime("");
        setSlots([]);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được nhân viên"));
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots() {
    if (!serviceId || !staffId || !bookingDate) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchAvailableSlots(serviceId, staffId, bookingDate);
      setSlots(data);
      if (!data.some((item) => item.startTime === startTime)) {
        setStartTime("");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được khung giờ"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step >= 1 && serviceId) {
      void loadStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, serviceId]);

  useEffect(() => {
    if (step >= 3 && serviceId && staffId && bookingDate) {
      void loadSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, serviceId, staffId, bookingDate]);

  useEffect(() => {
    if (step !== 4 || !serviceId) {
      setAvailableCoupons([]);
      return;
    }
    setCouponLoading(true);
    void fetchAvailableBookingCoupons(serviceId)
      .then(setAvailableCoupons)
      .catch(() => setAvailableCoupons([]))
      .finally(() => setCouponLoading(false));
    setAppliedCoupon(null);
  }, [step, serviceId]);

  function canGoNext() {
    if (step === 0) return Boolean(serviceId);
    if (step === 1) return Boolean(staffId);
    if (step === 2) return Boolean(bookingDate);
    if (step === 3) return Boolean(startTime);
    return true;
  }

  async function handleConfirm() {
    if (!serviceId || !staffId || !bookingDate || !startTime) return;
    setSubmitting(true);
    setError("");
    try {
      const booking = await createBooking({
        serviceId,
        staffId,
        bookingDate,
        startTime,
        note,
        customerCouponId: appliedCoupon?.customerCouponId,
      });
      navigate(`/customer/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Không tạo được lịch hẹn"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Đặt lịch</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Tạo lịch hẹn mới</h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 text-xs ${
              index === step
                ? "bg-spa-primary text-white"
                : index < step
                  ? "bg-spa-primary/15 text-spa-dark"
                  : "bg-black/5 text-spa-muted"
            }`}
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="mb-4 text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        {step === 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-spa-dark">Chọn dịch vụ</h3>
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setServiceId(service.id)}
                className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left ${
                  serviceId === service.id
                    ? "border-spa-primary bg-spa-primary/5"
                    : "border-black/5"
                }`}
              >
                <span>
                  <span className="block font-medium text-spa-dark">{service.name}</span>
                  <span className="text-sm text-spa-muted">
                    {formatDuration(service.duration)} · {formatPrice(service.price)}
                  </span>
                </span>
              </button>
            ))}
            {services.length === 0 && !loading ? (
              <p className="text-sm text-spa-muted">Chưa có dịch vụ khả dụng.</p>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-spa-dark">Chọn nhân viên</h3>
            {staffList.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setStaffId(member.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                  staffId === member.id
                    ? "border-spa-primary bg-spa-primary/5"
                    : "border-black/5"
                }`}
              >
                <Avatar name={member.name || "NV"} src={member.avatar} />
                <span>
                  <span className="block font-medium text-spa-dark">{member.name}</span>
                  <span className="text-sm text-spa-muted">
                    {member.specialization || "Chuyên viên spa"}
                  </span>
                </span>
              </button>
            ))}
            {staffList.length === 0 && !loading ? (
              <p className="text-sm text-spa-muted">
                Chưa có nhân viên đang hoạt động được phân công dịch vụ này. Hãy gán dịch vụ cho nhân
                viên trong mục Quản lý nhân viên.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-spa-dark">Chọn ngày</h3>
            <label className="block text-sm">
              Ngày hẹn
              <input
                type="date"
                min={todayLocal()}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={bookingDate}
                onChange={(event) => {
                  setBookingDate(event.target.value);
                  setStartTime("");
                }}
              />
            </label>
            <p className="text-sm text-spa-muted">
              Khung giờ trống phụ thuộc lịch làm việc của nhân viên trong ngày này. Nếu chưa thấy
              giờ, hãy chọn ngày đã được xếp lịch.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-spa-dark">Chọn giờ</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => setStartTime(slot.startTime)}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    startTime === slot.startTime
                      ? "border-spa-primary bg-spa-primary text-white"
                      : "border-black/5 text-spa-dark"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            {slots.length === 0 && !loading ? (
              <p className="text-sm text-spa-muted">
                Không còn khung giờ trống. Hãy chọn ngày khác hoặc nhân viên khác.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-spa-dark">Xác nhận lịch hẹn</h3>
            <p className="text-sm text-spa-muted">
              Sau khi đặt, lịch sẽ chờ Admin duyệt trước khi nhân viên nhận ca.
            </p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-spa-muted">Dịch vụ</dt>
                <dd className="font-medium text-spa-dark">{selectedService?.name}</dd>
              </div>
              <div>
                <dt className="text-spa-muted">Nhân viên</dt>
                <dd className="font-medium text-spa-dark">{selectedStaff?.name}</dd>
              </div>
              <div>
                <dt className="text-spa-muted">Ngày</dt>
                <dd className="font-medium text-spa-dark">{bookingDate}</dd>
              </div>
              <div>
                <dt className="text-spa-muted">Giờ</dt>
                <dd className="font-medium text-spa-dark">
                  {selectedSlot
                    ? `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-spa-muted">Thời lượng</dt>
                <dd className="font-medium text-spa-dark">
                  {selectedService ? formatDuration(selectedService.duration) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-spa-muted">Giá</dt>
                <dd className="font-medium text-spa-primary">
                  {appliedCoupon
                    ? formatPrice(appliedCoupon.totalAmount)
                    : selectedService
                      ? formatPrice(selectedService.price)
                      : "—"}
                </dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-spa-primary/20 bg-spa-bg/60 p-4">
              <h4 className="text-sm font-semibold text-spa-dark">Ưu đãi dành riêng cho bạn</h4>
              {couponLoading ? (
                <p className="mt-2 text-sm text-spa-muted">Đang tải mã khả dụng...</p>
              ) : availableCoupons.length === 0 ? (
                <p className="mt-2 text-sm text-spa-muted">Không có mã áp dụng cho dịch vụ này.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {availableCoupons.map((coupon) => (
                    <li
                      key={coupon.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-spa-dark">{coupon.programName}</p>
                        <p className="text-xs text-spa-muted">
                          {coupon.discountLabel} · {coupon.code}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={appliedCoupon?.customerCouponId === coupon.id}
                        className="rounded-full bg-spa-primary px-4 py-2 text-xs text-white disabled:opacity-50"
                        onClick={() => {
                          void applyBookingCoupon(coupon.id, serviceId)
                            .then(setAppliedCoupon)
                            .catch((err) =>
                              setError(getErrorMessage(err, "Không áp dụng được mã"))
                            );
                        }}
                      >
                        {appliedCoupon?.customerCouponId === coupon.id ? "Đang dùng" : "Sử dụng"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {appliedCoupon ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-3 text-sm">
                  <p className="font-medium text-spa-dark">
                    Đang dùng: {appliedCoupon.programName} ({appliedCoupon.couponCode})
                  </p>
                  <p className="mt-1 text-spa-muted">
                    Tạm tính: {formatPrice(appliedCoupon.originalAmount)} −{" "}
                    {formatPrice(appliedCoupon.discountAmount)} ={" "}
                    <span className="font-semibold text-spa-primary">
                      {formatPrice(appliedCoupon.totalAmount)}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs text-rose-700 hover:underline"
                    onClick={() => setAppliedCoupon(null)}
                  >
                    Bỏ áp dụng mã
                  </button>
                </div>
              ) : null}
            </div>

            <label className="block text-sm">
              Ghi chú (tuỳ chọn)
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Yêu cầu đặc biệt, dị ứng sản phẩm..."
              />
            </label>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <div className="flex gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((value) => value - 1)}
                className="rounded-full border px-5 py-2.5"
              >
                Quay lại
              </button>
            ) : (
              <Link to="/customer/services" className="rounded-full border px-5 py-2.5">
                Hủy
              </Link>
            )}
          </div>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canGoNext()}
              onClick={() => setStep((value) => value + 1)}
              className="rounded-full bg-spa-primary px-5 py-2.5 text-white disabled:opacity-50"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || !canGoNext()}
              onClick={() => void handleConfirm()}
              className="rounded-full bg-spa-primary px-5 py-2.5 text-white disabled:opacity-50"
            >
              {submitting ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
