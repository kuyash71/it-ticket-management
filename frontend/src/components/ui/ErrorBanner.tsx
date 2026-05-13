import type { ReactNode } from "react";
import { IconAlertCircle } from "./Icon";

export const ErrorBanner = ({ children }: { children: ReactNode }) => (
  <div className="error-banner" role="alert">
    <IconAlertCircle size={16} aria-hidden />
    <div>{children}</div>
  </div>
);
