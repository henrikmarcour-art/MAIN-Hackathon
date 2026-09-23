"use client";

import { useState } from "react";
import { categoryMeta, type Venue } from "@/data/events";
import { AvatarStack } from "@/components/Avatar";
import {
  attendeeCountNoun,
  displayAttendeeCount,
  type CrowdQuery,
} from "@/lib/venue-attendance";
import type { Filter } from "./types";
import { ChevronIcon } from "./icons";

type Props = {
  venues: Venue[];
  goingIds: Set<string>;
  filter: Filter;
  crowd: CrowdQuery;
  headlineCount: number;
  onPick: (id: string) => void;
};

function categoryLabel(v: Venue) {
  return v.category === "private"
    ? "Private"
    : categoryMeta[v.category].label.replace(/s$/, "");
}

export default function DiscoveryRail({
  venues,
  goingIds,
  filter,
  crowd,
  headlineCount,
  onPick,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const countNoun = attendeeCountNoun(filter);

  const popular = [...venues]
    .map((v) => ({
      v,
      count: displayAttendeeCount(v, goingIds, filter, crowd),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <section
      aria-label="Popular tonight"
      className="pointer-events-none absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 px-3 md:inset-x-auto md:bottom-6 md:left-6 md:w-[460px] md:px-0"
    >
      <div className="mn-control pointer-events-auto rounded-3xl md:rounded-2xl">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex w-full flex-col items-stretch px-4 pt-2 text-left"
        >
          <span className="mx-auto mb-2 h-1 w-9 rounded-full bg-line md:hidden" />
          <span className="flex items-center justify-between pb-2 md:pt-1.5">
            <span>
              <span className="block text-[15px] font-bold tracking-tight text-graphite">
                Popular tonight
              </span>
              <span className="block text-[12px] text-graphite-muted">
                <span className="font-semibold tabular-nums text-graphite-soft">
                  {headlineCount.toLocaleString("en-US")}
                </span>{" "}
                {filter === "friends"
                  ? "friends out tonight"
                  : "people going out"}
              </span>
            </span>
            <span
              className={`grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-graphite-soft transition-transform ${
                expanded ? "rotate-90" : "-rotate-90"
              }`}
            >
              <ChevronIcon size={13} strokeWidth={2.4} />
            </span>
          </span>
        </button>

        {expanded && (
          <div className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto px-3 pb-3 pt-1">
            {popular.length === 0 && (
              <p className="px-1 pb-1 text-[13px] text-graphite-muted">
                Nothing in this lens yet. Try another filter.
              </p>
            )}
            {popular.map(({ v, count }, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onPick(v.id)}
                className="mn-card group w-[212px] shrink-0 snap-start text-left"
              >
                <span className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                      v.isPrivate ? "text-violet" : "text-cobalt"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        v.isPrivate ? "bg-violet" : "bg-cobalt"
                      }`}
                    />
                    {categoryLabel(v)}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-graphite px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime">
                      Hottest
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block truncate text-[15px] font-bold leading-tight tracking-tight text-graphite">
                  {v.name}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-graphite-muted">
                  {v.time}
                </span>
                <span className="mt-2.5 flex items-center justify-between">
                  {v.friendsGoing.length > 0 ? (
                    <AvatarStack people={v.friendsGoing.slice(0, 3)} size={22} />
                  ) : (
                    <span className="text-[12px] text-graphite-muted">
                      {v.vibe.split(" · ")[0]}
                    </span>
                  )}
                  <span className="text-[13px] font-bold tabular-nums tracking-tight text-graphite">
                    {count}
                    <span className="ml-1 font-medium text-graphite-muted">
                      {countNoun}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
