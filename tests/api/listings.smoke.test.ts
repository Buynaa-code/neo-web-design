import { describe, expect, it } from "vitest";
import {
  getListing,
  listListings,
  toListing,
} from "@/infrastructure/api/listings";
import { listingResourceSchema } from "@/domain/schemas/api";

/**
 * Live contract smoke tests for the public listing endpoints + the
 * ListingResource -> UI Listing adapter.
 */
describe("listing endpoints (live)", () => {
  it("index returns a paginated set of ListingResource", async () => {
    const { items, meta } = await listListings({ perPage: 3 });
    expect(Array.isArray(items)).toBe(true);
    expect(meta.per_page).toBeGreaterThan(0);
    expect(meta.current_page).toBe(1);
    expect(typeof meta.total).toBe("number");
    for (const item of items) {
      expect(() => listingResourceSchema.parse(item)).not.toThrow();
    }
  });

  it("supports filters without error", async () => {
    const { items } = await listListings({ mode: "sale", perPage: 2 });
    for (const item of items) expect(item.mode).toBeDefined();
  });

  it("q param does full-text search server-side (unrelated terms return nothing)", async () => {
    // Public/read-only probe: no listing is created here, so this only proves
    // the contract (an obviously-nonsense term returns 0), not that `q` finds
    // real content — see listings.q-search.e2e.test.ts for a live round trip
    // that creates a listing and searches for its own unique field value.
    const { items, meta } = await listListings({
      q: "zzz-nonsense-term-that-should-never-match-anything-zzz",
      perPage: 5,
    });
    expect(items).toHaveLength(0);
    expect(meta.total).toBe(0);
  });

  it("show + adapter produce a valid UI Listing", async () => {
    const { items } = await listListings({ perPage: 1 });
    if (items.length === 0) return; // empty backend — nothing to show
    const detail = await getListing(items[0].id);
    expect(detail.id).toBe(items[0].id);

    const ui = toListing(detail);
    expect(ui.id).toBe(detail.id);
    expect(["sale", "rent"]).toContain(ui.mode);
    expect(typeof ui.price).toBe("number");
    expect(typeof ui.photos).toBe("number");
    expect(Array.isArray(ui.features)).toBe(true);
  });
});
