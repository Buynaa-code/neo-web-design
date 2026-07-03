"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listBuildings,
  listDistricts,
  listKhoroolols,
  listKhoroos,
  listKhotkhons,
  listProvinces,
  listStreets,
} from "@/infrastructure/api/address";
import { STALE } from "@/infrastructure/query/client";
import { queryKeys } from "@/infrastructure/query/keys";

/**
 * Cascading address selectors for the live cascade:
 *   Province → District → Khoroo → { Street, Khoroolol, Khotkhon, Building }
 *
 * Each level is fetched lazily — only once its parent is chosen (`enabled`) —
 * and then cached, so re-selecting a parent is instant. All are reference data
 * with a long staleTime and are persisted offline.
 */

const reference = { staleTime: STALE.reference } as const;

export function useProvinces() {
  return useQuery({
    queryKey: queryKeys.provinces,
    queryFn: listProvinces,
    ...reference,
  });
}

export function useDistricts(provinceId?: string | number) {
  return useQuery({
    queryKey: queryKeys.districts(provinceId),
    queryFn: () => listDistricts(provinceId),
    enabled: provinceId != null,
    ...reference,
  });
}

export function useKhoroos(districtId?: string | number) {
  return useQuery({
    queryKey: queryKeys.khoroos(districtId),
    queryFn: () => listKhoroos(districtId),
    enabled: districtId != null,
    ...reference,
  });
}

export function useStreets(khorooId?: string | number) {
  return useQuery({
    queryKey: queryKeys.streets(khorooId),
    queryFn: () => listStreets(khorooId),
    enabled: khorooId != null,
    ...reference,
  });
}

export function useKhoroolols(khorooId?: string | number) {
  return useQuery({
    queryKey: queryKeys.khoroolols(khorooId),
    queryFn: () => listKhoroolols(khorooId),
    enabled: khorooId != null,
    ...reference,
  });
}

export function useKhotkhons(khorooId?: string | number) {
  return useQuery({
    queryKey: queryKeys.khotkhons(khorooId),
    queryFn: () => listKhotkhons(khorooId),
    enabled: khorooId != null,
    ...reference,
  });
}

export function useBuildings(khorooId?: string | number) {
  return useQuery({
    queryKey: queryKeys.buildings(khorooId),
    queryFn: () => listBuildings(khorooId),
    enabled: khorooId != null,
    ...reference,
  });
}
