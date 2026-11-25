import { useEffect, useState, type FormEvent } from "react";
import ImageUpload from "../../components/ImageUpload";
import { useAuth } from "../../contexts/AuthContext";
import {
  changePasswordRequest,
  fetchMe,
  updateProfileRequest,
} from "../../services/authService";
import type { ProfileUser } from "../../types/auth";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function Profile() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchMe();
        if (cancelled) return;
        setProfile(data);
        setName(data.name);
        setPhone(data.phone);
        setAvatar(data.avatar || "");
        setUser(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const updated = await updateProfileRequest({ name, phone, avatar });
      setProfile(updated);
      setUser(updated);
      setMessage("Đã cập nhật hồ sơ");
    } catch (err) {
      setError(getErrorMessage(err, "Cập nhật thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      await changePasswordRequest(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Đã đổi mật khẩu");
    } catch (err) {
      setError(getErrorMessage(err, "Đổi mật khẩu thất bại"));
    } finally {
      setSaving(false);
    }
  }

  if (!profile && !error) {
    return <p className="text-stone-500">Đang tải hồ sơ...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Thông tin tài khoản</h2>
        <form onSubmit={(event) => void handleSave(event)} className="mt-4 space-y-4">
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          {message ? <p className="text-sm text-teal-700">{message}</p> : null}
          <label className="block text-sm">
            Họ tên
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2"
              value={profile?.email || ""}
              disabled
            />
          </label>
          <label className="block text-sm">
            Số điện thoại
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <ImageUpload
            label="Avatar"
            value={avatar}
            onChange={setAvatar}
            folder="spa-management/avatars"
          />
          <p className="text-sm text-stone-500">
            Role: {profile?.role} · Status: {profile?.status}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-rose-700 px-4 py-2 text-white hover:bg-rose-800 disabled:opacity-60"
          >
            Lưu hồ sơ
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Đổi mật khẩu</h2>
        <form
          onSubmit={(event) => void handleChangePassword(event)}
          className="mt-4 space-y-4"
        >
          <label className="block text-sm">
            Mật khẩu hiện tại
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Mật khẩu mới
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-stone-800 px-4 py-2 text-white hover:bg-stone-900 disabled:opacity-60"
          >
            Đổi mật khẩu
          </button>
        </form>
      </section>
    </div>
  );
}
