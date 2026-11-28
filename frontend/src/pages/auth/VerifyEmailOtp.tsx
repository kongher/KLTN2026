import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import OtpInput from "../../components/OtpInput";
import { getDashboardPath, useAuth } from "../../contexts/AuthContext";
import { resendEmailOtpRequest, type RegisterOtpPending } from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";

type VerifyEmailOtpProps = {
  email: string;
  maskedEmail: string;
  pending: RegisterOtpPending;
  onExpired: () => void;
  onBack: () => void;
  onSessionUpdate: (pending: RegisterOtpPending) => void;
};

function secondsLeft(expiresAt: string) {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function VerifyEmailOtp({
  email,
  maskedEmail,
  pending,
  onExpired,
  onBack,
  onSessionUpdate,
}: VerifyEmailOtpProps) {
  const { verifyEmailOtp } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiresAt, setExpiresAt] = useState(pending.expiresAt);
  const [resendAvailableAt, setResendAvailableAt] = useState(pending.resendAvailableAt);
  const [remaining, setRemaining] = useState(() => secondsLeft(pending.expiresAt));
  const [resendIn, setResendIn] = useState(() =>
    Math.max(0, Math.floor((new Date(pending.resendAvailableAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = window.setInterval(() => {
      setRemaining(secondsLeft(expiresAt));
      setResendIn(
        Math.max(0, Math.floor((new Date(resendAvailableAt).getTime() - Date.now()) / 1000))
      );
    }, 1000);
    return () => window.clearInterval(tick);
  }, [expiresAt, resendAvailableAt]);

  useEffect(() => {
    if (remaining === 0) {
      onExpired();
    }
  }, [remaining, onExpired]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    if (remaining <= 0) {
      setError("Mã OTP đã hết hạn. Vui lòng đăng ký lại.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await verifyEmailOtp({ email, otp });
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Xác thực thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || resending) return;
    setError("");
    setMessage("");
    setResending(true);
    try {
      const next = await resendEmailOtpRequest(email);
      setExpiresAt(next.expiresAt);
      setResendAvailableAt(next.resendAvailableAt);
      onSessionUpdate(next);
      setOtp("");
      setMessage("Đã gửi mã OTP mới đến email của bạn.");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể gửi lại mã OTP"));
    } finally {
      setResending(false);
    }
  }

  const expired = remaining <= 0;

  return (
    <AuthCard
      title="Xác thực Email"
      subtitle={`Mã gồm 6 chữ số đã được gửi tới ${maskedEmail}.`}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{message}</p>
        ) : null}

        <div className="text-center text-sm text-stone-600">
          {expired ? (
            <p className="text-rose-700">Mã OTP đã hết hạn.</p>
          ) : (
            <p>
              Mã hết hạn sau:{" "}
              <span className="font-semibold text-[#C9A46C]">{formatCountdown(remaining)}</span>
            </p>
          )}
        </div>

        <OtpInput value={otp} onChange={setOtp} disabled={submitting || expired} />

        <button
          type="submit"
          disabled={submitting || expired || otp.length !== 6}
          className="w-full rounded-lg bg-[#C9A46C] py-2.5 font-medium text-white hover:bg-[#b8935b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Đang xác thực..." : "Xác nhận"}
        </button>

        <div className="flex flex-col gap-3 text-center text-sm">
          <button
            type="button"
            disabled={resending || resendIn > 0 || expired}
            onClick={() => void handleResend()}
            className="text-[#C9A46C] hover:underline disabled:cursor-not-allowed disabled:text-stone-400"
          >
            {resending
              ? "Đang gửi lại..."
              : resendIn > 0
                ? `Gửi lại mã sau ${resendIn}s`
                : "Gửi lại mã OTP"}
          </button>
          <button type="button" onClick={onBack} className="text-stone-600 hover:underline">
            Quay lại đăng ký
          </button>
        </div>
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