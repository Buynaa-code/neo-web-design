import type { Listing, ListingCreateInput } from "@/domain/schemas/listing";
import { listingSchema } from "@/domain/schemas/listing";
import type { ListingDraftSubmission } from "@/domain/schemas/listing-draft";

const API_BASE = "/api/listings";
const DRAFTS_BASE = "/api/listing-drafts";

export interface ListListingsParams {
  mode?: "sale" | "rent";
  district?: string;
  rooms?: number[];
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
}

export interface ListListingsResponse {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

function buildQuery(params: ListListingsParams): string {
  const search = new URLSearchParams();
  if (params.mode) search.set("mode", params.mode);
  if (params.district) search.set("district", params.district);
  if (params.rooms?.length) search.set("rooms", params.rooms.join(","));
  if (params.priceMin != null) search.set("priceMin", String(params.priceMin));
  if (params.priceMax != null) search.set("priceMax", String(params.priceMax));
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listListings(
  params: ListListingsParams = {},
  init?: RequestInit
): Promise<ListListingsResponse> {
  const res = await fetch(`${API_BASE}${buildQuery(params)}`, init);
  if (!res.ok) throw new Error(`listListings failed: ${res.status}`);
  return (await res.json()) as ListListingsResponse;
}

export async function getListing(
  id: number,
  init?: RequestInit
): Promise<Listing> {
  const res = await fetch(`${API_BASE}/${id}`, init);
  if (!res.ok) throw new Error(`getListing failed: ${res.status}`);
  const data = await res.json();
  return listingSchema.parse(data);
}

export async function createListing(
  input: ListingCreateInput
): Promise<Listing> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`createListing failed: ${res.status} ${detail}`);
  }
  const data = await res.json();
  return listingSchema.parse(data);
}

export async function submitListingDraft(
  payload: ListingDraftSubmission
): Promise<ListingDraftSubmission> {
  const res = await fetch(DRAFTS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`submitListingDraft failed: ${res.status} ${detail}`);
  }
  return (await res.json()) as ListingDraftSubmission;
}
