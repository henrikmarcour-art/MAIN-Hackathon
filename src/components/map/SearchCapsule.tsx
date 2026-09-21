"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { categoryMeta, currentUser, type Venue } from "@/data/events";
import { Avatar } from "@/components/Avatar";
import { displayAttendeeCount } from "@/lib/venue-attendance";
import type { Filter } from "./types";
import { CloseIcon, SearchIcon } from "./icons";

type Props = {
  venues: Venue[];
  goingIds: Set<string>;
  filter: Filter;
  onPick: (id: string) => void;
  className?: string;
};

function categoryLabel(v: Venue) {
  return v.category === "private"
    ? "Private"
    : categoryMeta[v.category].label.replace(/s$/, "");
}

export default function SearchCapsule({
  venues,
  goingIds,
  filter,
  onPick,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = venues
      .map((v) => ({
        v,
        count: displayAttendeeCount(v, goingIds, filter),
      }))
      .filter(({ v }) =>
        term.length === 0
          ? true
          : `${v.name} ${v.vibe} ${v.address} ${categoryLabel(v)}`
              .toLowerCase()
              .includes(term)
      )
      .sort((a, b) => b.count - a.count);
    return list.slice(0, 6);
  }, [venues, goingIds, filter, q]);

  return (
    <div className={`pointer-events-auto relative ${className}`}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mn-control flex h-14 w-full items-center gap-3 rounded-full pl-4 pr-2 text-left transition-transform active:scale-[0.99]"
          aria-label="Search tonight"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-graphite text-surface">
            <SearchIcon size={15} strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[15px] font-bold tracking-tight text-graphite">
              Where to tonight?
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-graphite-muted">
              Maastricht
              <span className="text-line">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-graphite-soft">
                <span className="mn-live-dot" />
                Live now
              </span>
            </span>
          </span>
          <span className="shrink-0 pr-1">
            <Avatar person={currentUser} size={34} />
          </span>
        </button>
      ) : (
        <div className="mn-control animate-fade overflow-hidden rounded-[22px]">
          <div className="flex h-14 items-center gap-3 pl-4 pr-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-graphite text-surface">
              <SearchIcon size={15} strokeWidth={2.4} />
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search places, vibes, streets"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium tracking-tight text-graphite outline-none placeholder:text-graphite-muted"
              aria-label="Search places"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close search"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-graphite-soft hover:bg-surface-2"
            >
              <CloseIcon size={14} />
            </button>
          </div>
          <div className="border-t border-line/80">
            <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-graphite-muted">
              {q.trim() ? "Results" : "Popular now"}
            </div>
            {results.length === 0 ? (
              <p className="px-4 pb-4 pt-1 text-[13px] text-graphite-muted">
                Nothing matches tonight. Try a street or a vibe.
              </p>
            ) : (
              <ul className="max-h-[300px] overflow-y-auto pb-2">
                {results.map(({ v, count }) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(v.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          v.isPrivate ? "bg-violet" : "bg-cobalt"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold tracking-tight text-graphite">
                          {v.name}
                        </span>
                        <span className="block truncate text-[12px] text-graphite-muted">
                          {categoryLabel(v)} · {v.time}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold tabular-nums text-graphite">
                        {count}
                        <span className="ml-1 font-medium text-graphite-muted">
                          going
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
