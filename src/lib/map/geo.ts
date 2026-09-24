export type LngLat = { lng: number; lat: number };

/** Rough box around Maastricht; outside it we show the city instead of you. */
export function isInMaastricht({ lng, lat }: LngLat) {
  return lng > 5.6 && lng < 5.78 && lat > 50.79 && lat < 50.9;
}

/** Ground metres per CSS pixel for MapLibre's 512px tiles. */
export function metersPerPixel(lat: number, zoom: number) {
  return (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (512 * 2 ** zoom);
}
