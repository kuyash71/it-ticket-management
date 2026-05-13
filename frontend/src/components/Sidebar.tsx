import { useTranslation } from "react-i18next";

import type { AppView } from "../App";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { Avatar } from "./ui/Avatar";
import {
  IconBarChart,
  IconChevronLeft,
  IconChevronRight,
  IconInbox,
  IconLayoutDashboard,
  IconSettings
} from "./ui/Icon";
import { Tooltip } from "./ui/Tooltip";
import { LogoMark, LogoWordmark } from "./Logo";

type NavItem = {
  id: AppView["name"];
  label: string;
  icon: JSX.Element;
  hidden?: boolean;
};

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeView: AppView["name"];
  onNavigate: (view: AppView) => void;
};

export const Sidebar = ({ collapsed, onToggleCollapse, activeView, onNavigate }: SidebarProps) => {
  const { t } = useTranslation();
  const { isCustomer } = useRole();
  const { token } = useAuth();
  const userName = parseUsernameFromToken(token);
  const roleLabel = useRoleLabel();

  const mainNav: NavItem[] = [
    { id: "dashboard", label: t("nav.dashboard"), icon: <IconLayoutDashboard /> },
    { id: "tickets",   label: t("nav.tickets"),   icon: <IconInbox /> },
    { id: "reports",   label: t("nav.reports"),   icon: <IconBarChart />, hidden: isCustomer() }
  ];

  const secondaryNav: NavItem[] = [
    { id: "settings", label: t("nav.settings"), icon: <IconSettings /> }
  ];

  return (
    <aside className="sidebar" aria-label={t("nav.aria.main")}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-mark"><LogoMark size={26} /></span>
          {!collapsed && <LogoWordmark />}
        </div>
        {!collapsed && (
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={t("nav.collapse")}
            title={t("nav.collapse")}
          >
            <IconChevronLeft />
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={t("nav.expand")}
            style={{ position: "absolute", right: 4 }}
          >
            <IconChevronRight />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavGroup
          title={t("nav.section.workspace")}
          items={mainNav}
          activeView={activeView}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <NavGroup
          title={t("nav.section.account")}
          items={secondaryNav}
          activeView={activeView}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="user-summary"
          onClick={() => onNavigate({ name: "settings" })}
          title={collapsed ? userName : undefined}
        >
          <Avatar name={userName} />
          <div>
            <div className="user-name">{userName}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </button>
      </div>
    </aside>
  );
};

const NavGroup = ({
  title,
  items,
  activeView,
  onNavigate,
  collapsed
}: {
  title: string;
  items: NavItem[];
  activeView: AppView["name"];
  onNavigate: (view: AppView) => void;
  collapsed: boolean;
}) => {
  const visible = items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;
  return (
    <div className="nav-section">
      <div className="nav-section-title">{title}</div>
      {visible.map((item) => {
        const isActive = activeView === item.id ||
          (activeView === "ticket-detail" && item.id === "tickets");
        const btn = (
          <button
            key={item.id}
            type="button"
            className="nav-item"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate({ name: item.id } as AppView)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
        return collapsed ? (
          <Tooltip key={item.id} label={item.label}>{btn}</Tooltip>
        ) : (
          btn
        );
      })}
    </div>
  );
};

const parseUsernameFromToken = (token?: string): string => {
  if (!token) return "User";
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return (
      payload.preferred_username ??
      payload.name ??
      payload.email ??
      "User"
    );
  } catch {
    return "User";
  }
};

const useRoleLabel = () => {
  const { t } = useTranslation();
  const { isManager, isAgent } = useRole();
  if (isManager()) return t("role.manager");
  if (isAgent()) return t("role.agent");
  return t("role.customer");
};
