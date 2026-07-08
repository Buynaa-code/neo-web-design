import { describe, expect, it } from "vitest";
import {
  bboxFromCenterZoom,
  getLayerCacheDataByBbox,
  resolveCoreAddressFromNeodataIds,
} from "@/infrastructure/api/neodata";
import {
  layerCacheDataResourceSchema,
  resolveAddressFromLayerCacheData,
} from "@/domain/schemas/neodata";

/**
 * Live contract smoke test against https://data.neomap.mn/api (the "Neodata"
 * map/layer service — a separate host from the main Neomap API). This is the
 * lookup the wizard's "pin a building -> auto-fill district/khoroo" flow
 * relies on: send the map's 4 corners (bbox) at zoom 18 and expect back
 * `LayerCacheDataResource`s carrying the khoroo/district ids for that spot.
 *
 * TWO KNOWN LIVE BUGS currently block this from ever returning real data —
 * see docs/api-listing-wizard-requirements.md section C for full write-ups
 * and curl repros:
 *   - §9  `bbox` filtering never matches anything, even for a bbox built
 *         directly from a real feature's own geometry coordinates.
 *   - §13 The unfiltered endpoint only ever returns `sync=false` ("not yet
 *         processed") rows — it's an internal ETL queue, not a general
 *         spatial index. Its row count fluctuates with a background sync
 *         worker and was observed to go from 325,494 to 0 within an hour.
 *         Zero rows here does NOT mean "no coverage" — it may just mean the
 *         queue is currently empty.
 *
 * These tests assert the *contract* (shape, envelope, resolver pipeline),
 * not that real data comes back — matching this repo's convention for pre-
 * launch/partially-seeded backends (see tests/api/address.smoke.test.ts).
 * Re-run this file any time to check current backend status: the row count
 * logged by the first test is the signal to watch for a fix landing.
 */
describe("neodata layer-cache-data endpoint (live)", () => {
  const sukhbaatarSquare = { lat: 47.9184, lng: 106.9177 };
  // The bbox a Leaflet map would report via `getBounds()` after re-centering
  // on the pin at zoom 18, for a typical wizard map panel (800x500px) — i.e.
  // the actual 2 corners (SW/NE) the wizard will send, not an arbitrary margin.
  const bbox = bboxFromCenterZoom(sukhbaatarSquare, 18, { widthPx: 800, heightPx: 500 });

  it("whole-of-Mongolia bbox returns a valid envelope — logs current row count as a status signal", async () => {
    // A planet-wide bbox 500s (the backend scans every row server-side per
    // §9's docstring) — Mongolia's real bounds are generous enough to catch
    // any current coverage without tripping that timeout.
    const mongolia = { minLat: 41.5, minLng: 87.5, maxLat: 52.5, maxLng: 119.5 };
    const result = await getLayerCacheDataByBbox(mongolia, { perPage: 1 });

    expect(Array.isArray(result.data)).toBe(true);
    // eslint-disable-next-line no-console
    console.log(`[neodata] current Mongolia-wide row count: ${result.meta?.total ?? "unknown"}`);
  });

  it("returns a paginated envelope of LayerCacheDataResource for a real zoom-18 bbox", async () => {
    const result = await getLayerCacheDataByBbox(bbox, {
      zoom: 18,
      perPage: 50,
      onlyHasZznm: true,
    });

    expect(Array.isArray(result.data)).toBe(true);
    for (const item of result.data) {
      expect(() => layerCacheDataResourceSchema.parse(item)).not.toThrow();
    }
    if (result.data.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[neodata] bbox around Sukhbaatar Square matched ${result.data.length} row(s) — bbox bug may be fixed!`);
    }
  });

  it("resolves a district/khoroo id pair, and cross-checks it against the live core address cascade", async () => {
    const result = await getLayerCacheDataByBbox(bbox, {
      zoom: 18,
      perPage: 50,
      onlyHasZznm: true,
    });

    const resolved = resolveAddressFromLayerCacheData(result.data);
    if (result.data.length === 0 || !resolved || resolved.provinceId == null) {
      // Currently always true (bbox filter + empty-queue bugs) — assert the
      // contract, not the data. If this starts failing, the backend has
      // started returning real coverage for this bbox — go verify the wizard
      // wiring (list-property-wizard.tsx's autoFillFromMapPin) end-to-end.
      expect(resolved).toBeNull();
      return;
    }

    expect(resolved.districtId).toBeGreaterThan(0);
    expect(resolved.khorooId).toBeGreaterThan(0);

    // Full pipeline: neodata ids ARE core address cascade ids (confirmed live
    // 2026-07-08 — see docs/api-listing-wizard-requirements.md §12 update).
    // If a match ever comes back, prove it resolves to a real district/khoroo
    // name via the core API, exactly as list-property-wizard.tsx's
    // autoFillFromMapPin does.
    const core = await resolveCoreAddressFromNeodataIds(
      resolved.provinceId,
      resolved.districtId,
      resolved.khorooId
    );
    expect(core).not.toBeNull();
    expect(core?.districtName).toBeTruthy();
    expect(core?.khorooName).toBeTruthy();
  });
});
