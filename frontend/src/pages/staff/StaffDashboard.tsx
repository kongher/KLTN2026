import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStaffPendingBookingsCount } from "../../services/bookingService";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function StaffDashboard() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchStaffPendingBookingsCount()
      .then((count) => {
        if (!cancelled) setPendingCount(count);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl bg-spa-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Nhân viên</p>
      <h2 className="mt-2 text-xl font-semibold text-spa-dark">Ca làm việc & lịch hẹn</h2>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/staff/bookings"
          className="inline-flex items-center rounded-full bg-spa-primary px-5 py-2.5 text-white hover:bg-spa-dark"
        >
          Lịch hẹn của tôi
          <CountBadge count={pendingCount} />
        </Link>
        <Link
          to="/staff/treatments"
          className="inline-flex rounded-full border px-5 py-2.5"
        >
          Hồ sơ điều trị
        </Link>
        <Link
          to="/staff/schedule"
          className="inline-flex rounded-full border px-5 py-2.5"
        >
          Lịch làm việc
        </Link>
      </div>
    </section>
  );
}
