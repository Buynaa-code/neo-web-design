import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { register } from "@/infrastructure/api/auth";
import {
  listProvinces,
  listDistricts,
  listKhoroos,
} from "@/infrastructure/api/address";
import { optionName } from "@/domain/schemas/api";
import {
  createListing,
  deleteListing,
  getListing,
  updateListing,
} from "@/infrastructure/api/listings";
import { uploadMedia, deleteMedia } from "@/infrastructure/api/media";

/**
 * Image contract for listings (2026-06-26 — backend now persists photos).
 *
 * Verifies the REAL upload mechanism discovered against the live server:
 *  - `photos` is a GROUPED object keyed by category ({ cover, interior, ... }),
 *    each value an array of strings. A flat array is silently dropped.
 *  - Absolute http(s) URLs are stored verbatim; relative strings are treated as
 *    storage paths and prefixed with `{APP_URL}/storage/`.
 *  - `photo_seeds` (placeholder identifiers) and `cover_image_id` round-trip.
 *
 * GUARDED behind NEOMAP_E2E=1 — registers a throwaway user and WRITES real
 * listings, deleting each one in afterAll.
 */
const ENABLED = process.env.NEOMAP_E2E === "1";
const PASSWORD = "Password123!";
const email = `photos_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.invalid`;

const ABS_URL = "https://picsum.photos/seed/neomap-contract/800/600";
const REL_PATH = "listings/neomap-contract.jpg";

const addr = {
  provinceId: 0, districtId: 0, khorooId: 0,
  city: "", district: "", khoroo: "",
};

const createdIds: number[] = [];
const createdMediaIds: number[] = [];

function payload(extra: Record<string, unknown>): Record<string, unknown> {
  return {
    transaction_type: "sale", property_category: "apartment",
    property_subtype: "standard_apartment", mode: "sale",
    province_id: addr.provinceId || undefined,
    district_id: addr.districtId || undefined, khoroo_id: addr.khorooId || undefined,
    district: addr.district || "Сүхбаатар", khoroo: addr.khoroo || "1-р хороо",
    khotkhon: "Photo Contract Residence", floor: "5", selected_floor: "5",
    floor_type: "middle", main_floor_count: 12, total_floor_count: 12,
    rooms: 3, area: 78.5, total_area_m2: 78.5, year: 2020,
    price: 350_000_000, total_price: 350_000_000, deposit: 0,
    usage_condition: "used", certificate_status: "certificate_ready",
    commissioned_status: "commissioned", current_availability_status: "vacant",
    collateral_status: "no_collateral", relationship_to_property: "owner",
    confirms_information_is_true: true, confirms_authorized_to_publish: true,
    accepts_terms: true, amenities: [], included_items: [], features: [],
    ...extra,
  };
}

/** Narrow ListingResource.photos to its grouped-object shape. */
function asGroups(photos: unknown): Record<string, string[]> {
  expect(photos && typeof photos === "object" && !Array.isArray(photos)).toBe(true);
  return photos as Record<string, string[]>;
}

describe.skipIf(!ENABLED)("listing photos contract (live, WRITES to server)", () => {
  beforeAll(async () => {
    await register({ name: "Photo Test", email, password: PASSWORD, password_confirmation: PASSWORD });
    const [p] = await listProvinces();
    if (p) {
      addr.provinceId = Number(p.id) || 0; addr.city = optionName(p);
      const [d] = await listDistricts(p.id);
      if (d) {
        addr.districtId = Number(d.id) || 0; addr.district = optionName(d);
        const [k] = await listKhoroos(d.id);
        if (k) { addr.khorooId = Number(k.id) || 0; addr.khoroo = optionName(k); }
      }
    }
  });

  afterAll(async () => {
    for (const id of createdIds) await deleteListing(id).catch(() => {});
    for (const id of createdMediaIds) await deleteMedia(id).catch(() => {});
  });

  it("stores grouped photos and preserves arbitrary category keys", async () => {
    const created = await createListing(payload({
      photos: { cover: [ABS_URL], interior: [ABS_URL, ABS_URL] },
    }));
    createdIds.push(created.id);
    const groups = asGroups((await getListing(created.id)).photos);
    expect(groups.cover).toEqual([ABS_URL]);
    expect(groups.interior).toHaveLength(2);
  });

  it("keeps absolute URLs verbatim but prefixes relative paths with /storage/", async () => {
    const created = await createListing(payload({
      photos: { cover: [ABS_URL], plan: [REL_PATH] },
    }));
    createdIds.push(created.id);
    const groups = asGroups((await getListing(created.id)).photos);
    expect(groups.cover[0]).toBe(ABS_URL);
    expect(groups.plan[0]).toMatch(/\/storage\/.+neomap-contract\.jpg$/);
  });

  it("drops a flat photos array (must be a grouped object)", async () => {
    const created = await createListing(payload({ photos: [ABS_URL, ABS_URL] }));
    createdIds.push(created.id);
    const photos = (await getListing(created.id)).photos;
    // Flat input is not persisted — server returns an empty array or null.
    const count = Array.isArray(photos)
      ? photos.length
      : Object.values(photos ?? {}).reduce<number>(
          (n, g) => n + (Array.isArray(g) ? g.length : 0),
          0
        );
    expect(count).toBe(0);
  });

  it("round-trips photo_seeds and cover_image_id, and lets update replace photos", async () => {
    // Upload a real media file to get a valid cover_image_id (backend now validates exists:media,id).
    const bytes = Uint8Array.from(
      atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
      (c) => c.charCodeAt(0)
    );
    const [uploadedMedia] = await uploadMedia({
      files: [new File([bytes], "cover.png", { type: "image/png" })],
      category: "cover",
    });
    createdMediaIds.push(uploadedMedia.id);

    const created = await createListing(payload({
      photo_seeds: ["seed-a", "seed-b"],
      cover_image_id: uploadedMedia.id,
      cover_image_ids: [uploadedMedia.id],
      photos: { cover: [ABS_URL] },
    }));
    createdIds.push(created.id);
    const got = await getListing(created.id);
    expect(got.photoSeeds).toEqual(["seed-a", "seed-b"]);
    expect(got.coverImageId).toBe(uploadedMedia.id);

    const updated = await updateListing(created.id, {
      photos: { interior: [ABS_URL] },
    });
    const groups = asGroups(updated.photos);
    expect(groups.interior).toEqual([ABS_URL]);
  });
});
