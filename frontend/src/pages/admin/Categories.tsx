import { useEffect, useState, type FormEvent } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../services/catalogService";
import type { CatalogStatus, ServiceCategory } from "../../types/service";
import { getErrorMessage } from "../../utils/getErrorMessage";

const emptyForm = {
  name: "",
  description: "",
  status: "ACTIVE" as CatalogStatus,
};

export default function Categories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<
    | { type: "delete"; category: ServiceCategory }
    | { type: "status"; category: ServiceCategory }
    | null
  >(null);
  const [working, setWorking] = useState(false);

  async function load() {
    const items = await fetchCategories("ALL");
    setCategories(items);
  }

  useEffect(() => {
    void load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(category: ServiceCategory) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
      status: category.status,
    });
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        setMessage("Đã cập nhật danh mục");
      } else {
        await createCategory(form);
        setMessage("Đã tạo danh mục");
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Không lưu được danh mục"));
    }
  }

  async function handleDelete(category: ServiceCategory) {
    try {
      await deleteCategory(category.id);
      setMessage("Đã xóa danh mục");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleStatus(category: ServiceCategory) {
    try {
      await updateCategory(category.id, {
        status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      setMessage(
        category.status === "ACTIVE" ? "Đã ẩn danh mục" : "Đã hiện danh mục"
      );
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function runPending() {
    if (!pending) return;
    setWorking(true);
    setError("");
    try {
      if (pending.type === "delete") {
        await handleDelete(pending.category);
      } else {
        await toggleStatus(pending.category);
      }
      setPending(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Danh mục dịch vụ</h2>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
        >
          Thêm danh mục
        </button>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-spa-primary">{message}</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-spa-muted">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3">Số dịch vụ</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium">{category.name}</td>
                <td className="px-4 py-3 text-spa-muted">{category.description}</td>
                <td className="px-4 py-3">{category._count?.services ?? 0}</td>
                <td className="px-4 py-3">{category.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEdit(category)}>
                      Sửa
                    </button>
                    <button type="button" onClick={() => setPending({ type: "status", category })}>
                      {category.status === "ACTIVE" ? "Ẩn" : "Hiện"}
                    </button>
                    <button
                      type="button"
                      className="text-rose-700"
                      onClick={() => setPending({ type: "delete", category })}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="w-full max-w-md rounded-2xl bg-spa-white p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold">
              {editingId ? "Sửa danh mục" : "Thêm danh mục"}
            </h3>
            <label className="mt-4 block text-sm">
              Tên
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>
            <label className="mt-4 block text-sm">
              Mô tả
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label className="mt-4 block text-sm">
              Trạng thái
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as CatalogStatus })
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>
            <div className="mt-6 flex gap-3">
              <button type="submit" className="rounded-full bg-spa-primary px-4 py-2 text-white">
                Lưu
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border px-4 py-2">
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending?.type === "delete"
            ? "Xóa danh mục?"
            : pending?.category.status === "ACTIVE"
              ? "Ẩn danh mục?"
              : "Hiện danh mục?"
        }
        description={
          pending?.type === "delete"
            ? `Danh mục "${pending.category.name}" sẽ bị xóa. Hành động này không thể hoàn tác.`
            : pending
              ? `Bạn chắc chắn muốn ${pending.category.status === "ACTIVE" ? "ẩn" : "hiện"} danh mục "${pending.category.name}"?`
              : ""
        }
        confirmLabel={pending?.type === "delete" ? "Xác nhận xóa" : "Xác nhận"}
        cancelLabel="Hủy"
        tone={pending?.type === "delete" ? "danger" : "default"}
        loading={working}
        onConfirm={() => void runPending()}
        onCancel={() => setPending(null)}
      />
    </section>
  );
}
