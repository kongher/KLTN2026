import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchStaffList } from "../../services/staffService";
import type { Pagination } from "../../types/service";
import type { StaffMember, StaffStatus } from "../../types/staff";
import { STAFF_STATUS_LABEL } from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | StaffStatus>("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await fetchStaffList({
        search,
        status,
        page,
        limit: 10,
        sortBy: "createdAt",
        order: "desc",
      });
      setStaff(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách nhân viên"));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý nhân viên</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Hồ sơ nhân viên</h2>
        </div>
        <Link
          to="/admin/staff/new"
          className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
        >
          Thêm nhân viên mới
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên, email, SĐT hoặc chuyên môn"
          className="min-w-56 flex-1 rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "ALL" | StaffStatus);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang làm việc</option>
          <option value="INACTIVE">Ngưng làm việc</option>
        </select>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Avatar</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">SĐT</th>
              <th className="px-4 py-3">Chuyên môn</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-t border-black/5">
                <td className="px-4 py-3">
                  <Avatar name={member.name} src={member.avatar} />
                </td>
                <td className="px-4 py-3 font-medium text-spa-dark">{member.name}</td>
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3">{member.phone}</td>
                <td className="px-4 py-3">{member.specialization || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      member.status === "ACTIVE"
                        ? "bg-spa-primary/10 text-spa-primary"
                        : "bg-black/5 text-spa-muted"
                    }`}
                  >
                    {STAFF_STATUS_LABEL[member.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {member.services.length
                    ? member.services.map((service) => service.name).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <Link to={`/admin/staff/${member.id}`} className="text-spa-primary">
                      Xem
                    </Link>
                    <Link to={`/admin/staff/${member.id}/edit`} className="text-spa-primary">
                      Sửa
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff.length === 0 ? (
          <p className="px-4 py-8 text-center text-spa-muted">Chưa có nhân viên.</p>
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
