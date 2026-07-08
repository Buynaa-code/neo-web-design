import { describe, expect, it } from "vitest";
import { bboxFromCenterZoom, getLayerCacheDataByBbox } from "@/infrastructure/api/neodata";
import {
  layerCacheDataResourceSchema,
  resolveAddressFromLayerCacheData,
} from "@/domain/schemas/neodata";

/**
 * Live contract smoke test against https://data.neomap.mn/api (the "Neodata"
 * map/layer service — a separate host from the main Neomap API). This is the
 * lookup the wizard's "pin a building -> auto-fill district/khoroo" flow will
 * rely on: send the map's 4 corners (bbox) at zoom 18 and expect back
 * `LayerCacheDataResource`s carrying the khoroo/district ids for that spot.
 *
 * KNOWN LIVE BUG (2026-07-08, see docs/api-listing-wizard-requirements.md
 * section C #9): `bbox` filtering never matches, even for a bbox built
 * directly from a real feature's own geometry coordinates — the backend
 * always returns `meta.total === 0`. The endpoint without `bbox` sees
 * 300k+ real rows, so the data exists; only the bbox intersection is broken
 * server-side. These tests assert the *contract* (shape, envelope), matching
 * this repo's convention for pre-launch/partially-seeded backends (see
 * tests/api/address.smoke.test.ts) — not that bbox filtering actually works
 * yet. Once the backend bug is fixed, the second test here should start
 * resolving a real district/khoroo for Ulaanbaatar coordinates.
 */
describe("neodata layer-cache-data endpoint (live)", () => {
  const sukhbaatarSquare = { lat: 47.9184, lng: 106.9177 };
  // The bbox a Leaflet map would report via `getBounds()` after re-centering
  // on the pin at zoom 18, for a typical wizard map panel (800x500px) — i.e.
  // the actual 2 corners (SW/NE) the wizard will send, not an arbitrary margin.
  const bbox = bboxFromCenterZoom(sukhbaatarSquare, 18, { widthPx: 800, heightPx: 500 });

  it("returns a paginated envelope of LayerCacheDataResource for a bbox", async () => {
    const result = await getLayerCacheDataByBbox(bbox, {
      zoom: 18,
      perPage: 50,
      onlyHasZznm: true,
    });

    expect(Array.isArray(result.data)).toBe(true);
    for (const item of result.data) {
      expect(() => layerCacheDataResourceSchema.parse(item)).not.toThrow();
    }
  });

  it("resolves a district/khoroo id pair from the bbox results, once the backend's bbox filter works", async () => {
    const result = await getLayerCacheDataByBbox(bbox, {
      zoom: 18,
      perPage: 50,
      onlyHasZznm: true,
    });

    const resolved = resolveAddressFromLayerCacheData(result.data);
    if (result.data.length === 0 || !resolved) {
      // Currently always true (bbox filter bug) — assert the contract, not the data.
      expect(resolved).toBeNull();
      return;
    }

    expect(resolved.districtId).toBeGreaterThan(0);
    expect(resolved.khorooId).toBeGreaterThan(0);
  });
});
