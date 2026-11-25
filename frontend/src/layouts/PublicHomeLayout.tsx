import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import CustomerFooter from "../components/customer/CustomerFooter";
import { useAuth } from "../contexts/AuthContext";
import { useHomeContent } from "../contexts/HomeContentContext";

export default function PublicHomeLayout() {
  const { user, logout } = useAuth();
  const { settings } = useHomeContent();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/home";
  const isAdmin = user?.role === "ADMIN";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-spa-bg text-spa-text">
      <header className="sticky top-0 z-40 border-b border-spa-primary/15 bg-spa-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <NavLink to="/home" className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-spa-accent">{settings.name}</p>
            <h1 className="text-lg font-semibold text-spa-dark">Trang chủ</h1>
          </NavLink>

          {isAdmin ? (
            <Link
              to="/admin/dashboard"
              className="rounded-full bg-spa-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-spa-dark"
            >
              Quay lại Admin
            </Link>
          ) : (
            <nav className="flex flex-wrap items-center gap-2">
              <NavLink
                to="/home"
                end
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-spa-primary text-white"
                      : "text-spa-muted hover:bg-spa-primary/10 hover:text-spa-dark"
                  }`
                }
              >
                Trang chủ
              </NavLink>
              {user?.role === "CUSTOMER" ? (
                <Link
                  to="/customer/dashboard"
                  className="rounded-full px-4 py-2 text-sm text-spa-muted hover:bg-spa-primary/10"
                >
                  Khu khách hàng
                </Link>
              ) : null}
              {user?.role === "STAFF" ? (
                <Link
                  to="/staff/dashboard"
                  className="rounded-full px-4 py-2 text-sm text-spa-muted hover:bg-spa-primary/10"
                >
                  Trang nhân viên
                </Link>
              ) : null}
              {user ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-full border border-spa-primary/20 px-4 py-2 text-sm text-spa-dark hover:bg-spa-primary hover:text-white"
                >
                  Đăng xuất
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-full bg-spa-primary px-4 py-2 text-sm text-white hover:bg-spa-dark"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full border border-spa-primary/20 px-4 py-2 text-sm text-spa-dark"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      {isHome ? (
        <div className="flex-1">
          <Outlet />
        </div>
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <Outlet />
        </main>
      )}

      <CustomerFooter />
    </div>
  );
}
