"use client";

import type { Filter } from "./types";
import { TrendIcon, UsersIcon } from "./icons";

type Props = {
  filter: Filter;
  onFilter: (f: Filter) => void;
  /** Show the full set (mobile) or only the compact set (desktop). */
  className?: string;
};

const chips: { key: Filter; label: string; icon?: React.ReactNode }[] = [
  { key: "all", label: "All" },
  { key: "friends", label: "Friends", icon: <UsersIcon size={13} strokeWidth={2.2} /> },
  { key: "trending", label: "Trending", icon: <TrendIcon size={13} strokeWidth={2.2} /> },
  { key: "bar", label: "Bars" },
  { key: "club", label: "Clubs" },
  { key: "event", label: "Events" },
  { key: "food", label: "Food" },
];

export default function DiscoveryChips({ filter, onFilter, className = "" }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Discover"
      className={`no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto ${className}`}
    >
      {chips.map((c) => {
        const active = filter === c.key;
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onFilter(c.key)}
            className={[
              "mn-chip",
              active ? "is-active" : "",
            ].join(" ")}
          >
            {c.icon}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
