import { useTranslation } from "react-i18next";

import { useAuth } from "./auth/AuthProvider";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { TicketsPage } from "./pages/TicketsPage";

export const App = () => {
  const { t } = useTranslation();
  const { initialized, authenticated, login, logout } = useAuth();

  if (!initialized) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <h1>{t("app.title")}</h1>
      <p>{t("app.subtitle")}</p>

      <LanguageSwitcher />

      {!authenticated ? (
        <button type="button" onClick={login}>{t("auth.login")}</button>
      ) : (
        <>
          <button type="button" onClick={logout}>{t("auth.logout")}</button>
          <TicketsPage />
        </>
      )}
    </main>
  );
};
