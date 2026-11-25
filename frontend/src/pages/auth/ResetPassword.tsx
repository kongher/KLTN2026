import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import { resetPasswordRequest } from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordRequest(token, newPassword);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đặt lại mật khẩu thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Đặt lại mật khẩu" subtitle="Dán token reset và nhập mật khẩu mới.">
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <label className="block text-sm">
          Reset token
          <textarea
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            rows={3}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Mật khẩu mới
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Xác nhận mật khẩu
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-rose-700 py-2.5 font-medium text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {submitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="text-rose-700 hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </AuthCard>
  );
}
