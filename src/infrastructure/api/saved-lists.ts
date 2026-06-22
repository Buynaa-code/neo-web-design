import {
  savedListEnvelopeSchema,
  savedListListSchema,
  type SavedList,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

export interface SavedListInput {
  name: string;
  icon?: string | null;
}

/** GET /saved-lists — the user's named collections of listings. */
export async function listSavedLists(): Promise<SavedList[]> {
  return savedListListSchema.parse(await apiFetch("/saved-lists")).data;
}

/** POST /saved-lists */
export async function createSavedList(input: SavedListInput): Promise<SavedList> {
  return savedListEnvelopeSchema.parse(
    await apiFetch("/saved-lists", { method: "POST", body: input })
  ).data;
}

/** PUT /saved-lists/{id} */
export async function updateSavedList(
  id: number,
  input: Partial<SavedListInput>
): Promise<SavedList> {
  return savedListEnvelopeSchema.parse(
    await apiFetch(`/saved-lists/${id}`, { method: "PUT", body: input })
  ).data;
}

/** DELETE /saved-lists/{id} */
export async function deleteSavedList(id: number): Promise<void> {
  await apiFetch(`/saved-lists/${id}`, { method: "DELETE" });
}

/** POST /saved-lists/{id}/items — add a listing to the collection. */
export async function addSavedListItem(listId: number, listingId: number): Promise<void> {
  await apiFetch(`/saved-lists/${listId}/items`, {
    method: "POST",
    body: { listing_id: listingId },
  });
}

/** DELETE /saved-lists/{id}/items/{listing} — remove a listing. */
export async function removeSavedListItem(listId: number, listingId: number): Promise<void> {
  await apiFetch(`/saved-lists/${listId}/items/${listingId}`, { method: "DELETE" });
}
