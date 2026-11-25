import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ServiceImage from "../../components/ServiceImage";
import { fetchCategories, fetchServices } from "../../services/catalogService";
import type { Pagination, ServiceCategory, SpaService } from "../../types/service";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function Services() {
  const [services, setServices] = useState<SpaService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "price" | "name">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const query = useMemo(
    () => ({ search, categoryId, minPrice, maxPrice, sortBy, order, page, limit: 9 }),
    [search, categoryId, minPrice, maxPrice, sortBy, order, page]
  );

  useEffect(() => {
    void fetchCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchServices(query)
        .then((result) => {
          setServices(result.data);
          setPagination(result.pagination);
          setError("");
        })
        .catch((err) => setError(getErrorMessage(err, "Không tải được dịch vụ")))
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <section>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Liệu trình</p>
        <h2 className="mt-2 text-3xl font-semibold text-spa-dark">Dịch vụ spa</h2>
      </div>

      <div className="mb-8 grid gap-3 rounded-2xl bg-spa-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm kiếm liệu trình..."
          className="rounded-xl border border-black/10 px-3 py-2"
        />
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 px-3 py-2"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(event) => {
            setMinPrice(event.target.value);
            setPage(1);
          }}
          placeholder="Giá từ"
          className="rounded-xl border border-black/10 px-3 py-2"
        />
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(event) => {
            setMaxPrice(event.target.value);
            setPage(1);
          }}
          placeholder="Giá đến"
          className="rounded-xl border border-black/10 px-3 py-2"
        />
        <select
          value={`${sortBy}:${order}`}
          onChange={(event) => {
            const [nextSort, nextOrder] = event.target.value.split(":") as [
              "createdAt" | "price" | "name",
              "asc" | "desc",
            ];
            setSortBy(nextSort);
            setOrder(nextOrder);
          }}
          className="rounded-xl border border-black/10 px-3 py-2"
        >
          <option value="createdAt:desc">Mới nhất</option>
          <option value="price:asc">Giá tăng dần</option>
          <option value="price:desc">Giá giảm dần</option>
          <option value="name:asc">Tên A-Z</option>
          <option value="name:desc">Tên Z-A</option>
        </select>
      </div>

      {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-spa-muted">Đang tải dịch vụ...</p> : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.id}
            className="overflow-hidden rounded-2xl bg-spa-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ServiceImage
              src={service.image}
              alt={service.name}
              className="h-48 w-full object-cover"
            />
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide text-spa-accent">
                {service.category?.name}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-spa-dark">{service.name}</h3>
              <p className="mt-3 text-spa-primary">{formatPrice(service.price)}</p>
              <p className="text-sm text-spa-muted">{formatDuration(service.duration)}</p>
              <Link
                to={`/customer/services/${service.id}`}
                className="mt-4 inline-block rounded-full bg-spa-primary px-4 py-2 text-sm text-white hover:bg-spa-dark"
              >
                Xem chi tiết
              </Link>
            </div>
          </article>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-full border px-4 py-2 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm text-spa-muted">
            Trang {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-full border px-4 py-2 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      ) : null}
    </section>
  );
}
