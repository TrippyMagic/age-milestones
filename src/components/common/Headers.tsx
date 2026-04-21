import {JSX, useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent} from "react";
import { Link, useLocation } from "react-router-dom";

type TitleProps = {
  variant?: "page" | "navbar";
};

export function Title({ variant = "page" }: TitleProps) {
  const Element: keyof JSX.IntrinsicElements = variant === "page" ? "h1" : "span";
  const className = variant === "page" ? "title" : "title title--navbar";
  return <Element className={className}>KRONOSCOPE</Element>;
}

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/milestones", label: "Milestones" },
  { to: "/timescales", label: "Timescales" },
  { to: "/settings", label: "Settings" },
  { to: "/about", label: "About" },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

type NavbarProps = {
  onNavigateAttempt?: (to: NavItem["to"]) => boolean;
};

export function Navbar({ onNavigateAttempt }: NavbarProps) {
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

  const handleNavClick = (item: NavItem, evt: ReactMouseEvent<HTMLAnchorElement>) => {
    if (onNavigateAttempt && !onNavigateAttempt(item.to)) {
      evt.preventDefault();
    }
    setOpen(false);
  };

  return (
    <header className="app-navbar">
      <Link to="/" className="app-navbar__brand" aria-label="Go to landing page">
        <span className="app-navbar__brand-mark" aria-hidden="true" />
        <Title variant="navbar" />
      </Link>

      <div className="app-navbar__actions">
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
                onClick={evt => handleNavClick(item, evt)}
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
