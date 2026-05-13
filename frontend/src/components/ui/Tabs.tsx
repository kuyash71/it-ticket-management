import type { ReactNode } from "react";

type Tab = { key: string; label: ReactNode };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
};

export const Tabs = ({ tabs, active, onChange }: TabsProps) => (
  <div className="tabs" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        aria-selected={active === tab.key}
        className="tab"
        onClick={() => onChange(tab.key)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
