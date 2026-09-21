"use client";

import type { Invitation, Venue } from "@/data/events";
import { Avatar, AvatarStack } from "./Avatar";

type ChipProps = {
  invitation: Invitation;
  venue: Venue;
  onOpen: () => void;
};

/** Small floating notification under the top bar */
export function InviteChip({ invitation, venue, onOpen }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="animate-fade pointer-events-auto flex items-center gap-3 rounded-full border border-violet/30 bg-surface/95 py-1.5 pl-1.5 pr-4 text-left shadow-float backdrop-blur-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <Avatar person={invitation.from} size={30} />
      <span className="leading-tight">
        <span className="block text-[13px] font-semibold tracking-tight text-graphite">
          {invitation.from.name} invited you
        </span>
        <span className="block text-[12px] text-violet">
          {venue.name} · {venue.time}
        </span>
      </span>
      <span className="ml-1 h-2 w-2 rounded-full bg-violet" />
    </button>
  );
}

type CardProps = {
  invitation: Invitation;
  venue: Venue;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
};

/** Apple Invites-style card */
export function InviteCard({
  invitation,
  venue,
  onAccept,
  onDecline,
  onClose,
}: CardProps) {
  return (
    <div
      className="animate-fade absolute inset-0 z-40 flex items-end justify-center bg-graphite/40 p-3 backdrop-blur-[2px] md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Invitation from ${invitation.from.name}`}
    >
      <div
        className="animate-sheet w-full max-w-[380px] overflow-hidden rounded-[28px] bg-surface shadow-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        <div className="relative h-56 bg-violet">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, #fff 0, transparent 40%), radial-gradient(circle at 80% 90%, #1c1c1e 0, transparent 45%)",
            }}
          />
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              Private
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-[12px] font-medium uppercase tracking-wider text-white/75">
              Tonight · {venue.time}
            </p>
            <h2 className="mt-1 text-[30px] font-bold leading-[1.05] tracking-tight">
              {venue.name}
            </h2>
            <p className="mt-1 text-[13px] text-white/80">{venue.address}</p>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="flex items-start gap-3">
            <Avatar person={invitation.from} size={36} />
            <div className="min-w-0">
              <p className="text-[13px] text-graphite-muted">
                <span className="font-semibold text-graphite">
                  {invitation.from.name}
                </span>{" "}
                is hosting
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-graphite-soft">
                “{invitation.message}”
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5 py-2.5">
            <AvatarStack people={venue.friendsGoing} size={26} />
            <p className="text-[13px] text-graphite-soft">
              <span className="font-semibold text-graphite">
                {venue.goingCount} guests
              </span>{" "}
              already in · {venue.vibe}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
            <button
              type="button"
              onClick={onDecline}
              className="h-12 rounded-2xl bg-surface-2 text-[15px] font-semibold text-graphite-soft hover:bg-line active:scale-[0.98]"
            >
              Can’t make it
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="h-12 rounded-2xl bg-violet text-[15px] font-bold text-white hover:brightness-105 active:scale-[0.98]"
            >
              Accept invitation
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-graphite-muted">
            Only invited guests can see this event on the map.
          </p>
        </div>
      </div>
    </div>
  );
}
