import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type NavItem = { to: string; label: string; end?: boolean };

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const dashboardItem: NavItem = { to: "/admin/dashboard", label: "Dashboard", end: true };
const bookingItem: NavItem = { to: "/admin/bookings", label: "Quản lý Lịch hẹn" };

const navGroups: NavGroup[] = [
  {
    id: "staff",
    label: "Nhân sự",
    items: [
      { to: "/admin/staff", label: "Nhân viên" },
      { to: "/admin/schedules", label: "Lịch làm việc" },
      { to: "/admin/accounts", label: "Tài khoản & Bảo mật" },
    ],
  },
  {
    id: "services",
    label: "Dịch vụ",
    items: [
      { to: "/admin/services", label: "Dịch vụ" },
      { to: "/admin/categories", label: "Danh mục" },
      { to: "/admin/treatments", label: "Điều trị" },
    ],
  },
];

function pathMatches(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function groupIsActive(pathname: string, items: NavItem[]) {
  return items.some((item) => pathMatches(pathname, item.to, item.end));
}

function linkClass(isActive: boolean, nested = false) {
  return `${nested ? "block rounded-2xl px-4 py-2.5 text-sm" : "block rounded-2xl px-4 py-3 text-sm"} ${
    isActive ? "bg-white/10 text-spa-accent" : "text-white/80 hover:bg-white/5"
  }`;
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      initial[group.id] = groupIsActive(location.pathname, group.items);
    });
    return initial;
  });

  useEffect(() => {
    setExpanded((current) => {
      const next = { ...current };
      navGroups.forEach((group) => {
        if (groupIsActive(location.pathname, group.items)) {
          next[group.id] = true;
        }
      });
      return next;
    });
  }, [location.pathname]);

  function toggleGroup(id: string) {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-spa-bg text-spa-text lg:flex">
      <aside
        className={`${
          menuOpen ? "fixed inset-0 z-20 block" : "hidden"
        } w-72 bg-spa-dark p-6 text-white lg:static lg:block`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Lumina Spa</p>
            <h1 className="mt-1 text-xl font-semibold">Admin</h1>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setMenuOpen(false)}>
            Đóng
          </button>
        </div>
        <nav className="space-y-1">
          <NavLink
            to={dashboardItem.to}
            end={dashboardItem.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => linkClass(isActive)}
          >
            {dashboardItem.label}
          </NavLink>
          <NavLink
            to={bookingItem.to}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => linkClass(isActive)}
          >
            {bookingItem.label}
          </NavLink>
          <NavLink
            to="/admin/settings"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => linkClass(isActive)}
          >
            Cài đặt trang chủ
          </NavLink>

          {navGroups.map((group) => {
            const open = Boolean(expanded[group.id]);
            const active = groupIsActive(location.pathname, group.items);
            return (
              <div key={group.id} className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={open}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm ${
                    active ? "bg-white/10 text-spa-accent" : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <span>{group.label}</span>
                  <span className={`text-xs transition ${open ? "rotate-180" : ""}`} aria-hidden>
                    ▾
                  </span>
                </button>
                {open ? (
                  <div className="mt-1 space-y-1 pl-3">
                    {group.items.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => linkClass(isActive, true)}
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-10 w-full rounded-2xl border border-white/15 px-4 py-3 text-sm hover:bg-white/10"
        >
          Đăng xuất
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-black/5 bg-spa-white px-4 py-4 lg:px-8">
          <button
            type="button"
            className="rounded-xl border border-spa-primary/20 px-3 py-2 text-sm lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
          <p className="text-sm text-spa-muted">Xin chào, {user?.name}</p>
          <Link
            to="/home"
            className="rounded-full bg-spa-primary px-4 py-2 text-sm text-white hover:bg-spa-dark"
          >
            Xem trang chủ
          </Link>
        </header>
        <main className="px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
