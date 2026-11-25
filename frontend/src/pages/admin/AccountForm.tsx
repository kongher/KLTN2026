import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../contexts/AuthContext";
import { fetchStaff, updateStaff } from "../../services/staffService";
import type { StaffAccountRole } from "../../types/staff";
import { ROLE_LABEL } from "../../utils/statusLabels";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function AccountForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalRole, setOriginalRole] = useState<StaffAccountRole>("STAFF");
  const [role, setRole] = useState<StaffAccountRole>("STAFF");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchStaff(id)
      .then((staff) => {
        setName(staff.name);
        setEmail(staff.email);
        setOriginalEmail(staff.email);
        setRole(staff.role);
        setOriginalRole(staff.role);
        setIsSelf(user?.id === staff.userId);
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được tài khoản")));
  }, [id, user?.id]);

  function validateAndAskConfirm(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password) {
      if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setError("Mật khẩu mới phải 8-72 ký tự và gồm ít nhất một chữ và một số.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    if (isSelf && role !== originalRole) {
      setError("Bạn không thể đổi quyền của tài khoản đang đăng nhập.");
      return;
    }

    setConfirmOpen(true);
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setError("");

    try {
      await updateStaff(id, {
        email,
        role,
        ...(password ? { password } : {}),
      });
      navigate("/admin/accounts");
    } catch (err) {
      setError(getErrorMessage(err, "Không lưu được tài khoản"));
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const roleChanged = role !== originalRole;
  const emailChanged = email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-spa-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Tài khoản & Bảo mật</p>
      <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Sửa tài khoản {name || ""}</h2>
      <p className="mt-2 text-sm text-spa-muted">
        Chỉ thay đổi email, mật khẩu và quyền đăng nhập. Thông tin chuyên môn được sửa ở mục Nhân viên.
      </p>

      <form onSubmit={validateAndAskConfirm} className="mt-6 space-y-4">
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        {isSelf ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Đây là tài khoản bạn đang đăng nhập. Có thể đổi email/mật khẩu, nhưng không thể đổi quyền.
          </div>
        ) : null}

        <label className="block text-sm">
          Email đăng nhập
          <input
            type="email"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Mật khẩu mới (để trống nếu không đổi)
          <input
            type="password"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          Xác nhận mật khẩu mới
          <input
            type="password"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          Quyền (role)
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={role}
            disabled={isSelf}
            onChange={(event) => setRole(event.target.value as StaffAccountRole)}
          >
            <option value="STAFF">Nhân viên (STAFF)</option>
            <option value="ADMIN">Quản trị (ADMIN)</option>
          </select>
        </label>
        {roleChanged ? (
          <p className="text-sm text-amber-800">
            Đổi sang {ROLE_LABEL[role]} sẽ thay đổi quyền truy cập ngay sau khi lưu. ADMIN vào trang
            quản trị; STAFF vào portal nhân viên.
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
          >
            Lưu thay đổi
          </button>
          <Link to="/admin/accounts" className="rounded-full border px-5 py-2.5">
            Hủy
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận thay đổi tài khoản?"
        description={[
          emailChanged ? `Email mới: ${email}.` : null,
          password ? "Mật khẩu sẽ được thay thế ngay lập tức." : null,
          roleChanged
            ? `Quyền sẽ đổi từ ${ROLE_LABEL[originalRole]} sang ${ROLE_LABEL[role]}.`
            : null,
          "Hãy chắc chắn thông tin đã đúng trước khi tiếp tục.",
        ]
          .filter(Boolean)
          .join(" ")}
        confirmLabel="Lưu tài khoản"
        tone={roleChanged || password ? "warning" : "default"}
        loading={saving}
        onConfirm={() => void handleSave()}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
