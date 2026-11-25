import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import CustomerFooter from "../components/customer/CustomerFooter";
import { useAuth } from "../contexts/AuthContext";
import { useHomeContent } from "../contexts/HomeContentContext";

const NAV_LINKS = [
  { to: "/customer/dashboard", label: "Trang chủ", end: true },
  { to: "/customer/services", label: "Dịch vụ" },
  { to: "/customer/bookings", label: "Lịch hẹn" },
  { to: "/customer/treatments", label: "Điều trị" },
  { to: "/customer/profile", label: "Hồ sơ" },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { settings } = useHomeContent();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/customer/dashboard";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-spa-bg text-spa-text">
      <header className="sticky top-0 z-40 border-b border-spa-primary/15 bg-spa-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <NavLink to="/customer/dashboard" className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">{settings.name}</p>
            <h1 className="text-lg font-semibold text-spa-dark">Trang khách hàng</h1>
          </NavLink>
          <nav className="flex flex-wrap items-center gap-2">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
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

      {isHome ? (
        <div className="flex-1">
          <Outlet />
        </div>
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <p className="mb-6 text-sm text-spa-muted">Xin chào, {user?.name}</p>
          <Outlet />
        </main>
      )}

      <CustomerFooter />
    </div>
  );
}
