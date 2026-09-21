import type { Category } from "@/data/events";

export type MapTheme = "light" | "night";

/** Discovery filter: existing categories plus social lenses. */
export type Filter =
  | Exclude<Category, "private">
  | "all"
  | "friends"
  | "trending";

/** Attendance threshold for the "Trending" lens (local data only). */
export const TRENDING_MIN = 60;

/** Light theme: full OpenFreeMap detail with a muted natural palette (see `npm run map:style`). */
export const MAP_STYLES: Record<MapTheme, string> = {
  light: "/map-styles/maasnow-natural.json",
  night: "https://tiles.openfreemap.org/styles/dark",
};
