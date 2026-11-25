import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import ServiceImage from "../../components/ServiceImage";
import {
  changeServiceStatus,
  deleteService,
  fetchServices,
} from "../../services/catalogService";
import type { Pagination, SpaService } from "../../types/service";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function AdminServices() {
  const [services, setServices] = useState<SpaService[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<
    | { type: "delete"; service: SpaService }
    | { type: "status"; service: SpaService }
    | null
  >(null);
  const [working, setWorking] = useState(false);

  async function load() {
    try {
      const result = await fetchServices({
        search,
        status,
        page,
        limit: 10,
        sortBy: "createdAt",
        order: "desc",
      });
      setServices(result.data);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được dịch vụ"));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  async function handleStatus(service: SpaService) {
    const next = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await changeServiceStatus(service.id, next);
      setMessage(`Đã ${next === "ACTIVE" ? "kích hoạt" : "tạm ẩn"} dịch vụ`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(service: SpaService) {
    try {
      await deleteService(service.id);
      setMessage("Đã xóa dịch vụ");
      await load();
    } catch (err) {
      const text = getErrorMessage(err);
      setError(text);
      if (text.toLowerCase().includes("inactive")) {
        setMessage("Dịch vụ đang được sử dụng. Hãy dùng Deactivate.");
      }
    }
  }

  async function runPending() {
    if (!pending) return;
    setWorking(true);
    setError("");
    try {
      if (pending.type === "delete") {
        await handleDelete(pending.service);
      } else {
        await handleStatus(pending.service);
      }
      setPending(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Quản lý</p>
          <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Dịch vụ</h2>
        </div>
        <Link
          to="/admin/services/new"
          className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
        >
          Thêm dịch vụ
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên hoặc mô tả"
          className="min-w-56 flex-1 rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "ALL" | "ACTIVE" | "INACTIVE");
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-spa-white px-3 py-2"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-spa-primary">{message}</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-spa-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-spa-muted">
            <tr>
              <th className="px-4 py-3">Ảnh</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Thời lượng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t border-black/5">
                <td className="px-4 py-3">
                  <ServiceImage
                    src={service.image}
                    alt={service.name}
                    className="h-12 w-16 rounded-xl object-cover"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-spa-dark">{service.name}</td>
                <td className="px-4 py-3">{service.category?.name}</td>
                <td className="px-4 py-3">{formatPrice(service.price)}</td>
                <td className="px-4 py-3">{formatDuration(service.duration)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      service.status === "ACTIVE"
                        ? "bg-spa-primary/10 text-spa-primary"
                        : "bg-black/5 text-spa-muted"
                    }`}
                  >
                    {service.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/services/${service.id}/edit`} className="text-spa-primary">
                      Sửa
                    </Link>
                    <button type="button" onClick={() => setPending({ type: "status", service })}>
                      {service.status === "ACTIVE" ? "Ẩn" : "Hiện"}
                    </button>
                    <button
                      type="button"
                      className="text-rose-700"
                      onClick={() => setPending({ type: "delete", service })}
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

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Trước
          </button>
          <span>
            {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending?.type === "delete"
            ? "Xóa dịch vụ?"
            : pending?.service.status === "ACTIVE"
              ? "Ẩn dịch vụ?"
              : "Hiện dịch vụ?"
        }
        description={
          pending?.type === "delete"
            ? `Dịch vụ "${pending.service.name}" sẽ bị xóa. Hành động này không thể hoàn tác.`
            : pending
              ? `Bạn chắc chắn muốn ${pending.service.status === "ACTIVE" ? "ẩn" : "hiện"} dịch vụ "${pending.service.name}"?`
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
