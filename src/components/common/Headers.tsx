import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Title() {
  return <h1 className="title">AGE MILESTONES</h1>;
}

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/milestones", label: "Milestones" },
  { to: "/timescales", label: "Timescales" },
  { to: "/personalize", label: "Personalize" },
  { to: "/about", label: "About" },
] as const;

type NavbarProps = {
  onEditBirthDate?: () => void;
};

export function Navbar({ onEditBirthDate }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const toggle = () => setOpen(value => !value);
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="app-navbar">
      <Link to="/" className="app-navbar__brand">
        <span className="app-navbar__brand-mark" aria-hidden="true" />
        Age Milestones
      </Link>

      <div className="app-navbar__actions">
        {onEditBirthDate && (
          <button
            type="button"
            className="app-navbar__edit"
            onClick={onEditBirthDate}
          >
            Edit birth date
          </button>
        )}

        <div className="app-navbar__menu" ref={menuRef}>
          <button
            type="button"
            className="app-navbar__menu-toggle"
            onClick={toggle}
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls={`${menuId}-dropdown`}
          >
            <span className="app-navbar__menu-label">Menu</span>
            <span className="app-navbar__menu-icon" aria-hidden="true" />
          </button>

          <nav
            id={`${menuId}-dropdown`}
            className={`app-navbar__dropdown ${
              open ? "app-navbar__dropdown--open" : ""
            }`}
            aria-hidden={!open}
          >
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`app-navbar__link ${
                  isActive(item.to) ? "app-navbar__link--active" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
