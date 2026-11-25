import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchStaff } from "../../services/staffService";
import type { StaffMember } from "../../types/staff";
import { STAFF_STATUS_LABEL } from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function StaffDetail() {
  const { id } = useParams();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchStaff(id)
      .then((data) => {
        setStaff(data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được nhân viên")));
  }, [id]);

  if (error && !staff) {
    return <p className="text-sm text-rose-700">{error}</p>;
  }

  if (!staff) {
    return <p className="text-spa-muted">Đang tải nhân viên...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý nhân viên</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">{staff.name}</h2>
          <p className="mt-1 text-sm text-spa-muted">Thông tin cá nhân và chuyên môn</p>
        </div>
        <Link to="/admin/staff" className="rounded-full border px-5 py-2.5 text-sm">
          Quay lại danh sách
        </Link>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={staff.name} src={staff.avatar} className="h-16 w-16 text-lg" />
          <div>
            <p className="font-medium text-spa-dark">{staff.name}</p>
            <p className="text-sm text-spa-muted">{staff.specialization || "Chưa có chuyên môn"}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Email</dt>
            <dd className="mt-1">{staff.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Số điện thoại</dt>
            <dd className="mt-1">{staff.phone}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Trạng thái làm việc</dt>
            <dd className="mt-1">{STAFF_STATUS_LABEL[staff.status]}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-spa-dark">Dịch vụ phụ trách</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {staff.services.length ? (
              staff.services.map((service) => (
                <span
                  key={service.id}
                  className="rounded-full bg-spa-primary/10 px-3 py-1 text-sm text-spa-dark"
                >
                  {service.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-spa-muted">Chưa phân công dịch vụ.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={`/admin/staff/${staff.id}/edit`}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
          >
            Sửa thông tin
          </Link>
          <Link
            to={`/admin/staff/${staff.id}/services`}
            className="rounded-full border px-5 py-2.5"
          >
            Phân công dịch vụ
          </Link>
        </div>
      </div>
    </section>
  );
}
