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
 *     keys do. Resolving those ids to names is blocked until the backend's
 *     `/v1/districts|khoroos` endpoints (which 500 today) are fixed, so this
 *     module only exposes ids for now.
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

/** District/khoroo ids resolved from a bbox lookup. Names are not yet resolvable — see module docs. */
export interface ResolvedBuildingAddress {
  districtId: number;
  khorooId: number;
  zipCodeId: number | null;
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
    districtId: hit.district_id,
    khorooId: hit.khoroo_id,
    zipCodeId: hit.zip_code_id,
  };
}
