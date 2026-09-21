import type { Venue } from "@/data/events";
import type { Filter } from "@/components/map/types";

/** Headline number for pins, sheets, and rails — friends lens counts known friends only. */
export function displayAttendeeCount(
  venue: Venue,
  goingIds: Set<string>,
  filter: Filter
): number {
  if (filter === "friends") return venue.friendsGoing.length;
  return venue.goingCount + (goingIds.has(venue.id) ? 1 : 0);
}

export function attendeeCountNoun(filter: Filter): "going" | "friends" {
  return filter === "friends" ? "friends" : "going";
}

/** Unique friends across venues (for the friends-lens rail subtitle). */
export function uniqueFriendsAcrossVenues(venues: Venue[]): number {
  const ids = new Set<string>();
  for (const v of venues) {
    for (const f of v.friendsGoing) ids.add(f.id);
  }
  return ids.size;
}
