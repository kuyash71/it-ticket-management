import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
import { Button } from "./Button";
import { IconClose } from "./Icon";
export const Dialog = ({ open, onClose, title, description, size = "md", footer, closeOnBackdrop = true, children }) => {
    const titleId = useId();
    const descId = useId();
    const ref = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                onCloseRef.current();
        };
        document.addEventListener("keydown", onKey);
        // Focus first focusable only on open — not on every render
        const focusable = ref.current?.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        focusable?.focus();
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open]); // onClose intentionally excluded — held in ref to avoid focus theft on re-render
    if (!open)
        return null;
    return (_jsx("div", { className: "dialog-overlay", onClick: (e) => {
            if (closeOnBackdrop && e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { ref: ref, role: "dialog", "aria-modal": "true", "aria-labelledby": title ? titleId : undefined, "aria-describedby": description ? descId : undefined, className: ["dialog", size === "lg" && "dialog--lg"].filter(Boolean).join(" "), children: [(title || description) && (_jsxs("div", { className: "dialog-header", children: [_jsxs("div", { children: [title && _jsx("div", { id: titleId, className: "dialog-title", children: title }), description && _jsx("div", { id: descId, className: "dialog-description", children: description })] }), _jsx(Button, { variant: "ghost", size: "sm", iconOnly: true, onClick: onClose, "aria-label": "Close", leadingIcon: _jsx(IconClose, {}) })] })), _jsx("div", { className: "dialog-body", children: children }), footer && _jsx("div", { className: "dialog-footer", children: footer })] }) }));
};
