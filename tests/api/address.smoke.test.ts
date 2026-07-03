import { describe, expect, it } from "vitest";
import {
  listBuildings,
  listDistricts,
  listKhoroolols,
  listKhoroos,
  listKhotkhons,
  listProvinces,
  listStreets,
} from "@/infrastructure/api/address";
import { addressOptionSchema } from "@/domain/schemas/api";

/**
 * Live contract smoke tests against https://core.neomap.mn/api.
 * They validate that every address endpoint still returns the
 * `AddressOptionResource` shape the UI/adapter depends on, for the live
 * cascade Province → District → Khoroo → {Street, Khoroolol, Khotkhon, Building}.
 *
 * NOTE: the address tables may be unseeded (provinces == []). The tests assert
 * the contract (arrays of the right shape), not that data exists.
 */
describe("address endpoints (live)", () => {
  it("provinces returns AddressOption[]", async () => {
    const provinces = await listProvinces();
    expect(Array.isArray(provinces)).toBe(true);
    for (const p of provinces) expect(() => addressOptionSchema.parse(p)).not.toThrow();
  });

  it("cascades province -> district -> khoroo", async () => {
    const [province] = await listProvinces();
    if (!province) return; // provinces unseeded — nothing to cascade into

    const districts = await listDistricts(province.id);
    expect(Array.isArray(districts)).toBe(true);
    if (districts.length === 0) return;

    const khoroos = await listKhoroos(districts[0].id);
    expect(Array.isArray(khoroos)).toBe(true);
    if (khoroos.length === 0) return;

    const kid = khoroos[0].id;
    for (const fn of [listStreets, listKhoroolols, listKhotkhons, listBuildings]) {
      const result = await fn(kid);
      expect(Array.isArray(result)).toBe(true);
      for (const o of result) expect(() => addressOptionSchema.parse(o)).not.toThrow();
    }
  });
});
