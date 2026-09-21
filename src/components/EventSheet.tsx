"use client";

import { useEffect, useState } from "react";
import { categoryMeta, currentUser, people, type Venue } from "@/data/events";
import { AvatarStack } from "./Avatar";
import AttendeeListSheet from "./AttendeeListSheet";
import { totalGoingCount } from "@/lib/venue-attendees";

type Props = {
  venue: Venue;
  going: boolean;
  onToggleGoing: () => void;
  onClose: () => void;
  /** Only provided for events the current user hosts. */
  onDelete?: () => void;
};

function priceLabel(p: 1 | 2 | 3) {
  return "€".repeat(p);
}

export default function EventSheet({
  venue,
  going,
  onToggleGoing,
  onClose,
  onDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  // Never carry a pending confirmation over to another event.
  useEffect(() => {
    setConfirmDelete(false);
    setShowAttendees(false);
  }, [venue.id]);

  const allGoing = totalGoingCount(venue, going);
  const host =
    venue.hostId === currentUser.id
      ? currentUser
      : venue.hostId
        ? people[venue.hostId]
        : null;
  const isHost = venue.hostId === currentUser.id;
  const accent = venue.isPrivate
    ? "text-violet"
    : venue.busy
      ? "text-orange"
      : "text-lime-deep";
  const dot = venue.isPrivate
    ? "bg-violet"
    : venue.busy
      ? "bg-orange"
      : "bg-lime";

  const categoryLabel =
    venue.category === "private"
      ? "Private"
      : categoryMeta[venue.category].label.replace(/s$/, "");

  const friendNames = venue.friendsGoing.map((p) => p.name);
  const friendLine =
    friendNames.length === 0
      ? venue.vibe
      : friendNames.length === 1
        ? `${friendNames[0]} is going`
        : `${friendNames.slice(0, 2).join(", ")}${
            friendNames.length > 2 ? ` +${friendNames.length - 2}` : ""
          } are going`;

  if (showAttendees) {
    return (
      <AttendeeListSheet
        venue={venue}
        userGoing={going}
        onClose={() => setShowAttendees(false)}
      />
    );
  }

  return (
    <div
      className="animate-sheet pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 mx-auto w-full px-3 md:inset-x-auto md:bottom-6 md:right-6 md:w-[400px] md:px-0"
      role="dialog"
      aria-label={venue.name}
    >
      <div className="rounded-3xl border border-line/70 bg-surface shadow-sheet">
        {/* Grabber */}
        <div className="flex justify-center pt-2.5 md:hidden">
          <span className="h-1 w-9 rounded-full bg-line" />
        </div>

        <div className="px-5 pb-5 pt-3 md:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className={`flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider ${accent}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {venue.isPrivate
                  ? `Private · hosted by ${host?.name ?? "a friend"}`
                  : venue.openJoin
                    ? `${categoryLabel} · anyone can join`
                    : venue.busy
                      ? `${categoryLabel} · busy now`
                      : categoryLabel}
              </div>
              <h2 className="mt-1 truncate text-[24px] font-bold leading-tight tracking-tight text-graphite">
                {venue.name}
              </h2>
              <p className="mt-0.5 text-[13px] text-graphite-muted">
                {venue.address}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-graphite-soft hover:bg-line"
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

          <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-line/80 py-3">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-graphite-muted">
                Time
              </dt>
              <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-graphite">
                {venue.time}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-graphite-muted">
                Vibe
              </dt>
              <dd className="mt-0.5 text-[14px] font-semibold leading-snug text-graphite">
                {venue.vibe}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-graphite-muted">
                Price
              </dt>
              <dd className="mt-0.5 text-[14px] font-semibold text-graphite">
                <span>{priceLabel(venue.price)}</span>
                <span className="text-line">
                  {"€".repeat(3 - venue.price)}
                </span>
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-[14px] leading-relaxed text-graphite-soft">
            {venue.description}
          </p>

          <button
            type="button"
            onClick={() => setShowAttendees(true)}
            aria-label={`View all ${allGoing} people going`}
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent py-1 text-left transition-colors hover:border-line/80 hover:bg-surface-2/60 active:scale-[0.99]"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {venue.friendsGoing.length > 0 && (
                <AvatarStack people={venue.friendsGoing} size={30} />
              )}
              <span className="leading-tight">
                <span className="block text-[15px] font-bold tabular-nums tracking-tight text-graphite">
                  {allGoing}{" "}
                  <span className="font-medium text-graphite-muted">going</span>
                </span>
                <span className="block text-[12px] text-graphite-muted">
                  {friendLine}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 pr-1 text-[12px] font-semibold text-cobalt">
              All
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>

          {isHost ? (
            confirmDelete && onDelete ? (
              <div className="mt-4">
                <p className="text-center text-[13px] font-medium text-graphite-soft">
                  Delete “{venue.name}”? This removes it from the map.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="h-12 rounded-2xl bg-surface-2 text-[15px] font-semibold text-graphite-soft hover:bg-line active:scale-[0.98]"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="h-12 rounded-2xl bg-graphite text-[15px] font-bold text-surface hover:brightness-110 active:scale-[0.98]"
                  >
                    Delete event
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-graphite text-[15px] font-bold tracking-tight text-lime">
                  You’re hosting
                </div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    aria-label={`Delete ${venue.name}`}
                    title="Delete event"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-graphite-soft hover:bg-surface-2 active:scale-[0.98]"
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7h16M10 11v6M14 11v6" />
                      <path d="M6 7l1 13h10l1-13" />
                      <path d="M9 7V4h6v3" />
                    </svg>
                  </button>
                )}
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={onToggleGoing}
              aria-pressed={going}
              className={[
                "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold tracking-tight transition-all active:scale-[0.98]",
                going
                  ? "bg-graphite text-lime"
                  : venue.isPrivate
                    ? "bg-violet text-white hover:brightness-105"
                    : "bg-lime text-graphite hover:brightness-95",
              ].join(" ")}
            >
              {going ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  You’re going
                </>
              ) : venue.isPrivate ? (
                "Accept & go"
              ) : (
                "I’m going"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
