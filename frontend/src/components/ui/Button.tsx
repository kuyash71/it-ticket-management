import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  block?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      iconOnly = false,
      block = false,
      loading = false,
      leadingIcon,
      trailingIcon,
      children,
      className,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => {
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

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? <span className="spinner" aria-hidden="true" /> : leadingIcon}
        {!iconOnly && children}
        {!loading && trailingIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
