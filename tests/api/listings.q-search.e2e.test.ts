import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { register } from "@/infrastructure/api/auth";
import { createListing, deleteListing, listListings } from "@/infrastructure/api/listings";

/**
 * Live round-trip for `GET /listings?q=` — confirmed working 2026-07-08 (a
 * listing created with a unique `khotkhon` value is found by searching for
 * that exact value, and not found by unrelated terms). The frontend results
 * screen (ResultsScreen/AISearchBar) does NOT use this: it only ever applies
 * `parseAIQuery()`'s *extracted structured filters* (district/rooms/price/
 * lifestyle) over the locally bootstrapped 100 listings — free text that
 * doesn't match one of those patterns (e.g. a project/building name) is
 * silently dropped, so searching for it finds nothing even though the
 * backend could. `application/filters.ts`'s `filteredListings` now also
 * substring-matches the raw query text client-side to close that gap.
 *
 * GUARDED behind NEOMAP_E2E=1 — registers a throwaway user and WRITES a real
 * listing, deleting it in afterAll.
 */
const ENABLED = process.env.NEOMAP_E2E === "1";
const PASSWORD = "Password123!";
const email = `qsearch_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.invalid`;

const createdIds: number[] = [];

describe.skipIf(!ENABLED)("listing q= search (live, WRITES to server)", () => {
  beforeAll(async () => {
    await register({ name: "QSearch Test", email, password: PASSWORD, password_confirmation: PASSWORD });
  });

  afterAll(async () => {
    for (const id of createdIds) await deleteListing(id).catch(() => {});
  });

  it("finds a listing by a unique khotkhon value passed as q, and not by an unrelated term", async () => {
    const uniqueTerm = `ZzyxUniqueTerm${Date.now()}`;
    const created = await createListing({
      transaction_type: "sale", property_category: "apartment",
      property_subtype: "standard_apartment", mode: "sale",
      district: "Сүхбаатар", khoroo: "1-р хороо", khotkhon: uniqueTerm,
      floor: "5", selected_floor: "5", floor_type: "middle",
      main_floor_count: 12, total_floor_count: 12,
      rooms: 3, area: 78.5, total_area_m2: 78.5, year: 2020,
      price: 350_000_000, total_price: 350_000_000, deposit: 0,
      usage_condition: "used", certificate_status: "certificate_ready",
      commissioned_status: "commissioned", current_availability_status: "vacant",
      collateral_status: "no_collateral", relationship_to_property: "owner",
      confirms_information_is_true: true, confirms_authorized_to_publish: true,
      accepts_terms: true, amenities: [], included_items: [], features: [],
    });
    createdIds.push(created.id);

    const found = await listListings({ q: uniqueTerm, perPage: 5 });
    expect(found.items.map((i) => i.id)).toContain(created.id);

    const notFound = await listListings({ q: "zzz-nonsense-term-zzz", perPage: 5 });
    expect(notFound.items.map((i) => i.id)).not.toContain(created.id);
  });
});
