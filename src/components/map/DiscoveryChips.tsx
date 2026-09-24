"use client";

import { useEffect, useRef, useState } from "react";
import { categoryMeta } from "@/data/events";
import type { Filter } from "./types";
import { ChevronIcon, TrendIcon, UsersIcon } from "./icons";

type Props = {
  filter: Filter;
  onFilter: (f: Filter) => void;
  className?: string;
  /** Which edge the type menu lines up with. */
  menuAlign?: "start" | "end";
};

type Lens = Extract<Filter, "all" | "friends" | "trending">;
type TypeFilter = Exclude<Filter, Lens>;

/**
 * Three lenses on tonight, plus a secondary type menu. "Tonight" is the
 * `all` filter: it already means everything open now or starting later tonight.
 */
const lenses: { key: Lens; label: string; icon?: React.ReactNode }[] = [
  { key: "all", label: "Tonight" },
  { key: "friends", label: "Friends", icon: <UsersIcon size={13} strokeWidth={2.2} /> },
  { key: "trending", label: "Trending", icon: <TrendIcon size={13} strokeWidth={2.2} /> },
];

const types: TypeFilter[] = ["bar", "club", "event", "food"];

export default function DiscoveryChips({
  filter,
  onFilter,
  className = "",
  menuAlign = "start",
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeType = (types as Filter[]).includes(filter)
    ? (filter as TypeFilter)
    : null;

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const pick = (f: Filter) => {
    setMenuOpen(false);
    onFilter(f);
  };

  return (
    <div ref={rootRef} className={`pointer-events-auto relative ${className}`}>
      <div
        role="tablist"
        aria-label="Discover"
        className="no-scrollbar flex gap-2 overflow-x-auto"
      >
        {lenses.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pick(c.key)}
              className={`mn-chip ${active ? "is-active" : ""}`}
            >
              {c.icon}
              {c.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className={`mn-chip ${activeType ? "is-active" : ""}`}
        >
          {activeType ? categoryMeta[activeType].label : "Type"}
          <ChevronIcon
            size={12}
            strokeWidth={2.4}
            className={menuOpen ? "-rotate-90" : "rotate-90"}
          />
        </button>
      </div>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Type of place"
          className={`mn-control animate-fade absolute top-full z-10 mt-2 w-44 overflow-hidden rounded-2xl py-1 ${
            menuAlign === "end" ? "right-0" : "left-0"
          }`}
        >
          {types.map((t) => (
            <button
              key={t}
              type="button"
              role="menuitemradio"
              aria-checked={filter === t}
              onClick={() => pick(filter === t ? "all" : t)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-body text-graphite hover:bg-surface-2"
            >
              {categoryMeta[t].label}
              {filter === t && (
                <span className="h-1.5 w-1.5 rounded-full bg-graphite" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
