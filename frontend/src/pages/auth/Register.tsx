import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import { useAuth } from "../../contexts/AuthContext";
import type { RegisterOtpPending } from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import VerifyEmailOtp from "./VerifyEmailOtp";

type Step = "form" | "otp";

export default function Register() {
  const { register } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<RegisterOtpPending | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);
    try {
      const session = await register({ name, email, phone, password });
      setPending(session);
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err, "Đăng ký thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "otp" && pending) {
    return (
      <VerifyEmailOtp
        email={email.trim().toLowerCase()}
        maskedEmail={pending.email}
        pending={pending}
        onSessionUpdate={setPending}
        onBack={() => {
          setStep("form");
          setPending(null);
          setError("");
        }}
        onExpired={() => {
          setStep("form");
          setPending(null);
          setError("Mã OTP đã hết hạn. Vui lòng đăng ký lại.");
        }}
      />
    );
  }

  return (
    <AuthCard title="Đăng ký" subtitle="Tạo tài khoản khách hàng Lumina Spa.">
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <label className="block text-sm">
          Họ tên
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#C9A46C]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#C9A46C]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Số điện thoại
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#C9A46C]"
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
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#C9A46C]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Xác nhận mật khẩu
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#C9A46C]"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#C9A46C] py-2.5 font-medium text-white hover:bg-[#b8935b] disabled:opacity-60"
        >
          {submitting ? "Đang gửi mã OTP..." : "Đăng ký"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-600">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-[#C9A46C] hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthCard>
  );
}