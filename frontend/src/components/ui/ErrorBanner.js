import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconAlertCircle } from "./Icon";
export const ErrorBanner = ({ children }) => (_jsxs("div", { className: "error-banner", role: "alert", children: [_jsx(IconAlertCircle, { size: 16, "aria-hidden": true }), _jsx("div", { children: children })] }));
