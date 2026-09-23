"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { currentUser, type Person, type Venue } from "@/data/events";
import {
  loadEventChat,
  saveEventChat,
  type StoredChatMessage,
} from "@/lib/event-chat";
import {
  buildAttendeeList,
  isFriendAttendee,
  totalGoingCount,
} from "@/lib/venue-attendees";
import type { CrowdQuery } from "@/lib/venue-attendance";
import { Avatar } from "./Avatar";

type Props = {
  venue: Venue;
  userGoing: boolean;
  crowd: CrowdQuery;
  onClose: () => void;
};

function displayName(p: Person): string {
  return p.id === currentUser.id ? "You" : p.name;
}

function matchesSearch(p: Person, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    displayName(p),
    p.name,
    p.initials,
    currentUser.name,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function AttendeeListSheet({
  venue,
  userGoing,
  crowd,
  onClose,
}: Props) {
  const [draft, setDraft] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [chatReady, setChatReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const attendees = useMemo(
    () => buildAttendeeList(venue, userGoing, crowd),
    [venue, userGoing, crowd]
  );
  const filteredAttendees = useMemo(
    () => attendees.filter((p) => matchesSearch(p, peopleQuery.trim())),
    [attendees, peopleQuery]
  );
  const total = totalGoingCount(venue, userGoing, crowd);
  const trimmedQuery = peopleQuery.trim();

  useEffect(() => {
    setMessages(loadEventChat(venue));
    setChatReady(true);
    setPeopleQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload chat only when switching events
  }, [venue.id]);

  useEffect(() => {
    if (!chatReady || !venue.isPrivate) return;
    saveEventChat(venue.id, messages);
  }, [messages, venue.id, venue.isPrivate, chatReady]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        from: currentUser,
        text,
        at: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setDraft("");
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div
      className="animate-sheet pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-h-[min(72dvh,640px)] w-full flex-col px-3 md:inset-x-auto md:bottom-6 md:right-6 md:w-[400px] md:px-0"
      role="dialog"
      aria-label={`Going to ${venue.name}`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-line/70 bg-surface shadow-sheet md:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-line/80 px-5 py-3">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-graphite">
              {total}{" "}
              <span className="font-semibold text-graphite-muted">going</span>
            </h2>
            <p className="text-[12px] text-graphite-muted">{venue.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to event"
            className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-graphite-soft hover:bg-line"
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

        {venue.isPrivate && (
          <div className="shrink-0 border-b border-line/80 bg-surface-2/80 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-violet">
              Group chat
            </p>
            <div className="mb-2 max-h-[120px] space-y-2 overflow-y-auto rounded-2xl bg-surface px-3 py-2">
              {messages.length === 0 && (
                <p className="text-[12px] text-graphite-muted">
                  Say hi to everyone invited.
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} className="flex gap-2 text-[13px] leading-snug">
                  <Avatar person={m.from} size={24} className="shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-graphite">
                      {m.from.id === currentUser.id ? "You" : m.from.name}
                    </span>
                    <span className="ml-1.5 text-[11px] tabular-nums text-graphite-muted">
                      {m.at}
                    </span>
                    <p className="text-graphite-soft">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message the group…"
                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-[14px] text-graphite outline-none placeholder:text-graphite-muted focus:border-violet/50"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="h-10 shrink-0 rounded-xl bg-violet px-4 text-[14px] font-bold text-white disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        )}

        <div className="shrink-0 border-b border-line/80 px-4 py-2.5">
          <label className="sr-only" htmlFor="attendee-search">
            Search people at this event
          </label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-muted"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" />
            </svg>
            <input
              id="attendee-search"
              type="search"
              value={peopleQuery}
              onChange={(e) => setPeopleQuery(e.target.value)}
              placeholder="Search people…"
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-line bg-surface-2/80 pl-9 pr-3 text-[14px] text-graphite outline-none placeholder:text-graphite-muted focus:border-cobalt/40 focus:bg-surface"
            />
          </div>
        </div>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
        >
          {trimmedQuery && filteredAttendees.length === 0 ? (
            <p className="px-2 py-6 text-center text-[14px] font-medium text-graphite-muted">
              no people found
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {filteredAttendees.map((p) => {
                const isYou = p.id === currentUser.id;
                const isFriend = isFriendAttendee(venue, p);
                const isHost = venue.hostId === p.id;
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 py-2.5 pl-1 pr-2"
                  >
                    <Avatar person={p} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-graphite">
                          {displayName(p)}
                        </span>
                        {isHost && (
                          <span className="shrink-0 rounded-full bg-violet/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet">
                            Host
                          </span>
                        )}
                        {isFriend && !isHost && (
                          <span className="shrink-0 rounded-full bg-cobalt/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cobalt">
                            Friend
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-graphite-muted">
                        {isYou ? "On your list tonight" : "Going tonight"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
