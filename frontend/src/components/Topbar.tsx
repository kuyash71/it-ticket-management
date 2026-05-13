import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { parseJwtPayload } from "../lib/jwt";
import { Avatar } from "./ui/Avatar";
import { DropdownMenu } from "./ui/DropdownMenu";
import {
  IconBell,
  IconLogOut,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSun,
  IconUser
} from "./ui/Icon";
import { Tooltip } from "./ui/Tooltip";
import { useTheme } from "../theme/ThemeProvider";
import type { AppView } from "../App";
import { LanguageSwitcher } from "./LanguageSwitcher";

type TopbarProps = {
  onOpenCommand: () => void;
  onNavigate: (view: AppView) => void;
};

export const Topbar = ({ onOpenCommand, onNavigate }: TopbarProps) => {
  const { t } = useTranslation();
  const { logout, token } = useAuth();
  const { roles } = useRole();
  const { resolved, setTheme } = useTheme();
  const userName = parseUsername(token);

  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  return (
    <header className="topbar" role="banner">
      <button
        type="button"
        className="topbar-search"
        onClick={onOpenCommand}
        aria-label={t("command.open")}
      >
        <IconSearch />
        <span className="topbar-search-placeholder">{t("command.placeholder")}</span>
        <span className="kbd">⌘K</span>
      </button>

      <div className="topbar-actions">
        <LanguageSwitcher />
        <Tooltip label={resolved === "dark" ? t("theme.light") : t("theme.dark")}>
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm"
            onClick={toggleTheme}
            aria-label={t("theme.toggle")}
          >
            {resolved === "dark" ? <IconSun /> : <IconMoon />}
          </button>
        </Tooltip>
        <Tooltip label={t("nav.notifications")}>
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm"
            aria-label={t("nav.notifications")}
          >
            <IconBell />
          </button>
        </Tooltip>
        <div className="topbar-divider" aria-hidden="true" />
        <DropdownMenu
          align="end"
          trigger={
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ paddingLeft: 4, paddingRight: 8, gap: 8 }}
              aria-label={userName}
            >
              <Avatar name={userName} size="sm" />
              <span style={{ fontSize: "var(--text-sm)" }}>{userName}</span>
            </button>
          }
          items={[
            { key: "label", label: roles.join(", ") || "User", label_only: true },
            { key: "settings", label: t("nav.settings"), icon: <IconSettings />, onSelect: () => onNavigate({ name: "settings" }) },
            { key: "profile",  label: t("settings.profile"), icon: <IconUser />, onSelect: () => onNavigate({ name: "settings" }) },
            { key: "div1", divider: true },
            { key: "logout", label: t("auth.logout"), icon: <IconLogOut />, danger: true, onSelect: logout }
          ]}
        />
      </div>
    </header>
  );
};

const parseUsername = (token?: string): string => {
  if (!token) return "User";
  try {
    const payload = parseJwtPayload(token);
    return (payload.preferred_username ?? payload.name ?? payload.email ?? "User") as string;
  } catch {
    return "User";
  }
};
