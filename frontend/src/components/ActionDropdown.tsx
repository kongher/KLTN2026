import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type ActionItem = {
  label: string;
  onClick: () => void;
  tone?: "danger" | "default";
};

type Props = {
  label?: string;
  items: ActionItem[];
};

export default function ActionDropdown({ label = "Thao tác", items }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 148;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 96 && rect.top > 96;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);

    setMenuStyle({
      position: "fixed",
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      left,
      width: menuWidth,
    });
  }, [open]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-spa-dark transition ${
          open
            ? "border-spa-primary bg-spa-primary/10"
            : "border-black/10 hover:border-spa-primary/30 hover:bg-spa-bg"
        }`}
      >
        <span className="text-base leading-none">▾</span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={menuStyle}
              className="z-50 overflow-hidden rounded-xl border border-black/8 bg-white py-1 shadow-xl"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-spa-bg ${
                    item.tone === "danger" ? "text-rose-700" : "text-spa-dark"
                  }`}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
