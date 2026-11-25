import { useEffect, useState } from "react";
import { fetchSchedules } from "../../services/scheduleService";
import type { Pagination } from "../../types/service";
import type { ScheduleStatus, StaffSchedule } from "../../types/schedule";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { SCHEDULE_STATUS_LABEL } from "../../utils/statusLabels";

function formatTime(value: string) {
  return value.slice(0, 5);
}

function statusClass(status: ScheduleStatus) {
  if (status === "AVAILABLE") return "bg-spa-primary/10 text-spa-primary";
  if (status === "OFF") return "bg-black/5 text-spa-muted";
  return "bg-amber-50 text-amber-800";
}

export default function MySchedule() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<"ALL" | ScheduleStatus>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await fetchSchedules({
        status,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: 20,
      });
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
  }, [status, from, to, page]);

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Nhân viên</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Lịch làm việc của tôi</h2>
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

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Bắt đầu</th>
              <th className="px-4 py-3">Kết thúc</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium text-spa-dark">{schedule.date}</td>
                <td className="px-4 py-3">{formatTime(schedule.startTime)}</td>
                <td className="px-4 py-3">{formatTime(schedule.endTime)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${statusClass(schedule.status)}`}>
                    {SCHEDULE_STATUS_LABEL[schedule.status]}
                  </span>
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
    </section>
  );
}
