import {
  listingPaginatedSchema,
  type ListingResource,
  type PaginatorMeta,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/** GET /views — recently-viewed listings (most recent first, paginated). */
export async function listViews(): Promise<{
  items: ListingResource[];
  meta: PaginatorMeta;
}> {
  const res = listingPaginatedSchema.parse(await apiFetch("/views"));
  return { items: res.data, meta: res.meta };
}

/** POST /views — record that the user opened a listing. Fire-and-forget. */
export async function recordView(listingId: number): Promise<void> {
  await apiFetch("/views", { method: "POST", body: { listing_id: listingId } });
}
