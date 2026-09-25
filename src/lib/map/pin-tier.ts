import { currentUser, type Venue } from "@/data/events";
import type { Filter } from "@/components/map/types";
import { TRENDING_MIN } from "@/components/map/types";
import type { LngLat } from "@/lib/map/geo";
import type { Preferences } from "@/lib/preferences";
import { scoreVenue } from "@/lib/relevance";

/**
 * Map pin hierarchy (DESIGN_SYSTEM §10).
 *
 * Most places are quiet dots. A capped, ranked few become prominent:
 * "relevant" (category icon) or "social" (friends' avatars). Ranking decides
 * prominence only; nothing is hidden. Caps and on-screen overlap are applied
 * in MapView, which knows the zoom and pixel positions.
 */
export type PinTier = "quiet" | "relevant" | "social";

export type PinCandidate = {
  id: string;
  /** Lower = more important. */
  rank: number;
  /** Tier when the pin is allowed to be prominent. */
  tier: Exclude<PinTier, "quiet">;
  /** Yours, going or invited: always prominent, outside the cap. */
  personal: boolean;
  /** The single "hot" pin: a soft halo, slightly larger. */
  hot: boolean;
};

/** Friends needed before a place counts as social at all. */
const SOCIAL_MIN_FRIENDS = 2;
/** Demo data gives most places friends, so social pins are capped hard. */
const SOCIAL_MAX = 3;
const SOCIAL_MAX_FRIENDS_LENS = 6;

/** How many non-personal pins may be prominent at a zoom level. */
export function prominentCap(zoom: number) {
  if (zoom < 14) return 6;
  if (zoom < 15) return 10;
  if (zoom < 16) return 16;
  return 24;
}

export type PinPlanInput = {
  venues: Venue[];
  counts: ReadonlyMap<string, number>;
  filter: Filter;
  goingIds: ReadonlySet<string>;
  invitedIds: ReadonlySet<string>;
  prefs: Preferences;
  at: Date;
  userPosition: LngLat | null;
};

/** Every venue in rank order with the tier it gets if it stays prominent. */
export function planPins(input: PinPlanInput): PinCandidate[] {
  const { venues, counts, filter, goingIds, invitedIds, prefs, at, userPosition } =
    input;
  const mineIds = new Set(
    venues.filter((v) => v.hostId === currentUser.id).map((v) => v.id)
  );
  const userCreatedIds = new Set(
    venues.filter((v) => v.id.startsWith("created-")).map((v) => v.id)
  );
  const ctx = { at, prefs, goingIds, mineIds, userCreatedIds, userPosition };

  const scored = venues.map((v) => {
    const count = counts.get(v.id) ?? 0;
    const personal =
      mineIds.has(v.id) || goingIds.has(v.id) || invitedIds.has(v.id);
    // The active lens decides what "important" means.
    const lensScore =
      filter === "trending"
        ? count
        : filter === "friends"
          ? v.friendsGoing.length * 100 + count
          : scoreVenue(v, ctx).score * 1000 + count;
    return { v, count, personal, lensScore };
  });

  scored.sort(
    (a, b) => Number(b.personal) - Number(a.personal) || b.lensScore - a.lensScore
  );

  // At most one hot pin, and only if it is genuinely busy.
  let hotId: string | null = null;
  let hotCount = TRENDING_MIN - 1;
  for (const s of scored) {
    if (s.count > hotCount) {
      hotCount = s.count;
      hotId = s.v.id;
    }
  }

  const socialMax = filter === "friends" ? SOCIAL_MAX_FRIENDS_LENS : SOCIAL_MAX;
  const socialIds = new Set(
    scored
      .filter((s) => !s.v.isPrivate && s.v.friendsGoing.length >= SOCIAL_MIN_FRIENDS)
      .sort(
        (a, b) =>
          b.v.friendsGoing.length - a.v.friendsGoing.length ||
          b.lensScore - a.lensScore
      )
      .slice(0, socialMax)
      .map((s) => s.v.id)
  );

  return scored.map((s, rank) => ({
    id: s.v.id,
    rank,
    tier: socialIds.has(s.v.id) ? "social" : "relevant",
    personal: s.personal,
    hot: s.v.id === hotId,
  }));
}
