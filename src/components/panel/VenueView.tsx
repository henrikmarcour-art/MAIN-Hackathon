"use client";

import type { Venue } from "@/data/events";
import type { LngLat } from "@/lib/map/geo";
import { BackIcon, CheckIcon, LockIcon } from "@/components/map/icons";
import {
  BTN_PRIMARY,
  Caption,
  Face,
  LiveDot,
  VenueImage,
  areaOf,
  categoryLabel,
  euro,
  timeText,
  venueTimeState,
  walkLabel,
} from "./ui";

type Props = {
  venue: Venue;
  at: Date;
  isNow: boolean;
  going: boolean;
  userPosition: LngLat | null;
  onBack: () => void;
  onToggleGoing: () => void;
  /** Only for events created in this browser. */
  onDelete?: () => void;
};

/**
 * Selected venue: the photo, then what and when, who's going, and one lime
 * action. Share and Invite from the mockup are left out until they do
 * something real (no dead buttons).
 */
export default function VenueView({
  venue: v,
  at,
  isNow,
  going,
  userPosition,
  onBack,
  onToggleGoing,
  onDelete,
}: Props) {
  const s = venueTimeState(v, at);
  const walk = walkLabel(v, userPosition);
  const others = Math.max(0, v.goingCount - v.friendsGoing.length);
  const area = areaOf(v);

  return (
    <div className="flex h-full flex-col">
      <VenueImage className="h-[310px]">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0)_30%)]" />
        <div className="absolute left-[22px] top-[22px]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"
          >
            <BackIcon size={18} />
          </button>
        </div>
      </VenueImage>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6 pt-6">
        <Caption className={v.isPrivate ? "flex items-center gap-1.5 !text-ui-violet" : ""}>
          {v.isPrivate && <LockIcon size={11} strokeWidth={2.4} />}
          {categoryLabel(v.category)}
          {area ? ` · ${area}` : ""}
        </Caption>
        <h1 className="mt-2 text-hero text-ui-ink">{v.name}</h1>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-ui-ink-soft">
          <span className="flex items-center gap-[7px] font-semibold text-ui-ink">
            {s.kind === "open" && isNow && <LiveDot />}
            {timeText(s, isNow)}
          </span>
          <span className="whitespace-nowrap font-mono tabular-nums">{v.time}</span>
          {walk && (
            <>
              <span>·</span>
              <span className="whitespace-nowrap">{walk}</span>
            </>
          )}
          <span>·</span>
          <span>{euro(v.price)}</span>
        </div>
        <div className="mt-1 text-[15px] text-ui-ink-soft">{v.vibe}</div>

        {(v.friendsGoing.length > 0 || others > 0) && (
          <div className="mt-[22px] flex gap-4 border-t border-ui-line pt-5">
            {v.friendsGoing.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <Face person={p} size={52} />
                <span className="text-meta font-semibold text-ui-ink">{p.name}</span>
              </div>
            ))}
            {others > 0 && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-ui-fill font-mono text-[12px] font-bold text-ui-ink">
                  +{others}
                </span>
                <span className="text-meta text-ui-ink-soft">going</span>
              </div>
            )}
          </div>
        )}

        <p className="mt-[18px] text-[15px] leading-[23px] text-ui-ink-soft">{v.description}</p>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-5 text-meta font-semibold text-ui-ink-soft underline-offset-4 hover:underline"
          >
            Delete this event
          </button>
        )}
      </div>

      <div className="flex gap-2.5 border-t border-ui-line bg-ui-panel px-7 pb-[26px] pt-4">
        {going ? (
          <button
            type="button"
            onClick={onToggleGoing}
            aria-pressed="true"
            className="inline-flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-ui-fill text-[16px] font-semibold text-ui-ink hover:brightness-95 active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-ink">
              <CheckIcon size={13} />
            </span>
            You’re going
          </button>
        ) : (
          <button type="button" onClick={onToggleGoing} aria-pressed="false" className={`${BTN_PRIMARY} flex-1`}>
            I’m going
          </button>
        )}
      </div>
    </div>
  );
}
