import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function pointInPolygon(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function geoDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Convert 0..1 normalised UB coords → real lat/lng (loose mapping for Leaflet). */
export function normalisedToLatLng(lat: number, lng: number): [number, number] {
  const UB_LAT_MIN = 47.85;
  const UB_LAT_MAX = 47.95;
  const UB_LNG_MIN = 106.78;
  const UB_LNG_MAX = 107.05;
  const realLat = UB_LAT_MAX - lat * (UB_LAT_MAX - UB_LAT_MIN);
  const realLng = UB_LNG_MIN + lng * (UB_LNG_MAX - UB_LNG_MIN);
  return [realLat, realLng];
}
