import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import { createStaff, fetchStaff, updateStaff } from "../../services/staffService";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function StaffForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchStaff(id)
      .then((staff) => {
        setName(staff.name);
        setEmail(staff.email);
        setPhone(staff.phone);
        setSpecialization(staff.specialization || "");
        setAvatar(staff.avatar || "");
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được nhân viên")));
  }, [id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isEdit && id) {
        await updateStaff(id, {
          name,
          phone,
          specialization,
          avatar,
        });
        navigate(`/admin/staff/${id}`);
      } else {
        await createStaff({
          name,
          email,
          phone,
          password,
          specialization,
          avatar,
        });
        navigate("/admin/staff");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Không lưu được nhân viên"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-spa-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý nhân viên</p>
      <h2 className="mt-1 text-2xl font-semibold text-spa-dark">
        {isEdit ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
      </h2>
      <p className="mt-2 text-sm text-spa-muted">
        {isEdit
          ? "Cập nhật thông tin cá nhân và chuyên môn. Email, mật khẩu và quyền truy cập được quản lý tại Tài khoản & Bảo mật."
          : "Tạo hồ sơ nhân viên kèm tài khoản đăng nhập. Sau này khóa, xóa hoặc đổi mật khẩu tại mục Tài khoản & Bảo mật."}
      </p>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
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
        {isEdit ? (
          <div className="rounded-xl bg-spa-bg px-4 py-3 text-sm text-spa-muted">
            Email hiện tại: <span className="font-medium text-spa-dark">{email}</span>
            {" · "}
            <Link to={`/admin/accounts/${id}/edit`} className="text-spa-primary">
              Sửa tài khoản
            </Link>
          </div>
        ) : (
          <>
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
              Mật khẩu ban đầu
              <input
                type="password"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
            </label>
          </>
        )}
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
            placeholder="Chăm sóc da mặt, massage..."
          />
        </label>
        <ImageUpload
          label="Avatar"
          value={avatar}
          onChange={setAvatar}
          folder="spa-management/avatars"
        />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <Link to={id ? `/admin/staff/${id}` : "/admin/staff"} className="rounded-full border px-5 py-2.5">
            Hủy
          </Link>
        </div>
      </form>
    </section>
  );
}
