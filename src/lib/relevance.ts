import type { Category, Venue } from "@/data/events";
import { TRENDING_MIN } from "@/components/map/types";
import { distanceMeters, type LngLat } from "@/lib/map/geo";
import {
  clockInMaastricht,
  isHappeningAt,
  isUpcomingTonight,
} from "@/lib/night-time";
import type { Interest, Preferences } from "@/lib/preferences";

/**
 * V1 relevance: a transparent, additive score per venue plus the reasons behind
 * it. Groundwork only — nothing hides or caps places based on it yet.
 */

export type RelevanceContext = {
  at: Date;
  prefs: Preferences;
  goingIds: ReadonlySet<string>;
  /** Events created in this browser. */
  mineIds: ReadonlySet<string>;
  /** Any user-created (Supabase) event. */
  userCreatedIds: ReadonlySet<string>;
  userPosition?: LngLat | null;
};

export type RelevanceReason =
  | "yours"
  | "going"
  | "saved"
  | "private"
  | "community"
  | "friends"
  | "interest"
  | "nearby"
  | "trending"
  | "time"
  | "habit";

export type Relevance = {
  score: number;
  /** Always visible no matter the score: yours, going, saved, private, community, 2+ friends. */
  pinned: boolean;
  /** The visitor chose "Hide this" or "Not my vibe". */
  hidden: boolean;
  /** Strongest first. */
  reasons: RelevanceReason[];
  /** Short "why" line for cards later, e.g. "Because you like nightlife". */
  headline: string | null;
  interest: Interest | null;
};

export const WEIGHTS = {
  time: 3,
  interest: 2.5,
  habit: 2,
  nearby: 2,
  nearbyWide: 1,
  friend: 2,
  friendExtra: 1,
  friendMax: 4,
  trending: 1.5,
} as const;

const NEARBY_M = 600;
const NEARBY_WIDE_M = 1500;

const CATEGORY_INTERESTS: Record<Category, Interest[]> = {
  bar: ["nightlife", "chill"],
  club: ["nightlife", "parties"],
  event: [],
  food: ["food"],
  private: ["parties"],
};

const KEYWORD_INTERESTS: [RegExp, Interest][] = [
  [/\b(jazz|live|band|concert|gig|acoustic)\b/, "live-music"],
  [/\b(techno|dj|party|dance|rave)\b/, "parties"],
  [/\bstudent/, "student"],
  [/\b(coffee|café|cafe|espresso|brunch)\b/, "coffee"],
  [/\b(quiet|chill|wine|cocktails?|brown café|whisky)\b/, "chill"],
  [/\b(sport|football|match|screening)\b/, "sports"],
];

/** Interests a venue speaks to, from its category plus words in its vibe and description. */
export function venueInterests(v: Venue): Interest[] {
  const text = `${v.vibe} ${v.description}`.toLowerCase();
  const found = new Set<Interest>(CATEGORY_INTERESTS[v.category]);
  for (const [re, interest] of KEYWORD_INTERESTS) {
    if (re.test(text)) found.add(interest);
  }
  return [...found];
}

/** 0–1: how well a venue fits the time of night (Maastricht clock). */
export function timeFit(v: Venue, at: Date): number {
  if (v.category === "event" || v.isPrivate) {
    if (isHappeningAt(v, at)) return 1;
    return isUpcomingTonight(v, at) ? 0.6 : 0.2;
  }
  const { hour } = clockInMaastricht(at);
  const within = (from: number, to: number) =>
    from <= to ? hour >= from && hour <= to : hour >= from || hour <= to;
  switch (v.category) {
    case "food":
      return within(18, 21) ? 1 : within(17, 22) ? 0.6 : 0.2;
    case "bar":
      return within(20, 1) ? 1 : within(18, 2) ? 0.6 : 0.3;
    case "club":
      return within(23, 4) ? 1 : within(22, 5) ? 0.6 : 0.1;
    default:
      return 0.5;
  }
}

function habitBoost(prefs: Preferences, category: Category) {
  const a = prefs.affinity[category];
  if (!a) return 0;
  const signal = a.open + 3 * a.save + 3 * a.going;
  return Math.min(1, Math.log1p(signal) / Math.log1p(20));
}

const HEADLINES: Partial<Record<RelevanceReason, string>> = {
  yours: "Your event",
  going: "You're going",
  saved: "Saved",
  private: "You're invited",
  friends: "Friends are going",
  nearby: "Near you",
  trending: "Trending tonight",
  time: "Good for right now",
  habit: "Like places you open",
};

const INTEREST_LABELS: Record<Interest, string> = {
  nightlife: "nightlife",
  food: "food",
  coffee: "coffee",
  "live-music": "live music",
  parties: "parties",
  chill: "chill nights",
  student: "student nights",
  sports: "sports",
};

export function scoreVenue(v: Venue, ctx: RelevanceContext): Relevance {
  const { prefs } = ctx;
  const weighted: [RelevanceReason, number][] = [];

  const fit = timeFit(v, ctx.at);
  weighted.push(["time", WEIGHTS.time * fit]);

  const matched = venueInterests(v).find((i) => prefs.interests.includes(i)) ?? null;
  if (matched) weighted.push(["interest", WEIGHTS.interest]);

  const habit = habitBoost(prefs, v.category);
  if (habit > 0) weighted.push(["habit", WEIGHTS.habit * habit]);

  if (ctx.userPosition) {
    const d = distanceMeters(ctx.userPosition, v);
    if (d <= NEARBY_M) weighted.push(["nearby", WEIGHTS.nearby]);
    else if (d <= NEARBY_WIDE_M) weighted.push(["nearby", WEIGHTS.nearbyWide]);
  }

  const friends = v.friendsGoing.length;
  if (friends > 0) {
    weighted.push([
      "friends",
      Math.min(WEIGHTS.friendMax, WEIGHTS.friend + WEIGHTS.friendExtra * (friends - 1)),
    ]);
  }

  if (v.busy || v.goingCount >= TRENDING_MIN) weighted.push(["trending", WEIGHTS.trending]);

  const pinnedReasons: RelevanceReason[] = [];
  if (ctx.mineIds.has(v.id)) pinnedReasons.push("yours");
  if (ctx.goingIds.has(v.id)) pinnedReasons.push("going");
  if (prefs.saved.includes(v.id)) pinnedReasons.push("saved");
  if (v.isPrivate) pinnedReasons.push("private");
  else if (ctx.userCreatedIds.has(v.id)) pinnedReasons.push("community");
  const pinned = pinnedReasons.length > 0 || friends >= 2;

  const reasons = [
    ...pinnedReasons,
    ...weighted
      .filter(([, w]) => w > 0.5)
      .sort((a, b) => b[1] - a[1])
      .map(([r]) => r),
  ];
  const top = reasons[0] ?? null;
  const headline =
    top === "interest" && matched
      ? `Because you like ${INTEREST_LABELS[matched]}`
      : top
        ? HEADLINES[top] ?? null
        : null;

  return {
    score: weighted.reduce((sum, [, w]) => sum + w, 0),
    pinned,
    hidden: prefs.hidden.includes(v.id) || prefs.notMyVibe.includes(v.id),
    reasons,
    headline,
    interest: matched,
  };
}

/** Venues with their relevance, most relevant first (hidden ones last). */
export function rankVenues(venues: Venue[], ctx: RelevanceContext) {
  return venues
    .map((venue) => ({ venue, relevance: scoreVenue(venue, ctx) }))
    .sort(
      (a, b) =>
        Number(a.relevance.hidden) - Number(b.relevance.hidden) ||
        b.relevance.score - a.relevance.score
    );
}
