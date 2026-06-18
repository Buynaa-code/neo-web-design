import {
  formOptionsSchema,
  listingFlowMetadataSchema,
  propertyCategoriesSchema,
  type FormOptions,
  type ListingFlowMetadata,
  type PropertyCategories,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/**
 * Reference / "info" metadata used to render the listing wizard and category
 * pickers. These change rarely, so they are aggressively cached on the client
 * (see the TanStack Query hooks). All public.
 */

/** GET /listings/form-options — everything needed to render the listing form. */
export async function fetchFormOptions(): Promise<FormOptions> {
  return formOptionsSchema.parse(
    await apiFetch("/listings/form-options", { skipAuth: true })
  );
}

/** GET /listing-flow — wizard steps + enum/amenity/included groups. */
export async function fetchListingFlow(): Promise<ListingFlowMetadata> {
  return listingFlowMetadataSchema.parse(
    await apiFetch("/listing-flow", { skipAuth: true })
  );
}

/** GET /property-categories — categories, land purposes, suitable-use tags. */
export async function fetchPropertyCategories(): Promise<PropertyCategories> {
  return propertyCategoriesSchema.parse(
    await apiFetch("/property-categories", { skipAuth: true })
  );
}
