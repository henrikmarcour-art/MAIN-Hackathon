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

export function searchLocalPlaces(query: string): PlaceHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  return maastrichtPlaces
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.kind.includes(q)
    )
    .map((p) => ({ ...p, source: "local" as const }));
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

export function mergePlaceHits(
  local: PlaceHit[],
  remote: PlaceHit[]
): PlaceHit[] {
  const seen = new Set(local.map((p) => p.name.toLowerCase()));
  const extra = remote.filter((p) => !seen.has(p.name.toLowerCase()));
  return [...local, ...extra].slice(0, 10);
}
