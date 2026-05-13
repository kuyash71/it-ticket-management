import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const current = i18n.language?.startsWith("tr") ? "tr" : "en";
    const change = async (lang) => {
        localStorage.setItem("lang", lang);
        await i18n.changeLanguage(lang);
    };
    return (_jsxs("div", { className: "segmented", role: "group", "aria-label": "Language", children: [_jsx("button", { type: "button", className: "segmented-option", "aria-pressed": current === "tr", onClick: () => void change("tr"), children: "TR" }), _jsx("button", { type: "button", className: "segmented-option", "aria-pressed": current === "en", onClick: () => void change("en"), children: "EN" })] }));
};
