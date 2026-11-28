import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { fetchCustomerList } from "../../services/customerService";
import type { CustomerProfile } from "../../types/customer";
import type { Pagination } from "../../types/service";
import type { AccountStatus } from "../../types/staff";
import { ACCOUNT_STATUS_LABEL } from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

function genderLabel(value: string | null) {
  if (!value) return "—";
  const map: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };
  return map[value] || value;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState<"ALL" | AccountStatus>("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await fetchCustomerList({
        search,
        accountStatus,
        page,
        limit: 10,
        sortBy: "createdAt",
        order: "desc",
      });
      setCustomers(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách khách hàng"));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, accountStatus, page]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý khách hàng</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Hồ sơ khách hàng</h2>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên, email hoặc SĐT"
          className="min-w-56 flex-1 rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        />
        <select
          value={accountStatus}
          onChange={(event) => {
            setAccountStatus(event.target.value as "ALL" | AccountStatus);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Vô hiệu hóa</option>
          <option value="LOCKED">Đã khóa</option>
          <option value="BANNED">Bị cấm</option>
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
              <th className="px-4 py-3">Giới tính</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Lịch hẹn</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-black/5">
                <td className="px-4 py-3">
                  <Avatar name={customer.name} src={customer.avatar} />
                </td>
                <td className="px-4 py-3 font-medium text-spa-dark">{customer.name}</td>
                <td className="px-4 py-3">{customer.email}</td>
                <td className="px-4 py-3">{customer.phone || "—"}</td>
                <td className="px-4 py-3">{genderLabel(customer.gender)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      customer.accountStatus === "ACTIVE"
                        ? "bg-spa-primary/10 text-spa-primary"
                        : "bg-black/5 text-spa-muted"
                    }`}
                  >
                    {ACCOUNT_STATUS_LABEL[customer.accountStatus]}
                  </span>
                </td>
                <td className="px-4 py-3">{customer.bookingCount}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/customers/${customer.id}`} className="text-spa-primary">
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 ? (
          <p className="px-4 py-8 text-center text-spa-muted">Chưa có khách hàng.</p>
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