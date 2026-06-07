import { normalisedToLatLng } from "@/lib/utils";
import type { Listing } from "@/lib/types";
import type { MyPlace } from "@/lib/store";

export type TravelMode = "car" | "walk";

/** Real (km) distance between two lat/lng points — Haversine formula. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Adjust straight-line km to a route km — city detour factor */
const ROUTE_FACTOR = {
  car: 1.35,
  walk: 1.2,
} as const;

/** Average speed km/h within UB traffic / pedestrian conditions */
const SPEED_KMH = {
  car: 22,
  walk: 4.4,
} as const;

export function travelEstimate(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  mode: TravelMode
): { km: number; minutes: number } {
  const straightKm = haversineKm(a, b);
  const routeKm = straightKm * ROUTE_FACTOR[mode];
  const hours = routeKm / SPEED_KMH[mode];
  return { km: routeKm, minutes: Math.max(1, Math.round(hours * 60)) };
}

/** Convert listing normalised coords → real lat/lng (UB-bounded). */
export function listingLatLng(listing: Listing): { lat: number; lng: number } {
  const [lat, lng] = normalisedToLatLng(listing.lat, listing.lng);
  return { lat, lng };
}

/** Travel from listing → place in both modes. */
export function listingToPlace(
  listing: Listing,
  place: MyPlace
): { car: { km: number; minutes: number }; walk: { km: number; minutes: number } } {
  const a = listingLatLng(listing);
  const b = { lat: place.lat, lng: place.lng };
  return {
    car: travelEstimate(a, b, "car"),
    walk: travelEstimate(a, b, "walk"),
  };
}

export function fmtMinutes(m: number): string {
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const rest = m - h * 60;
  return rest ? `${h}ц ${rest}м` : `${h}ц`;
}

export function fmtKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}м`;
  if (km < 10) return `${km.toFixed(1)} км`;
  return `${Math.round(km)} км`;
}
