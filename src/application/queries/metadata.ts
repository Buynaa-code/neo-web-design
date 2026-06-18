"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchFormOptions,
  fetchListingFlow,
  fetchPropertyCategories,
} from "@/infrastructure/api/metadata";
import { STALE } from "@/infrastructure/query/client";
import { queryKeys } from "@/infrastructure/query/keys";

/**
 * Reference / "info" metadata hooks. Long staleTime + persisted cache means
 * they load instantly on repeat visits and only hit the network when stale
 * (then revalidate quietly in the background to catch backend changes).
 */

export function useFormOptions() {
  return useQuery({
    queryKey: queryKeys.formOptions,
    queryFn: fetchFormOptions,
    staleTime: STALE.reference,
  });
}

export function useListingFlow() {
  return useQuery({
    queryKey: queryKeys.listingFlow,
    queryFn: fetchListingFlow,
    staleTime: STALE.reference,
  });
}

export function usePropertyCategories() {
  return useQuery({
    queryKey: queryKeys.propertyCategories,
    queryFn: fetchPropertyCategories,
    staleTime: STALE.reference,
  });
}
