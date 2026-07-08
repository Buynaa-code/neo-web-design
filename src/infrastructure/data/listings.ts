import type { Listing, MapLabel, DistrictZone } from "@/domain/types";

/**
 * Real listings only — populated by <ListingsBootstrap> from the live API
 * (see `replaceListings`). No hardcoded/seed listings: an empty backend means
 * an empty array here, not fake content standing in for it.
 */
export const LISTINGS: Listing[] = [];

export const MAP_LABELS: MapLabel[] = [
  { name: "СҮХБААТАР", x: 52, y: 19 },
  { name: "ЧИНГЭЛТЭЙ", x: 20, y: 19 },
  { name: "ХАН-УУЛ", x: 38, y: 69 },
  { name: "БАЯНЗҮРХ", x: 78, y: 22 },
  { name: "СОНГИНОХАЙРХАН", x: 11, y: 70 },
];

export const DISTRICT_ZONES: DistrictZone[] = [
  { name: "Чингэлтэй", points: "0,0 40,0 40,38 0,38", label: { x: 20, y: 19 } },
  { name: "Сүхбаатар", points: "40,0 65,0 65,38 40,38", label: { x: 52, y: 19 } },
  { name: "Баянзүрх", points: "65,0 100,0 100,100 55,100 55,38 65,38", label: { x: 78, y: 22 } },
  { name: "Сонгинохайрхан", points: "0,38 22,38 22,100 0,100", label: { x: 11, y: 70 } },
  { name: "Хан-Уул", points: "22,38 55,38 55,100 22,100", label: { x: 38, y: 69 } },
];

export function getListing(id: number): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}

/**
 * Replaces the seed dataset in place with real API data. We mutate the
 * existing `LISTINGS` array (rather than reassign) so every module that
 * imported it keeps a valid reference; screens subscribe to the store's
 * `listingsVersion` to re-render once this runs. Called once on app boot by
 * <ListingsBootstrap>.
 */
export function replaceListings(next: Listing[]): void {
  LISTINGS.splice(0, LISTINGS.length, ...next);
}

/**
 * Real photo URL from the API's grouped `photos` object, if the listing has
 * one. No synthetic fallback — `photoSeeds` are opaque backend placeholder
 * identifiers, not resolvable to a real image, so callers must handle
 * `undefined` (no photo) themselves instead of getting a fake stock photo.
 */
export function photoUrl(listing: Listing, n = 0): string | undefined {
  if (listing.photoUrls && listing.photoUrls.length) {
    return listing.photoUrls[n % listing.photoUrls.length];
  }
  return undefined;
}

export interface DistrictStats {
  count: number;
  min?: number;
  max?: number;
  avg?: number;
  ppm?: number;
  listings: Listing[];
}

export function districtStats(districtName: string, listings: Listing[]): DistrictStats {
  const arr = listings.filter((l) => l.district === districtName);
  if (!arr.length) return { count: 0, listings: [] };
  const prices = arr.map((l) => l.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
  const ppm = arr.reduce((s, l) => s + l.price / l.area, 0) / arr.length;
  return { count: arr.length, min, max, avg, ppm, listings: arr };
}

export function districtClusterCounts(): { name: string; count: number }[] {
  const districts = [
    "Хан-Уул", "Баянзүрх", "Сүхбаатар", "Чингэлтэй", "Сонгинохайрхан",
    "Налайх", "Баянгол", "Багануур", "Багахангай",
  ];
  return districts.map((d) => ({
    name: d,
    count: LISTINGS.filter((l) => l.district === d && l.status !== "sold").length,
  }));
}
