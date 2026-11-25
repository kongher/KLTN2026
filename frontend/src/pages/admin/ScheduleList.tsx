import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchSchedules } from "../../services/scheduleService";
import { fetchStaffList } from "../../services/staffService";
import type { StaffSchedule } from "../../types/schedule";
import type { StaffMember } from "../../types/staff";
import {
  formatDateVi,
  formatTimeHm,
  SCHEDULE_STATUS_LABEL,
  STAFF_STATUS_LABEL,
} from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function ScheduleList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(addDaysIso(14));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [staffResult, scheduleResult] = await Promise.all([
        fetchStaffList({ search, page: 1, limit: 50, sortBy: "name", order: "asc" }),
        fetchSchedules({ from, to, page: 1, limit: 50 }),
      ]);
      setStaff(staffResult.data);
      setSchedules(scheduleResult.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được lịch làm việc"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, from, to]);

  const schedulesByStaff = useMemo(() => {
    const map = new Map<string, StaffSchedule[]>();
    schedules.forEach((item) => {
      const list = map.get(item.staffId) || [];
      list.push(item);
      map.set(item.staffId, list);
    });
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
      );
    });
    return map;
  }, [schedules]);

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý lịch làm việc</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Lịch nhân viên</h2>
        <p className="mt-1 text-sm text-spa-muted">
          Chọn nhân viên để xem lịch chi tiết, xếp lịch mới hoặc sửa/xóa ca làm việc.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm nhân viên theo tên, email, SĐT"
          className="min-w-56 flex-1 rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        />
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
          aria-label="Từ ngày"
        />
        <input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
          aria-label="Đến ngày"
        />
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}

      {loading ? <p className="text-sm text-spa-muted">Đang tải lịch làm việc...</p> : null}

      <div className="grid gap-4">
        {staff.map((member) => {
          const slots = schedulesByStaff.get(member.id) || [];
          return (
            <article key={member.id} className="rounded-2xl bg-spa-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} src={member.avatar} className="h-12 w-12" />
                  <div>
                    <h3 className="font-semibold text-spa-dark">{member.name}</h3>
                    <p className="text-sm text-spa-muted">
                      {member.specialization || "Chưa có chuyên môn"} ·{" "}
                      {STAFF_STATUS_LABEL[member.status]}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/schedules/${member.id}`}
                    className="rounded-full border px-4 py-2 text-sm"
                  >
                    Xem lịch chi tiết
                  </Link>
                  <Link
                    to={`/admin/schedules/${member.id}?new=1`}
                    className="rounded-full bg-spa-primary px-4 py-2 text-sm text-white hover:bg-spa-dark"
                  >
                    Xếp lịch mới
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {slots.length ? (
                  slots.slice(0, 4).map((slot) => (
                    <span
                      key={slot.id}
                      className="rounded-full bg-spa-bg px-3 py-1 text-xs text-spa-dark"
                    >
                      {formatDateVi(slot.date)} {formatTimeHm(slot.startTime)}–
                      {formatTimeHm(slot.endTime)} · {SCHEDULE_STATUS_LABEL[slot.status]}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-spa-muted">Chưa có lịch trong khoảng ngày đã chọn.</p>
                )}
                {slots.length > 4 ? (
                  <span className="rounded-full bg-spa-primary/10 px-3 py-1 text-xs text-spa-primary">
                    +{slots.length - 4} ca
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {!loading && staff.length === 0 ? (
        <p className="rounded-2xl bg-spa-white px-4 py-8 text-center text-spa-muted shadow-sm">
          Chưa có nhân viên để xếp lịch.
        </p>
      ) : null}
    </section>
  );
}
