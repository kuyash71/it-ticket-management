import { useEffect } from "react";
import type { PropsWithChildren, ReactNode } from "react";

type DrawerProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
}>;

export const Drawer = ({ open, onClose, title, footer, children }: DrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        {title && (
          <div className="dialog-header">
            <div className="dialog-title">{title}</div>
          </div>
        )}
        <div className="dialog-body" style={{ flex: 1 }}>{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </aside>
    </>
  );
};
