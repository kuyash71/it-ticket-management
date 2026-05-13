import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("tr") ? "tr" : "en";

  const change = async (lang: "tr" | "en") => {
    localStorage.setItem("lang", lang);
    await i18n.changeLanguage(lang);
  };

  return (
    <div className="segmented" role="group" aria-label="Language">
      <button
        type="button"
        className="segmented-option"
        aria-pressed={current === "tr"}
        onClick={() => void change("tr")}
      >
        TR
      </button>
      <button
        type="button"
        className="segmented-option"
        aria-pressed={current === "en"}
        onClick={() => void change("en")}
      >
        EN
      </button>
    </div>
  );
};
