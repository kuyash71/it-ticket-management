import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = async (lang: "tr" | "en") => {
    localStorage.setItem("lang", lang);
    await i18n.changeLanguage(lang);
  };

  return (
    <div>
      <button type="button" onClick={() => void changeLanguage("tr")}>{t("lang.tr")}</button>
      <button type="button" onClick={() => void changeLanguage("en")}>{t("lang.en")}</button>
    </div>
  );
};
