import { describe, expect, it } from "vitest";
import {
  buildCreateRequest,
  createDefaultDraft,
  draftFromListing,
} from "@/components/list-property-wizard";
import {
  mapEnum,
  CERT_KEY,
  INTERIOR_KEY,
  COLLATERAL_KEY,
  CURRENT_KEY,
} from "@/components/list-property-wizard-enums";
import type { ListingResource } from "@/domain/schemas/api";

/**
 * Live `GET /listing-flow` enum_options (core.neomap.mn), captured 2026-07-22.
 * A wizard label that maps to a key NOT in this list will 422 with
 * "selected <field> is invalid" — that's the exact bug reported by the user.
 */
const LIVE_ENUM_OPTIONS = {
  certificate_status: {
    certificate_ready: "Бэлэн гэрчилгээтэй",
    unfinished_building_certificate: "Дуусаагүй барилгын гэрчилгээтэй",
    certificate_pending_ready: "Гэрчилгээгүй - гэрчилгээ гарахад бэлэн",
    under_construction_contract: "Гэрчилгээгүй - баригдаж байгаа, захиалгын гэрээтэй",
    other: "Бусад",
  },
  interior_condition: {
    renovated_within_1_year: "Сүүлийн 1 жилийн хугацаанд засал хийсэн",
    renovated_1_to_3_years: "1-3 жилийн өмнө засал хийсэн",
    old_or_original_finish: "3-с дээш жилийн өмнө засал хийсэн / анхны заслаараа байгаа",
    unfinished_buyer_finishes: "Засваргүй, гэрээлэгч өөрөө засал хийнэ",
    other: "Бусад",
  },
  collateral_status: {
    no_collateral: "Ямар нэг барьцаанд байхгүй",
    financial_institution_collateral: "Банк, ББСБ, санхүүгийн байгууллагын зээлийн барьцаанд байгаа",
    third_party_collateral: "Гуравдагч этгээдийн барьцаанд байгаа",
  },
  current_availability_status: {
    has_lease_contract: "Түрээсийн эсхүл хөлслүүлэх гэрээтэй байгаа",
    occupied_or_in_use: "Амьдарч, ашиглаж байгаа",
    vacant: "Сул, чөлөөтэй байгаа",
    other: "Бусад",
  },
};

function keysOf(field: keyof typeof LIVE_ENUM_OPTIONS): Set<string> {
  return new Set(Object.keys(LIVE_ENUM_OPTIONS[field]));
}

describe("state enum label -> API key maps", () => {
  it("every certOptions label maps to a key the live server accepts", () => {
    const valid = keysOf("certificate_status");
    for (const [label, key] of Object.entries(CERT_KEY)) {
      expect(valid.has(key), `"${label}" -> "${key}"`).toBe(true);
    }
  });

  it("every interiorOptions label maps to a key the live server accepts", () => {
    const valid = keysOf("interior_condition");
    for (const [label, key] of Object.entries(INTERIOR_KEY)) {
      expect(valid.has(key), `"${label}" -> "${key}"`).toBe(true);
    }
  });

  it("every collateralOptions label maps to a key the live server accepts", () => {
    const valid = keysOf("collateral_status");
    for (const [label, key] of Object.entries(COLLATERAL_KEY)) {
      expect(valid.has(key), `"${label}" -> "${key}"`).toBe(true);
    }
  });

  it("every currentOptions label maps to a key the live server accepts", () => {
    const valid = keysOf("current_availability_status");
    for (const [label, key] of Object.entries(CURRENT_KEY)) {
      expect(valid.has(key), `"${label}" -> "${key}"`).toBe(true);
    }
  });
});

describe("mapEnum", () => {
  it("never returns a value absent from the live enum_options for that field", () => {
    const enumOptions = LIVE_ENUM_OPTIONS;
    const cases: Array<[string, string, Record<string, string>]> = [
      ["certificate_status", "Бусад", CERT_KEY],
      ["certificate_status", "Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй", CERT_KEY],
      ["interior_condition", "Бусад: Дотор засвар хийгдэж байгаа, хийгдэнэ", INTERIOR_KEY],
      ["interior_condition", "Засваргүй, Гэрээлэгч өөрөө засал хийнэ", INTERIOR_KEY],
    ];
    for (const [field, label, map] of cases) {
      const result = mapEnum(field, label, map, enumOptions);
      const valid = keysOf(field as keyof typeof LIVE_ENUM_OPTIONS);
      expect(result === undefined || valid.has(result), `${field}: "${label}" -> ${result}`).toBe(true);
    }
  });

  it('collateral_status "Бусад" (no backend "other" value) is omitted rather than sent as garbage', () => {
    const result = mapEnum("collateral_status", "Бусад", COLLATERAL_KEY, LIVE_ENUM_OPTIONS);
    expect(result).toBeUndefined();
  });

  it("an unrecognised label with no live enum_options loaded still falls through as-is (best-effort)", () => {
    const result = mapEnum("collateral_status", "Бусад", COLLATERAL_KEY, undefined);
    expect(result).toBe("Бусад");
  });
});

describe("buildCreateRequest — collateral status regression (selected collateral status is invalid)", () => {
  it("omits collateral_status and sends the free-text note when the user picks 'Бусад'", () => {
    const draft = createDefaultDraft();
    draft.state.collateral = "Бусад";
    draft.state.collateralNote = "Шүүхийн маргаантай";

    const body = buildCreateRequest(draft, undefined, LIVE_ENUM_OPTIONS);

    expect(body.collateral_status).toBeUndefined();
    expect(body.collateral_description).toBe("Шүүхийн маргаантай");
  });

  it("sends a valid key for a mapped collateral status", () => {
    const draft = createDefaultDraft();
    draft.state.collateral = "Гуравдагч этгээдийн барьцаанд байгаа";

    const body = buildCreateRequest(draft, undefined, LIVE_ENUM_OPTIONS);

    expect(body.collateral_status).toBe("third_party_collateral");
  });

  it("sends the currently-correct under_construction_contract key, not the stale under_construction one", () => {
    const draft = createDefaultDraft();
    draft.state.certStatus = "Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй";

    const body = buildCreateRequest(draft, undefined, LIVE_ENUM_OPTIONS);

    expect(body.certificate_status).toBe("under_construction_contract");
  });
});

describe("buildCreateRequest — location (lat/lng) persistence", () => {
  it("sends normalised 0..1 lat/lng once the user places a map pin", () => {
    const draft = createDefaultDraft();
    draft.lat = 47.9077;
    draft.lng = 106.8832;
    draft.locationTouched = true;

    const body = buildCreateRequest(draft, undefined, undefined);

    expect(typeof body.lat).toBe("number");
    expect(typeof body.lng).toBe("number");
    expect(body.lat as number).toBeGreaterThanOrEqual(0);
    expect(body.lat as number).toBeLessThanOrEqual(1);
    expect(body.lng as number).toBeGreaterThanOrEqual(0);
    expect(body.lng as number).toBeLessThanOrEqual(1);
  });

  it("omits lat/lng entirely when the user never touched the map pin", () => {
    const draft = createDefaultDraft();
    draft.locationTouched = false;

    const body = buildCreateRequest(draft, undefined, undefined);

    expect(body.lat).toBeUndefined();
    expect(body.lng).toBeUndefined();
  });

  it("round-trips a saved pin back through draftFromListing to real WGS84", () => {
    const draft = createDefaultDraft();
    draft.lat = 47.918;
    draft.lng = 106.92;
    draft.locationTouched = true;
    const sent = buildCreateRequest(draft, undefined, undefined);

    const resource = {
      id: 1,
      lat: sent.lat,
      lng: sent.lng,
      district: "Сүхбаатар",
    } as unknown as ListingResource;

    const back = draftFromListing(resource, undefined);
    expect(back.locationTouched).toBe(true);
    expect(back.lat).toBeCloseTo(47.918, 2);
    expect(back.lng).toBeCloseTo(106.92, 2);
  });

  it("treats a listing with no saved pin (lat/lng null) as not location-touched, not as (0,0)", () => {
    const resource = {
      id: 2,
      lat: null,
      lng: null,
      district: "Хан-Уул",
    } as unknown as ListingResource;

    const back = draftFromListing(resource, undefined);
    expect(back.locationTouched).toBe(false);
  });
});
