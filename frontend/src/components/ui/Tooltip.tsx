import { useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";

type TooltipProps = PropsWithChildren<{
  label: ReactNode;
}>;

export const Tooltip = ({ label, children }: TooltipProps) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && <span className="tooltip" role="tooltip">{label}</span>}
    </span>
  );
};
