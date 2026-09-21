import { maastrichtPlaces, type Place, type PlaceKind } from "@/data/events";

export type PlaceHit = Place & { source: "local" | "map" };

const KIND_FROM_OSM: Record<string, PlaceKind> = {
  bar: "bar",
  pub: "bar",
  cafe: "bar",
  nightclub: "club",
  restaurant: "food",
  fast_food: "food",
  event_venue: "event",
};

const KIND_WORDS: Record<string, PlaceKind> = {
  bar: "bar",
  bars: "bar",
  cafe: "bar",
  café: "bar",
  pub: "bar",
  club: "club",
  clubs: "club",
  nightclub: "club",
  food: "food",
  eat: "food",
  dinner: "food",
  restaurant: "food",
  event: "event",
  events: "event",
  venue: "event",
  cinema: "event",
  theatre: "event",
};

function normalise(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Rank a place against the query. Higher is better, 0 means "no match".
 * Name matches outrank address matches, and matches at a word boundary
 * outrank matches in the middle of a word.
 */
function score(place: Place, q: string): number {
  const name = normalise(place.name);
  const address = normalise(place.address);
  const street = address.split("·")[0].trim();

  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(name))
    return 80;
  if (name.includes(q)) return 60;
  if (street.startsWith(q)) return 50;
  if (street.includes(q)) return 40;
  if (address.includes(q)) return 30;
  if (KIND_WORDS[q] === place.kind) return 20;
  return 0;
}

export function searchLocalPlaces(query: string, limit = 12): PlaceHit[] {
  const q = normalise(query.trim());
  if (q.length < 1) return [];
  return maastrichtPlaces
    .map((p) => ({ p, s: score(p, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name, "nl"))
    .slice(0, limit)
    .map((r) => ({ ...r.p, source: "local" as const }));
}

function formatPhotonAddress(props: Record<string, unknown>): string {
  const street = [props.housenumber, props.street].filter(Boolean).join(" ");
  const area = [props.district, props.city].filter(Boolean).join(" · ");
  return [street, area].filter(Boolean).join(" · ") || "Maastricht";
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
};

export async function searchRemotePlaces(query: string): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`/api/places?mode=search&q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return (data.features ?? [])
    .map((f, i): PlaceHit | null => {
      const coords = f.geometry?.coordinates;
      const props = f.properties ?? {};
      if (!coords || coords.length < 2) return null;
      const osmValue = String(props.osm_value ?? "");
      return {
        id: `remote-${props.osm_id ?? i}`,
        name: String(props.name ?? props.street ?? "Place"),
        address: formatPhotonAddress(props),
        lng: coords[0],
        lat: coords[1],
        kind: KIND_FROM_OSM[osmValue] ?? "other",
        source: "map",
      };
    })
    .filter((p): p is PlaceHit => p !== null);
}

export async function geocodeAddress(query: string): Promise<PlaceHit | null> {
  const hits = await searchRemotePlaces(query);
  if (hits[0]) return hits[0];
  const local = searchLocalPlaces(query);
  return local[0] ?? null;
}

export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string> {
  const res = await fetch(`/api/places?mode=reverse&lng=${lng}&lat=${lat}`);
  if (!res.ok) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const props = data.features?.[0]?.properties;
  if (!props) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const name = props.name ? String(props.name) : "";
  const address = formatPhotonAddress(props);
  return name ? `${name} · ${address}` : address;
}

/** Local (curated, instant) hits first, then anything new from live OSM. */
export function mergePlaceHits(
  local: PlaceHit[],
  remote: PlaceHit[]
): PlaceHit[] {
  const key = (p: PlaceHit) =>
    `${normalise(p.name)}|${normalise(p.address).split("·")[0].trim()}`;
  const seen = new Set(local.map(key));
  const extra = remote.filter((p) => {
    const k = key(p);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return [...local, ...extra].slice(0, 14);
}
