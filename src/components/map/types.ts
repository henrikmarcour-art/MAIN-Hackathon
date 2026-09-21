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

export const MAP_STYLES: Record<MapTheme, string> = {
  light: "https://tiles.openfreemap.org/styles/positron",
  night: "https://tiles.openfreemap.org/styles/dark",
};
