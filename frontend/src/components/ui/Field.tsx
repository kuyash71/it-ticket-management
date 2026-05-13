import type { PropsWithChildren, ReactNode } from "react";

type FieldProps = PropsWithChildren<{
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  required?: boolean;
}>;

export const Field = ({ label, hint, error, htmlFor, required, children }: FieldProps) => (
  <div className="field">
    {label && (
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: "var(--color-danger)", marginLeft: 2 }}>
            *
          </span>
        )}
      </label>
    )}
    {children}
    {error ? <div className="field-error">{error}</div> : hint ? <div className="field-hint">{hint}</div> : null}
  </div>
);
