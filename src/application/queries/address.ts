"use client";

import { useQuery } from "@tanstack/react-query";
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
import { STALE } from "@/infrastructure/query/client";
import { queryKeys } from "@/infrastructure/query/keys";

/**
 * Cascading address selectors. Each level is fetched lazily — only "when
 * needed" (i.e. once its parent is chosen) via the `enabled` flag — and then
 * cached, so re-selecting a parent is instant. All are reference data with a
 * long staleTime and are persisted offline.
 */

const reference = { staleTime: STALE.reference } as const;

export function useCountries() {
  return useQuery({
    queryKey: queryKeys.countries,
    queryFn: listCountries,
    ...reference,
  });
}

export function useCities(countryId?: number) {
  return useQuery({
    queryKey: queryKeys.cities(countryId),
    queryFn: () => listCities(countryId),
    enabled: countryId != null,
    ...reference,
  });
}

export function useDistricts(cityId?: number) {
  return useQuery({
    queryKey: queryKeys.districts(cityId),
    queryFn: () => listDistricts(cityId),
    enabled: cityId != null,
    ...reference,
  });
}

export function useKhoroos(districtId?: number) {
  return useQuery({
    queryKey: queryKeys.khoroos(districtId),
    queryFn: () => listKhoroos(districtId),
    enabled: districtId != null,
    ...reference,
  });
}

export function useZipcodes(khorooId?: number) {
  return useQuery({
    queryKey: queryKeys.zipcodes(khorooId),
    queryFn: () => listZipcodes(khorooId),
    enabled: khorooId != null,
    ...reference,
  });
}

export function useStreets(khorooId?: number) {
  return useQuery({
    queryKey: queryKeys.streets(khorooId),
    queryFn: () => listStreets(khorooId),
    enabled: khorooId != null,
    ...reference,
  });
}

export function useComplexes(khorooId?: number, streetId?: number) {
  return useQuery({
    queryKey: queryKeys.complexes(khorooId, streetId),
    queryFn: () => listComplexes(khorooId, streetId),
    enabled: khorooId != null,
    ...reference,
  });
}

export function useBuildingBlocks(complexId?: number) {
  return useQuery({
    queryKey: queryKeys.buildingBlocks(complexId),
    queryFn: () => listBuildingBlocks(complexId),
    enabled: complexId != null,
    ...reference,
  });
}
