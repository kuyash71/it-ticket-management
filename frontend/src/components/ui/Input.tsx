import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leadingIcon?: ReactNode;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, invalid, ...rest }, ref) => {
    const input = (
      <input
        ref={ref}
        className={["input", className].filter(Boolean).join(" ")}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
    if (!leadingIcon) return input;
    return (
      <div className="input-with-icon">
        {leadingIcon}
        {input}
      </div>
    );
  }
);
Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={["textarea", className].filter(Boolean).join(" ")}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={["select", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
