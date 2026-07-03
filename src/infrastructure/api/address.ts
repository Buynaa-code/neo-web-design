import {
  addressOptionListSchema,
  type AddressOption,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/**
 * Cascading address reference data (live cascade as of the 2026-07 backend):
 *
 *   Province → District → Khoroo → { Street, Khoroolol, Khotkhon, Building }
 *
 * Every endpoint returns `{ data: AddressOption[] }` where each option is
 * `{ id, name }`. Each level is filtered by the parent id. These are public
 * (no auth needed). The old countries/cities/zipcodes/complexes/building-blocks
 * endpoints were removed by the backend and are gone here too.
 */

async function fetchOptions(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<AddressOption[]> {
  const res = await apiFetch(path, { query, skipAuth: true });
  return addressOptionListSchema.parse(res).data;
}

export const listProvinces = () => fetchOptions("/address/provinces");

export const listDistricts = (provinceId?: string | number) =>
  fetchOptions("/address/districts", { province_id: provinceId });

export const listKhoroos = (districtId?: string | number) =>
  fetchOptions("/address/khoroos", { district_id: districtId });

export const listStreets = (khorooId?: string | number) =>
  fetchOptions("/address/streets", { khoroo_id: khorooId });

export const listKhoroolols = (khorooId?: string | number) =>
  fetchOptions("/address/khoroolols", { khoroo_id: khorooId });

export const listKhotkhons = (khorooId?: string | number) =>
  fetchOptions("/address/khotkons", { khoroo_id: khorooId });

export const listBuildings = (khorooId?: string | number) =>
  fetchOptions("/address/buildings", { khoroo_id: khorooId });
