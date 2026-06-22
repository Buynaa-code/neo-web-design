import {
  listingPaginatedSchema,
  type ListingResource,
  type PaginatorMeta,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/** GET /favorites — the authenticated user's favourited listings (paginated). */
export async function listFavorites(): Promise<{
  items: ListingResource[];
  meta: PaginatorMeta;
}> {
  const res = listingPaginatedSchema.parse(await apiFetch("/favorites"));
  return { items: res.data, meta: res.meta };
}

/** POST /favorites — favourite a listing. */
export async function addFavorite(listingId: number): Promise<void> {
  await apiFetch("/favorites", { method: "POST", body: { listing_id: listingId } });
}

/** DELETE /favorites/{listing} — un-favourite a listing. */
export async function removeFavorite(listingId: number): Promise<void> {
  await apiFetch(`/favorites/${listingId}`, { method: "DELETE" });
}
