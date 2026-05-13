import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";

import { IconAlertCircle, IconAlertTriangle, IconCheckCircle, IconInfo } from "./Icon";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastContextValue = {
  show: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId++;
      setToasts((all) => [...all, { ...toast, id }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) => show({ type: "success", title, description }),
      error: (title, description) => show({ type: "error", title, description }),
      info: (title, description) => show({ type: "info", title, description })
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
};

const iconMap: Record<ToastType, ReactNode> = {
  success: <IconCheckCircle />,
  error:   <IconAlertCircle />,
  warning: <IconAlertTriangle />,
  info:    <IconInfo />
};

const ToastRegion = ({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) => (
  <div className="toast-region" role="region" aria-label="Notifications" aria-live="polite">
    {toasts.map((t) => (
      <div key={t.id} className={`toast toast--${t.type}`} onClick={() => onDismiss(t.id)}>
        <span className="toast-icon">{iconMap[t.type]}</span>
        <div className="toast-content">
          <div className="toast-title">{t.title}</div>
          {t.description && <div className="toast-description">{t.description}</div>}
        </div>
      </div>
    ))}
  </div>
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};

/**
 * Defensive hook for places that may render outside ToastProvider during early init.
 * Returns no-op functions when context is missing.
 */
export const useToastSafe = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  const noop = () => {};
  return { show: noop, success: noop, error: noop, info: noop };
};

// Suppress unused warning for useEffect when bundled with strict tsconfig
void useEffect;
