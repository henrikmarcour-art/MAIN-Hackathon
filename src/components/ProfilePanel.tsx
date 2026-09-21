"use client";

// Owned by: Thies (Profile)
// Feel free to restyle freely, add settings, friends list, etc.
// Props stay the same shape so Map/Events work doesn't need to change.

import { currentUser, type Venue } from "@/data/events";
import { Avatar } from "./Avatar";

type Props = {
  venues: Venue[];
  goingIds: Set<string>;
  onOpenVenue: (id: string) => void;
};

export default function ProfilePanel({ venues, goingIds, onOpenVenue }: Props) {
  const going = venues.filter((v) => goingIds.has(v.id));

  return (
    <div className="animate-fade pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] top-[132px] z-20 mx-auto w-full overflow-y-auto px-3 md:bottom-6 md:right-6 md:left-auto md:top-6 md:w-[400px] md:px-0">
      <div className="rounded-3xl border border-line/70 bg-surface p-5 shadow-sheet">
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
      </div>
    </div>
  );
}
