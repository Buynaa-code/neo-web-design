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
        gcTime: PERSIST_MAX_AGE,
        retry: 1,
        refetchOnWindowFocus: false,
        // Stale-while-revalidate: cached data shows instantly, a background
        // refetch picks up backend changes when the entry is stale.
        refetchOnMount: true,
      },
    },
  });
}
