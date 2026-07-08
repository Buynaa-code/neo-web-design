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
} from "@/infrastructure/api/listings";
import { uploadMedia, deleteMedia } from "@/infrastructure/api/media";

/**
 * Video contract for listings — mirrors tests/api/listing-photos.e2e.test.ts
 * but for the "Бичлэг" (video) media category the wizard already uploads
 * through (list-property-wizard.tsx: PHOTO_CATEGORY_API["Бичлэг"] = "video",
 * PHOTO_IDS_FIELD.video = "video_ids"). Nothing in the UI plays the result
 * back yet — this test exists to confirm the upload+link+readback round trip
 * actually works server-side before wiring a `<video>` player on top of it.
 *
 * GUARDED behind NEOMAP_E2E=1 — registers a throwaway user and WRITES a real
 * listing + media file, deleting both in afterAll.
 */
const ENABLED = process.env.NEOMAP_E2E === "1";
const PASSWORD = "Password123!";
const email = `video_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.invalid`;

// Minimal MP4 container: just an `ftyp` box (isom brand). Real players won't
// play it (no moov/mdat), but it's enough for MIME-sniffing/extension-based
// upload validation — the same "smallest valid file" approach the photos
// test uses for its 1x1 PNG.
const MP4_FTYP_BOX = Uint8Array.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // size=24, "ftyp"
  0x69, 0x73, 0x6f, 0x6d, // major_brand "isom"
  0x00, 0x00, 0x02, 0x00, // minor_version
  0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, // compatible_brands
]);

const addr = {
  provinceId: 0, districtId: 0, khorooId: 0,
  district: "", khoroo: "",
};

const createdIds: number[] = [];
const createdMediaIds: number[] = [];

function payload(extra: Record<string, unknown>): Record<string, unknown> {
  return {
    transaction_type: "sale", property_category: "apartment",
    property_subtype: "standard_apartment", mode: "sale",
    // `province_id` intentionally omitted — the live server 500s on it
    // (SQLSTATE 42S22, missing column on `listings`); see list-property-wizard.tsx.
    district_id: addr.districtId || undefined, khoroo_id: addr.khorooId || undefined,
    district: addr.district || "Сүхбаатар", khoroo: addr.khoroo || "1-р хороо",
    khotkhon: "Video Contract Residence", floor: "5", selected_floor: "5",
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

/** Pull the video group out of a listing's grouped `photos` field, if present. */
function videoGroup(photos: unknown): string[] {
  if (!photos || typeof photos !== "object" || Array.isArray(photos)) return [];
  const group = (photos as Record<string, unknown>).video;
  return Array.isArray(group) ? group.filter((v): v is string => typeof v === "string") : [];
}

describe.skipIf(!ENABLED)("listing video contract (live, WRITES to server)", () => {
  beforeAll(async () => {
    await register({ name: "Video Test", email, password: PASSWORD, password_confirmation: PASSWORD });
    const [p] = await listProvinces();
    if (p) {
      addr.provinceId = Number(p.id) || 0;
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

  it("uploads a video/mp4 file via /media with category=video", async () => {
    const [uploaded] = await uploadMedia({
      files: [new File([MP4_FTYP_BOX], "walkthrough.mp4", { type: "video/mp4" })],
      category: "video",
    });
    createdMediaIds.push(uploaded.id);

    expect(uploaded.id).toBeGreaterThan(0);
    expect(uploaded.category).toBe("video");
    expect(typeof uploaded.url).toBe("string");
  });

  it("video_ids alone does NOT populate photos.video (known backend gap, see list-property-wizard.tsx:323-324)", async () => {
    const [uploaded] = await uploadMedia({
      files: [new File([MP4_FTYP_BOX], "walkthrough.mp4", { type: "video/mp4" })],
      category: "video",
    });
    createdMediaIds.push(uploaded.id);

    const created = await createListing(payload({ video_ids: [uploaded.id] }));
    createdIds.push(created.id);

    const got = await getListing(created.id);
    // The wizard already knows this and always sends the grouped `photos` URL
    // payload alongside the id fields (buildMediaPayload) — this test just
    // documents that the id-only path is a no-op, so nobody "fixes" the
    // wizard to drop the URL fallback under the assumption ids are enough.
    expect(videoGroup(got.photos)).toEqual([]);
  });

  it("uploads a video and links it the way the wizard actually does — media id + url in photos.video together", async () => {
    const [uploaded] = await uploadMedia({
      files: [new File([MP4_FTYP_BOX], "walkthrough.mp4", { type: "video/mp4" })],
      category: "video",
    });
    createdMediaIds.push(uploaded.id);

    const created = await createListing(payload({
      video_ids: [uploaded.id],
      photos: { video: [uploaded.url] },
    }));
    createdIds.push(created.id);

    const got = await getListing(created.id);
    const urls = videoGroup(got.photos);
    expect(urls).toContain(uploaded.url);
  });

  it("also accepts a direct video URL via photos.video (no media upload)", async () => {
    const clipUrl = "https://example.invalid/clips/neomap-contract.mp4";
    const created = await createListing(payload({ photos: { video: [clipUrl] } }));
    createdIds.push(created.id);

    const got = await getListing(created.id);
    const urls = videoGroup(got.photos);
    expect(urls).toContain(clipUrl);
  });
});
