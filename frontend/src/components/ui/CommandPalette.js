import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconSearch } from "./Icon";
export const CommandPalette = ({ open, onClose, actions, placeholder = "Type a command or search...", emptyText = "No results found." }) => {
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    useEffect(() => {
        if (!open) {
            setQuery("");
            setActive(0);
            return;
        }
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [open]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return actions;
        return actions.filter((a) => {
            const hay = `${a.label} ${a.group ?? ""} ${(a.keywords ?? []).join(" ")}`.toLowerCase();
            return hay.includes(q);
        });
    }, [query, actions]);
    const grouped = useMemo(() => {
        const map = new Map();
        for (const a of filtered) {
            const g = a.group ?? "";
            if (!map.has(g))
                map.set(g, []);
            map.get(g).push(a);
        }
        return Array.from(map.entries());
    }, [filtered]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
            else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, filtered.length - 1));
            }
            else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
            }
            else if (e.key === "Enter") {
                e.preventDefault();
                const action = filtered[active];
                if (action) {
                    action.onSelect();
                    onClose();
                }
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose, filtered, active]);
    if (!open)
        return null;
    let runningIndex = 0;
    return (_jsx("div", { className: "command-overlay", onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "command", role: "dialog", "aria-modal": "true", "aria-label": "Command palette", children: [_jsxs("div", { className: "command-input-row", children: [_jsx(IconSearch, {}), _jsx("input", { ref: inputRef, className: "command-input", placeholder: placeholder, value: query, onChange: (e) => { setQuery(e.target.value); setActive(0); }, "aria-label": placeholder }), _jsx("span", { className: "kbd", children: "ESC" })] }), _jsxs("div", { className: "command-list", role: "listbox", children: [filtered.length === 0 && _jsx("div", { className: "command-empty", children: emptyText }), grouped.map(([group, items]) => (_jsxs("div", { children: [group && _jsx("div", { className: "command-group-label", children: group }), items.map((a) => {
                                    const idx = runningIndex++;
                                    const isActive = idx === active;
                                    return (_jsxs("button", { type: "button", role: "option", "aria-selected": isActive, className: "command-item", onMouseEnter: () => setActive(idx), onClick: () => { a.onSelect(); onClose(); }, children: [a.icon, _jsx("span", { style: { flex: 1 }, children: a.label }), a.shortcut && _jsx("span", { className: "kbd", children: a.shortcut })] }, a.key));
                                })] }, group)))] })] }) }));
};
