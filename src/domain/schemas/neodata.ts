import { z } from "zod";

/**
 * Zod schemas for the "Neodata" map/layer service (docs/document-data.json),
 * served from a HOST SEPARATE from the main Neomap/RiskSolution API
 * (`https://data.neomap.mn/api`, vs. `https://core.neomap.mn/api`). It backs
 * the wizard's "pin a building on the map -> auto-fill district/khoroo" flow:
 * a bbox query against `/layer-cache-data` returns the administrative-layer
 * features covering that map area, each carrying an embedded `district`/
 * `khoroo` object when `only_has_zznm=true`.
 *
 * Kept in its own file (not domain/schemas/api.ts) because it's a distinct
 * backend with its own resource shapes, even though some names overlap
 * (Khoroo/District) with the core address cascade.
 *
 * Live-probed 2026-07-08 (see docs/api-listing-wizard-requirements.md, section
 * C) against real data — two things the OpenAPI doc gets wrong:
 *   - `geometry` is a GeoJSON object (`{type, coordinates}`), not an array.
 *   - The embedded `district`/`khoroo` objects never actually appear in the
 *     response, even with `only_has_zznm=1` — only the raw `*_id` foreign
 *     keys do.
 *
 * IMPORTANT (confirmed 2026-07-08): those raw ids are NOT a separate id space
 * needing name-matching — `province_id`/`district_id`/`khoroo_id` here are
 * the SAME ids as the core Neomap API's own address cascade
 * (`/address/provinces|districts|khoroos`). Verified directly: a neodata row
 * with `province_id:1, district_id:1, khoroo_id:4` and core's
 * `GET /address/districts?province_id=1` both agree — id 1 = "Улаанбаатар",
 * district id 1 = "Багануур", khoroo id 4 = "4-р хороо". So resolving a
 * building's district/khoroo just means looking those same ids up directly
 * in the core cascade — no need for this host's separate (and 401-requiring)
 * `/v1/provinces|districts|khoroos` endpoints at all.
 */

const nullableString = z.string().nullable();
const nullableInt = z.number().int().nullable();

export const layerCacheDataResourceSchema = z
  .object({
    id: z.number(),
    guid: z.number(),
    object_no: nullableString,
    object_name: nullableString,
    layer_type_id: nullableInt,
    address_no: nullableString,
    geometry: z.unknown(),
    sync: z.boolean(),
    zip_code_id: nullableInt,
    khoroo_id: nullableInt,
    district_id: nullableInt,
    province_id: nullableInt,
    // Undocumented in the OpenAPI spec but observed live 2026-07-08 — the
    // feature's centroid, handy for confirming a match without re-parsing geometry.
    coordinate_lat: z.coerce.number().nullable().optional(),
    coordinate_long: z.coerce.number().nullable().optional(),
  })
  .loose();
export type LayerCacheDataResource = z.infer<typeof layerCacheDataResourceSchema>;

export const layerCacheDataListSchema = z
  .object({
    data: z.array(layerCacheDataResourceSchema),
    links: z.record(z.string(), z.unknown()).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .loose();
export type LayerCacheDataList = z.infer<typeof layerCacheDataListSchema>;

/**
 * Address info resolved from a bbox lookup. `provinceId`/`districtId`/
 * `khorooId` ARE the core Neomap API's own address cascade ids (see module
 * docs), ready to pass straight to `listDistricts`/`listKhoroos`/etc. in
 * `infrastructure/api/address.ts`. The rest (`zipCodeId`, `objectName`,
 * `objectNo`, `addressNo`) are per-feature data with no core-API equivalent
 * to resolve further — surfaced as-is so callers can use whatever's usable
 * (e.g. `objectName` as a building/complex name, `addressNo` as a unit/building
 * number) instead of only ever filling district/khoroo.
 */
export interface ResolvedBuildingAddress {
  provinceId: number | null;
  districtId: number;
  khorooId: number;
  /** Raw `zip_code_id` foreign key — there's no core-API zipcode lookup to resolve it to an actual postal code. */
  zipCodeId: number | null;
  /** Building/complex/parcel name, if the matched feature has one. */
  objectName: string | null;
  objectNo: string | null;
  /** Building/unit number-ish free text, if present. */
  addressNo: string | null;
}

/**
 * Picks the first feature that carries both a khoroo_id and district_id
 * (i.e. an administrative-boundary layer, not e.g. a building footprint).
 */
export function resolveAddressFromLayerCacheData(
  items: LayerCacheDataResource[]
): ResolvedBuildingAddress | null {
  const hit = items.find((item) => item.khoroo_id != null && item.district_id != null);
  if (!hit || hit.khoroo_id == null || hit.district_id == null) return null;
  return {
    provinceId: hit.province_id,
    districtId: hit.district_id,
    khorooId: hit.khoroo_id,
    zipCodeId: hit.zip_code_id,
    objectName: hit.object_name,
    objectNo: hit.object_no,
    addressNo: hit.address_no,
  };
}
