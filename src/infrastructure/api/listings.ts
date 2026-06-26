import type { Listing, ListingStatus } from "@/domain/types";
import type { ListingDraftSubmission } from "@/domain/schemas/listing-draft";
import {
  listingEnvelopeSchema,
  listingPaginatedSchema,
  type ListingResource,
  type PaginatorMeta,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/* -------------------------------------------------------------------------- */
/* Public listing browsing                                                    */
/* -------------------------------------------------------------------------- */

export interface ListListingsParams {
  mode?: "rent" | "sale";
  district?: string;
  rooms?: number;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  q?: string;
  perPage?: number;
  page?: number;
}

export interface PaginatedListings {
  items: ListingResource[];
  meta: PaginatorMeta;
}

function toQuery(params: ListListingsParams): Record<string, string | number | undefined> {
  return {
    mode: params.mode,
    district: params.district,
    rooms: params.rooms,
    status: params.status,
    price_min: params.priceMin,
    price_max: params.priceMax,
    area_min: params.areaMin,
    area_max: params.areaMax,
    q: params.q,
    per_page: params.perPage,
    page: params.page,
  };
}

/** GET /listings — public, filtered, paginated. */
export async function listListings(
  params: ListListingsParams = {}
): Promise<PaginatedListings> {
  const res = listingPaginatedSchema.parse(
    await apiFetch("/listings", { query: toQuery(params), skipAuth: true })
  );
  return { items: res.data, meta: res.meta };
}

/** GET /listings/{id} — public detail. */
export async function getListing(id: number): Promise<ListingResource> {
  const res = listingEnvelopeSchema.parse(
    await apiFetch(`/listings/${id}`, { skipAuth: true })
  );
  return res.data;
}

/** GET /my/listings — the authenticated user's own listings. */
export async function listMyListings(
  params: Pick<ListListingsParams, "mode" | "status" | "perPage" | "page"> = {}
): Promise<PaginatedListings> {
  const res = listingPaginatedSchema.parse(
    await apiFetch("/my/listings", { query: toQuery(params) })
  );
  return { items: res.data, meta: res.meta };
}

/* -------------------------------------------------------------------------- */
/* Listing creation / editing (authenticated)                                 */
/* -------------------------------------------------------------------------- */

/** POST /listings */
export async function createListing(
  body: Record<string, unknown>
): Promise<ListingResource> {
  return listingEnvelopeSchema.parse(
    await apiFetch("/listings", { method: "POST", body })
  ).data;
}

/** PUT /listings/{id} */
export async function updateListing(
  id: number,
  body: Record<string, unknown>
): Promise<ListingResource> {
  return listingEnvelopeSchema.parse(
    await apiFetch(`/listings/${id}`, { method: "PUT", body })
  ).data;
}

/** DELETE /listings/{id} */
export async function deleteListing(id: number): Promise<void> {
  await apiFetch(`/listings/${id}`, { method: "DELETE" });
}

/** PATCH /listings/{id}/draft — partial wizard-step save. */
export async function saveListingDraft(
  id: number,
  body: Record<string, unknown>
): Promise<ListingResource> {
  return listingEnvelopeSchema.parse(
    await apiFetch(`/listings/${id}/draft`, { method: "PATCH", body })
  ).data;
}

/** POST /listings/{id}/submit — finalise a draft for moderation. */
export async function submitListing(
  id: number,
  body: Record<string, unknown>
): Promise<ListingResource> {
  const res = (await apiFetch(`/listings/${id}/submit`, {
    method: "POST",
    body,
  })) as { listing: unknown };
  return listingEnvelopeSchema.parse({ data: res.listing }).data;
}

/** POST /listings/register — multi-step wizard endpoint (step 1..5). */
export async function registerListingStep(
  body: Record<string, unknown>
): Promise<{ listing_id: string | number; step: number }> {
  return apiFetch("/listings/register", { method: "POST", body });
}

/**
 * @deprecated Legacy wizard entry point. The real backend has no
 * `/listing-drafts`; the multi-step flow uses `/listings/register` and
 * `/listings/{id}/draft` + `/listings/{id}/submit`. Kept so the existing
 * wizard keeps compiling until it is migrated (Stage 5). Posts the collected
 * payload to the register endpoint as a single best-effort step.
 */
export async function submitListingDraft(
  payload: ListingDraftSubmission
): Promise<{ listing_id: string | number; step: number }> {
  return registerListingStep(payload as unknown as Record<string, unknown>);
}

/* -------------------------------------------------------------------------- */
/* Adapter: ListingResource (wire) -> Listing (UI)                            */
/* -------------------------------------------------------------------------- */

const UI_STATUSES: ReadonlySet<ListingStatus> = new Set([
  "new",
  "active",
  "hot",
  "drop",
  "reserved",
  "sold",
]);

function toUiStatus(status: string): ListingStatus {
  return UI_STATUSES.has(status as ListingStatus)
    ? (status as ListingStatus)
    : "active";
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Photos can be a flat array or a grouped object ({ cover, plan, ... }). */
function countPhotos(photos: ListingResource["photos"], seeds: unknown[]): number {
  if (Array.isArray(photos)) return photos.length;
  if (photos && typeof photos === "object") {
    return Object.values(photos).reduce<number>(
      (sum, group) => sum + (Array.isArray(group) ? group.length : 0),
      0
    );
  }
  return seeds.length;
}

/** Order of photo groups for display — cover first, video last. */
const PHOTO_GROUP_ORDER = [
  "cover",
  "exterior",
  "interior",
  "view_from_inside",
  "plan",
  "master_plan",
  "amenity",
  "other",
  "video",
];

/**
 * Flatten the grouped `photos` object into an ordered list of real URLs
 * (cover group first). A flat array is returned as-is; anything else yields [].
 */
function flattenPhotoUrls(photos: ListingResource["photos"]): string[] {
  if (Array.isArray(photos)) {
    return photos.filter((p): p is string => typeof p === "string");
  }
  if (!photos || typeof photos !== "object") return [];
  const groups = photos as Record<string, unknown>;
  const keys = Object.keys(groups)
    .filter((k) => k !== "video") // video group holds a clip URL, not a photo
    .sort((a, b) => {
      const ia = PHOTO_GROUP_ORDER.indexOf(a);
      const ib = PHOTO_GROUP_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  const urls: string[] = [];
  for (const key of keys) {
    const group = groups[key];
    if (Array.isArray(group)) {
      for (const u of group) if (typeof u === "string" && u) urls.push(u);
    }
  }
  return urls;
}

/**
 * Maps the rich API `ListingResource` down to the simple `Listing` shape the
 * existing UI consumes, filling safe defaults for nullable fields. This lets us
 * swap mock data for real data without touching presentation components.
 */
export function toListing(r: ListingResource): Listing {
  const priceHistory = Array.isArray(r.priceHistory)
    ? r.priceHistory
        .filter(
          (p): p is { d: string; p: number } =>
            !!p &&
            typeof p === "object" &&
            typeof (p as { d?: unknown }).d === "string" &&
            typeof (p as { p?: unknown }).p === "number"
        )
        .map((p) => ({ d: p.d, p: p.p }))
    : undefined;

  return {
    id: r.id,
    mode: r.mode === "rent" ? "rent" : "sale",
    district: r.district ?? r.khotkhon ?? r.khoroo ?? "—",
    khoroo: r.khoroo ?? "",
    khotkhon: r.khotkhon ?? "",
    rooms: r.rooms ?? 0,
    area: r.area ?? 0,
    floor: r.floor ?? "",
    year: r.year ?? 0,
    price: r.price,
    photos: countPhotos(r.photos, r.photoSeeds),
    status: toUiStatus(r.status),
    listedDays: r.listedDays,
    viewCount: r.viewCount,
    viewingCount: r.viewingCount,
    features: toStringArray(r.features),
    agentId: r.agentId ?? 0,
    lat: r.lat ?? 0,
    lng: r.lng ?? 0,
    desc: r.desc ?? undefined,
    priceHistory: priceHistory?.length ? priceHistory : undefined,
    photoSeeds: r.photoSeeds.filter(
      (s): s is string | number => typeof s === "string" || typeof s === "number"
    ),
    photoUrls: flattenPhotoUrls(r.photos),
  };
}
