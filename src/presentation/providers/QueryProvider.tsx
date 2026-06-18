"use client";

import { useState, type ReactNode } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  makeQueryClient,
  PERSIST_MAX_AGE,
} from "@/infrastructure/query/client";
import { isReferenceKey } from "@/infrastructure/query/keys";

/**
 * App-wide TanStack Query provider.
 *
 * Reference / "info" data (metadata + address options) is persisted to
 * localStorage so it is available *instantly* on the next visit with no
 * network wait, then revalidated in the background. Dynamic data (listings,
 * auth) is intentionally NOT persisted — only its query key shape is restored.
 *
 * `buster` is bumped whenever the cache shape changes to invalidate stale
 * persisted entries after a deploy.
 */
const PERSIST_BUSTER = "neomap-cache-v1";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? undefined
      : createSyncStoragePersister({
          storage: window.localStorage,
          key: "neomap.query-cache",
        })
  );

  // During SSR there is no persister; render a plain client to avoid hydration
  // mismatches. The client provider hydrates on mount.
  if (!persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: noopPersister, buster: PERSIST_BUSTER }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          // Only persist slow-changing reference data.
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && isReferenceKey(query.queryKey),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

/** No-op persister used on the server where there is no storage. */
const noopPersister = {
  persistClient: async () => undefined,
  restoreClient: async () => undefined,
  removeClient: async () => undefined,
};
