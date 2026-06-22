import {
  savedSearchEnvelopeSchema,
  savedSearchListSchema,
  type SavedSearch,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

export interface SavedSearchInput {
  name: string;
  alert_freq: "instant" | "daily" | "weekly";
  mode?: "rent" | "sale";
  filters?: Record<string, unknown>;
  channels?: { sms?: boolean; email?: boolean; push?: boolean };
}

/** GET /saved-searches — saved filter sets that drive new-match alerts. */
export async function listSavedSearches(): Promise<SavedSearch[]> {
  return savedSearchListSchema.parse(await apiFetch("/saved-searches")).data;
}

/** POST /saved-searches */
export async function createSavedSearch(input: SavedSearchInput): Promise<SavedSearch> {
  return savedSearchEnvelopeSchema.parse(
    await apiFetch("/saved-searches", { method: "POST", body: input })
  ).data;
}

/** PUT /saved-searches/{id} */
export async function updateSavedSearch(
  id: number,
  input: Partial<SavedSearchInput>
): Promise<SavedSearch> {
  return savedSearchEnvelopeSchema.parse(
    await apiFetch(`/saved-searches/${id}`, { method: "PUT", body: input })
  ).data;
}

/** DELETE /saved-searches/{id} */
export async function deleteSavedSearch(id: number): Promise<void> {
  await apiFetch(`/saved-searches/${id}`, { method: "DELETE" });
}
