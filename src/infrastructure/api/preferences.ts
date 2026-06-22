import { preferenceEnvelopeSchema, type Preference } from "@/domain/schemas/api";
import { apiFetch } from "./http";

export interface PreferenceInput {
  lifestyle?: "family" | "young-pro" | "student" | "investor";
  purpose?: "live" | "invest";
  bathrooms_min?: number | null;
  needs_office?: boolean;
  vibes?: string[] | null;
  bedrooms?: number[] | null;
  must_haves?: string[] | null;
  conditions?: string[] | null;
  notification_channels?: string[] | null;
}

/** GET /preferences — the user's lifestyle/search preference profile. */
export async function getPreferences(): Promise<Preference> {
  return preferenceEnvelopeSchema.parse(await apiFetch("/preferences")).data;
}

/** PUT /preferences */
export async function updatePreferences(input: PreferenceInput): Promise<Preference> {
  return preferenceEnvelopeSchema.parse(
    await apiFetch("/preferences", { method: "PUT", body: input })
  ).data;
}
