import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
export const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();
    const changeLanguage = async (lang) => {
        localStorage.setItem("lang", lang);
        await i18n.changeLanguage(lang);
    };
    return (_jsxs("div", { children: [_jsx("button", { type: "button", onClick: () => void changeLanguage("tr"), children: t("lang.tr") }), _jsx("button", { type: "button", onClick: () => void changeLanguage("en"), children: t("lang.en") })] }));
};
