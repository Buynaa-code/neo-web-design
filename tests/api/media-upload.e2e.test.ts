import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { register } from "@/infrastructure/api/auth";
import { uploadMedia, listMedia, deleteMedia } from "@/infrastructure/api/media";
import { ApiError } from "@/infrastructure/api/http";

/**
 * Media upload contract (`/media`) — added to the backend spec 2026-06-26
 * (docs/document.json: POST/GET /media, DELETE /media/{id}, StoreMediaRequest,
 * MediaResource, and the `*_image_ids[]` listing-link fields).
 *
 * MediaPolicy bug was fixed on 2026-06-29 — policy now accepts App\Models\Customer.
 * Happy-path tests run by default; set NEOMAP_MEDIA_FIXED=0 to skip them.
 *
 * GUARDED behind NEOMAP_E2E=1 — registers a throwaway user and WRITES.
 */
const ENABLED = process.env.NEOMAP_E2E === "1";
const EXPECT_POLICY_FIXED = process.env.NEOMAP_MEDIA_FIXED !== "0";
const PASSWORD = "Password123!";
const email = `media_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.invalid`;

/** A tiny valid 1x1 PNG as a File, for multipart upload. */
function pngFile(name = "px.png"): File {
  const bytes = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    ),
    (c) => c.charCodeAt(0)
  );
  return new File([bytes], name, { type: "image/png" });
}

const createdMediaIds: number[] = [];

describe.skipIf(!ENABLED)("media upload contract (live, WRITES to server)", () => {
  beforeAll(async () => {
    await register({
      name: "Media Test",
      email,
      password: PASSWORD,
      password_confirmation: PASSWORD,
    });
  });

  afterAll(async () => {
    for (const id of createdMediaIds) await deleteMedia(id).catch(() => {});
  });

  it.skipIf(EXPECT_POLICY_FIXED)(
    "currently 500s — MediaPolicy type-hints User, not Customer",
    async () => {
      const err = await uploadMedia({
        files: [pngFile()],
        category: "interior",
      }).then(
        () => null,
        (e) => e
      );
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(500);
      expect(JSON.stringify((err as ApiError).body)).toContain("MediaPolicy");
    }
  );

  it.skipIf(!EXPECT_POLICY_FIXED)(
    "uploads a file and returns a MediaResource with id + url",
    async () => {
      const media = await uploadMedia({
        files: [pngFile()],
        category: "interior",
      });
      expect(media).toHaveLength(1);
      expect(typeof media[0].id).toBe("number");
      expect(media[0].url).toMatch(/^https?:\/\//);
      createdMediaIds.push(media[0].id);
    }
  );

  it.skipIf(!EXPECT_POLICY_FIXED)("lists the user's uploaded media", async () => {
    const { items } = await listMedia({ perPage: 50 });
    expect(Array.isArray(items)).toBe(true);
    if (createdMediaIds.length) {
      expect(items.some((m) => createdMediaIds.includes(m.id))).toBe(true);
    }
  });
});
