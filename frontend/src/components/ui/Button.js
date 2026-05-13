import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
export const Button = forwardRef(({ variant = "default", size = "md", iconOnly = false, block = false, loading = false, leadingIcon, trailingIcon, children, className, disabled, type = "button", ...rest }, ref) => {
    const classes = [
        "btn",
        variant !== "default" && `btn--${variant}`,
        size !== "md" && `btn--${size}`,
        iconOnly && "btn--icon",
        block && "btn--block",
        className
    ]
        .filter(Boolean)
        .join(" ");
    return (_jsxs("button", { ref: ref, type: type, className: classes, disabled: disabled || loading, ...rest, children: [loading ? _jsx("span", { className: "spinner", "aria-hidden": "true" }) : leadingIcon, !iconOnly && children, !loading && trailingIcon] }));
});
Button.displayName = "Button";
