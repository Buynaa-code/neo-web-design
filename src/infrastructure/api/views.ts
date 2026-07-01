import type { ListingResource, PaginatorMeta } from "@/domain/schemas/api";
import { apiFetch } from "./http";
import { parseListingList } from "./listings";

/** GET /views — recently-viewed listings (most recent first, paginated). */
export async function listViews(): Promise<{
  items: ListingResource[];
  meta: PaginatorMeta;
}> {
  return parseListingList(await apiFetch("/views"));
}

/** POST /views — record that the user opened a listing. Fire-and-forget. */
export async function recordView(listingId: number): Promise<void> {
  await apiFetch("/views", { method: "POST", body: { listing_id: listingId } });
}
