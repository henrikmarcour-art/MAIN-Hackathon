import type { Venue } from "@/data/events";
import { parseVenueSpan, toNightOffset } from "@/lib/night-time";

const CATEGORY_WORDS: Record<Venue["category"], string> = {
  bar: "bar bars drinks",
  club: "club clubs dance",
  event: "event events",
  food: "food dinner eat",
  private: "private",
};

/**
 * Search tonight's venues (desktop panel). Every word must match the name,
 * vibe, area or category. "open after HH:MM" finds places still open then.
 */
export function searchVenues(venues: Venue[], query: string): Venue[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const after = q.match(/^open after (\d{1,2}):(\d{2})$/);
  if (after) {
    const t = toNightOffset(Number(after[1]), Number(after[2]));
    return venues.filter((v) => {
      const span = parseVenueSpan(v.time);
      return span !== null && span.end > t;
    });
  }

  const words = q.split(/\s+/);
  return venues.filter((v) => {
    const hay = `${v.name} ${v.vibe} ${v.address} ${CATEGORY_WORDS[v.category]}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
