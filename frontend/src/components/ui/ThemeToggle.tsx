import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeProvider";
import type { Theme } from "../../theme/ThemeProvider";
import { IconMonitor, IconMoon, IconSun } from "./Icon";

type ThemeOption = { value: Theme; icon: JSX.Element; label: string };

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const options: ThemeOption[] = [
    { value: "light",  icon: <IconSun />,     label: t("theme.light") },
    { value: "system", icon: <IconMonitor />, label: t("theme.system") },
    { value: "dark",   icon: <IconMoon />,    label: t("theme.dark") }
  ];

  return (
    <div className="segmented" role="group" aria-label={t("theme.title")}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="segmented-option"
          aria-pressed={theme === opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
        >
          {opt.icon}
          <span className="sr-only">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};
