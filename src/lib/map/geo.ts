export type LngLat = { lng: number; lat: number };

/** Rough box around Maastricht; outside it we show the city instead of you. */
export function isInMaastricht({ lng, lat }: LngLat) {
  return lng > 5.6 && lng < 5.78 && lat > 50.79 && lat < 50.9;
}

/** Ground metres per CSS pixel for MapLibre's 512px tiles. */
export function metersPerPixel(lat: number, zoom: number) {
  return (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (512 * 2 ** zoom);
}

/** Great-circle distance in metres. */
export function distanceMeters(a: LngLat, b: LngLat) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/**
 * Walking minutes at an easy 75 m/min, never below 2. Straight-line, so a
 * slight underestimate in the old town; only shown when the visitor has
 * shared their real location.
 */
export function walkMinutes(from: LngLat, to: LngLat) {
  return Math.max(2, Math.round(distanceMeters(from, to) / 75));
}
