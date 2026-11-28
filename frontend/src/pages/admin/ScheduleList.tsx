import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchStaffList } from "../../services/staffService";
import type { StaffMember } from "../../types/staff";
import { STAFF_STATUS_LABEL } from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function ScheduleList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const staffResult = await fetchStaffList({
        search,
        page: 1,
        limit: 50,
        sortBy: "name",
        order: "asc",
      });
      setStaff(staffResult.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách nhân viên"));
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
  }, [search]);

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý lịch làm việc</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Lịch nhân viên</h2>
        <p className="mt-1 text-sm text-spa-muted">
          Chọn nhân viên để xem lịch chi tiết, xếp lịch mới hoặc sửa/xóa ca làm việc.
        </p>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm nhân viên theo tên, email, SĐT"
          className="w-full max-w-xl rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        />
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}

      {loading ? <p className="text-sm text-spa-muted">Đang tải danh sách nhân viên...</p> : null}

      <div className="grid gap-4">
        {staff.map((member) => (
          <article key={member.id} className="rounded-2xl bg-spa-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                  Lịch làm việc
                </Link>
                <Link
                  to={`/admin/schedules/${member.id}?new=1`}
                  className="rounded-full bg-spa-primary px-4 py-2 text-sm text-white hover:bg-spa-dark"
                >
                  Xếp lịch mới
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!loading && staff.length === 0 ? (
        <p className="rounded-2xl bg-spa-white px-4 py-8 text-center text-spa-muted shadow-sm">
          Chưa có nhân viên để xếp lịch.
        </p>
      ) : null}
    </section>
  );
}