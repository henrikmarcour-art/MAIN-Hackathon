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

function venueToRow(venue: Venue): Omit<EventRow, "id"> & { id: string } {
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
  };
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
  const { error } = await supabase.from("events").insert(venueToRow(venue));
  if (error) {
    console.error("Failed to save event to Supabase:", error.message);
  }
}
