import { Link, useLocation } from "react-router-dom";
import { phoneHref } from "../../utils/homeSettings";
import { useAuth } from "../../contexts/AuthContext";
import { useHomeContent } from "../../contexts/HomeContentContext";

export default function CustomerFooter() {
  const { user } = useAuth();
  const location = useLocation();
  const { settings } = useHomeContent();
  const isCustomerArea = location.pathname.startsWith("/customer") && user?.role === "CUSTOMER";

  const quickLinks = isCustomerArea
    ? [
        { to: "/customer/dashboard", label: "Trang chủ" },
        { to: "/customer/services", label: "Dịch vụ" },
        { to: "/customer/bookings/new", label: "Đặt lịch" },
        { to: "/customer/policy", label: "Chính sách bảo mật" },
        { to: "/customer/terms", label: "Điều khoản sử dụng" },
        { to: "/customer/careers", label: "Tuyển dụng" },
      ]
    : [
        { to: "/home", label: "Trang chủ" },
        { to: "/home#services", label: "Dịch vụ" },
        { to: user?.role === "CUSTOMER" ? "/customer/bookings/new" : "/login", label: "Đặt lịch" },
        { to: "/policy", label: "Chính sách bảo mật" },
        { to: "/terms", label: "Điều khoản sử dụng" },
        { to: "/careers", label: "Tuyển dụng" },
      ];

  const socials = [
    { label: "Facebook", href: settings.facebook },
    { label: "Instagram", href: settings.instagram },
    { label: "Zalo OA", href: settings.zalo },
  ].filter((item) => item.href);

  return (
    <footer className="mt-auto border-t border-spa-primary/15 bg-spa-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.8fr_0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">{settings.name}</p>
          <h2 className="mt-2 text-xl font-semibold">Thông tin liên hệ</h2>
          {settings.address ? (
            <p className="mt-4 text-sm leading-6 text-white/80">{settings.address}</p>
          ) : null}
          {settings.phone ? (
            <p className="mt-3 text-sm">
              Hotline:{" "}
              <a href={phoneHref(settings.phone)} className="text-spa-accent hover:underline">
                {settings.phone}
              </a>
            </p>
          ) : null}
          {settings.email ? <p className="mt-1 text-sm text-white/80">Email: {settings.email}</p> : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-spa-accent">Giờ mở cửa</h3>
          {settings.hoursWeekday ? (
            <p className="mt-3 text-sm text-white/85">{settings.hoursWeekday}</p>
          ) : null}
          {settings.hoursWeekend ? (
            <p className="mt-1 text-sm text-white/85">{settings.hoursWeekend}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white hover:text-spa-dark"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-spa-accent">Liên kết nhanh</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-spa-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {settings.mapSrc ? (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-spa-accent">Bản đồ</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <iframe
                title={`Bản đồ ${settings.name}`}
                src={settings.mapSrc}
                className="h-48 w-full grayscale-[0.2]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {settings.name}. Không gian thư giãn dành riêng cho bạn.
      </div>
    </footer>
  );
}
