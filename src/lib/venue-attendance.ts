import type { Category, Venue } from "@/data/events";
import type { Filter } from "@/components/map/types";
import { venueEventBounds } from "@/lib/night-time";

/**
 * Two different crowd numbers — not the same curve twice.
 *
 * instantPresence(t)
 *   Snapshot: how many people are physically on site at time t.
 *   Asymmetric Gaussian: fills in before peak, empties after.
 *   Used while the time slider is open (Now / +Nh).
 *
 * stillActiveOrComing(t)
 *   Residual tonight: everyone from the static going count who has not
 *   left yet (already there or still on the way). Flat at maxCount until
 *   peak, then a slower leave-curve down toward 0 at event end.
 *   Used in normal map mode (slider closed).
 *
 * Invariant: stillActiveOrComing(t) >= instantPresence(t) for every t.
 */
export type PresenceVenueType = "bar" | "club" | "event";

export type PresenceArgs = {
  venueType: PresenceVenueType | string;
  maxCount: number;
  eventStartTime: Date;
  eventEndTime: Date;
  evaluationTime: Date;
};

export type CrowdMode = "instantPresence" | "stillActiveOrComing";

export type CrowdQuery = {
  mode: CrowdMode;
  at: Date;
};

type PresenceShape = {
  /** Hours after eventStartTime when the night is fullest. */
  peakOffsetHours: number;
  /** Gaussian width while the room is filling (t < peak). */
  sigmaLeft: number;
  /** Gaussian width while people leave the room (t >= peak). */
  sigmaRight: number;
};

/**
 * Per-type shape. Food / private / unknown fall back to BAR.
 * Hours are wall-clock hours, not slider ticks.
 */
export const PRESENCE_BY_TYPE: Record<PresenceVenueType, PresenceShape> = {
  bar: {
    peakOffsetHours: 1.5,
    sigmaLeft: 1.0,
    sigmaRight: 2.0,
  },
  club: {
    peakOffsetHours: 3.0,
    sigmaLeft: 1.5,
    sigmaRight: 3.5,
  },
  event: {
    peakOffsetHours: 0.5,
    sigmaLeft: 0.5,
    sigmaRight: 1.5,
  },
};

export function resolvePresenceVenueType(
  venueType: PresenceVenueType | string | Category
): PresenceVenueType {
  if (venueType === "club" || venueType === "event" || venueType === "bar") {
    return venueType;
  }
  return "bar";
}

function hoursBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 3_600_000;
}

function gauss(deltaHours: number, sigma: number) {
  if (sigma <= 0) return deltaHours === 0 ? 1 : 0;
  return Math.exp(-(deltaHours * deltaHours) / (2 * sigma * sigma));
}

function roundCount(n: number) {
  return Math.max(0, Math.round(n));
}

function peakAndLeave(args: PresenceArgs) {
  const start = args.eventStartTime.getTime();
  const end = args.eventEndTime.getTime();
  const durationHours = Math.max(hoursBetween(args.eventStartTime, args.eventEndTime), 1 / 60);
  const shape = PRESENCE_BY_TYPE[resolvePresenceVenueType(args.venueType)];
  let peakOffset = shape.peakOffsetHours;
  if (peakOffset >= durationHours) peakOffset = durationHours * 0.5;
  const peakMs = start + peakOffset * 3_600_000;
  const hoursAfterPeakAtEnd = Math.max((end - peakMs) / 3_600_000, 1 / 60);
  // Leave-curve must not decay faster than instantPresence after the peak
  // (otherwise "still around or coming" would drop below "physically there").
  const sigmaLeaveSpread = Math.max(hoursAfterPeakAtEnd / 2, shape.sigmaRight);
  return { shape, peakMs, sigmaLeaveSpread };
}

/**
 * People physically on site at evaluationTime.
 * Before start → full static maxCount. After end → 0.
 */
export function instantPresence(args: PresenceArgs): number {
  const { maxCount, eventStartTime, eventEndTime, evaluationTime } = args;
  const t = evaluationTime.getTime();
  if (t < eventStartTime.getTime()) return roundCount(maxCount);
  if (t >= eventEndTime.getTime()) return 0;

  const { shape, peakMs } = peakAndLeave(args);
  const dt = (t - peakMs) / 3_600_000;
  const sigma = dt < 0 ? shape.sigmaLeft : shape.sigmaRight;
  return roundCount(maxCount * gauss(dt, sigma));
}

/**
 * People who have not left yet (on site or still coming).
 * Flat at maxCount until peak, then a leave Gaussian toward 0 at event end.
 * Before start → full static maxCount. After end → 0.
 */
export function stillActiveOrComing(args: PresenceArgs): number {
  const { maxCount, eventStartTime, eventEndTime, evaluationTime } = args;
  const t = evaluationTime.getTime();
  if (t < eventStartTime.getTime()) return roundCount(maxCount);
  if (t >= eventEndTime.getTime()) return 0;

  const { peakMs, sigmaLeaveSpread } = peakAndLeave(args);
  let value: number;
  if (t <= peakMs) {
    value = maxCount;
  } else {
    const dt = (t - peakMs) / 3_600_000;
    value = maxCount * gauss(dt, sigmaLeaveSpread);
  }
  return Math.max(roundCount(value), instantPresence(args));
}

function presenceArgsForVenue(
  venue: Venue,
  maxCount: number,
  at: Date
): PresenceArgs | null {
  const bounds = venueEventBounds(venue, at);
  if (!bounds) return null;
  return {
    venueType: resolvePresenceVenueType(venue.category),
    maxCount,
    eventStartTime: bounds.start,
    eventEndTime: bounds.end,
    evaluationTime: at,
  };
}

export function crowdCountAt(
  venue: Venue,
  maxCount: number,
  crowd: CrowdQuery
): number {
  const args = presenceArgsForVenue(venue, maxCount, crowd.at);
  if (!args) return roundCount(maxCount);
  return crowd.mode === "instantPresence"
    ? instantPresence(args)
    : stillActiveOrComing(args);
}

/** Headline number for pins, sheets, and rails — friends lens counts known friends only. */
export function displayAttendeeCount(
  venue: Venue,
  goingIds: Set<string>,
  filter: Filter,
  crowd: CrowdQuery
): number {
  if (filter === "friends") return venue.friendsGoing.length;
  const maxCount = venue.goingCount + (goingIds.has(venue.id) ? 1 : 0);
  return crowdCountAt(venue, maxCount, crowd);
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
