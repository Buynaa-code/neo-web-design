import type { Listing, ListingCreateInput } from "@/domain/schemas/listing";
import { listingSchema } from "@/domain/schemas/listing";
import type { ListingDraftSubmission } from "@/domain/schemas/listing-draft";
import { LISTINGS } from "@/infrastructure/data/listings";
import { getPropertyKind } from "@/application/filters";
import { apiFetch } from "./http";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

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

export async function listListings(
  params: ListListingsParams = {}
): Promise<ListListingsResponse> {
  if (USE_MOCK) return listListingsMock(params);
  return apiFetch<ListListingsResponse>("/listings", {
    query: {
      mode: params.mode,
      district: params.district,
      rooms: params.rooms?.length ? params.rooms.join(",") : undefined,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function getListing(id: number): Promise<Listing> {
  if (USE_MOCK) {
    const found = getMockStore().find((l) => l.id === id);
    if (!found) throw new Error(`Listing ${id} not found`);
    return found;
  }
  const data = await apiFetch<unknown>(`/listings/${id}`);
  return listingSchema.parse(data);
}

export async function createListing(
  input: ListingCreateInput
): Promise<Listing> {
  if (USE_MOCK) {
    const store = getMockStore();
    const nextId = store.reduce((m, l) => Math.max(m, l.id), 0) + 1;
    const created = listingSchema.parse({
      ...input,
      id: nextId,
      photos: input.photoSeeds?.length ?? 0,
      listedDays: 0,
      viewCount: 0,
      viewingCount: 0,
    });
    store.unshift(created);
    return created;
  }
  const data = await apiFetch<unknown>("/listings", {
    method: "POST",
    body: input,
  });
  return listingSchema.parse(data);
}

export async function submitListingDraft(
  payload: ListingDraftSubmission
): Promise<ListingDraftSubmission> {
  if (USE_MOCK) {
    console.info("[mock] submitListingDraft", payload);
    return payload;
  }
  return apiFetch<ListingDraftSubmission>("/listing-drafts", {
    method: "POST",
    body: payload,
  });
}

let mockStore: Listing[] | null = null;
function getMockStore(): Listing[] {
  if (!mockStore) mockStore = [...LISTINGS];
  return mockStore;
}

function listListingsMock(params: ListListingsParams): ListListingsResponse {
  let items = getMockStore();
  if (params.mode) {
    items = items.filter((l) => l.mode === params.mode);
    if (params.mode === "sale") items = items.filter((l) => getPropertyKind(l) === "apartment");
  }
  if (params.district) items = items.filter((l) => l.district === params.district);
  if (params.rooms?.length) {
    const rooms = params.rooms;
    items = items.filter((l) => rooms.includes(l.rooms));
  }
  if (params.priceMin != null) {
    const min = params.priceMin;
    items = items.filter((l) => l.price >= min);
  }
  if (params.priceMax != null) {
    const max = params.priceMax;
    items = items.filter((l) => l.price <= max);
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
