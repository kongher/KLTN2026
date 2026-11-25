import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import { getDashboardPath, useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(identifier, password);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng nhập thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Đăng nhập" subtitle="Nhập email hoặc số điện thoại để tiếp tục.">
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <label className="block text-sm">
          Email hoặc số điện thoại
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-sm">
          Mật khẩu
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-rose-700 py-2.5 font-medium text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm text-stone-600">
        <Link to="/home" className="text-rose-700 hover:underline">
          Về trang chủ
        </Link>
        <Link to="/forgot-password" className="text-rose-700 hover:underline">
          Quên mật khẩu?
        </Link>
        <Link to="/register" className="text-rose-700 hover:underline">
          Tạo tài khoản khách
        </Link>
      </div>
    </AuthCard>
  );
}
