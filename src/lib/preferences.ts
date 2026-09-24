import type { Category } from "@/data/events";
import { MAP_STYLE_IDS, type MapStyleId } from "@/lib/map/styles";

/**
 * Per-browser preferences (Phase 1, no accounts). Kept deliberately flat so it
 * can move 1:1 to a Supabase `profiles` row + interaction tables once auth
 * exists: upload this object once on first sign-in, then read from there.
 */

export const INTERESTS = [
  "nightlife",
  "food",
  "coffee",
  "live-music",
  "parties",
  "chill",
  "student",
  "sports",
] as const;
export type Interest = (typeof INTERESTS)[number];

export type InteractionKind = "open" | "save" | "going";
export type CategoryAffinity = Record<InteractionKind, number>;

export type Preferences = {
  version: 1;
  interests: Interest[];
  saved: string[];
  /** "Hide this": never show this place. */
  hidden: string[];
  /** "Not my vibe": hide this place and treat it as a negative signal later. */
  notMyVibe: string[];
  affinity: Partial<Record<Category, CategoryAffinity>>;
  mapStyle: MapStyleId;
  updatedAt: string | null;
};

const STORAGE_KEY = "maasnow:prefs:v1";

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  interests: [],
  saved: [],
  hidden: [],
  notMyVibe: [],
  affinity: {},
  mapStyle: "standard",
  updatedAt: null,
};

const stringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;

/** Accept only what we recognise; anything malformed falls back to defaults. */
function sanitize(raw: unknown): Preferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFERENCES };
  const r = raw as Record<string, unknown>;
  const affinity: Preferences["affinity"] = {};
  if (r.affinity && typeof r.affinity === "object") {
    for (const [cat, a] of Object.entries(r.affinity as Record<string, unknown>)) {
      const x = (a ?? {}) as Record<string, unknown>;
      affinity[cat as Category] = {
        open: count(x.open),
        save: count(x.save),
        going: count(x.going),
      };
    }
  }
  return {
    version: 1,
    interests: stringList(r.interests).filter((i): i is Interest =>
      (INTERESTS as readonly string[]).includes(i)
    ),
    saved: stringList(r.saved),
    hidden: stringList(r.hidden),
    notMyVibe: stringList(r.notMyVibe),
    affinity,
    mapStyle: MAP_STYLE_IDS.includes(r.mapStyle as MapStyleId)
      ? (r.mapStyle as MapStyleId)
      : DEFAULT_PREFERENCES.mapStyle,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null,
  };
}

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function updatePreferences(
  change: (current: Preferences) => Preferences
): Preferences {
  const next = { ...change(loadPreferences()), updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage full: preferences just don't persist.
  }
  return next;
}

/** Count a signal for the venue's category (used by relevance scoring). */
export function recordInteraction(
  kind: InteractionKind,
  venue: { category: Category }
) {
  updatePreferences((p) => {
    const current = p.affinity[venue.category] ?? { open: 0, save: 0, going: 0 };
    return {
      ...p,
      affinity: {
        ...p.affinity,
        [venue.category]: { ...current, [kind]: current[kind] + 1 },
      },
    };
  });
}
