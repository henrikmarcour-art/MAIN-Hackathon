"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  categoryMeta,
  people,
  type FriendPlan,
  type Invitation,
  type Venue,
} from "@/data/events";
import type { Filter } from "@/components/map/types";
import type { LngLat } from "@/lib/map/geo";
import { ChevronIcon, FilterIcon, LockIcon } from "@/components/map/icons";
import {
  Caption,
  Face,
  Faces,
  LiveDot,
  VenueImage,
  timeText,
  venueTimeState,
  walkLabel,
} from "./ui";

export type Pick = { venue: Venue; why: string };

type TypeFilter = Exclude<Filter, "all" | "friends" | "trending">;
const TYPES: TypeFilter[] = ["bar", "club", "event", "food"];

type Props = {
  at: Date;
  isNow: boolean;
  timeLabel: string;
  /** People out across the city at the chosen time. */
  outCount: number;
  picks: Pick[];
  friendsOut: FriendPlan[];
  venueById: ReadonlyMap<string, Venue>;
  invite: { invitation: Invitation; venue: Venue } | null;
  userPosition: LngLat | null;
  typeFilter: TypeFilter | null;
  onTypeFilter: (t: TypeFilter | null) => void;
  onOpenVenue: (id: string) => void;
  onFriends: () => void;
  onInvite: () => void;
};

/** The night's own day: 01:00 on Saturday is still Friday night. */
const weekday = (at: Date) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "Europe/Amsterdam" }).format(
    new Date(at.getTime() - 6 * 60 * 60 * 1000)
  );

/** "Café De Poshoorn" → "De Poshoorn", so names fit under a face. */
const shortName = (n: string) => n.replace(/^(In den Ouden |Café )/, "");

export default function TonightView({
  at,
  isNow,
  timeLabel,
  outCount,
  picks,
  friendsOut,
  venueById,
  invite,
  userPosition,
  typeFilter,
  onTypeFilter,
  onOpenVenue,
  onFriends,
  onInvite,
}: Props) {
  const [top, ...rest] = picks;
  const topState = top ? venueTimeState(top.venue, at) : null;
  const topWalk = top ? walkLabel(top.venue, userPosition) : null;

  return (
    <div className="pb-8">
      <div className="flex items-end justify-between px-7 pb-5 pt-[26px]">
        <div>
          <Caption className="mb-2">{weekday(at)} · Maastricht</Caption>
          <h1 className="text-hero text-ui-ink">Tonight</h1>
        </div>
        <div className="pb-[3px] text-right">
          <div className="flex items-center justify-end gap-[7px] text-[15px] font-semibold text-ui-ink">
            {isNow && <LiveDot />}
            <span className="font-mono tabular-nums">{isNow ? `Now ${timeLabel}` : `At ${timeLabel}`}</span>
          </div>
          <div className="mt-[3px] text-meta text-ui-ink-soft">
            <span className="font-mono tabular-nums">{outCount}</span> out in the city
          </div>
        </div>
      </div>

      {top && topState && (
        <button
          type="button"
          onClick={() => onOpenVenue(top.venue.id)}
          className="mx-4 block w-[calc(100%-32px)] rounded-[22px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-ink"
        >
          <VenueImage className="h-[222px] rounded-[22px]">
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.25)_48%,rgba(0,0,0,0)_70%)]" />
            <div className="absolute inset-x-5 bottom-[18px] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
              <div className="text-caption uppercase tracking-[0.1em] opacity-85">
                Your pick{topWalk ? ` · ${topWalk}` : ""} · {timeText(topState, isNow)}
              </div>
              <div className="mt-1.5 text-feature">{top.venue.name}</div>
              <div className="mt-2.5 flex items-center gap-2.5 text-[14px] font-medium">
                {top.venue.friendsGoing.length > 0 && (
                  <Faces people={top.venue.friendsGoing} size={26} ringColor="#111" />
                )}
                <span className="truncate">{top.why}</span>
              </div>
            </div>
          </VenueImage>
        </button>
      )}

      {friendsOut.length > 0 && (
        <div className="px-7 pt-[22px]">
          <button
            type="button"
            onClick={onFriends}
            className="flex w-full items-baseline justify-between text-ui-ink"
          >
            <span className="text-headline font-bold">{friendsOut.length} friends out</span>
            <span className="text-meta font-semibold text-ui-ink-soft">See where</span>
          </button>
          <div className="mt-3.5 grid grid-cols-6 gap-2">
            {friendsOut.map((p) => {
              const person = people[p.personId];
              const place = venueById.get(p.atVenueId);
              if (!person) return null;
              return (
                <button
                  key={p.personId}
                  type="button"
                  onClick={onFriends}
                  className="flex min-w-0 flex-col items-center gap-1.5"
                >
                  <Face
                    person={person}
                    size={50}
                    ring={p.nextVenueId && p.nextVenueId === top?.venue.id ? "ink" : "none"}
                  />
                  <span className="text-[12px] font-semibold text-ui-ink">{person.name}</span>
                  {place && (
                    <span className="-mt-1 max-w-full truncate text-[11px] text-ui-ink-soft">
                      {shortName(place.name)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {invite && (
        <button
          type="button"
          onClick={onInvite}
          className="mx-7 mt-5 flex w-[calc(100%-56px)] items-center gap-3.5 border-y border-ui-line py-3.5 text-left text-ui-ink"
        >
          <span className="m-0.5">
            <Face person={invite.invitation.from} size={36} ring="violet" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">
              {invite.invitation.from.name} invited you
            </span>
            <span className="flex min-w-0 items-center gap-[5px] text-meta text-ui-ink-soft">
              <span className="text-ui-violet">
                <LockIcon size={11} strokeWidth={2.4} />
              </span>
              <span className="truncate">{invite.venue.name}</span> · <span className="font-mono tabular-nums">{invite.venue.time.split(/\s*[–-]\s*/)[0]}</span>
              {invite.venue.goingCount > 1 && <> · {invite.venue.goingCount - 1} in</>}
            </span>
          </span>
          <span className="text-ui-ink-muted">
            <ChevronIcon size={16} />
          </span>
        </button>
      )}

      <div className="flex items-center justify-between px-7 pt-5">
        <Caption>{typeFilter ? categoryMeta[typeFilter].label : "Also tonight"}</Caption>
        <TypeMenu value={typeFilter} onChange={onTypeFilter} />
      </div>
      <div className="px-7">
        {rest.slice(0, 3).map(({ venue: v, why }) => {
          const s = venueTimeState(v, at);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onOpenVenue(v.id)}
              className="flex w-full items-center gap-3.5 border-b border-ui-line py-3 text-left"
            >
              <VenueImage className="h-[52px] w-[52px] rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold tracking-[-0.01em] text-ui-ink">{v.name}</span>
                <span className="block truncate text-meta text-ui-ink-soft">{why}</span>
              </span>
              <span
                className={`font-mono text-meta tabular-nums ${s.kind === "closed" ? "text-ui-ink-muted" : "text-ui-ink"}`}
              >
                {s.kind === "open" ? `→ ${s.until}` : timeText(s, isNow)}
              </span>
            </button>
          );
        })}
        {rest.length === 0 && (
          <p className="py-4 text-meta text-ui-ink-soft">Nothing else open at this time.</p>
        )}
      </div>
    </div>
  );
}

/**
 * The one small way into venue types on desktop: a quiet button that opens
 * four options, instead of a permanent row of chips.
 */
function TypeMenu({
  value,
  onChange,
}: {
  value: TypeFilter | null;
  onChange: (t: TypeFilter | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (t: TypeFilter | null) => {
    onChange(t);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-meta font-semibold transition-colors ${
          value ? "bg-ui-ink text-ui-panel" : "text-ui-ink-soft hover:bg-ui-fill"
        }`}
      >
        <FilterIcon size={14} strokeWidth={2.2} />
        {value ? categoryMeta[value].label : "All types"}
      </button>
      {open && (
        <div
          id={id}
          role="group"
          aria-label="Venue type"
          className="animate-fade absolute right-0 top-[calc(100%+6px)] z-30 flex w-44 flex-col rounded-2xl bg-ui-panel p-1.5 shadow-float ring-1 ring-ui-line"
        >
          {[null, ...TYPES].map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              aria-pressed={value === t}
              onClick={() => pick(t)}
              className={`flex h-10 items-center rounded-xl px-3 text-left text-body ${
                value === t ? "font-semibold text-ui-ink" : "font-medium text-ui-ink-soft"
              } hover:bg-ui-fill`}
            >
              {t ? categoryMeta[t].label : "All types"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
