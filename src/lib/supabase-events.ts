import { supabase } from "./supabase";
import type { Category, Person, Venue } from "@/data/events";

/** Row shape of the `events` table (Phase 1: no auth, no attendees/friends tables). */
type EventRow = {
  id: string;
  name: string;
  category: Category;
  address: string;
  lng: number;
  lat: number;
  time: string;
  vibe: string | null;
  price: 1 | 2 | 3;
  description: string | null;
  going_count: number;
  friends_going: Person[] | null;
  is_private: boolean;
  open_join: boolean;
  host_id: string | null;
  invited_ids: string[] | null;
  busy: boolean;
  delete_token_hash: string | null;
};

function rowToVenue(row: EventRow): Venue {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    lng: row.lng,
    lat: row.lat,
    time: row.time,
    vibe: row.vibe ?? "",
    price: row.price,
    description: row.description ?? "",
    goingCount: row.going_count,
    friendsGoing: row.friends_going ?? [],
    busy: row.busy,
    isPrivate: row.is_private,
    hostId: row.host_id ?? undefined,
    openJoin: row.open_join,
    invitedIds: row.invited_ids ?? [],
  };
}

function venueToRow(venue: Venue, deleteTokenHash: string | null): EventRow {
  return {
    id: venue.id,
    name: venue.name,
    category: venue.category,
    address: venue.address,
    lng: venue.lng,
    lat: venue.lat,
    time: venue.time,
    vibe: venue.vibe,
    price: venue.price,
    description: venue.description,
    going_count: venue.goingCount,
    friends_going: venue.friendsGoing,
    is_private: venue.isPrivate ?? false,
    open_join: venue.openJoin ?? true,
    host_id: venue.hostId ?? null,
    invited_ids: venue.invitedIds ?? [],
    busy: venue.busy ?? false,
    delete_token_hash: deleteTokenHash,
  };
}

// TEMPORARY (Phase 1, no auth): deleting is gated by a random secret that only
// the creator's browser holds in localStorage; Supabase stores its SHA-256 hash
// and the `delete_event` RPC checks it. Clearing site data or switching devices
// loses the ability to delete. Replace with host_id = auth.uid() once auth lands.
const deleteTokenKey = (id: string) => `maasnow:delete-token:${id}`;

function readDeleteToken(id: string): string | null {
  try {
    return localStorage.getItem(deleteTokenKey(id));
  } catch {
    return null;
  }
}

function storeDeleteToken(id: string, token: string) {
  try {
    localStorage.setItem(deleteTokenKey(id), token);
  } catch {}
}

function forgetDeleteToken(id: string) {
  try {
    localStorage.removeItem(deleteTokenKey(id));
  } catch {}
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** True if this browser created the event and can therefore delete it. */
export function canDeleteEvent(id: string): boolean {
  return readDeleteToken(id) !== null;
}

/** Fetches user-created events to merge with the hardcoded seed venues. */
export async function fetchCreatedEvents(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load events from Supabase:", error.message);
    return [];
  }
  return (data as EventRow[]).map(rowToVenue);
}

/** Persists a newly created event. UI already updates optimistically before this resolves. */
export async function insertEvent(venue: Venue): Promise<void> {
  let deleteTokenHash: string | null = null;
  // crypto.subtle only exists in secure contexts (https, localhost); over plain
  // http on a LAN the event is still saved, just without a way to delete it.
  if (globalThis.crypto?.subtle) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = toHex(bytes);
    // Stored before the first await so the delete button shows immediately.
    storeDeleteToken(venue.id, token);
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token)
    );
    deleteTokenHash = toHex(new Uint8Array(digest));
  } else {
    console.warn("crypto.subtle unavailable; this event cannot be deleted later.");
  }

  const { error } = await supabase
    .from("events")
    .insert(venueToRow(venue, deleteTokenHash));
  if (error) {
    console.error("Failed to save event to Supabase:", error.message);
  }
}

/** Removes a user-created event. UI already updates optimistically before this resolves. */
export async function deleteEvent(id: string): Promise<void> {
  const token = readDeleteToken(id);
  if (!token) {
    console.error(`No delete token for event ${id} in this browser; only its creator can delete it.`);
    return;
  }
  const { data, error } = await supabase.rpc("delete_event", {
    p_id: id,
    p_token: token,
  });
  if (error) {
    console.error("Failed to delete event from Supabase:", error.message);
    return;
  }
  if (data !== true) {
    console.error(`Supabase did not delete event ${id} (not found or token mismatch).`);
    return;
  }
  forgetDeleteToken(id);
}
