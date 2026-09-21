"use client";

import { currentUser, type Venue } from "@/data/events";
import { Avatar, AvatarStack } from "./Avatar";
import type { Tab } from "./BottomNav";

type Props = {
  tab: Exclude<Tab, "map">;
  venues: Venue[];
  goingIds: Set<string>;
  onOpenVenue: (id: string) => void;
};

/** Lightweight panels for the non-map tabs (Phase 1: minimal, no routes). */
export default function TabPanel({ tab, venues, goingIds, onOpenVenue }: Props) {
  const going = venues.filter((v) => goingIds.has(v.id));
  const top = [...venues]
    .filter((v) => !v.isPrivate)
    .sort((a, b) => b.goingCount - a.goingCount)
    .slice(0, 4);

  return (
    <div className="animate-fade pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] top-[132px] z-20 mx-auto w-full overflow-y-auto px-3 md:bottom-6 md:right-6 md:left-auto md:top-6 md:w-[400px] md:px-0">
      <div className="rounded-3xl border border-line/70 bg-surface p-5 shadow-sheet">
        {tab === "foryou" && (
          <>
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
                        {v.goingCount + (goingIds.has(v.id) ? 1 : 0)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "create" && (
          <>
            <h2 className="text-[22px] font-bold tracking-tight">Create</h2>
            <p className="mt-0.5 text-[13px] text-graphite-muted">
              Host a public night or a private party.
            </p>
            <div className="mt-4 grid gap-2">
              <div className="rounded-2xl border border-line/80 p-4">
                <div className="text-[14px] font-semibold">Public event</div>
                <div className="text-[12px] text-graphite-muted">
                  Visible to everyone in Maastricht.
                </div>
              </div>
              <div className="rounded-2xl border border-violet/40 p-4">
                <div className="text-[14px] font-semibold text-violet">
                  Private party
                </div>
                <div className="text-[12px] text-graphite-muted">
                  Only invited guests see it on the map.
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-graphite-muted">
              Event creation ships in Phase 2.
            </p>
          </>
        )}

        {tab === "profile" && (
          <>
            <div className="flex items-center gap-3">
              <Avatar person={currentUser} size={48} />
              <div>
                <h2 className="text-[22px] font-bold leading-tight tracking-tight">
                  {currentUser.name}
                </h2>
                <p className="text-[13px] text-graphite-muted">Maastricht</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-line/80 py-3 text-center">
              <div>
                <div className="text-[18px] font-bold tabular-nums">
                  {going.length}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-graphite-muted">
                  tonight
                </div>
              </div>
              <div>
                <div className="text-[18px] font-bold tabular-nums">7</div>
                <div className="text-[11px] uppercase tracking-wider text-graphite-muted">
                  friends
                </div>
              </div>
              <div>
                <div className="text-[18px] font-bold tabular-nums">12</div>
                <div className="text-[11px] uppercase tracking-wider text-graphite-muted">
                  nights out
                </div>
              </div>
            </div>
            <h3 className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
              Your plans tonight
            </h3>
            {going.length === 0 ? (
              <p className="mt-2 text-[14px] text-graphite-soft">
                Nothing yet. Tap a marker and hit “I’m going”.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line/80">
                {going.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => onOpenVenue(v.id)}
                      className="flex w-full items-center justify-between py-2.5 text-left"
                    >
                      <span className="text-[15px] font-semibold tracking-tight">
                        {v.name}
                      </span>
                      <span className="text-[12px] tabular-nums text-graphite-muted">
                        {v.time}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
