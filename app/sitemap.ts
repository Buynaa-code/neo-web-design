import type { MetadataRoute } from "next";

import { LISTINGS } from "@/infrastructure/data/listings";

const BASE_URL = "https://hdlh.vercel.app";

// Public, indexable routes. Auth-gated / utility screens are intentionally excluded.
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/results", priority: 0.9, changeFrequency: "hourly" },
  { path: "/interests", priority: 0.6, changeFrequency: "monthly" },
  { path: "/news", priority: 0.6, changeFrequency: "weekly" },
  { path: "/list-property", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const listingEntries: MetadataRoute.Sitemap = LISTINGS.map((listing) => ({
    url: `${BASE_URL}/property/${listing.id}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...listingEntries];
}
