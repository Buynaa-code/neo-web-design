/**
 * Centralised TanStack Query keys. The first element of every key is a stable
 * "domain" string; the `REFERENCE_DOMAINS` set marks the slow-changing
 * reference / "info" data that we persist to localStorage so it is available
 * instantly on the next load.
 */

import type { ListListingsParams } from "@/infrastructure/api/listings";

export const queryKeys = {
  // Reference / metadata (persisted, long staleTime)
  formOptions: ["form-options"] as const,
  listingFlow: ["listing-flow"] as const,
  propertyCategories: ["property-categories"] as const,
  countries: ["address", "countries"] as const,
  cities: (countryId?: number) => ["address", "cities", countryId ?? null] as const,
  districts: (cityId?: number) => ["address", "districts", cityId ?? null] as const,
  khoroos: (districtId?: number) => ["address", "khoroos", districtId ?? null] as const,
  zipcodes: (khorooId?: number) => ["address", "zipcodes", khorooId ?? null] as const,
  streets: (khorooId?: number) => ["address", "streets", khorooId ?? null] as const,
  complexes: (khorooId?: number, streetId?: number) =>
    ["address", "complexes", khorooId ?? null, streetId ?? null] as const,
  buildingBlocks: (complexId?: number) =>
    ["address", "building-blocks", complexId ?? null] as const,

  // Dynamic data (short staleTime, not persisted)
  listings: (params: ListListingsParams) => ["listings", params] as const,
  listing: (id: number) => ["listings", "detail", id] as const,
  myListings: (params: unknown) => ["my-listings", params] as const,
  currentUser: ["auth", "user"] as const,

  // Engagement (per-user, dynamic, not persisted)
  favorites: ["favorites"] as const,
  savedLists: ["saved-lists"] as const,
  savedSearches: ["saved-searches"] as const,
  alerts: (unread?: boolean) => ["alerts", unread ?? null] as const,
  appointments: (status?: string) => ["appointments", status ?? null] as const,
  views: ["views"] as const,
  conversations: ["conversations"] as const,
  messages: (conversationId: number) => ["conversations", conversationId, "messages"] as const,
  preferences: ["preferences"] as const,
  rentalTenants: ["rental", "tenants"] as const,
  rentalContracts: ["rental", "contracts"] as const,
  rentalIncome: (year?: number) => ["rental", "income", year ?? null] as const,

  // Articles / news (public, slow-changing — persisted as reference)
  articles: (params: unknown) => ["articles", params] as const,
  article: (slug: string) => ["articles", "detail", slug] as const,
};

/** Key domains whose data is slow-changing and safe to persist offline. */
export const REFERENCE_DOMAINS = new Set([
  "form-options",
  "listing-flow",
  "property-categories",
  "address",
  "articles",
]);

export function isReferenceKey(queryKey: readonly unknown[]): boolean {
  return typeof queryKey[0] === "string" && REFERENCE_DOMAINS.has(queryKey[0]);
}
