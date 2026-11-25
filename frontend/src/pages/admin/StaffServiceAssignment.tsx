import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchServices } from "../../services/catalogService";
import { assignStaffServices, fetchStaff } from "../../services/staffService";
import type { SpaService } from "../../types/service";
import type { StaffMember } from "../../types/staff";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function StaffServiceAssignment() {
  const { id } = useParams();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [services, setServices] = useState<SpaService[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([fetchStaff(id), fetchServices({ status: "ALL", limit: 50 })])
      .then(([member, catalog]) => {
        setStaff(member);
        setServices(catalog.data);
        setSelected(member.services.map((service) => service.id));
      })
      .catch((err) => setError(getErrorMessage(err, "Không tải được dữ liệu phân công")));
  }, [id]);

  function toggle(serviceId: string) {
    setSelected((current) =>
      current.includes(serviceId)
        ? current.filter((value) => value !== serviceId)
        : [...current, serviceId]
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    setError("");
    setSaving(true);

    try {
      const updated = await assignStaffServices(id, selected);
      setSelected(updated.map((service) => service.id));
      setMessage("Đã cập nhật dịch vụ cho nhân viên");
    } catch (err) {
      setError(getErrorMessage(err, "Không lưu được phân công"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl bg-spa-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Phân công</p>
        <h2 className="mt-1 text-2xl font-semibold text-spa-dark">
          Dịch vụ của {staff?.name || "nhân viên"}
        </h2>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="text-sm text-spa-primary">{message}</p> : null}

        <div className="space-y-2">
          {services.map((service) => (
            <label
              key={service.id}
              className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3"
            >
              <span>
                <span className="block font-medium text-spa-dark">{service.name}</span>
                <span className="text-xs text-spa-muted">{service.status}</span>
              </span>
              <input
                type="checkbox"
                checked={selected.includes(service.id)}
                onChange={() => toggle(service.id)}
              />
            </label>
          ))}
          {services.length === 0 ? (
            <p className="text-sm text-spa-muted">Chưa có dịch vụ để phân công.</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu phân công"}
          </button>
          <Link to={id ? `/admin/staff/${id}` : "/admin/staff"} className="rounded-full border px-5 py-2.5">
            Quay lại
          </Link>
        </div>
      </form>
    </section>
  );
}
