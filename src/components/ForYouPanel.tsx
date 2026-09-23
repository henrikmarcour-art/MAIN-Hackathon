"use client";

// Owned by: Leo (Events)
// Feel free to restyle the feed, add sections (e.g. "This weekend"),
// or pull in different sort/ranking logic. Props stay the same shape.

import { type Venue } from "@/data/events";
import { displayAttendeeCount, type CrowdQuery } from "@/lib/venue-attendance";
import { AvatarStack } from "./Avatar";

type Props = {
  venues: Venue[];
  goingIds: Set<string>;
  crowd: CrowdQuery;
  onOpenVenue: (id: string) => void;
};

export default function ForYouPanel({ venues, goingIds, crowd, onOpenVenue }: Props) {
  const top = [...venues]
    .filter((v) => !v.isPrivate)
    .sort(
      (a, b) =>
        displayAttendeeCount(b, goingIds, "all", crowd) -
        displayAttendeeCount(a, goingIds, "all", crowd)
    )
    .slice(0, 4);

  return (
    <div className="animate-fade pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] top-[132px] z-20 mx-auto w-full overflow-y-auto px-3 md:bottom-6 md:right-6 md:left-auto md:top-6 md:w-[400px] md:px-0">
      <div className="rounded-3xl border border-line/70 bg-surface p-5 shadow-sheet">
        <h2 className="text-[22px] font-bold tracking-tight">For You</h2>
        <p className="mt-0.5 text-[13px] text-graphite-muted">
          Where your people are tonight.
        </p>
        <ul className="mt-4 divide-y divide-line/80">
          {top.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onOpenVenue(v.id)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold tracking-tight">
                    {v.name}
                  </div>
                  <div className="text-[12px] text-graphite-muted">
                    {v.time} · {v.vibe}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.friendsGoing.length > 0 && (
                    <AvatarStack people={v.friendsGoing} size={22} />
                  )}
                  <span
                    className={`text-[13px] font-bold tabular-nums ${
                      v.busy ? "text-orange" : "text-graphite"
                    }`}
                  >
                    {displayAttendeeCount(v, goingIds, "all", crowd)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
