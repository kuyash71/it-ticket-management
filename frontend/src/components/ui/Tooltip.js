import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export const Tooltip = ({ label, children }) => {
    const [show, setShow] = useState(false);
    return (_jsxs("span", { className: "tooltip-wrapper", onMouseEnter: () => setShow(true), onMouseLeave: () => setShow(false), onFocus: () => setShow(true), onBlur: () => setShow(false), children: [children, show && _jsx("span", { className: "tooltip", role: "tooltip", children: label })] }));
};
