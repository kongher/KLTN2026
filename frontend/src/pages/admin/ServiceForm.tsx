import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import { createService, fetchCategories, fetchService, updateService } from "../../services/catalogService";
import type { CatalogStatus, ServiceCategory } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<CatalogStatus>("ACTIVE");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchCategories("ALL")
      .then((items) => {
        setCategories(items);
        if (!id && items[0]) setCategoryId(items[0].id);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchService(id)
      .then((service) => {
        setCode(service.code);
        setName(service.name);
        setDescription(service.description || "");
        setPrice(String(service.price));
        setDuration(String(service.duration));
        setCategoryId(service.categoryId);
        setImage(service.image || "");
        setStatus(service.status);
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được dịch vụ")));
  }, [id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      code: code.trim(),
      name,
      description,
      price: Number(price),
      duration: Number(duration),
      categoryId,
      image,
      status,
    };

    try {
      if (isEdit && id) {
        await updateService(id, payload);
      } else {
        await createService(payload);
      }
      navigate("/admin/services");
    } catch (err) {
      setError(getErrorMessage(err, "Không lưu được dịch vụ"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-spa-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-spa-dark">
        {isEdit ? "Sửa dịch vụ" : "Thêm dịch vụ"}
      </h2>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <label className="block text-sm">
          Mã dịch vụ
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 uppercase"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            pattern="[A-Za-z0-9_-]{2,50}"
            title="2–50 ký tự: chữ, số, gạch dưới, gạch ngang. Không phân biệt hoa thường."
            required
            maxLength={50}
            placeholder="VD: MASS001"
          />
          <span className="mt-1 block text-xs text-spa-muted">
            Bắt buộc, không trùng (không phân biệt hoa/thường). Đổi tên dịch vụ không tự đổi mã.
          </span>
        </label>
        <label className="block text-sm">
          Tên
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Mô tả
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Giá
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Thời lượng (phút)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
            />
          </label>
        </div>
        <label className="block text-sm">
          Danh mục
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          >
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.status})
              </option>
            ))}
          </select>
        </label>
        <ImageUpload
          label="Ảnh dịch vụ"
          value={image}
          onChange={setImage}
          folder="spa-management/services"
        />
        <label className="block text-sm">
          Trạng thái
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value as CatalogStatus)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <Link to="/admin/services" className="rounded-full border px-5 py-2.5">
            Hủy
          </Link>
        </div>
      </form>
    </section>
  );
}
