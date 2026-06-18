import {
  addressOptionListSchema,
  type AddressOption,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/**
 * Cascading address reference data. Every endpoint returns
 * `{ data: AddressOption[] }`. Each level is filtered by the parent id; an
 * omitted parent returns the full set. These are public (no auth needed).
 */

async function fetchOptions(
  path: string,
  query?: Record<string, number | undefined>
): Promise<AddressOption[]> {
  const res = await apiFetch(path, { query, skipAuth: true });
  return addressOptionListSchema.parse(res).data;
}

export const listCountries = () => fetchOptions("/address/countries");

export const listCities = (countryId?: number) =>
  fetchOptions("/address/cities", { country_id: countryId });

export const listDistricts = (cityId?: number) =>
  fetchOptions("/address/districts", { city_id: cityId });

export const listKhoroos = (districtId?: number) =>
  fetchOptions("/address/khoroos", { district_id: districtId });

export const listZipcodes = (khorooId?: number) =>
  fetchOptions("/address/zipcodes", { khoroo_id: khorooId });

export const listStreets = (khorooId?: number) =>
  fetchOptions("/address/streets", { khoroo_id: khorooId });

export const listComplexes = (khorooId?: number, streetId?: number) =>
  fetchOptions("/address/complexes", {
    khoroo_id: khorooId,
    street_id: streetId,
  });

export const listBuildingBlocks = (complexId?: number) =>
  fetchOptions("/address/building-blocks", { complex_id: complexId });
