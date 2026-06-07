import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { Avatar } from "./Primitives";
import type { AppView } from "../../App";
import { useAuth } from "../../auth/AuthProvider";
import type { UserRole } from "../../auth/AuthProvider";

type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  tone: string;
  view: AppView;
  count?: number;
};

type NavSection = { group: string | null; items: NavItem[] };

export function navFor(role: UserRole, counts?: { tickets?: number; overtime?: number }): NavSection[] {
  if (role === "MANAGER") {
    return [
      { group: null, items: [
        { id: "dashboard", label: "Genel Bakış", icon: "grid", tone: "purple", view: { name: "dashboard" } },
        { id: "tickets", label: "Talepler", icon: "ticket", tone: "blue", view: { name: "tickets" }, count: counts?.tickets },
        { id: "reports", label: "Raporlar", icon: "report", tone: "teal", view: { name: "reports" } }
      ]},
      { group: "Yönetim", items: [
        { id: "overtime", label: "Süre Aşımı", icon: "clock", tone: "red", view: { name: "tickets", overtime: true }, count: counts?.overtime },
        { id: "settings", label: "Ayarlar", icon: "settings", tone: "gray", view: { name: "settings" } }
      ]}
    ];
  }
  if (role === "AGENT") {
    return [
      { group: null, items: [
        { id: "dashboard", label: "Genel Bakış", icon: "grid", tone: "purple", view: { name: "dashboard" } },
        { id: "tickets", label: "Talepler", icon: "ticket", tone: "blue", view: { name: "tickets" }, count: counts?.tickets },
        { id: "reports", label: "Raporlar", icon: "report", tone: "teal", view: { name: "reports" } }
      ]},
      { group: "Hesap", items: [
        { id: "settings", label: "Ayarlar", icon: "settings", tone: "gray", view: { name: "settings" } }
      ]}
    ];
  }
  return [
    { group: null, items: [
      { id: "dashboard", label: "Panelim", icon: "grid", tone: "purple", view: { name: "dashboard" } },
      { id: "tickets", label: "Taleplerim", icon: "ticket", tone: "blue", view: { name: "tickets" }, count: counts?.tickets }
    ]},
    { group: "Hesap", items: [
      { id: "settings", label: "Ayarlar", icon: "settings", tone: "gray", view: { name: "settings" } }
    ]}
  ];
}

export type SidebarProps = {
  role: UserRole;
  userName: string;
  userRoleLabel: string;
  active: string;
  navigate: (view: AppView) => void;
  counts?: { tickets?: number; overtime?: number };
};

export function Sidebar({ role, userName, userRoleLabel, active, navigate, counts }: SidebarProps) {
  const sections = navFor(role, counts);
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.svg" alt="ITSM" className="brand-mark-img" width={26} height={26} />
        <div className="col">
          <div className="brand-name">ITSM</div>
          <div className="brand-sub">Destek Merkezi</div>
        </div>
      </div>
      {sections.map((sec, si) => (
        <div key={si}>
          {sec.group && <div className="nav-label">{sec.group}</div>}
          {sec.items.map((it) => (
            <div
              key={it.id}
              className={"nav-item" + (it.id === active ? " active" : "")}
              style={{ ["--tone" as any]: `var(--${it.tone || "gray"})` }}
              onClick={() => navigate(it.view)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") navigate(it.view); }}
            >
              <span className="nav-ic"><Icon name={it.icon} size={13} strokeWidth={2.2} /></span>
              <span className="lbl">{it.label}</span>
              {it.count != null && <span className="nav-count tnum">{it.count}</span>}
            </div>
          ))}
        </div>
      ))}
      <div className="sidebar-footer">
        <UserMenu userName={userName} userRoleLabel={userRoleLabel} navigate={navigate} />
      </div>
    </aside>
  );
}

function UserMenu({ userName, userRoleLabel, navigate }: { userName: string; userRoleLabel: string; navigate: (v: AppView) => void }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className="user-chip"
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter") setOpen((o) => !o); }}
      >
        <Avatar name={userName} size="md" />
        <div className="user-meta">
          <div className="user-name">{userName}</div>
          <div className="user-role">{userRoleLabel}</div>
        </div>
        <Icon name="chevdown" size={14} style={{ marginLeft: "auto", color: "var(--text-tertiary)" }} />
      </div>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            padding: 4,
            zIndex: 100,
            boxShadow: "var(--shadow-pop)"
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => { setOpen(false); navigate({ name: "settings" }); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon name="settings" size={14} />Ayarlar
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => { setOpen(false); logout(); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: "var(--fs-sm)", color: "var(--red)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--red) 8%, var(--bg-surface))")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon name="logout" size={14} />Çıkış Yap
          </div>
        </div>
      )}
    </div>
  );
}

export type TopbarProps = {
  title?: ReactNode;
  crumb?: ReactNode;
  showSearch?: boolean;
  onSearchClick?: () => void;
  actions?: ReactNode;
};

export function Topbar({ title, crumb, showSearch = true, onSearchClick, actions }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="col" style={{ gap: 1 }}>
        {crumb && <div className="crumb">{crumb}</div>}
        {title && <h1>{title}</h1>}
      </div>
      <div className="topbar-spacer" />
      {showSearch && (
        <div className="search" onClick={onSearchClick} role="button" tabIndex={0} style={{ cursor: "pointer" }}>
          <Icon name="search" size={14} />
          <span>Talep ara…</span>
          <kbd>⌘K</kbd>
        </div>
      )}
      {actions}
      <button className="iconbtn" aria-label="Bildirimler"><Icon name="bell" size={15} /></button>
    </header>
  );
}
