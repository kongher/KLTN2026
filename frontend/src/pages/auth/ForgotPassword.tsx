import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import { forgotPasswordRequest } from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResetToken("");
    setMessage("");
    setSubmitting(true);

    try {
      const result = await forgotPasswordRequest(email);
      setMessage(result.message);
      setResetToken(result.data.resetToken);
    } catch (err) {
      setError(getErrorMessage(err, "Không tạo được mã đặt lại mật khẩu"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Quên mật khẩu"
      subtitle="MVP chưa gửi email thật. Token reset sẽ hiện ra để test."
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{message}</p>
        ) : null}
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
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-rose-700 py-2.5 font-medium text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {submitting ? "Đang tạo token..." : "Tạo reset token"}
        </button>
      </form>
      {resetToken ? (
        <div className="mt-4 rounded-lg bg-stone-100 p-3 text-xs break-all text-stone-700">
          <p className="mb-2 font-medium">Reset token (dev):</p>
          {resetToken}
          <Link
            to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
            className="mt-3 block text-sm text-rose-700 hover:underline"
          >
            Tiếp tục đặt lại mật khẩu
          </Link>
        </div>
      ) : null}
      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="text-rose-700 hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </AuthCard>
  );
}
