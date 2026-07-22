import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { register } from "@/infrastructure/api/auth";
import { createListing, deleteListing, getListing } from "@/infrastructure/api/listings";
import { latLngToNormalised, normalisedToLatLng } from "@/lib/utils";

/**
 * Live regression test for two real bugs reported by a user:
 *  1. "selected collateral status is invalid" — the wizard sent a stale/
 *     unmapped enum value for `collateral_status`/`certificate_status`.
 *  2. Every listing showing at the same map point — `lat`/`lng` were never
 *     sent (backend rejects real WGS84), so every listing round-tripped
 *     lat:null/lng:null and collapsed onto one spot on the results map.
 *
 * GUARDED: only runs when NEOMAP_E2E=1 (creates a real record, deleted in
 * afterAll). Run with `npm run test:e2e`.
 */
const ENABLED = process.env.NEOMAP_E2E === "1";

const PASSWORD = "Password123!";
const email = `smoke_collateral_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.invalid`;
const createdListingIds: number[] = [];

function basePayload(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    transaction_type: "sale",
    property_category: "apartment",
    property_subtype: "standard_apartment",
    mode: "sale",
    district: "Сүхбаатар",
    khoroo: "1-р хороо",
    khotkhon: "Зайсан Хилл Residence",
    area: 78.5,
    total_area_m2: 78.5,
    price: 350_000_000,
    total_price: 350_000_000,
    rooms: 3,
    usage_condition: "used",
    interior_condition: "renovated_within_1_year",
    certificate_status: "certificate_ready",
    current_availability_status: "vacant",
    relationship_to_property: "owner",
    confirms_information_is_true: true,
    confirms_authorized_to_publish: true,
    accepts_terms: true,
    ...overrides,
  };
}

describe.skipIf(!ENABLED)("listing collateral_status + lat/lng regressions (live, WRITES to server)", () => {
  beforeAll(async () => {
    const res = await register({
      name: "Smoke Test",
      email,
      password: PASSWORD,
      password_confirmation: PASSWORD,
    });
    expect(res.tokenType).toBe("Bearer");
  });

  afterAll(async () => {
    for (const id of createdListingIds) {
      await deleteListing(id).catch(() => {});
    }
  });

  it('accepts the fixed under_construction_contract certificate_status key (the old under_construction key 422s)', async () => {
    const created = await createListing(
      basePayload({ certificate_status: "under_construction_contract" })
    );
    createdListingIds.push(created.id);
    const readBack = await getListing(created.id);
    expect((readBack as unknown as Record<string, unknown>).certificateStatus).toBe(
      "under_construction_contract"
    );
  });

  it('omitting collateral_status ("Бусад" case) + sending collateral_description round-trips cleanly (no 422)', async () => {
    const note = "Шүүхийн маргаантай — тестийн тайлбар";
    const created = await createListing(
      basePayload({ collateral_description: note })
    );
    createdListingIds.push(created.id);
    const readBack = await getListing(created.id);
    const r = readBack as unknown as Record<string, unknown>;
    expect(r.collateralStatus == null || r.collateralStatus === "no_collateral").toBe(true);
    expect(r.collateralDescription).toBe(note);
  });

  it("a real map pin, sent as normalised 0..1 lat/lng, survives create -> GET and denormalises back near the original point", async () => {
    const realLat = 47.9184; // Sukhbaatar Square
    const realLng = 106.9177;
    const [lat, lng] = latLngToNormalised(realLat, realLng);
    expect(lat).toBeGreaterThanOrEqual(0);
    expect(lat).toBeLessThanOrEqual(1);

    const created = await createListing(basePayload({ lat, lng }));
    createdListingIds.push(created.id);
    const readBack = await getListing(created.id);

    expect(readBack.lat).not.toBeNull();
    expect(readBack.lng).not.toBeNull();
    expect(readBack.lat).not.toBe(0);
    expect(readBack.lng).not.toBe(0);

    const [backLat, backLng] = normalisedToLatLng(readBack.lat as number, readBack.lng as number);
    expect(backLat).toBeCloseTo(realLat, 1);
    expect(backLng).toBeCloseTo(realLng, 1);
  });
});
