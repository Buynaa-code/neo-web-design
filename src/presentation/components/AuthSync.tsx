"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken, onUnauthorized } from "@/infrastructure/api/token";
import { useStore } from "@/infrastructure/store";
import { useStoreHydrated } from "@/infrastructure/useStoreHydrated";
import { useSyncFavorites } from "@/application/queries/saved";

/**
 * Single global bridge that keeps the three auth sources of truth in sync:
 *  - the bearer token (localStorage `neomap.auth.token`),
 *  - the zustand `isLoggedIn` / `currentUser` (persisted store, drives routing),
 *  - the TanStack Query cache (per-user data).
 *
 * Two responsibilities:
 *  1. On a 401 the HTTP layer clears the token and fires `onUnauthorized`. Here
 *     we drop the store to signed-out and wipe the query cache so no stale or
 *     cross-user data lingers, and ProtectedRoute redirects to /auth.
 *  2. On boot we reconcile the "zombie" state where the persisted `isLoggedIn`
 *     survived a reload but the token is already gone — otherwise the UI looks
 *     logged in while every API call 401s.
 *
 * Mounted once at app root (below QueryProvider). Renders nothing.
 */
export function AuthSync() {
  const qc = useQueryClient();
  const hydrated = useStoreHydrated();

  // Keep the heart state (zustand) reconciled with the server favorites.
  useSyncFavorites();

  // 401 → fully sign out + clear the cache (token already cleared by the HTTP layer).
  useEffect(() => {
    return onUnauthorized(() => {
      useStore.getState().signOut();
      qc.clear();
    });
  }, [qc]);

  // Boot reconciliation: persisted "logged in" but no token → force sign-out.
  useEffect(() => {
    if (!hydrated) return;
    const state = useStore.getState();
    if (state.isLoggedIn && !getToken()) {
      state.signOut();
      qc.clear();
    }
  }, [hydrated, qc]);

  return null;
}
