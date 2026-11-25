import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên",
  ADMIN: "Quản trị",
};

function linksFor(role: UserRole, basePath: string) {
  const items = [{ to: `${basePath}/dashboard`, label: "Tổng quan" }];
  if (role === "CUSTOMER") {
    items[0] = { to: `${basePath}/dashboard`, label: "Trang chủ" };
    items.push({ to: `${basePath}/services`, label: "Dịch vụ" });
    items.push({ to: `${basePath}/bookings`, label: "Lịch hẹn" });
    items.push({ to: `${basePath}/treatments`, label: "Điều trị" });
  }
  if (role === "STAFF") {
    items.push({ to: `${basePath}/schedule`, label: "Lịch làm việc" });
    items.push({ to: `${basePath}/bookings`, label: "Lịch hẹn" });
    items.push({ to: `${basePath}/treatments`, label: "Điều trị" });
    items.push({ to: `${basePath}/profile`, label: "Hồ sơ của tôi" });
  } else {
    items.push({ to: `${basePath}/profile`, label: "Hồ sơ" });
  }
  return items;
}

type AppShellProps = {
  role: UserRole;
  basePath: string;
};

export default function AppShell({ role, basePath }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-spa-bg text-spa-text">
      <header className="border-b border-spa-primary/15 bg-spa-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">Lumina Spa</p>
            <h1 className="text-lg font-semibold text-spa-dark">{ROLE_LABEL[role]}</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {linksFor(role, basePath).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-spa-primary text-white"
                      : "text-spa-muted hover:bg-spa-primary/10 hover:text-spa-dark"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-full border border-spa-primary/20 px-4 py-2 text-sm text-spa-dark hover:bg-spa-primary hover:text-white"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-6 text-sm text-spa-muted">Xin chào, {user?.name}</p>
        <Outlet />
      </main>
    </div>
  );
}
