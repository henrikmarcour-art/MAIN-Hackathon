import { currentUser, people, type Person, type Venue } from "@/data/events";

export type StoredChatMessage = {
  id: string;
  from: Person;
  text: string;
  at: string;
};

const PREFIX = "maasnow-event-chat:";

function storageKey(venueId: string) {
  return `${PREFIX}${venueId}`;
}

function hostPerson(venue: Venue): Person | null {
  if (!venue.hostId) return null;
  if (venue.hostId === currentUser.id) return currentUser;
  return people[venue.hostId] ?? venue.friendsGoing.find((p) => p.id === venue.hostId) ?? null;
}

export function seedPrivateChat(venue: Venue): StoredChatMessage[] {
  const host = hostPerson(venue);
  if (!host) return [];
  return [
    {
      id: `${venue.id}-seed-1`,
      from: host,
      text: "Door code is 2847 — ping me when you’re on the stairs.",
      at: "20:41",
    },
  ];
}

export function loadEventChat(venue: Venue): StoredChatMessage[] {
  if (typeof window === "undefined") {
    return venue.isPrivate ? seedPrivateChat(venue) : [];
  }
  try {
    const raw = sessionStorage.getItem(storageKey(venue.id));
    if (raw) {
      const parsed = JSON.parse(raw) as StoredChatMessage[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return venue.isPrivate ? seedPrivateChat(venue) : [];
}

export function saveEventChat(venueId: string, messages: StoredChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(venueId), JSON.stringify(messages));
  } catch {
    /* quota / private mode */
  }
}
