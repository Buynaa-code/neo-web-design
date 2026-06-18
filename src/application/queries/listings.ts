"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createListing,
  deleteListing,
  getListing,
  listListings,
  listMyListings,
  toListing,
  updateListing,
  type ListListingsParams,
} from "@/infrastructure/api/listings";
import { queryKeys } from "@/infrastructure/query/keys";

/**
 * Dynamic listing data — short staleTime, not persisted. `keepPreviousData`
 * keeps the previous page visible while the next page/filter loads, avoiding
 * layout flashes during pagination.
 */
export function useListings(params: ListListingsParams = {}) {
  return useQuery({
    queryKey: queryKeys.listings(params),
    queryFn: () => listListings(params),
    placeholderData: keepPreviousData,
    // Map wire resources to UI listings once, here, so components stay simple.
    select: (res) => ({
      ...res,
      listings: res.items.map(toListing),
    }),
  });
}

export function useListing(id: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.listing(id ?? 0),
    queryFn: () => getListing(id as number),
    enabled: id != null,
    select: (resource) => ({ resource, listing: toListing(resource) }),
  });
}

export function useMyListings(
  params: Pick<ListListingsParams, "mode" | "status" | "perPage" | "page"> = {}
) {
  return useQuery({
    queryKey: queryKeys.myListings(params),
    queryFn: () => listMyListings(params),
    select: (res) => ({ ...res, listings: res.items.map(toListing) }),
  });
}

function useInvalidateListings() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["listings"] });
    qc.invalidateQueries({ queryKey: ["my-listings"] });
  };
}

export function useCreateListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createListing(body),
    onSuccess: invalidate,
  });
}

export function useUpdateListing(id: number) {
  const invalidate = useInvalidateListings();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => updateListing(id, body),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: queryKeys.listing(id) });
    },
  });
}

export function useDeleteListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (id: number) => deleteListing(id),
    onSuccess: invalidate,
  });
}
