import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
export const DropdownMenu = ({ trigger, items, align = "start" }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            const target = e.target;
            if (triggerRef.current?.contains(target) ||
                menuRef.current?.contains(target)) {
                return;
            }
            setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape")
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);
    const style = {
        top: "calc(100% + 4px)",
        [align === "end" ? "right" : "left"]: 0
    };
    return (_jsxs("div", { style: { position: "relative", display: "inline-block" }, ref: triggerRef, children: [_jsx("span", { onClick: () => setOpen((o) => !o), children: trigger }), open && (_jsx("div", { ref: menuRef, className: "menu", style: style, role: "menu", children: items.map((it) => it.divider ? (_jsx("div", { className: "menu-divider" }, it.key)) : it.label_only ? (_jsx("div", { className: "menu-label", children: it.label }, it.key)) : (_jsxs("button", { type: "button", role: "menuitem", className: ["menu-item", it.danger && "menu-item--danger"].filter(Boolean).join(" "), onClick: () => {
                        it.onSelect?.();
                        setOpen(false);
                    }, children: [it.icon, _jsx("span", { style: { flex: 1 }, children: it.label }), it.shortcut && _jsx("span", { className: "menu-shortcut", children: it.shortcut })] }, it.key))) }))] }));
};
export const MenuShell = ({ children }) => (_jsx("div", { className: "menu", style: { position: "static" }, children: children }));
