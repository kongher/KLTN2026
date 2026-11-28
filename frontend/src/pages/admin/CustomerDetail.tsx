import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchCustomer } from "../../services/customerService";
import type { CustomerProfile } from "../../types/customer";
import { ACCOUNT_STATUS_LABEL } from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

function genderLabel(value: string | null) {
  if (!value) return "Chưa cập nhật";
  const map: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };
  return map[value] || value;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchCustomer(id)
      .then((data) => {
        setCustomer(data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được khách hàng")));
  }, [id]);

  if (error && !customer) {
    return <p className="text-sm text-rose-700">{error}</p>;
  }

  if (!customer) {
    return <p className="text-spa-muted">Đang tải khách hàng...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý khách hàng</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">{customer.name}</h2>
          <p className="mt-1 text-sm text-spa-muted">Thông tin tài khoản khách hàng</p>
        </div>
        <Link to="/admin/customers" className="rounded-full border px-5 py-2.5 text-sm">
          Quay lại danh sách
        </Link>
      </div>

      <div className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={customer.name} src={customer.avatar} className="h-16 w-16 text-lg" />
          <div>
            <p className="font-medium text-spa-dark">{customer.name}</p>
            <p className="text-sm text-spa-muted">
              {customer.emailVerified ? "Email đã xác thực" : "Email chưa xác thực"}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Email</dt>
            <dd className="mt-1">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Số điện thoại</dt>
            <dd className="mt-1">{customer.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Trạng thái tài khoản</dt>
            <dd className="mt-1">{ACCOUNT_STATUS_LABEL[customer.accountStatus]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Giới tính</dt>
            <dd className="mt-1">{genderLabel(customer.gender)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Ngày sinh</dt>
            <dd className="mt-1">{customer.dateOfBirth || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Địa chỉ</dt>
            <dd className="mt-1">{customer.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-spa-muted">Số lịch hẹn</dt>
            <dd className="mt-1">{customer.bookingCount}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}