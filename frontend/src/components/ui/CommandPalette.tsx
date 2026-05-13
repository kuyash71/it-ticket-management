import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { IconSearch } from "./Icon";

export type CommandAction = {
  key: string;
  label: string;
  group?: string;
  icon?: ReactNode;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  actions: CommandAction[];
  placeholder?: string;
  emptyText?: string;
};

export const CommandPalette = ({
  open,
  onClose,
  actions,
  placeholder = "Type a command or search...",
  emptyText = "No results found."
}: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => {
      const hay = `${a.label} ${a.group ?? ""} ${(a.keywords ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, actions]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandAction[]>();
    for (const a of filtered) {
      const g = a.group ?? "";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(a);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const action = filtered[active];
        if (action) {
          action.onSelect();
          onClose();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, filtered, active]);

  if (!open) return null;

  let runningIndex = 0;
  return (
    <div className="command-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="command" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-input-row">
          <IconSearch />
          <input
            ref={inputRef}
            className="command-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            aria-label={placeholder}
          />
          <span className="kbd">ESC</span>
        </div>
        <div className="command-list" role="listbox">
          {filtered.length === 0 && <div className="command-empty">{emptyText}</div>}
          {grouped.map(([group, items]) => (
            <div key={group}>
              {group && <div className="command-group-label">{group}</div>}
              {items.map((a) => {
                const idx = runningIndex++;
                const isActive = idx === active;
                return (
                  <button
                    key={a.key}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className="command-item"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => { a.onSelect(); onClose(); }}
                  >
                    {a.icon}
                    <span style={{ flex: 1 }}>{a.label}</span>
                    {a.shortcut && <span className="kbd">{a.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
