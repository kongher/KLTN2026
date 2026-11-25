import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  changeScheduleStatus,
  createSchedule,
  deleteSchedule,
  fetchStaffSchedules,
  updateSchedule,
} from "../../services/scheduleService";
import { fetchStaff } from "../../services/staffService";
import type { Pagination } from "../../types/service";
import type { ScheduleStatus, StaffSchedule } from "../../types/schedule";
import type { StaffMember } from "../../types/staff";
import {
  formatDateVi,
  formatTimeHm,
  SCHEDULE_STATUS_LABEL,
} from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

function createEmptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "17:00",
    status: "AVAILABLE" as ScheduleStatus,
  };
}

function statusClass(status: ScheduleStatus) {
  if (status === "AVAILABLE") return "bg-spa-primary/10 text-spa-primary";
  if (status === "OFF") return "bg-black/5 text-spa-muted";
  return "bg-amber-50 text-amber-800";
}

export default function StaffSchedulePage() {
  const { staffId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<"ALL" | ScheduleStatus>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StaffSchedule | null>(null);

  const title = useMemo(
    () => (staff ? `Lịch làm việc · ${staff.name}` : "Lịch làm việc"),
    [staff]
  );

  async function load() {
    if (!staffId) return;
    try {
      const [member, result] = await Promise.all([
        staff ? Promise.resolve(staff) : fetchStaff(staffId),
        fetchStaffSchedules(staffId, {
          status,
          from: from || undefined,
          to: to || undefined,
          page,
          limit: 20,
        }),
      ]);
      setStaff(member);
      setSchedules(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được lịch làm việc"));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, status, from, to, page]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      startCreate();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, staffId]);

  function startCreate() {
    setEditingId(null);
    setForm(createEmptyForm());
    setOpen(true);
    setError("");
  }

  function startEdit(schedule: StaffSchedule) {
    setEditingId(schedule.id);
    setForm({
      date: schedule.date,
      startTime: formatTimeHm(schedule.startTime),
      endTime: formatTimeHm(schedule.endTime),
      status: schedule.status,
    });
    setOpen(true);
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!staffId) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await updateSchedule(editingId, {
          staffId,
          ...form,
        });
        setMessage("Đã cập nhật lịch làm việc");
      } else {
        await createSchedule({
          staffId,
          ...form,
        });
        setMessage("Đã xếp lịch mới");
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Không lưu được lịch"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteSchedule(pendingDelete.id);
      setMessage("Đã xóa lịch làm việc");
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingDelete(null);
    }
  }

  async function handleToggleStatus(schedule: StaffSchedule) {
    const next: ScheduleStatus =
      schedule.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      await changeScheduleStatus(schedule.id, next);
      setMessage(
        next === "AVAILABLE" ? "Đã bật ca làm việc (sẵn sàng)" : "Đã tạm ngưng ca làm việc"
      );
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý lịch làm việc</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">{title}</h2>
          {staff ? (
            <p className="mt-1 text-sm text-spa-muted">
              {staff.email} · {staff.specialization || "Chưa có chuyên môn"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/schedules" className="rounded-full border px-5 py-2.5">
            Quay lại danh sách
          </Link>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
          >
            Xếp lịch mới
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
          aria-label="Từ ngày"
        />
        <input
          type="date"
          value={to}
          onChange={(event) => {
            setTo(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
          aria-label="Đến ngày"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "ALL" | ScheduleStatus);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Sẵn sàng</option>
          <option value="UNAVAILABLE">Tạm ngưng</option>
          <option value="OFF">Nghỉ</option>
        </select>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-spa-primary">{message}</p> : null}

      {open ? (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mb-6 rounded-2xl bg-spa-white p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-spa-dark">
            {editingId ? "Sửa lịch làm việc" : "Xếp lịch mới"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Ngày
              <input
                type="date"
                required
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Trạng thái
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as ScheduleStatus,
                  }))
                }
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="UNAVAILABLE">Tạm ngưng</option>
                <option value="OFF">Nghỉ</option>
              </select>
            </label>
            <label className="block text-sm">
              Bắt đầu
              <input
                type="time"
                required
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startTime: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              Kết thúc
              <input
                type="time"
                required
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endTime: event.target.value }))
                }
              />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-spa-primary px-5 py-2.5 text-white disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu lịch"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border px-5 py-2.5"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Bắt đầu</th>
              <th className="px-4 py-3">Kết thúc</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium text-spa-dark">
                  {formatDateVi(schedule.date)}
                </td>
                <td className="px-4 py-3">{formatTimeHm(schedule.startTime)}</td>
                <td className="px-4 py-3">{formatTimeHm(schedule.endTime)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${statusClass(schedule.status)}`}>
                    {SCHEDULE_STATUS_LABEL[schedule.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="text-spa-primary" onClick={() => startEdit(schedule)}>
                      Sửa
                    </button>
                    <button type="button" onClick={() => void handleToggleStatus(schedule)}>
                      {schedule.status === "AVAILABLE" ? "Tạm ngưng" : "Bật lại"}
                    </button>
                    <button
                      type="button"
                      className="text-rose-700"
                      onClick={() => setPendingDelete(schedule)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schedules.length === 0 ? (
          <p className="px-4 py-8 text-center text-spa-muted">Chưa có lịch trong bộ lọc này.</p>
        ) : null}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Trước
          </button>
          <span>
            {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Xóa lịch làm việc?"
        description={
          pendingDelete
            ? `Ca ${formatDateVi(pendingDelete.date)} ${formatTimeHm(pendingDelete.startTime)}-${formatTimeHm(pendingDelete.endTime)} sẽ bị xóa vĩnh viễn và không thể hoàn tác.`
            : ""
        }
        confirmLabel="Xóa lịch"
        tone="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
