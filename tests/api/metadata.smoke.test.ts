import { describe, expect, it } from "vitest";
import {
  fetchFormOptions,
  fetchListingFlow,
  fetchPropertyCategories,
} from "@/infrastructure/api/metadata";

/**
 * Live contract smoke tests for the reference / "info" metadata endpoints.
 * Schema validation happens inside the api functions (they `.parse()`), so a
 * resolved promise already means the wire shape matched the OpenAPI doc.
 */
describe("metadata endpoints (live)", () => {
  it("form-options returns the full classification + groups", async () => {
    const opts = await fetchFormOptions();
    expect(opts.classification).toBeDefined();
    expect(typeof opts.classification.transactions).toBe("object");
    expect(Array.isArray(opts.steps)).toBe(true);
    expect(typeof opts.amenityGroups).toBe("object");
  });

  it("listing-flow returns wizard steps + groups", async () => {
    const flow = await fetchListingFlow();
    expect(Array.isArray(flow.steps)).toBe(true);
    expect(typeof flow.amenity_groups).toBe("object");
    expect(typeof flow.included_item_groups).toBe("object");
  });

  it("property-categories returns transactions + categories", async () => {
    const cats = await fetchPropertyCategories();
    expect(typeof cats.transactions).toBe("object");
    expect(typeof cats.categories).toBe("object");
    expect(Array.isArray(cats.suitableUseTags)).toBe(true);
  });
});
