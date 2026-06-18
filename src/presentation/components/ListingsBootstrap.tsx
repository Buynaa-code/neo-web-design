"use client";

import { useEffect } from "react";
import { useListings } from "@/application/queries/listings";
import { replaceListings } from "@/infrastructure/data/listings";
import { useStore } from "@/infrastructure/store";

/**
 * Loads real listings from the API once on app boot and swaps them in for the
 * seed dataset (in place — see `replaceListings`), bumping `listingsVersion`
 * so subscribed screens re-render. Renders nothing.
 *
 * If the request fails or returns nothing, the seed data stays in place, so
 * the app degrades gracefully to mock content.
 */
export function ListingsBootstrap() {
  const bump = useStore((s) => s.bumpListingsVersion);
  const { data } = useListings({ perPage: 100 });

  useEffect(() => {
    if (data?.listings?.length) {
      replaceListings(data.listings);
      bump();
    }
  }, [data, bump]);

  return null;
}
