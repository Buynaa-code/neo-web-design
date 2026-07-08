"use client";

import { useEffect } from "react";
import { useListings } from "@/application/queries/listings";
import { replaceListings } from "@/infrastructure/data/listings";
import { useStore } from "@/infrastructure/store";

/**
 * Loads real listings from the API once on app boot and swaps them in (in
 * place — see `replaceListings`), bumping `listingsVersion` so subscribed
 * screens re-render. Renders nothing.
 *
 * Runs once `data` resolves, even if the API returns 0 listings — there's no
 * seed/mock data to fall back to, so an empty result means the app genuinely
 * shows an empty state rather than silently keeping stale content.
 */
export function ListingsBootstrap() {
  const bump = useStore((s) => s.bumpListingsVersion);
  const { data } = useListings({ perPage: 100 });

  useEffect(() => {
    if (!data) return;
    replaceListings(data.listings ?? []);
    bump();
  }, [data, bump]);

  return null;
}
