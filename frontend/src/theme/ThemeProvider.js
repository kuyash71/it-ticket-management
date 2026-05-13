import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
const ThemeContext = createContext(undefined);
const STORAGE_KEY = "itsm.theme";
const resolveSystem = () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const applyTheme = (theme) => {
    const resolved = theme === "system" ? resolveSystem() : theme;
    document.documentElement.setAttribute("data-theme", resolved);
};
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ?? "system";
    });
    const [resolved, setResolved] = useState(() => theme === "system" ? resolveSystem() : theme);
    useEffect(() => {
        applyTheme(theme);
        setResolved(theme === "system" ? resolveSystem() : theme);
    }, [theme]);
    // Track OS scheme changes while in system mode
    useEffect(() => {
        if (theme !== "system")
            return;
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            applyTheme("system");
            setResolved(resolveSystem());
        };
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [theme]);
    const setTheme = useCallback((next) => {
        localStorage.setItem(STORAGE_KEY, next);
        setThemeState(next);
    }, []);
    const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
};
export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx)
        throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
};
