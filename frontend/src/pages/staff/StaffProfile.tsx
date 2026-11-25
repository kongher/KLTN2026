import { useEffect, useState, type FormEvent } from "react";
import ImageUpload from "../../components/ImageUpload";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../contexts/AuthContext";
import { changePasswordRequest } from "../../services/authService";
import { fetchStaffProfile, updateStaffProfile } from "../../services/staffService";
import type { StaffMember } from "../../types/staff";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { ACCOUNT_STATUS_LABEL, STAFF_STATUS_LABEL } from "../../utils/statusLabels";

type Mode = "view" | "edit" | "password";

export default function StaffProfile() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState<Mode>("view");
  const [profile, setProfile] = useState<StaffMember | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  function syncForm(data: StaffMember) {
    setProfile(data);
    setName(data.name);
    setEmail(data.email);
    setPhone(data.phone);
    setAvatar(data.avatar || "");
    setSpecialization(data.specialization || "");
    setUser({
      id: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      role: "STAFF",
      status: data.accountStatus,
    });
  }

  async function load() {
    setLoading(true);
    try {
      const data = await fetchStaffProfile();
      syncForm(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEdit() {
    if (!profile) return;
    syncForm(profile);
    setMessage("");
    setError("");
    setMode("edit");
  }

  function openPassword() {
    setCurrentPassword("");
    setNewPassword("");
    setMessage("");
    setError("");
    setMode("password");
  }

  function backToView() {
    if (profile) syncForm(profile);
    setCurrentPassword("");
    setNewPassword("");
    setMessage("");
    setError("");
    setMode("view");
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const updated = await updateStaffProfile({
        name,
        email,
        phone,
        avatar,
        specialization,
      });
      syncForm(updated);
      setMessage("Đã cập nhật hồ sơ");
      setMode("view");
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
      setMode("view");
    } catch (err) {
      setError(getErrorMessage(err, "Đổi mật khẩu thất bại"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-spa-muted">Đang tải hồ sơ...</p>;
  }

  if (!profile) {
    return (
      <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-spa-dark">Hồ sơ của tôi</h2>
        <p className="mt-3 text-sm text-rose-700">{error || "Không tải được hồ sơ."}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-full border px-5 py-2.5 text-sm"
        >
          Thử lại
        </button>
      </section>
    );
  }

  if (mode === "edit") {
    return (
      <section className="mx-auto max-w-xl rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-spa-dark">Chỉnh sửa hồ sơ</h2>
          <p className="text-sm text-spa-muted">Cập nhật thông tin cá nhân của bạn.</p>
        </div>

        <ImageUpload
          label="Avatar"
          value={avatar}
          onChange={setAvatar}
          folder="spa-management/avatars"
        />

        <form onSubmit={(event) => void handleSave(event)} className="mt-5 space-y-4">
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <label className="block text-sm">
            Họ tên
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Số điện thoại
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Chuyên môn
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              type="button"
              onClick={backToView}
              className="rounded-full border px-5 py-2.5"
            >
              Hủy
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (mode === "password") {
    return (
      <section className="mx-auto max-w-xl rounded-2xl bg-spa-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-spa-dark">Đổi mật khẩu</h2>
          <p className="text-sm text-spa-muted">Nhập mật khẩu hiện tại và mật khẩu mới.</p>
        </div>
        <form onSubmit={(event) => void handleChangePassword(event)} className="space-y-4">
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <label className="block text-sm">
            Mật khẩu hiện tại
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Mật khẩu mới
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Đổi mật khẩu"}
            </button>
            <button
              type="button"
              onClick={backToView}
              className="rounded-full border px-5 py-2.5"
            >
              Hủy
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl bg-spa-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <Avatar name={profile.name} src={profile.avatar} className="h-14 w-14" />
        <div>
          <h2 className="text-xl font-semibold text-spa-dark">Hồ sơ của tôi</h2>
          <p className="text-sm text-spa-muted">Thông tin cá nhân nhân viên</p>
        </div>
      </div>

      {message ? <p className="mb-4 text-sm text-spa-primary">{message}</p> : null}
      {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-spa-muted">Họ tên</dt>
          <dd className="mt-0.5 font-medium text-spa-dark">{profile.name}</dd>
        </div>
        <div>
          <dt className="text-spa-muted">Email</dt>
          <dd className="mt-0.5 font-medium text-spa-dark">{profile.email}</dd>
        </div>
        <div>
          <dt className="text-spa-muted">Số điện thoại</dt>
          <dd className="mt-0.5 font-medium text-spa-dark">{profile.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-spa-muted">Chuyên môn</dt>
          <dd className="mt-0.5 font-medium text-spa-dark">{profile.specialization || "—"}</dd>
        </div>
        <div>
          <dt className="text-spa-muted">Trạng thái</dt>
          <dd className="mt-0.5 font-medium text-spa-dark">
            {STAFF_STATUS_LABEL[profile.status]} · Tài khoản: {ACCOUNT_STATUS_LABEL[profile.accountStatus]}
          </dd>
        </div>
        <div>
          <dt className="text-spa-muted">Dịch vụ phụ trách</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {profile.services.length ? (
              profile.services.map((service) => (
                <span
                  key={service.id}
                  className="rounded-full bg-spa-primary/10 px-3 py-1 text-xs text-spa-dark"
                >
                  {service.name}
                </span>
              ))
            ) : (
              <span className="text-spa-muted">Chưa được phân công.</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openEdit}
          className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
        >
          Chỉnh sửa
        </button>
        <button
          type="button"
          onClick={openPassword}
          className="rounded-full border px-5 py-2.5"
        >
          Đổi mật khẩu
        </button>
      </div>
    </section>
  );
}
