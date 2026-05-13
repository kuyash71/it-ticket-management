import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { parseJwtPayload } from "../lib/jwt";
import { useRole } from "../auth/useRole";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import {
  IconBell,
  IconGlobe,
  IconLogOut,
  IconSun,
  IconUser
} from "../components/ui/Icon";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ui/ThemeToggle";

type SectionId = "profile" | "preferences" | "notifications";

type Profile = {
  name: string;
  email: string;
  username: string;
};

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { token, logout } = useAuth();
  const { isManager, isAgent } = useRole();
  const [section, setSection] = useState<SectionId>("profile");

  const profile = useMemo<Profile>(() => parseProfile(token), [token]);
  const roleLabel = isManager() ? t("role.manager") : isAgent() ? t("role.agent") : t("role.customer");

  const sections: { id: SectionId; label: string; icon: ReactNode }[] = [
    { id: "profile", label: t("settings.profile"), icon: <IconUser /> },
    { id: "preferences", label: t("settings.preferences"), icon: <IconSun /> },
    { id: "notifications", label: t("settings.notifications"), icon: <IconBell /> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("nav.settings")}</h1>
          <p className="page-subtitle">{t("settings.subtitle")}</p>
        </div>
      </div>

      <div className="settings-shell">
        <nav className="settings-nav" aria-label={t("settings.nav.aria")}>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className="nav-item"
              aria-current={section === s.id ? "page" : undefined}
              onClick={() => setSection(s.id)}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div>
          {section === "profile" && (
            <ProfileSection profile={profile} roleLabel={roleLabel} onLogout={logout} />
          )}
          {section === "preferences" && <PreferencesSection />}
          {section === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
};

const ProfileSection = ({
  profile,
  roleLabel,
  onLogout
}: {
  profile: Profile;
  roleLabel: string;
  onLogout: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <>
      <SettingsCard
        title={t("settings.profile")}
        description={t("settings.profile.desc")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <Avatar name={profile.name || profile.username} size="xl" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)" }}>
              {profile.name || profile.username}
            </div>
            <div className="text-sm text-muted">{profile.email}</div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              <span className="badge badge--sm">{roleLabel}</span>
            </div>
          </div>
        </div>

        <ReadOnlyField label={t("settings.profile.username")} value={profile.username} />
        <ReadOnlyField label={t("settings.profile.email")} value={profile.email || "—"} />
        <ReadOnlyField label={t("settings.profile.fullname")} value={profile.name || "—"} />
        <p className="text-xs text-muted">{t("settings.profile.managed_by_keycloak")}</p>
      </SettingsCard>

      <SettingsCard title={t("settings.session")} description={t("settings.session.desc")}>
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="settings-row-title">{t("auth.logout")}</div>
            <div className="settings-row-description">{t("settings.session.logout_desc")}</div>
          </div>
          <Button variant="danger" leadingIcon={<IconLogOut />} onClick={onLogout}>
            {t("auth.logout")}
          </Button>
        </div>
      </SettingsCard>
    </>
  );
};

const PreferencesSection = () => {
  const { t } = useTranslation();
  return (
    <SettingsCard title={t("settings.preferences")} description={t("settings.preferences.desc")}>
      <div className="settings-row">
        <div className="settings-row-label">
          <div className="settings-row-title">{t("theme.title")}</div>
          <div className="settings-row-description">{t("settings.theme.desc")}</div>
        </div>
        <ThemeToggle />
      </div>
      <div className="settings-row">
        <div className="settings-row-label">
          <div className="settings-row-title">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconGlobe /> {t("settings.language")}
            </span>
          </div>
          <div className="settings-row-description">{t("settings.language.desc")}</div>
        </div>
        <LanguageSwitcher />
      </div>
    </SettingsCard>
  );
};

const NotificationsSection = () => {
  const { t } = useTranslation();
  return (
    <SettingsCard title={t("settings.notifications")} description={t("settings.notifications.desc")}>
      <p className="text-sm text-muted">{t("settings.notifications.coming_soon")}</p>
    </SettingsCard>
  );
};

const SettingsCard = ({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="settings-section">
    <header className="settings-section-header">
      <div className="settings-section-title">{title}</div>
      {description && <div className="settings-section-description">{description}</div>}
    </header>
    <div className="settings-section-body">{children}</div>
  </section>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div className="settings-row">
    <div className="settings-row-label">
      <div className="settings-row-title">{label}</div>
    </div>
    <div className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: label.toLowerCase().includes("id") ? "var(--font-mono)" : undefined }}>
      {value}
    </div>
  </div>
);

function parseProfile(token?: string): Profile {
  if (!token) return { name: "", email: "", username: "User" };
  try {
    const payload = parseJwtPayload(token) as Record<string, string>;
    return {
      name: payload.name ?? `${payload.given_name ?? ""} ${payload.family_name ?? ""}`.trim(),
      email: payload.email ?? "",
      username: payload.preferred_username ?? payload.email ?? "User"
    };
  } catch {
    return { name: "", email: "", username: "User" };
  }
}
