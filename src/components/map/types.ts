import type { Category } from "@/data/events";

/** Discovery filter: existing categories plus social lenses. */
export type Filter =
  | Exclude<Category, "private">
  | "all"
  | "friends"
  | "trending";

/** Attendance threshold for the "Trending" lens (local data only). */
export const TRENDING_MIN = 60;
