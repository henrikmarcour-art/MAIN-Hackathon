import type { Venue } from "@/data/events";

/** Nightlife window shown on the map: 18:00 through 05:00. */
export const NIGHT_HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5] as const;

export const NIGHT_START_HOUR = 18;
export const NIGHT_END_HOUR = 5;

const TZ = "Europe/Amsterdam";
const ORIGIN = NIGHT_START_HOUR * 60;
/** Allow starts from noon the same calendar day (e.g. 17:00). */
const EARLY_SLACK = 6 * 60;
/** Exclusive end of the night on the offset timeline (05:00). */
const NIGHT_END_OFFSET = (24 - NIGHT_START_HOUR + NIGHT_END_HOUR) * 60;
const DEFAULT_DURATION_MIN = 120;
const LATE_END_HOUR = 6;

export type ClockParts = { hour: number; minute: number };

export function clockInMaastricht(at: Date = new Date()): ClockParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(at);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

export function formatClock(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Minutes after 18:00. After-midnight hours wrap forward; 17:00 is −60. */
export function toNightOffset(hour: number, minute: number) {
  let d = hour * 60 + minute - ORIGIN;
  if (d < -EARLY_SLACK) d += 24 * 60;
  return d;
}

export function hourIndex(hour: number) {
  const i = NIGHT_HOURS.indexOf(hour as (typeof NIGHT_HOURS)[number]);
  return i === -1 ? 0 : i;
}

export function hourAtIndex(index: number) {
  const clamped = Math.min(Math.max(0, Math.round(index)), NIGHT_HOURS.length - 1);
  return NIGHT_HOURS[clamped];
}

type Span = { start: number; end: number };

function parseHourMinute(token: string): ClockParts | null {
  const m = token.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Map a venue's clock span onto real Dates around `at` (Maastricht night
 * offset, so 23:00–05:00 stays one continuous evening).
 */
export function venueEventBounds(
  venue: Venue,
  at: Date
): { start: Date; end: Date } | null {
  const span = parseVenueSpan(venue.time);
  if (!span) return null;
  const now = clockInMaastricht(at);
  const nowOff = toNightOffset(now.hour, now.minute);
  return {
    start: addHours(at, (span.start - nowOff) / 60),
    end: addHours(at, (span.end - nowOff) / 60),
  };
}

export function parseVenueSpan(time: string): Span | null {
  const raw = time.trim();
  if (!raw) return null;

  const range = raw.match(
    /^(\d{1,2}:\d{2})\s*[–-]\s*(late|\d{1,2}:\d{2})$/i
  );
  if (range) {
    const startClock = parseHourMinute(range[1]);
    if (!startClock) return null;
    const start = toNightOffset(startClock.hour, startClock.minute);
    if (/^late$/i.test(range[2])) {
      return { start, end: toNightOffset(LATE_END_HOUR, 0) };
    }
    const endClock = parseHourMinute(range[2]);
    if (!endClock) return null;
    let end = toNightOffset(endClock.hour, endClock.minute);
    if (end <= start) end += 24 * 60;
    return { start, end };
  }

  const point = parseHourMinute(raw);
  if (!point) return null;
  const start = toNightOffset(point.hour, point.minute);
  return { start, end: start + DEFAULT_DURATION_MIN };
}

function spanOf(venue: Venue): Span | null {
  return parseVenueSpan(venue.time);
}

function overlapsNightWindow(span: Span) {
  return span.start < NIGHT_END_OFFSET && span.end > 0;
}

export function isHappeningAtHour(venue: Venue, hour: number) {
  const span = spanOf(venue);
  if (!span || !overlapsNightWindow(span)) return false;
  const t = toNightOffset(hour, 0);
  return span.start <= t && t < span.end;
}

/** Events running at this instant (Maastricht clock). */
export function isHappeningAt(venue: Venue, at: Date) {
  const span = spanOf(venue);
  if (!span || !overlapsNightWindow(span)) return false;
  const now = clockInMaastricht(at);
  const t = toNightOffset(now.hour, now.minute);
  return span.start <= t && t < span.end;
}

/** Whole hours from now until 05:00, or 11 hours outside the night window. */
export function maxForwardHours(at: Date = new Date()) {
  const now = clockInMaastricht(at);
  const nowOff = toNightOffset(now.hour, now.minute);
  if (nowOff < 0 || nowOff >= NIGHT_END_OFFSET) return 11;
  return Math.max(0, Math.ceil((NIGHT_END_OFFSET - nowOff) / 60));
}

export function addHours(at: Date, hours: number) {
  return new Date(at.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Live / "normal" mode: every evening event that has not already ended.
 * Before 18:00 (and after 05:00), the whole upcoming night is still ahead.
 */
export function isUpcomingTonight(venue: Venue, at: Date = new Date()) {
  const span = spanOf(venue);
  if (!span || !overlapsNightWindow(span)) return false;
  const now = clockInMaastricht(at);
  const nowOff = toNightOffset(now.hour, now.minute);
  if (nowOff >= NIGHT_END_OFFSET) return true;
  return span.end > nowOff;
}

export function liveThumbIndex(at: Date = new Date()) {
  const { hour, minute } = clockInMaastricht(at);
  const off = toNightOffset(hour, minute);
  if (off < 0) return 0;
  if (off >= NIGHT_END_OFFSET) return NIGHT_HOURS.length - 1;
  return Math.min(
    NIGHT_HOURS.length - 1,
    Math.floor(off / 60)
  );
}
