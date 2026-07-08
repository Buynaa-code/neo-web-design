import {
  layerCacheDataListSchema,
  type LayerCacheDataList,
} from "@/domain/schemas/neodata";
import { apiFetch } from "./http";

/**
 * Client for the "Neodata" map/layer service (docs/document-data.json),
 * a HOST SEPARATE from the main Neomap API (`NEXT_PUBLIC_API_URL`,
 * core.neomap.mn). Public/no-auth. Used by the wizard's map step: after the
 * user pins a building and the map re-centers at zoom 18, we send its 4
 * corners (bbox) and get back every layer feature covering that spot,
 * including the administrative khoroo/district it falls in.
 *
 * `apiFetch` passes any path starting with "http" straight through instead of
 * prefixing `NEXT_PUBLIC_API_URL`, so a full URL here hits this other host
 * without needing a second fetch client.
 */

const NEODATA_BASE =
  process.env.NEXT_PUBLIC_NEODATA_API_URL ?? "https://data.neomap.mn/api";

export interface Bbox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export function bboxToQueryString(bbox: Bbox): string {
  return `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`;
}

// Web Mercator ground resolution at zoom 0, 256px tiles (meters/pixel at the equator).
const WEB_MERCATOR_BASE_RESOLUTION = 156543.03392804097;
const METERS_PER_DEGREE_LAT = 111320;

/** Ground meters covered by one pixel at a given latitude/zoom (Web Mercator, same formula Leaflet uses internally). */
export function metersPerPixel(lat: number, zoom: number): number {
  return (WEB_MERCATOR_BASE_RESOLUTION * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

/**
 * Derives the bbox (2 corners: SW + NE) a Leaflet map would report via
 * `map.getBounds()` after centering on `center` at `zoom`, for a viewport of
 * `widthPx`x`heightPx`. This is only an approximation for use where no live
 * map instance exists (tests, server-side) — in the actual wizard UI, prefer
 * reading `map.getBounds()` directly off the Leaflet instance once it has
 * re-centered, since that reflects the real rendered container size exactly.
 */
export function bboxFromCenterZoom(
  center: { lat: number; lng: number },
  zoom: number,
  viewport: { widthPx: number; heightPx: number }
): Bbox {
  const resolution = metersPerPixel(center.lat, zoom);
  const halfHeightM = (viewport.heightPx * resolution) / 2;
  const halfWidthM = (viewport.widthPx * resolution) / 2;
  const deltaLat = halfHeightM / METERS_PER_DEGREE_LAT;
  const deltaLng =
    halfWidthM / (METERS_PER_DEGREE_LAT * Math.cos((center.lat * Math.PI) / 180));
  return {
    minLat: center.lat - deltaLat,
    minLng: center.lng - deltaLng,
    maxLat: center.lat + deltaLat,
    maxLng: center.lng + deltaLng,
  };
}

export interface GetLayerCacheDataOptions {
  zoom?: number;
  perPage?: number;
  /** Only return features linked to an administrative unit (district/khoroo/zipcode). */
  onlyHasZznm?: boolean;
}

export async function getLayerCacheDataByBbox(
  bbox: Bbox,
  opts: GetLayerCacheDataOptions = {}
): Promise<LayerCacheDataList> {
  const res = await apiFetch(`${NEODATA_BASE}/layer-cache-data`, {
    query: {
      bbox: bboxToQueryString(bbox),
      zoom: opts.zoom,
      per_page: opts.perPage,
      // Live bug: the backend's `boolean` validation rejects the string
      // "true"/"false" ("The only has zznm field must be true or false.")
      // and only accepts 1/0 — see docs/api-listing-wizard-requirements.md #10.
      only_has_zznm:
        opts.onlyHasZznm === undefined ? undefined : opts.onlyHasZznm ? 1 : 0,
    },
    skipAuth: true,
  });
  return layerCacheDataListSchema.parse(res);
}
