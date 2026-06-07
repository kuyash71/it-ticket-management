import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { Card } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Avatar } from "../components/itsm/Primitives";
import { parseJwtPayload } from "../lib/jwt";

function Row({ k, sub, right }: { k: string; sub?: string; right: ReactNode }) {
  return (
    <div className="row" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-faint)", alignItems: "flex-start" }}>
      <div className="col" style={{ flex: 1, gap: 2 }}>
        <span style={{ fontWeight: 550, fontSize: "var(--fs-body)" }}>{k}</span>
        {sub && <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>{sub}</span>}
      </div>
      <div className="row" style={{ gap: 10 }}>{right}</div>
    </div>
  );
}

export const SettingsPage = () => {
  const { i18n } = useTranslation();
  const { token, roles, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const payload = token ? safeParse(token) : null;
  const name = (payload?.name as string) ?? (payload?.preferred_username as string) ?? "Kullanıcı";
  const email = (payload?.email as string) ?? "—";
  const roleLabel = roles.includes("MANAGER") ? "Yönetici" : roles.includes("AGENT") ? "Uzman" : "Müşteri";

  return (
    <div className="content-narrow col" style={{ gap: 16, maxWidth: 820 }}>
      <Card title="Görünüm" pad={false}>
        <Row k="Dil" sub="Arayüz dili" right={(
          <div className="seg">
            {(["tr", "en"] as const).map((l) => (
              <button key={l} className={i18n.language.startsWith(l) ? "on" : ""} onClick={() => void i18n.changeLanguage(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        )} />
        <Row k="Tema" sub="Açık veya koyu tema" right={(
          <div className="seg">
            {([["light", "Açık", "sun"], ["dark", "Koyu", "moon"], ["system", "Sistem", "settings"]] as const).map(([id, lbl, ic]) => (
              <button key={id} className={theme === id ? "on" : ""} onClick={() => setTheme(id)}>
                <Icon name={ic} size={11} style={{ marginRight: 5 }} />{lbl}
              </button>
            ))}
          </div>
        )} />
      </Card>

      <Card title="Profil" head={<span className="badge tone-gray">Keycloak · salt okunur</span>}>
        <div className="row" style={{ gap: 16, padding: "6px 0" }}>
          <Avatar name={name} size="lg" />
          <div className="col" style={{ flex: 1 }}>
            <div className="row" style={{ gap: 8 }}>
              <b style={{ fontSize: "var(--fs-card)" }}>{name}</b>
              <span className="badge tone-purple">{roleLabel}</span>
            </div>
            <span className="faint" style={{ fontSize: "var(--fs-sm)" }}>{email}</span>
          </div>
        </div>
      </Card>

      <Card title="Güvenlik" pad={false}>
        <Row k="İki Faktörlü Doğrulama (TOTP)" sub="Authenticator uygulaması zorunlu" right={(
          <span className="badge tone-green">
            <Icon name="shield" size={11} className="ic" strokeWidth={2.2} />Aktif
          </span>
        )} />
        <Row k="Oturum" sub="Hesabınızdan çıkış yapın" right={(
          <button className="btn btn-danger" onClick={logout}>
            <Icon name="logout" size={13} />Çıkış Yap
          </button>
        )} />
      </Card>
    </div>
  );
};

function safeParse(token: string): Record<string, unknown> | null {
  try { return parseJwtPayload(token); } catch { return null; }
}
