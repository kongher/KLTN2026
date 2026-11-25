import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import { getDashboardPath, useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({ name, email, phone, password });
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng ký thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Đăng ký" subtitle="Chỉ khách hàng được tự đăng ký tài khoản.">
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <label className="block text-sm">
          Họ tên
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Số điện thoại
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-rose-500"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0901234567"
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
          {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-600">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-rose-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthCard>
  );
}
