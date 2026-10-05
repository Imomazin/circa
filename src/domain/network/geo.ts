/** Approximate coordinates for the demonstrator's Scottish locations. */
export const LOCATIONS: Record<string, { lat: number; lng: number }> = {
  Glasgow: { lat: 55.861, lng: -4.25 },
  Edinburgh: { lat: 55.953, lng: -3.188 },
  Inverness: { lat: 57.478, lng: -4.224 },
  Perth: { lat: 56.397, lng: -3.437 },
  Aberdeen: { lat: 57.149, lng: -2.094 },
  Livingston: { lat: 55.883, lng: -3.523 },
  "Fort William": { lat: 56.819, lng: -5.105 },
  Galashiels: { lat: 55.617, lng: -2.807 },
  Dundee: { lat: 56.462, lng: -2.97 },
  Stirling: { lat: 56.117, lng: -3.937 },
};

/** Road factor applied to great-circle distance to approximate driving km. */
const ROAD_FACTOR = 1.3;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Indicative road distance between two named locations, km. */
export function distanceBetween(regionA: string, regionB: string): number {
  const a = LOCATIONS[regionA];
  const b = LOCATIONS[regionB];
  if (!a || !b) return 120; // conservative fallback
  if (regionA === regionB) return 12;
  return Math.round(haversineKm(a, b) * ROAD_FACTOR);
}

/** Normalised x/y (0–1) for a lightweight schematic map of Scotland. */
export function normalisedPosition(region: string): { x: number; y: number } | null {
  const loc = LOCATIONS[region];
  if (!loc) return null;
  const lats = Object.values(LOCATIONS).map((l) => l.lat);
  const lngs = Object.values(LOCATIONS).map((l) => l.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.08;
  const x = pad + (1 - 2 * pad) * ((loc.lng - minLng) / (maxLng - minLng));
  const y = pad + (1 - 2 * pad) * ((maxLat - loc.lat) / (maxLat - minLat));
  return { x, y };
}
