import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/ThemeProvider";
import { IconMonitor, IconMoon, IconSun } from "./Icon";
export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation();
    const options = [
        { value: "light", icon: _jsx(IconSun, {}), label: t("theme.light") },
        { value: "system", icon: _jsx(IconMonitor, {}), label: t("theme.system") },
        { value: "dark", icon: _jsx(IconMoon, {}), label: t("theme.dark") }
    ];
    return (_jsx("div", { className: "segmented", role: "group", "aria-label": t("theme.title"), children: options.map((opt) => (_jsxs("button", { type: "button", className: "segmented-option", "aria-pressed": theme === opt.value, onClick: () => setTheme(opt.value), title: opt.label, children: [opt.icon, _jsx("span", { className: "sr-only", children: opt.label })] }, opt.value))) }));
};
