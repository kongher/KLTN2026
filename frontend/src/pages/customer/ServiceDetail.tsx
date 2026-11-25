import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ServiceImage from "../../components/ServiceImage";
import { fetchService } from "../../services/catalogService";
import type { SpaService } from "../../types/service";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<SpaService | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchService(id)
      .then(setService)
      .catch((err) => setError(getErrorMessage(err, "Không tìm thấy dịch vụ")));
  }, [id]);

  if (error) {
    return <p className="text-rose-700">{error}</p>;
  }

  if (!service) {
    return <p className="text-spa-muted">Đang tải chi tiết liệu trình...</p>;
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-spa-white shadow-sm lg:grid lg:grid-cols-2">
      <ServiceImage
        src={service.image}
        alt={service.name}
        className="h-72 w-full object-cover lg:h-full"
      />
      <div className="p-6 lg:p-10">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">
          {service.category?.name}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-spa-dark">{service.name}</h2>
        <p className="mt-4 leading-7 text-spa-muted">
          {service.description || "Liệu trình được thiết kế cho trải nghiệm thư giãn cao cấp."}
        </p>
        <div className="mt-6 flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-spa-muted">Giá</p>
            <p className="text-xl text-spa-primary">{formatPrice(service.price)}</p>
          </div>
          <div>
            <p className="text-sm text-spa-muted">Thời lượng</p>
            <p className="text-xl text-spa-dark">{formatDuration(service.duration)}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(`/customer/bookings/new?serviceId=${service.id}`)}
            className="rounded-full bg-spa-primary px-6 py-3 text-white hover:bg-spa-dark"
          >
            Đặt lịch
          </button>
          <Link to="/customer/services" className="rounded-full border px-6 py-3 text-spa-dark">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    </section>
  );
}
