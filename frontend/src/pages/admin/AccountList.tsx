import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../contexts/AuthContext";
import {
  changeStaffStatus,
  deleteStaff,
  fetchStaffList,
} from "../../services/staffService";
import type { Pagination } from "../../types/service";
import type { AccountStatus, StaffMember, StaffStatus } from "../../types/staff";
import {
  ACCOUNT_STATUS_LABEL,
  ROLE_LABEL,
  STAFF_STATUS_LABEL,
} from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

type PendingAction =
  | { type: "lock"; member: StaffMember }
  | { type: "unlock"; member: StaffMember }
  | { type: "delete"; member: StaffMember };

const ACTION_COPY: Record<
  PendingAction["type"],
  { title: string; confirmLabel: string; tone: "danger" | "warning" | "default" }
> = {
  lock: {
    title: "Khóa tài khoản?",
    confirmLabel: "Khóa tài khoản",
    tone: "warning",
  },
  unlock: {
    title: "Mở khóa tài khoản?",
    confirmLabel: "Mở khóa",
    tone: "default",
  },
  delete: {
    title: "Bạn có chắc muốn xóa nhân viên này không?",
    confirmLabel: "Xác nhận",
    tone: "danger",
  },
};

function actionDescription(action: PendingAction) {
  const name = action.member.name;
  if (action.type === "lock") {
    return `${name} sẽ không thể đăng nhập cho đến khi được mở khóa. Lịch hẹn đang có không tự hủy.`;
  }
  if (action.type === "unlock") {
    return `Cho phép ${name} đăng nhập trở lại nếu tài khoản đang ở trạng thái hoạt động.`;
  }
  return `Nhân viên ${name} sẽ bị xóa khỏi hệ thống. Bấm Hủy để quay lại và giữ nguyên tài khoản.`;
}

export default function AccountList() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState<"ALL" | AccountStatus>("ALL");
  const [workStatus, setWorkStatus] = useState<"ALL" | StaffStatus>("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [working, setWorking] = useState(false);

  async function load() {
    try {
      const result = await fetchStaffList({
        search,
        status: workStatus,
        accountStatus,
        page,
        limit: 10,
        sortBy: "name",
        order: "asc",
      });
      setStaff(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách tài khoản"));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, accountStatus, workStatus, page]);

  function isSelf(member: StaffMember) {
    return user?.id === member.userId;
  }

  async function runPending() {
    if (!pending) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const { member, type } = pending;
      if (type === "delete") {
        await deleteStaff(member.id);
        setMessage(`Đã xóa tài khoản của ${member.name}`);
      } else {
        await changeStaffStatus(member.id, { locked: type === "lock" });
        setMessage(
          type === "lock"
            ? `Đã khóa tài khoản của ${member.name}`
            : `Đã mở khóa tài khoản của ${member.name}`
        );
      }
      setPending(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
      setPending(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Tài khoản & Bảo mật</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Quản trị tài khoản nhân viên</h2>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên, email, SĐT"
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
          <option value="ALL">Mọi trạng thái tài khoản</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Vô hiệu hóa</option>
          <option value="LOCKED">Đã khóa</option>
        </select>
        <select
          value={workStatus}
          onChange={(event) => {
            setWorkStatus(event.target.value as "ALL" | StaffStatus);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        >
          <option value="ALL">Mọi trạng thái làm việc</option>
          <option value="ACTIVE">Đang làm việc</option>
          <option value="INACTIVE">Ngưng làm việc</option>
        </select>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-spa-primary">{message}</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Tài khoản</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Quyền</th>
              <th className="px-4 py-3">Tài khoản</th>
              <th className="px-4 py-3">Làm việc</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const self = isSelf(member);
              const locked = member.accountStatus === "LOCKED";
              return (
                <tr key={member.id} className="border-t border-black/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} src={member.avatar} />
                      <div>
                        <p className="font-medium text-spa-dark">{member.name}</p>
                        <p className="text-xs text-spa-muted">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[member.role]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        locked
                          ? "bg-rose-50 text-rose-700"
                          : member.accountStatus === "ACTIVE"
                            ? "bg-spa-primary/10 text-spa-primary"
                            : "bg-black/5 text-spa-muted"
                      }`}
                    >
                      {ACCOUNT_STATUS_LABEL[member.accountStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{STAFF_STATUS_LABEL[member.status]}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <Link to={`/admin/accounts/${member.id}/edit`} className="text-spa-primary">
                        Sửa tài khoản
                      </Link>
                      {self ? (
                        <span className="text-xs text-spa-muted">Tài khoản hiện tại</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ type: locked ? "unlock" : "lock", member })
                            }
                          >
                            {locked ? "Mở khóa" : "Khóa"}
                          </button>
                          <button
                            type="button"
                            className="text-rose-700"
                            onClick={() => setPending({ type: "delete", member })}
                          >
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {staff.length === 0 ? (
          <p className="px-4 py-8 text-center text-spa-muted">Chưa có tài khoản nhân viên.</p>
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
        open={Boolean(pending)}
        title={pending ? ACTION_COPY[pending.type].title : ""}
        description={pending ? actionDescription(pending) : ""}
        confirmLabel={pending ? ACTION_COPY[pending.type].confirmLabel : "Xác nhận"}
        tone={pending ? ACTION_COPY[pending.type].tone : "default"}
        loading={working}
        onConfirm={() => void runPending()}
        onCancel={() => setPending(null)}
      />
    </section>
  );
}
