import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
export const Input = forwardRef(({ className, leadingIcon, invalid, ...rest }, ref) => {
    const input = (_jsx("input", { ref: ref, className: ["input", className].filter(Boolean).join(" "), "aria-invalid": invalid || undefined, ...rest }));
    if (!leadingIcon)
        return input;
    return (_jsxs("div", { className: "input-with-icon", children: [leadingIcon, input] }));
});
Input.displayName = "Input";
export const Textarea = forwardRef(({ className, invalid, ...rest }, ref) => (_jsx("textarea", { ref: ref, className: ["textarea", className].filter(Boolean).join(" "), "aria-invalid": invalid || undefined, ...rest })));
Textarea.displayName = "Textarea";
export const Select = forwardRef(({ className, children, ...rest }, ref) => (_jsx("select", { ref: ref, className: ["select", className].filter(Boolean).join(" "), ...rest, children: children })));
Select.displayName = "Select";
