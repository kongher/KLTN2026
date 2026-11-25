import { useEffect, useState, type FormEvent } from "react";
import ImageUpload from "../../components/ImageUpload";
import {
  createTreatment,
  fetchCompletedBookingsWithoutTreatment,
  fetchStaffTreatments,
  updateTreatment,
} from "../../services/treatmentService";
import type { CompletedBookingOption, Treatment } from "../../types/treatment";
import type { Pagination } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function StaffTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [options, setOptions] = useState<CompletedBookingOption[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState("");
  const [note, setNote] = useState("");
  const [beforeImage, setBeforeImage] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = options.find((item) => item.id === bookingId);

  async function load() {
    setLoading(true);
    try {
      const [list, completed] = await Promise.all([
        fetchStaffTreatments(page, 10),
        fetchCompletedBookingsWithoutTreatment(),
      ]);
      setTreatments(list.data);
      setPagination(list.pagination);
      setOptions(completed);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được hồ sơ điều trị"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function resetForm() {
    setEditingId(null);
    setBookingId("");
    setNote("");
    setBeforeImage("");
    setAfterImage("");
  }

  function startEdit(item: Treatment) {
    setEditingId(item.id);
    setBookingId(item.bookingId);
    setNote(item.note || "");
    setBeforeImage(item.beforeImage || "");
    setAfterImage(item.afterImage || "");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await updateTreatment(editingId, { note, beforeImage, afterImage });
        setMessage("Đã cập nhật hồ sơ điều trị");
      } else {
        if (!bookingId) {
          setError("Vui lòng chọn booking đã hoàn thành");
          setSaving(false);
          return;
        }
        await createTreatment({ bookingId, note, beforeImage, afterImage });
        setMessage("Đã tạo hồ sơ điều trị");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Treatment</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Hồ sơ điều trị</h2>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-spa-primary">{message}</p> : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-spa-dark">
          {editingId ? "Cập nhật Treatment" : "Tạo Treatment Record"}
        </h3>

        {!editingId ? (
          <label className="mt-4 block text-sm">
            <span className="text-spa-muted">Booking đã hoàn thành</span>
            <select
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-spa-bg px-3 py-2"
              required
            >
              <option value="">— Chọn booking —</option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.customer.name} · {item.service.name} · {item.bookingDate}{" "}
                  {formatTime(item.startTime)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {selected || editingId ? (
          <div className="mt-4 grid gap-3 rounded-xl bg-spa-bg/70 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-spa-muted">Khách hàng</p>
              <p className="font-medium text-spa-dark">
                {selected?.customer.name ||
                  treatments.find((t) => t.id === editingId)?.customer?.name ||
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-spa-muted">Dịch vụ</p>
              <p className="font-medium text-spa-dark">
                {selected?.service.name ||
                  treatments.find((t) => t.id === editingId)?.service?.name ||
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-spa-muted">Nhân viên</p>
              <p className="font-medium text-spa-dark">Bạn (được phân công)</p>
            </div>
          </div>
        ) : null}

        <label className="mt-4 block text-sm">
          <span className="text-spa-muted">Ghi chú</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-black/10 bg-spa-bg px-3 py-2"
            placeholder="Ghi chú điều trị..."
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ImageUpload
            label="Before image"
            value={beforeImage}
            onChange={setBeforeImage}
            folder="spa-management/treatments/before"
          />
          <ImageUpload
            label="After image"
            value={afterImage}
            onChange={setAfterImage}
            folder="spa-management/treatments/after"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-50"
          >
            {editingId ? "Lưu thay đổi" : "Tạo hồ sơ"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border px-5 py-2.5"
            >
              Hủy sửa
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <p className="text-sm text-spa-muted">Đang tải...</p> : null}

      <div className="space-y-4">
        {treatments.map((item) => (
          <article key={item.id} className="rounded-2xl bg-spa-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-spa-dark">
                  {item.service?.name || "Dịch vụ"}
                </h3>
                <p className="text-sm text-spa-muted">
                  {item.customer?.name} · {item.booking?.bookingDate}{" "}
                  {item.booking ? formatTime(item.booking.startTime) : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="rounded-full border px-4 py-2 text-sm"
              >
                Sửa
              </button>
            </div>
            {item.note ? <p className="mt-3 text-sm text-spa-text">{item.note}</p> : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase text-spa-muted">Before</p>
                {item.beforeImage ? (
                  <img
                    src={item.beforeImage}
                    alt="Before"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <p className="text-sm text-spa-muted">Chưa có ảnh</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs uppercase text-spa-muted">After</p>
                {item.afterImage ? (
                  <img
                    src={item.afterImage}
                    alt="After"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <p className="text-sm text-spa-muted">Chưa có ảnh</p>
                )}
              </div>
            </div>
          </article>
        ))}
        {!loading && treatments.length === 0 ? (
          <p className="text-spa-muted">Chưa có hồ sơ điều trị.</p>
        ) : null}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm text-spa-muted">
            Trang {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      ) : null}
    </section>
  );
}
