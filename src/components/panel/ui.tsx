"use client";

import type { Category, Person, Venue } from "@/data/events";
import { walkMinutes, type LngLat } from "@/lib/map/geo";
import { venueTimeState, type VenueTimeState } from "@/lib/night-time";

/**
 * Small building blocks shared by the desktop panel views. Colours come from
 * the mode-aware roles (bg-ui-panel, text-ui-ink …), so every view follows
 * Standard / Night / Satellite without knowing about them.
 */

export type Ring = "none" | "panel" | "violet" | "lime" | "ink";

const RING: Record<Ring, string | undefined> = {
  none: undefined,
  panel: "0 0 0 2px var(--ui-panel)",
  violet: "0 0 0 2px var(--ui-panel), 0 0 0 3.5px var(--ui-violet)",
  lime: "0 0 0 2px var(--ui-panel), 0 0 0 4px var(--color-lime)",
  ink: "0 0 0 2px var(--ui-panel), 0 0 0 3.5px var(--ui-ink)",
};

/**
 * A person's face. Initials on their colour until real photos exist
 * (no stock portraits standing in for friends).
 */
export function Face({
  person,
  size = 28,
  ring = "none",
}: {
  person: Person;
  size?: number;
  ring?: Ring;
}) {
  return (
    <span
      className="mn-face inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: person.color,
        fontSize: Math.round(size * 0.4),
        boxShadow: RING[ring],
      }}
      role="img"
      aria-label={person.name}
    >
      {person.initials}
    </span>
  );
}

/** Overlapping faces with a panel-coloured ring between them. */
export function Faces({
  people,
  size = 24,
  overlap = 0.28,
  ringColor = "var(--ui-panel)",
}: {
  people: Person[];
  size?: number;
  overlap?: number;
  ringColor?: string;
}) {
  return (
    <span className="inline-flex shrink-0 pl-0.5">
      {people.map((p, i) => (
        <span
          key={p.id}
          className="mn-face relative inline-grid place-items-center rounded-full font-semibold text-white"
          style={{
            width: size,
            height: size,
            marginLeft: i ? -size * overlap : 0,
            zIndex: people.length - i,
            background: p.color,
            fontSize: Math.round(size * 0.4),
            boxShadow: `0 0 0 2px ${ringColor}`,
          }}
          role="img"
          aria-label={p.name}
        >
          {p.initials}
        </span>
      ))}
    </span>
  );
}

const CATEGORY_LABEL: Record<Category, string> = {
  bar: "Bar",
  club: "Club",
  event: "Event",
  food: "Dinner",
  private: "Private",
};

export function categoryLabel(c: Category) {
  return CATEGORY_LABEL[c];
}

/** "Binnenstad" from "Bredestraat 14 · Binnenstad". */
export function areaOf(v: Venue) {
  return v.address.split("·")[1]?.trim() ?? "";
}

export function euro(price: 1 | 2 | 3) {
  return "€".repeat(price);
}

/** Walking minutes, only when the visitor has shared a real location. */
export function walkLabel(v: Venue, from: LngLat | null) {
  return from ? `${walkMinutes(from, v)} min walk` : null;
}

/** "Thies, Mara and Jonas" */
export function names(people: Person[]) {
  const n = people.map((p) => p.name);
  if (n.length <= 1) return n.join("");
  return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

export function timeText(s: VenueTimeState, isNow: boolean) {
  switch (s.kind) {
    case "open":
      return isNow ? "On now" : "Open";
    case "soon":
      return `In ${s.inMinutes} min`;
    case "later":
      return `From ${s.from}`;
    default:
      return "Closed";
  }
}

export { venueTimeState };

/**
 * Where a venue photo goes. There are no venue images yet (they need an
 * image_url column and storage), so this is a calm dark block.
 */
export function VenueImage({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className={`mn-img relative shrink-0 overflow-hidden ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Caption({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-caption uppercase tracking-[0.1em] text-ui-ink-soft ${className}`}>
      {children}
    </div>
  );
}

export const BTN =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl px-[22px] text-[16px] font-semibold transition-[filter,transform] active:scale-[0.98] disabled:cursor-default";
/** The one lime action in a view. */
export const BTN_PRIMARY = `${BTN} bg-lime text-ink hover:brightness-[1.03]`;
export const BTN_SECONDARY = `${BTN} bg-ui-fill text-ui-ink hover:brightness-95`;

export const ROUND_BTN =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ui-fill text-ui-ink transition-[filter] hover:brightness-95";

/** Lowercase wordmark (approved identity). */
export function Wordmark({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <span
      className={`font-semibold leading-none ${muted ? "text-ui-ink-muted" : "text-ui-ink"}`}
      style={{ fontSize: size, letterSpacing: "-0.045em" }}
    >
      maasnow
    </span>
  );
}

export function LiveDot({ size = 7 }: { size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full bg-lime"
      style={{ width: size, height: size, boxShadow: "0 0 0 2px rgba(198,244,50,0.25)" }}
    />
  );
}
