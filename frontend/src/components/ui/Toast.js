import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { IconAlertCircle, IconAlertTriangle, IconCheckCircle, IconInfo } from "./Icon";
const ToastContext = createContext(undefined);
let nextId = 1;
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const remove = useCallback((id) => {
        setToasts((all) => all.filter((t) => t.id !== id));
    }, []);
    const show = useCallback((toast) => {
        const id = nextId++;
        setToasts((all) => [...all, { ...toast, id }]);
        setTimeout(() => remove(id), 4500);
    }, [remove]);
    const value = useMemo(() => ({
        show,
        success: (title, description) => show({ type: "success", title, description }),
        error: (title, description) => show({ type: "error", title, description }),
        info: (title, description) => show({ type: "info", title, description })
    }), [show]);
    return (_jsxs(ToastContext.Provider, { value: value, children: [children, _jsx(ToastRegion, { toasts: toasts, onDismiss: remove })] }));
};
const iconMap = {
    success: _jsx(IconCheckCircle, {}),
    error: _jsx(IconAlertCircle, {}),
    warning: _jsx(IconAlertTriangle, {}),
    info: _jsx(IconInfo, {})
};
const ToastRegion = ({ toasts, onDismiss }) => (_jsx("div", { className: "toast-region", role: "region", "aria-label": "Notifications", "aria-live": "polite", children: toasts.map((t) => (_jsxs("div", { className: `toast toast--${t.type}`, onClick: () => onDismiss(t.id), children: [_jsx("span", { className: "toast-icon", children: iconMap[t.type] }), _jsxs("div", { className: "toast-content", children: [_jsx("div", { className: "toast-title", children: t.title }), t.description && _jsx("div", { className: "toast-description", children: t.description })] })] }, t.id))) }));
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error("useToast must be used inside ToastProvider");
    return ctx;
};
/**
 * Defensive hook for places that may render outside ToastProvider during early init.
 * Returns no-op functions when context is missing.
 */
export const useToastSafe = () => {
    const ctx = useContext(ToastContext);
    if (ctx)
        return ctx;
    const noop = () => { };
    return { show: noop, success: noop, error: noop, info: noop };
};
// Suppress unused warning for useEffect when bundled with strict tsconfig
void useEffect;
