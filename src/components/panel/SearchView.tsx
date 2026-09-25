"use client";

import { useEffect, useRef } from "react";
import type { Person, Venue } from "@/data/events";
import { ChevronIcon, SearchIcon } from "@/components/map/icons";
import { Caption, Faces, VenueImage, names } from "./ui";

/** Shortcuts under "Try"; each one is a real query (or opens Friends). */
export const SEARCH_SUGGESTIONS = [
  { label: "Open after 03:00", query: "open after 03:00" },
  { label: "Where my friends are", query: null },
  { label: "Live music", query: "live" },
  { label: "Techno", query: "techno" },
] as const;

type Props = {
  query: string;
  onQuery: (q: string) => void;
  results: Venue[];
  onCancel: () => void;
  onOpenVenue: (id: string) => void;
  onFriends: () => void;
};

/** Search takes over the panel; results light up on the map. */
export default function SearchView({ query, onQuery, results, onCancel, onOpenVenue, onFriends }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const friendHits = results
    .map((v) => ({ v, people: v.friendsGoing }))
    .filter((r) => r.people.length > 0);
  const friendLine = (() => {
    const first = friendHits[0];
    if (!first || !query.trim()) return null;
    const ppl: Person[] = first.people.slice(0, 3);
    return { people: ppl, venue: first.v };
  })();

  return (
    <div className="px-7 pb-8 pt-[26px]">
      <div className="flex items-center gap-3.5">
        <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-[18px] bg-ui-fill px-[18px] text-ui-ink shadow-[inset_0_0_0_2px_var(--ui-ink)]">
          <SearchIcon size={20} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onCancel();
              }
              if (e.key === "Enter" && results[0]) onOpenVenue(results[0].id);
            }}
            placeholder="Places, music, friends"
            aria-label="Search tonight"
            className="min-w-0 flex-1 bg-transparent text-[20px] font-semibold tracking-[-0.02em] text-ui-ink caret-lime outline-none placeholder:font-medium placeholder:text-ui-ink-muted"
          />
        </label>
        <button
          type="button"
          onClick={onCancel}
          className="text-[15px] font-semibold text-ui-ink-soft hover:text-ui-ink"
        >
          Cancel
        </button>
      </div>

      {query.trim() && (
        <>
          <Caption className="mt-[34px]">
            Tonight · {results.length} {results.length === 1 ? "place" : "places"}
          </Caption>
          {results.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onOpenVenue(v.id)}
              className="flex w-full items-center gap-4 border-b border-ui-line py-3.5 text-left"
            >
              <VenueImage className="h-[72px] w-[72px] rounded-[14px]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-bold tracking-[-0.02em] text-ui-ink">{v.name}</span>
                <span className="block truncate text-meta text-ui-ink-soft">{v.vibe}</span>
                <span className="mt-0.5 block font-mono text-meta tabular-nums text-ui-ink">{v.time}</span>
              </span>
              {v.friendsGoing.length > 0 && <Faces people={v.friendsGoing} size={28} />}
            </button>
          ))}
          {results.length === 0 && (
            <p className="py-4 text-body text-ui-ink-soft">Nothing tonight matches “{query.trim()}”.</p>
          )}

          {friendLine && (
            <>
              <Caption className="mb-3 mt-[30px]">Friends going</Caption>
              <div className="flex items-center gap-3.5">
                <Faces people={friendLine.people} size={44} />
                <span className="text-[15px] text-ui-ink">
                  {names(friendLine.people)}{" "}
                  <span className="text-ui-ink-soft">
                    {friendLine.people.length > 1 ? "are" : "is"} going to {friendLine.venue.name}
                  </span>
                </span>
              </div>
            </>
          )}
        </>
      )}

      <Caption className="mb-1 mt-8">Try</Caption>
      {SEARCH_SUGGESTIONS.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => (s.query === null ? onFriends() : onQuery(s.query))}
          className="flex w-full items-center justify-between border-b border-ui-line py-[13px] text-left text-[16px] font-medium text-ui-ink"
        >
          {s.label}
          <span className="text-ui-ink-muted">
            <ChevronIcon size={16} />
          </span>
        </button>
      ))}
    </div>
  );
}
