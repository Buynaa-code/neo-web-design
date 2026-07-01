import { QueryClient } from "@tanstack/react-query";

/** Cache lifetimes, tuned per data volatility. */
export const STALE = {
  /** Reference / "info" data (metadata, address). Slow-changing. */
  reference: 1000 * 60 * 60, // 1h — served instantly, revalidated in background
  /** Listing lists/detail. Refreshed often. */
  listing: 1000 * 30, // 30s
} as const;

/** Persisted cache is kept up to a week before being discarded. */
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default for dynamic data; reference hooks override with a longer one.
        staleTime: STALE.listing,
        // Keep inactive per-user data in memory only briefly so it doesn't
        // linger for days after unmount/logout. Reference data is persisted to
        // localStorage independently (PERSIST_MAX_AGE), so it survives reloads
        // regardless of this in-memory GC window.
        gcTime: 1000 * 60 * 10, // 10m
        retry: 1,
        refetchOnWindowFocus: false,
        // Stale-while-revalidate: cached data shows instantly, a background
        // refetch picks up backend changes when the entry is stale.
        refetchOnMount: true,
      },
    },
  });
}
