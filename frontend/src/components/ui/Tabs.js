import { jsx as _jsx } from "react/jsx-runtime";
export const Tabs = ({ tabs, active, onChange }) => (_jsx("div", { className: "tabs", role: "tablist", children: tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": active === tab.key, className: "tab", onClick: () => onChange(tab.key), children: tab.label }, tab.key))) }));
