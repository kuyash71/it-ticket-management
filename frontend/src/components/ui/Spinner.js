import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const Spinner = ({ size = "sm", className }) => {
    const cls = ["spinner", size === "lg" && "spinner--lg", className].filter(Boolean).join(" ");
    return _jsx("span", { className: cls, role: "status", "aria-label": "Loading" });
};
export const LoadingState = ({ text }) => (_jsxs("div", { className: "loading-state", children: [_jsx(Spinner, { size: "lg" }), text && _jsx("span", { children: text })] }));
