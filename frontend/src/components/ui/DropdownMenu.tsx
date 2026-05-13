import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PropsWithChildren, ReactNode } from "react";

type MenuItem = {
  key: string;
  label?: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  onSelect?: () => void;
  divider?: boolean;
  label_only?: boolean;
};

type DropdownMenuProps = {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
};

export const DropdownMenu = ({ trigger, items, align = "start" }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const style: CSSProperties = {
    top: "calc(100% + 4px)",
    [align === "end" ? "right" : "left"]: 0
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={triggerRef}>
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && (
        <div ref={menuRef} className="menu" style={style} role="menu">
          {items.map((it) =>
            it.divider ? (
              <div key={it.key} className="menu-divider" />
            ) : it.label_only ? (
              <div key={it.key} className="menu-label">{it.label}</div>
            ) : (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                className={["menu-item", it.danger && "menu-item--danger"].filter(Boolean).join(" ")}
                onClick={() => {
                  it.onSelect?.();
                  setOpen(false);
                }}
              >
                {it.icon}
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.shortcut && <span className="menu-shortcut">{it.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export const MenuShell = ({ children }: PropsWithChildren) => (
  <div className="menu" style={{ position: "static" }}>{children}</div>
);
