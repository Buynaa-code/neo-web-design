"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, listFavorites, removeFavorite } from "@/infrastructure/api/favorites";
import { getToken } from "@/infrastructure/api/token";
import { useStore } from "@/infrastructure/store";
import {
  addSavedListItem,
  createSavedList,
  deleteSavedList,
  listSavedLists,
  removeSavedListItem,
  updateSavedList,
  type SavedListInput,
} from "@/infrastructure/api/saved-lists";
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
  updateSavedSearch,
  type SavedSearchInput,
} from "@/infrastructure/api/saved-searches";
import { toListing } from "@/infrastructure/api/listings";
import { queryKeys } from "@/infrastructure/query/keys";

/* -------------------------------------------------------------------------- */
/* Favorites                                                                  */
/* -------------------------------------------------------------------------- */

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: listFavorites,
    select: (res) => ({ ...res, listings: res.items.map(toListing) }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, favorited }: { listingId: number; favorited: boolean }) =>
      favorited ? removeFavorite(listingId) : addFavorite(listingId),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.favorites }),
  });
}

/**
 * Keeps the zustand `savedListingIds` (which drives the heart on cards/detail)
 * in sync with the server favorites, so the heart and the Saved screen agree.
 * The server is the source of truth; toggles update zustand instantly for
 * snappy feedback and the mutation reconciles on the next fetch. Mounted once
 * at app root. Only runs while authenticated.
 */
export function useSyncFavorites() {
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const setSavedListingIds = useStore((s) => s.setSavedListingIds);
  const authed = isLoggedIn && typeof window !== "undefined" && !!getToken();

  const { data } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: listFavorites,
    enabled: authed,
    select: (res) => res.items.map((i) => i.id),
  });

  useEffect(() => {
    if (authed && data) setSavedListingIds(data);
  }, [authed, data, setSavedListingIds]);
}

/* -------------------------------------------------------------------------- */
/* Saved lists                                                                */
/* -------------------------------------------------------------------------- */

export function useSavedLists() {
  return useQuery({ queryKey: queryKeys.savedLists, queryFn: listSavedLists });
}

export function useSavedListMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.savedLists });

  const create = useMutation({
    mutationFn: (input: SavedListInput) => createSavedList(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<SavedListInput> }) =>
      updateSavedList(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteSavedList(id),
    onSuccess: invalidate,
  });
  const addItem = useMutation({
    mutationFn: ({ listId, listingId }: { listId: number; listingId: number }) =>
      addSavedListItem(listId, listingId),
    onSuccess: invalidate,
  });
  const removeItem = useMutation({
    mutationFn: ({ listId, listingId }: { listId: number; listingId: number }) =>
      removeSavedListItem(listId, listingId),
    onSuccess: invalidate,
  });

  return { create, update, remove, addItem, removeItem };
}

/* -------------------------------------------------------------------------- */
/* Saved searches                                                             */
/* -------------------------------------------------------------------------- */

export function useSavedSearches(enabled = true) {
  return useQuery({ queryKey: queryKeys.savedSearches, queryFn: listSavedSearches, enabled });
}

export function useSavedSearchMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.savedSearches });

  const create = useMutation({
    mutationFn: (input: SavedSearchInput) => createSavedSearch(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<SavedSearchInput> }) =>
      updateSavedSearch(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteSavedSearch(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
