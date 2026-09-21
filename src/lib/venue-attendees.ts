import {
  currentUser,
  people,
  type Person,
  type Venue,
} from "@/data/events";

const GUEST_FIRST = [
  "Emma",
  "Lucas",
  "Sophie",
  "Noah",
  "Mila",
  "Daan",
  "Eva",
  "Sem",
  "Lisa",
  "Tom",
  "Anna",
  "Max",
  "Julia",
  "Tim",
  "Sara",
  "Ruben",
  "Fleur",
  "Sam",
  "Iris",
  "Ben",
];

const GUEST_LAST = [
  "Jansen",
  "de Vries",
  "Bakker",
  "Visser",
  "Smit",
  "Meijer",
  "de Boer",
  "Mulder",
  "de Groot",
  "Bos",
];

const GUEST_COLORS = [
  "#64748b",
  "#78716c",
  "#6b7280",
  "#475569",
  "#57534e",
  "#525252",
  "#4b5563",
  "#334155",
];

function guestPerson(venueId: string, index: number): Person {
  const fi = index % GUEST_FIRST.length;
  const li = Math.floor(index / GUEST_FIRST.length) % GUEST_LAST.length;
  const name = `${GUEST_FIRST[fi]} ${GUEST_LAST[li]}`;
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  return {
    id: `guest-${venueId}-${index}`,
    name,
    initials,
    color: GUEST_COLORS[index % GUEST_COLORS.length],
  };
}

/** Total headcount shown on the event sheet (includes current user if marked going). */
export function totalGoingCount(venue: Venue, userGoing: boolean): number {
  return venue.goingCount + (userGoing ? 1 : 0);
}

/**
 * Builds a stable attendee list for Phase 1: known friends & host first,
 * then synthetic guests until `totalGoingCount` is reached.
 */
export function buildAttendeeList(venue: Venue, userGoing: boolean): Person[] {
  const target = totalGoingCount(venue, userGoing);
  const byId = new Map<string, Person>();

  const add = (p: Person | null | undefined) => {
    if (!p || byId.has(p.id)) return;
    byId.set(p.id, p);
  };

  if (venue.hostId) {
    add(
      venue.hostId === currentUser.id
        ? currentUser
        : people[venue.hostId] ?? null
    );
  }

  for (const f of venue.friendsGoing) add(f);

  if (userGoing) add(currentUser);

  let guestIndex = 0;
  while (byId.size < target) {
    add(guestPerson(venue.id, guestIndex));
    guestIndex += 1;
  }

  const ordered: Person[] = [];
  const priority = new Set<string>();
  if (venue.hostId) {
    const host =
      venue.hostId === currentUser.id
        ? currentUser
        : people[venue.hostId];
    if (host && byId.has(host.id)) {
      ordered.push(host);
      priority.add(host.id);
    }
  }
  for (const f of venue.friendsGoing) {
    if (byId.has(f.id) && !priority.has(f.id)) {
      ordered.push(f);
      priority.add(f.id);
    }
  }
  if (userGoing && byId.has(currentUser.id) && !priority.has(currentUser.id)) {
    ordered.push(currentUser);
    priority.add(currentUser.id);
  }
  for (const p of byId.values()) {
    if (!priority.has(p.id)) ordered.push(p);
  }

  return ordered.slice(0, target);
}

export function isFriendAttendee(venue: Venue, person: Person): boolean {
  return venue.friendsGoing.some((f) => f.id === person.id);
}
