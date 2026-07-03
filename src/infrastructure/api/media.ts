import {
  mediaPaginatedSchema,
  mediaUploadEnvelopeSchema,
  type MediaResource,
  type PaginatorMeta,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/**
 * Media upload API (`/media`). Files are uploaded first, then their returned
 * ids are linked to a listing via the `*_image_ids[]` / `cover_image_id`
 * fields on create/update/draft.
 *
 * The `category` values mirror the listing `photos` groups, plus the document
 * categories (brochure/document/certificate) the backend accepts for PDFs.
 */
export type MediaCategory =
  | "cover"
  | "exterior"
  | "interior"
  | "view_from_inside"
  | "plan"
  | "master_plan"
  | "amenity"
  | "other"
  | "video"
  | "brochure"
  | "document"
  | "certificate";

/** Document/PDF categories — uploaded via file picker, not the photo grid. */
export const DOCUMENT_CATEGORIES = [
  "brochure",
  "document",
  "certificate",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface UploadMediaParams {
  files: File[];
  category?: MediaCategory;
  /** Pre-link to a specific draft listing (optional). */
  listingId?: number;
}

/**
 * POST /media — upload one or more image/video files (multipart/form-data).
 * Returns the created `MediaResource` records (each with `id` + `url`).
 *
 * Limits (server-enforced): images jpeg/png/webp ≤ 8 MB, video mp4/webm ≤ 100 MB,
 * max 20 files per request.
 */
export async function uploadMedia(
  params: UploadMediaParams
): Promise<MediaResource[]> {
  const form = new FormData();
  for (const file of params.files) form.append("files[]", file);
  if (params.category) form.append("category", params.category);
  if (params.listingId != null) form.append("listing_id", String(params.listingId));

  return mediaUploadEnvelopeSchema.parse(
    await apiFetch("/media", { method: "POST", body: form })
  ).data;
}

export interface ListMediaParams {
  listingId?: number;
  category?: MediaCategory;
  perPage?: number;
  page?: number;
}

export interface PaginatedMedia {
  items: MediaResource[];
  meta: PaginatorMeta;
}

/** GET /media — the authenticated user's uploaded media (paginated). */
export async function listMedia(
  params: ListMediaParams = {}
): Promise<PaginatedMedia> {
  const res = mediaPaginatedSchema.parse(
    await apiFetch("/media", {
      query: {
        listing_id: params.listingId,
        category: params.category,
        per_page: params.perPage,
        page: params.page,
      },
    })
  );
  return { items: res.data, meta: res.meta };
}

/** DELETE /media/{id} — owner-only; also removes the stored file. */
export async function deleteMedia(id: number): Promise<void> {
  await apiFetch(`/media/${id}`, { method: "DELETE" });
}
