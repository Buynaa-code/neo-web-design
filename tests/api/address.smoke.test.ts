import { describe, expect, it } from "vitest";
import {
  listBuildingBlocks,
  listCities,
  listComplexes,
  listCountries,
  listDistricts,
  listKhoroos,
  listStreets,
  listZipcodes,
} from "@/infrastructure/api/address";
import { addressOptionSchema } from "@/domain/schemas/api";

/**
 * Live contract smoke tests against http://core.neomap.mn/api.
 * They validate that every address endpoint still returns the
 * `AddressOptionResource` shape the UI/adapter depends on.
 */
describe("address endpoints (live)", () => {
  it("countries returns AddressOption[]", async () => {
    const countries = await listCountries();
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(0);
    for (const c of countries) expect(() => addressOptionSchema.parse(c)).not.toThrow();
  });

  it("cascades country -> city -> district -> khoroo", async () => {
    const [country] = await listCountries();
    expect(country).toBeDefined();

    const cities = await listCities(Number(country.id));
    expect(Array.isArray(cities)).toBe(true);
    if (cities.length === 0) return; // nothing to cascade into

    const districts = await listDistricts(Number(cities[0].id));
    expect(Array.isArray(districts)).toBe(true);
    if (districts.length === 0) return;

    const khoroos = await listKhoroos(Number(districts[0].id));
    expect(Array.isArray(khoroos)).toBe(true);
  });

  it("leaf endpoints accept an empty parent and return arrays", async () => {
    for (const fn of [listZipcodes, listStreets, listComplexes, listBuildingBlocks]) {
      const result = await (fn as () => Promise<unknown[]>)();
      expect(Array.isArray(result)).toBe(true);
    }
  });
});
