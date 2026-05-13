import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
export const Drawer = ({ open, onClose, title, footer, children }) => {
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "drawer-overlay", onClick: onClose }), _jsxs("aside", { className: "drawer", role: "dialog", "aria-modal": "true", children: [title && (_jsx("div", { className: "dialog-header", children: _jsx("div", { className: "dialog-title", children: title }) })), _jsx("div", { className: "dialog-body", style: { flex: 1 }, children: children }), footer && _jsx("div", { className: "dialog-footer", children: footer })] })] }));
};
