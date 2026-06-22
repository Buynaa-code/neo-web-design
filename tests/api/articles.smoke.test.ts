import { describe, expect, it } from "vitest";
import { listArticles } from "@/infrastructure/api/articles";
import { articleSchema } from "@/domain/schemas/api";

/**
 * Live contract smoke test for the public articles/news feed.
 * `/articles` is public (no auth) and paginated. The list may be empty if
 * nothing is seeded yet — we only assert the envelope/shape contract.
 */
describe("articles endpoint (live, public)", () => {
  it("GET /articles returns a paginated Article[]", async () => {
    const { items, meta } = await listArticles({ perPage: 5 });
    expect(Array.isArray(items)).toBe(true);
    expect(typeof meta.total).toBe("number");
    for (const a of items) expect(() => articleSchema.parse(a)).not.toThrow();
  });

  it("GET /articles?q= accepts a search query", async () => {
    const { items } = await listArticles({ q: "байр", perPage: 3 });
    expect(Array.isArray(items)).toBe(true);
  });
});
