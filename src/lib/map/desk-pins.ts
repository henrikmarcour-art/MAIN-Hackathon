import {
  friendPlans,
  people,
  type FriendPlan,
  type Invitation,
  type Person,
  type Venue,
} from "@/data/events";
import type { PinCandidate } from "@/lib/map/pin-tier";
import { isAvailableAt, parseVenueSpan } from "@/lib/night-time";

/**
 * Desktop map pins (approved desktop system): most places are quiet, a few
 * are named, friends show as face clusters, and exactly one thing gets the
 * strong treatment per view. This module only decides what each pin *is*;
 * MapView draws it. It is pure so the time capsule can re-run it every
 * frame without touching the map's DOM beyond a class toggle.
 */

export type PanelView = "tonight" | "friends" | "venue" | "invite" | "search";

export type DeskPinKind =
  /** A small quiet point. */
  | "dot"
  /** A slightly larger point with its name. */
  | "named"
  /** Friends' faces: one face plus a "+N" badge, with the venue name. */
  | "cluster"
  /** The one strong pill: faces, name and hours. */
  | "selected"
  /** A private night you can see: a small violet point. */
  | "private"
  /** The invite view: the host's face with a violet ring. */
  | "host"
  /** Friends view: where most friends end up. */
  | "dest";

export type DeskPin = {
  kind: DeskPinKind;
  /** Faded: closed at the chosen time, or not what this view is about. */
  dim: boolean;
  going: boolean;
  label?: string;
  sub?: string;
  people?: Person[];
};

/** Friends shown where they are right now (Friends view). */
export type FriendGroupPin = {
  venueId: string;
  lng: number;
  lat: number;
  people: Person[];
  /** The host of a private night: violet ring instead of a shadow. */
  hosting: boolean;
};

/** How many friend clusters and named places Tonight allows. */
const TONIGHT_CLUSTERS = 3;
const TONIGHT_NAMED = 4;

function hours(v: Venue) {
  const span = parseVenueSpan(v.time);
  if (!span) return v.time;
  const fmt = (m: number) => {
    const c = (((18 * 60 + m) % 1440) + 1440) % 1440;
    return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
  };
  return `${fmt(span.start)}–${fmt(span.end)}`;
}

/** The venue most friends head to next, and who (Friends view). */
export function friendsDestination(plans: FriendPlan[] = friendPlans) {
  const byVenue = new Map<string, FriendPlan[]>();
  for (const p of plans) {
    if (!p.nextVenueId) continue;
    byVenue.set(p.nextVenueId, [...(byVenue.get(p.nextVenueId) ?? []), p]);
  }
  let best: { venueId: string; plans: FriendPlan[] } | null = null;
  for (const [venueId, ps] of byVenue) {
    if (!best || ps.length > best.plans.length) best = { venueId, plans: ps };
  }
  if (!best) return null;
  const earliest = [...best.plans].map((p) => p.nextAt ?? "").sort()[0];
  return {
    venueId: best.venueId,
    people: best.plans.map((p) => people[p.personId]).filter(Boolean),
    at: earliest,
  };
}

export function friendGroups(
  byId: ReadonlyMap<string, Venue>,
  plans: FriendPlan[] = friendPlans
): FriendGroupPin[] {
  const groups = new Map<string, FriendGroupPin>();
  for (const p of plans) {
    const v = byId.get(p.atVenueId);
    const person = people[p.personId];
    if (!v || !person) continue;
    const g =
      groups.get(v.id) ??
      { venueId: v.id, lng: v.lng, lat: v.lat, people: [], hosting: false };
    g.people.push(person);
    g.hosting ||= !!p.hosting;
    groups.set(v.id, g);
  }
  return [...groups.values()];
}

export type DeskPinInput = {
  view: PanelView;
  venues: Venue[];
  /** Ranked by pin-tier (relevance), best first. */
  plan: PinCandidate[];
  at: Date;
  goingIds: ReadonlySet<string>;
  selectedId: string | null;
  invite: Invitation | null;
  searchHits: string[];
};

export function planDeskPins(input: DeskPinInput): Map<string, DeskPin> {
  const { view, venues, plan, at, goingIds, selectedId, invite, searchHits } = input;
  const byId = new Map(venues.map((v) => [v.id, v]));
  const pins = new Map<string, DeskPin>();
  const calm = view !== "tonight";

  // Everything starts as a quiet point, dimmed when closed at the chosen time
  // (Tonight) or when the view is about something else.
  for (const v of venues) {
    const available = isAvailableAt(v, at);
    pins.set(v.id, {
      kind: v.isPrivate ? "private" : "dot",
      dim: calm || !available,
      going: goingIds.has(v.id),
    });
  }

  const lift = (id: string, pin: Omit<DeskPin, "going">) => {
    if (!byId.has(id)) return;
    pins.set(id, { ...pin, going: goingIds.has(id) });
  };

  if (view === "tonight") {
    let clusters = 0;
    let named = 0;
    for (const c of plan) {
      const v = byId.get(c.id);
      if (!v || v.isPrivate) continue;
      const dim = pins.get(c.id)?.dim ?? false;
      const personal = goingIds.has(v.id);
      // Names and faces are for places you can still go to at this time.
      if (dim && !personal) continue;
      // Faces for the best-ranked open places with 2+ friends (pin-tier's
      // social cap counts closed places too, so it isn't reused here).
      if (clusters < TONIGHT_CLUSTERS && v.friendsGoing.length >= 2) {
        clusters++;
        lift(v.id, { kind: "cluster", dim, label: v.name, people: v.friendsGoing });
      } else if (personal || named < TONIGHT_NAMED) {
        if (!personal) named++;
        lift(v.id, { kind: "named", dim, label: v.name });
      }
    }
  } else if (view === "friends") {
    const dest = friendsDestination();
    if (dest) {
      const n = dest.people.length;
      lift(dest.venueId, {
        kind: "dest",
        dim: false,
        label: byId.get(dest.venueId)?.name,
        sub: `${n} friend${n === 1 ? "" : "s"} from ${dest.at}`,
      });
    }
  } else if (view === "venue" && selectedId) {
    const v = byId.get(selectedId);
    if (v) {
      lift(v.id, {
        kind: "selected",
        dim: false,
        label: v.name,
        sub: hours(v),
        people: v.friendsGoing.slice(0, 3),
      });
    }
  } else if (view === "invite" && invite) {
    lift(invite.venueId, {
      kind: "host",
      dim: false,
      label: byId.get(invite.venueId)?.name,
      sub: "Exact spot shared when you join",
      people: [invite.from],
    });
  } else if (view === "search") {
    for (const id of searchHits) {
      const v = byId.get(id);
      if (!v) continue;
      lift(id, v.friendsGoing.length
        ? { kind: "cluster", dim: false, label: v.name, people: v.friendsGoing }
        : { kind: "named", dim: false, label: v.name });
    }
  }
  return pins;
}
