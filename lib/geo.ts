export interface LatLon { lat: number; lon: number }

const R_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from a to b, degrees clockwise from north. */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Rough Kazakhstan bounding box; good enough to tell a visitor they are far outside it. */
export function inKazakhstanBox(p: LatLon): boolean {
  return p.lat >= 40.5 && p.lat <= 55.5 && p.lon >= 46.4 && p.lon <= 87.4;
}
