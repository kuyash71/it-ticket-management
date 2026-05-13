import { jsx as _jsx } from "react/jsx-runtime";
export const Skeleton = ({ variant = "text", width, height, className }) => {
    const cls = ["skeleton", `skeleton--${variant}`, className].filter(Boolean).join(" ");
    return _jsx("span", { className: cls, style: { width, height, display: "block" } });
};
