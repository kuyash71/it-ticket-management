import { jsx as _jsx } from "react/jsx-runtime";
const initials = (name) => {
    if (!name)
        return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1)
        return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
export const Avatar = ({ name, size = "md", title }) => {
    const cls = ["avatar", size !== "md" && `avatar--${size}`].filter(Boolean).join(" ");
    return (_jsx("span", { className: cls, title: title ?? name ?? undefined, "aria-hidden": "true", children: initials(name) }));
};
