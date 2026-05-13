import { useEffect, useId, useRef } from "react";
import type { PropsWithChildren, ReactNode } from "react";

import { Button } from "./Button";
import { IconClose } from "./Icon";

type DialogProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: "md" | "lg";
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
}>;

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  closeOnBackdrop = true,
  children
}: DialogProps) => {
  const titleId = useId();
  const descId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    // Focus first focusable only on open — not on every render
    const focusable = ref.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    focusable?.focus();

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]); // onClose intentionally excluded — held in ref to avoid focus theft on re-render

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={["dialog", size === "lg" && "dialog--lg"].filter(Boolean).join(" ")}
      >
        {(title || description) && (
          <div className="dialog-header">
            <div>
              {title && <div id={titleId} className="dialog-title">{title}</div>}
              {description && <div id={descId} className="dialog-description">{description}</div>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onClose}
              aria-label="Close"
              leadingIcon={<IconClose />}
            />
          </div>
        )}
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
};
