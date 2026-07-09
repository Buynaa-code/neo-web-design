"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Accessibility,
  Armchair,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Banknote,
  Bolt,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleEllipsis,
  Compass,
  Crosshair,
  DoorOpen,
  Droplets,
  Factory,
  Flame,
  GitBranch,
  Home,
  ImageOff,
  ImageUp,
  Images,
  Loader2,
  KeyRound,
  Layers2,
  Layers3,
  Link,
  Lock,
  Map,
  MapPin,
  MapPinned,
  Maximize2,
  Megaphone,
  Minimize2,
  Minus,
  MonitorCog,
  MousePointerClick,
  MoveDownLeft,
  MoveDownRight,
  MoveUpLeft,
  MoveUpRight,
  Navigation,
  PackageCheck,
  Paperclip,
  ParkingCircle,
  Pencil,
  PlayCircle,
  PlugZap,
  Plus,
  Rocket,
  RotateCcw,
  Route,
  Ruler,
  Save,
  Scan,
  SearchCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  Signpost,
  SlidersHorizontal,
  Sparkles,
  Store,
  Target,
  ThermometerSun,
  Trash2,
  FileText,
  TreePine,
  Trees,
  Upload,
  Users,
  Video,
  WandSparkles,
  Warehouse,
  Waves,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  DISTRICTS,
  KHOTKHON,
  ROOM_TAGS_BY_TYPE,
  ROOM_TYPES,
} from "@/infrastructure/data/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitListingDraft, type TagGroup } from "@/infrastructure/api/listings";
import {
  useCreateListing,
  useUpdateListing,
  useTagSuggestions,
  useListing,
} from "@/application/queries/listings";
import {
  uploadMedia,
  DOCUMENT_CATEGORIES,
  type MediaCategory,
  type DocumentCategory,
} from "@/infrastructure/api/media";
import { ApiError } from "@/infrastructure/api/http";
import { getToken } from "@/infrastructure/api/token";
import {
  getLayerCacheDataByBbox,
  resolveCoreAddressFromNeodataIds,
  type Bbox,
} from "@/infrastructure/api/neodata";
import { resolveAddressFromLayerCacheData } from "@/domain/schemas/neodata";
import type { GeoJsonObject } from "geojson";
import type { MapPolygon } from "@/components/place-picker/PlacePickerMap";
import { useFormOptions } from "@/application/queries/metadata";
import {
  useProvinces,
  useDistricts,
  useKhoroos,
  useStreets,
  useKhoroolols,
  useKhotkhons,
  useBuildings,
} from "@/application/queries/address";
import {
  optionName,
  type AddressOption,
  type ListingResource,
} from "@/domain/schemas/api";
import { useStore } from "@/infrastructure/store";

/** Maps the wizard's PropertyKey to the API's `property_category` enum. */
const CATEGORY_API: Record<PropertyKey, string> = {
  apartment: "apartment",
  house: "private_house",
  office: "office",
  retail: "commercial_service",
  industrial: "industrial_object",
  parking: "indoor_parking",
  warehouse: "storage_unit",
  fence_house: "fenced_house_with_land",
  summer_land: "summer_house_with_land",
  summer_no_land: "summer_house_without_land",
  land: "land",
  other: "other",
};

/** Wizard photo category labels → API `photos` group keys. */
const PHOTO_CATEGORY_API: Record<string, string> = {
  "Нүүрний зураг": "cover",
  "План зураг": "plan",
  "Дотор зураг": "interior",
  "Гадна орчны зураг": "exterior",
  "Мастер төлөвлөгөө, хотхоны зураг": "master_plan",
  "Дотроос гадагшаа харагдацын зураг": "view_from_inside",
  "Хотхоны бусад үзүүлэлтийн зураг": "other",
  "Бичлэг": "video",
};

/**
 * API `photos` group key → the listing-create field that links uploaded media
 * by id. `other` has no id field, so those uploads fall back to a URL string.
 */
const PHOTO_IDS_FIELD: Record<string, string> = {
  cover: "cover_image_ids",
  plan: "floor_plan_image_ids",
  interior: "interior_image_ids",
  exterior: "exterior_image_ids",
  master_plan: "master_plan_image_ids",
  view_from_inside: "view_from_inside_image_ids",
  amenity: "complex_amenity_image_ids",
  video: "video_ids",
};

/** Server-enforced /media limits — validated client-side for a clear message. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_FILES_PER_UPLOAD = 20;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Validate brochure/document/certificate uploads (PDF/DOC, ≤25MB each). */
function validateDocumentFiles(files: File[]): string | null {
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return `Нэг удаад хамгийн ихдээ ${MAX_FILES_PER_UPLOAD} файл байршуулна`;
  }
  for (const file of files) {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return `"${file.name}" — зөвхөн PDF/DOC файл (${file.type || "тодорхойгүй"})`;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return `"${file.name}" — хэтэрхий том (дээд хэмжээ 25MB)`;
    }
  }
  return null;
}

/** Returns a Mongolian error string if any file violates the server limits, else null. */
function validateMediaFiles(files: File[]): string | null {
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return `Нэг удаад хамгийн ихдээ ${MAX_FILES_PER_UPLOAD} файл байршуулна`;
  }
  for (const file of files) {
    const isVideo = file.type.startsWith("video/");
    const allowed = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowed.includes(file.type)) {
      return `"${file.name}" — дэмжигдэхгүй файлын төрөл (${file.type || "тодорхойгүй"})`;
    }
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      return `"${file.name}" — хэтэрхий том (дээд хэмжээ ${mb}MB)`;
    }
  }
  return null;
}

/** Resolve a PhotoDraft's display URL: an explicit URL, else a seed placeholder. */
/** Backend APP_URL may be misconfigured as localhost — remap to the real origin. */
function normalizeMediaUrl(url: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  const origin = apiBase ? new URL(apiBase).origin : "";
  if (origin && url.startsWith("http://localhost/"))
    return url.replace("http://localhost/", origin + "/");
  if (origin && url.startsWith("http://localhost:"))
    return url.replace(/^http:\/\/localhost:\d+\//, origin + "/");
  return url;
}

function photoDraftUrl(photo: { seed: string; url?: string }): string {
  const url = photo.url?.trim();
  // Local object-URL / data-URL previews can't be fetched by the server — fall
  // back to a seed placeholder for the payload (they still render in the grid).
  if (url && !url.startsWith("blob:") && !url.startsWith("data:")) return normalizeMediaUrl(url);
  return `https://picsum.photos/seed/${photo.seed}/800/600`;
}

/**
 * Build the API photo payload from the wizard's media drafts:
 *  - `photos`: grouped object keyed by API category (cover photo first), each a
 *    list of URLs — the only shape the backend persists.
 *  - `photo_seeds`: every photo's placeholder seed, cover first.
 */
function buildPhotoPayload(
  photos: { seed: string; url?: string; category: string }[],
  coverIndex: number
): { photos?: Record<string, string[]>; photo_seeds?: string[] } {
  if (!photos.length) return {};
  // Reorder so the chosen cover comes first (it leads its group + the seeds).
  const ordered =
    coverIndex > 0 && coverIndex < photos.length
      ? [photos[coverIndex], ...photos.filter((_, i) => i !== coverIndex)]
      : photos;
  const grouped: Record<string, string[]> = {};
  for (const photo of ordered) {
    const key = PHOTO_CATEGORY_API[photo.category] ?? "other";
    (grouped[key] ??= []).push(photoDraftUrl(photo));
  }
  return { photos: grouped, photo_seeds: ordered.map((p) => p.seed) };
}

/**
 * Build the full media payload for a listing create/update:
 *  - Photos uploaded as real files (carry a `mediaId`) are linked by id through
 *    the `*_image_ids[]` fields + `cover_image_id` (the modern `/media` flow).
 *  - Photos added by URL / seed placeholder (no `mediaId`) fall back to the
 *    grouped `photos` string payload, which the backend also persists.
 */
function buildMediaPayload(
  photos: PhotoDraft[],
  coverIndex: number
): Record<string, unknown> {
  if (!photos.length) return {};
  const ordered =
    coverIndex > 0 && coverIndex < photos.length
      ? [photos[coverIndex], ...photos.filter((_, i) => i !== coverIndex)]
      : photos;

  const idFields: Record<string, number[]> = {};
  const urlPhotos: PhotoDraft[] = [];

  for (const photo of ordered) {
    const apiKey = PHOTO_CATEGORY_API[photo.category] ?? "other";
    const idField = PHOTO_IDS_FIELD[apiKey];
    if (photo.mediaId != null && idField) {
      (idFields[idField] ??= []).push(photo.mediaId);
    }
    // Always include the URL in the grouped photos object too — the backend does
    // NOT auto-populate ListingResource.photos from the linked ids.
    urlPhotos.push(photo);
  }

  const out: Record<string, unknown> = { ...idFields };
  // The cover is whatever photo the user selected (moved to `ordered[0]` above),
  // regardless of its category — not just photos in the "cover" group.
  const coverImageId = ordered[0]?.mediaId;
  if (coverImageId != null) out.cover_image_id = coverImageId;
  // Remaining URL/seed photos are already cover-ordered; pass coverIndex 0.
  Object.assign(out, buildPhotoPayload(urlPhotos, 0));
  return out;
}

/**
 * Link uploaded brochure/document/certificate PDFs to the listing via the
 * backend's `brochure_ids` / `document_ids` fields. Certificates ride along in
 * `document_ids` (the media itself keeps its `certificate` category server-side;
 * there is no separate certificate_ids link field).
 */
function buildDocumentPayload(documents: DocumentDraft[]): Record<string, unknown> {
  const brochure: number[] = [];
  const document: number[] = [];
  for (const doc of documents) {
    if (doc.mediaId == null) continue;
    if (doc.category === "brochure") brochure.push(doc.mediaId);
    else document.push(doc.mediaId);
  }
  const out: Record<string, unknown> = {};
  if (brochure.length) out.brochure_ids = brochure;
  if (document.length) out.document_ids = document;
  return out;
}

type ClassificationLike = {
  categories?: Record<string, { subtypes?: Record<string, { label?: string }> }>;
};

/**
 * Resolves the API `property_subtype` *key* from the wizard's human-readable
 * subtype label, using the live form-options metadata. Falls back to the first
 * available subtype key for the category (the backend requires a valid one).
 */
function resolveSubtypeKey(
  category: string,
  subtypeLabel: string,
  classification: ClassificationLike | undefined
): string | undefined {
  const subs = classification?.categories?.[category]?.subtypes;
  if (!subs) return undefined;
  const keys = Object.keys(subs);
  return keys.find((k) => subs[k]?.label === subtypeLabel) ?? keys[0];
}

type EnumOptions = Record<string, unknown>;

/**
 * Reverse-looks-up an API enum *key* from a (possibly Mongolian) label, using
 * the live form-options `enumOptions[field]` map (shaped `{ key: label }`).
 * Falls back to the raw value if no exact label match is found (so already-key
 * values pass straight through). Returns undefined for empty input.
 */
function resolveEnumKey(
  field: string,
  label: string | undefined,
  enumOptions: EnumOptions | undefined
): string | undefined {
  const value = (label ?? "").trim();
  if (!value) return undefined;
  const map = enumOptions?.[field];
  if (map && typeof map === "object") {
    const entries = Object.entries(map as Record<string, unknown>);
    // If the value is already a valid key, keep it.
    if (entries.some(([key]) => key === value)) return value;
    const hit = entries.find(([, lbl]) => String(lbl) === value);
    if (hit) return hit[0];
  }
  return value;
}

/** Wizard-label → API-key maps for the enum selects (labels come from the UI). */
const USAGE_KEY: Record<string, string> = {
  "Цоо шинэ, ашиглаж байгаагүй": "brand_new_unused",
  "Ашиглагдаж байсан": "used",
};
const INTERIOR_KEY: Record<string, string> = {
  "Сүүлийн 1 жилийн хугацаанд засал хийсэн": "renovated_within_1_year",
  "1-3 жилийн өмнө засал хийсэн": "renovated_1_to_3_years",
  "3-с дээш жилийн өмнө засал хийсэн / Анхны заслаараа байгаа": "old_or_original_finish",
};
const CERT_KEY: Record<string, string> = {
  "Бэлэн гэрчилгээтэй": "certificate_ready",
  "Дуусаагүй барилгын гэрчилгээтэй": "unfinished_building_certificate",
  "Гэрчилгээгүй - Гэрчилгээ гарахад бэлэн": "certificate_pending_ready",
  "Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй": "under_construction",
};
const CURRENT_KEY: Record<string, string> = {
  "Түрээсийн эсхүл хөлслүүлэх гэрээтэй байгаа": "has_lease_contract",
  "Амьдарч, ашиглаж байгаа": "occupied_or_in_use",
  "Сул, чөлөөтэй байгаа": "vacant",
  "Бусад": "other",
};
const COLLATERAL_KEY: Record<string, string> = {
  "Ямар нэг барьцаанд байхгүй": "no_collateral",
  "Банк, ББСБ, санхүүгийн байгууллагын зээлийн барьцаанд байгаа": "financial_institution_collateral",
  "Гуравдагч этгээдийн барьцаанд байгаа": "third_party_collateral",
};
const RELATION_KEY: Record<string, string> = {
  "Өмчлөгч": "owner",
  "Эрх эзэмшигч": "right_holder",
  "Гэрээний эрх эзэмшигч": "contract_right_holder",
  "Өмчлөгч, эрх эзэмшигч хуулийн этгээдийн ажилтан": "employee_of_owner_entity",
  "Хууль ёсны итгэмжлэгдсэн төлөөлөгч": "legal_representative",
};
const RENT_FREQ_KEY: Record<string, string> = {
  "1 сар тутам": "monthly",
  "2 сар тутам": "bimonthly",
  "3 сар тутам": "quarterly",
  "4 сар тутам": "four_monthly",
  "6 сар тутам": "semiannual",
  "12 сар тутам": "annual",
};

/**
 * Resolves a wizard label to an API enum key: prefers the static label→key map,
 * then the live enumOptions reverse-lookup, then the raw value.
 */
function mapEnum(
  field: string,
  label: string | undefined,
  staticMap: Record<string, string>,
  enumOptions: EnumOptions | undefined
): string | undefined {
  const value = (label ?? "").trim();
  if (!value) return undefined;
  return staticMap[value] ?? resolveEnumKey(field, value, enumOptions);
}

/** Parses a numeric string to a positive number, or undefined when empty/zero. */
function numOrUndef(value: unknown): number | undefined {
  const n = parseFloat(String(value ?? ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Drops keys whose value is undefined, null, or an empty string. */
function pruneEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }
  return out;
}

/** Builds a StoreListingRequest body from the wizard draft + metadata. */
function buildCreateRequest(
  draft: SmartDraft,
  classification: ClassificationLike | undefined,
  enumOptions: EnumOptions | undefined
): Record<string, unknown> {
  const mode = modeOf(draft.goal);
  const category = CATEGORY_API[draft.propertyType];
  const area = parseFloat(draft.specs.areaCert) || 1;
  const price = priceOf(draft) || 0;
  const totalFloor =
    (clampInt(draft.address.floorBasement, 0, 99) || 0) +
    (clampInt(draft.address.floorAbove, 0, 99) || 0);

  const base: Record<string, unknown> = {
    transaction_type: mode,
    mode,
    property_category: category,
    property_subtype: resolveSubtypeKey(category, draft.subtype, classification),
    // Live address cascade master ids (Province → District → Khoroo → …).
    // `province_id` OMITTED: the live server 500s on any create/update that
    // includes it — SQLSTATE 42S22 "Unknown column 'province_id' in 'field
    // list'" (the `listings` table migration for this column was never run).
    // `khoroo_id` OMITTED too (2026-07-08, separate NEW regression): every
    // khoroo_id — including ones confirmed working earlier the same day —
    // now 500s with a foreign-key violation (`khoroos` table doesn't have a
    // row for the id `/address/khoroos` itself just returned). The `khoroo`
    // display-name string still gets sent below, so the user's selection
    // isn't lost, just not linked by id. See
    // docs/api-listing-wizard-requirements.md for both; re-add once fixed.
    district_id: draft.address.districtId ?? undefined,
    street_id: draft.address.streetId ?? undefined,
    khoroolol_id: draft.address.khoroololId ?? undefined,
    khotkon_id: draft.address.khotkonId ?? undefined,
    building_id: draft.address.buildingId ?? undefined,
    district: draft.address.district || "—",
    khotkhon: draft.address.khotkhon || draft.address.district || "—",
    khoroo: draft.address.khoroo || undefined,
    area,
    total_area_m2: area,
    // Detailed area breakdown.
    net_internal_area_m2: numOrUndef(draft.specs.areaInterior),
    balcony_terrace_veranda_loggia_area_m2: numOrUndef(draft.specs.areaBalcony),
    indoor_parking_area_m2: numOrUndef(draft.specs.areaGarage),
    storage_technical_room_area_m2: numOrUndef(draft.specs.areaStorage),
    price,
    rooms: parseInt(draft.specs.rooms, 10) || undefined,
    bedroom_count: parseInt(draft.specs.bedrooms, 10) || undefined,
    bathroom_count: parseInt(draft.specs.bathrooms, 10) || undefined,
    // Floor info (floor_type intentionally omitted — not required by POST /listings).
    floor: draft.address.selectedFloor || undefined,
    selected_floor: draft.address.selectedFloor || undefined,
    main_floor_count: clampInt(draft.address.floorAbove, 0, 99) || undefined,
    basement_floor_count: clampInt(draft.address.floorBasement, 0, 99) || undefined,
    total_floor_count: totalFloor || undefined,
    unit_number: draft.address.unit || undefined,
    street_number: draft.address.streetNumber || undefined,
    building_block_number: draft.address.buildingNumber || undefined,
    google_map_link: draft.address.googleMapLink || undefined,
    address_description: draft.address.note || undefined,
    year: parseInt(draft.state.commissionYear, 10) || undefined,
    commissioned_year: parseInt(draft.state.commissionYear, 10) || undefined,
    // State enums (wizard stores Mongolian labels → API keys).
    usage_condition: mapEnum("usage_condition", draft.state.condition, USAGE_KEY, enumOptions),
    interior_condition: mapEnum("interior_condition", draft.state.interior, INTERIOR_KEY, enumOptions),
    certificate_status: mapEnum("certificate_status", draft.state.certStatus, CERT_KEY, enumOptions),
    current_availability_status: mapEnum("current_availability_status", draft.state.current, CURRENT_KEY, enumOptions),
    collateral_status: mapEnum("collateral_status", draft.state.collateral, COLLATERAL_KEY, enumOptions),
    relationship_to_property: mapEnum("relationship_to_property", draft.services.relation, RELATION_KEY, enumOptions),
    vat_included: draft.pricing.vatIncluded,
    provides_vat_ebarimt: draft.pricing.ebarimt,
    desc: draft.desc || undefined,
    // Tag arrays — the backend accepts arbitrary strings (custom tags included).
    amenities: flattenTags(Object.values(draft.community)),
    included_items: flattenTags(Object.values(draft.included)),
    infrastructure: flattenInfra(draft.infra),
    // Optional paid services + declarations.
    wants_verified: draft.services.verified,
    wants_brokerage: draft.services.brokerage,
    wants_sponsored: draft.services.sponsored,
    confirms_information_is_true: draft.declarations.truth,
    confirms_authorized_to_publish: draft.declarations.authority,
    accepts_terms: draft.declarations.terms,
    // ALHAM 11 — photos: grouped object + placeholder seeds (cover first).
    ...buildMediaPayload(draft.media.photos, draft.media.coverIndex),
    // Танилцуулга/брошур/гэрчилгээ PDF-үүд → brochure_ids / document_ids.
    ...buildDocumentPayload(draft.media.documents),
  };

  if (mode === "rent") {
    base.monthly_total_price = numOrUndef(draft.pricing.monthlyPrice) ?? price;
    base.rent_payment_frequency = mapEnum(
      "rent_payment_frequency",
      draft.pricing.rentFrequency,
      RENT_FREQ_KEY,
      enumOptions
    );
    base.rent_deposit_amount = parseInt(draft.pricing.deposit, 10) || undefined;
  } else {
    base.total_price = numOrUndef(draft.pricing.totalPrice) ?? price;
    base.unit_price_m2 = area ? Math.round((numOrUndef(draft.pricing.totalPrice) ?? price) / area) : undefined;
    base.deposit = parseInt(draft.pricing.deposit, 10) || undefined;
  }

  return pruneEmpty(base);
}

/* -------------------------------------------------------------------------- */
/* Reverse map: ListingResource (wire) -> SmartDraft (wizard edit mode)        */
/* -------------------------------------------------------------------------- */

/** Flatten grouped tag arrays into a unique flat list (drops empties). */
function flattenTags(groups: string[][]): string[] {
  const seen = new Set<string>();
  for (const arr of groups) for (const t of arr) if (t && t.trim()) seen.add(t.trim());
  return Array.from(seen);
}

/** Flatten the single-choice infra map into a flat list of chosen values. */
function flattenInfra(infra: SmartDraft["infra"]): string[] {
  const out: string[] = [];
  for (const field of infraFields) {
    const value = infra[field.key];
    if (!value) continue;
    if (field.key === "internet") {
      for (const part of value.split(",").map((s) => s.trim()).filter(Boolean)) out.push(part);
    } else {
      out.push(value);
    }
  }
  return out;
}

const API_CATEGORY: Record<string, PropertyKey> = Object.fromEntries(
  Object.entries(CATEGORY_API).map(([key, value]) => [value, key])
) as Record<string, PropertyKey>;
const API_PHOTO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(PHOTO_CATEGORY_API).map(([label, key]) => [key, label])
);

/** key → label using an inverted label→key enum map, else the fallback. */
function labelFromKey(map: Record<string, string>, key: unknown, fallback: string): string {
  if (typeof key !== "string" || !key) return fallback;
  const found = Object.entries(map).find(([, v]) => v === key);
  return found ? found[0] : fallback;
}

/** Sort a flat tag list back into its grouped buckets; unknown → custom bucket. */
function distributeTags<K extends string>(
  values: unknown,
  groups: Array<{ key: K; items: string[] }>,
  customKey: K,
  base: Record<K, string[]>
): Record<K, string[]> {
  const out = {} as Record<K, string[]>;
  for (const key of Object.keys(base) as K[]) out[key] = [];
  const arr = Array.isArray(values) ? values.filter((v): v is string => typeof v === "string") : [];
  for (const value of arr) {
    const group = groups.find((g) => g.items.includes(value));
    out[group ? group.key : customKey].push(value);
  }
  return out;
}

/** Rebuild the single-choice infra map from a flat infrastructure list. */
function infraFromList(values: unknown, base: SmartDraft["infra"]): SmartDraft["infra"] {
  const out = { ...base };
  const arr = Array.isArray(values) ? values.filter((v): v is string => typeof v === "string") : [];
  const internet: string[] = [];
  for (const value of arr) {
    const field = infraFields.find((f) => f.choices.includes(value));
    if (field?.key === "internet") internet.push(value);
    else if (field) out[field.key] = value;
  }
  if (internet.length) out.internet = internet.join(", ");
  return out;
}

/** Rebuild PhotoDraft[] from the grouped `photos` object the API returns. */
function photosFromResource(photos: unknown): PhotoDraft[] {
  if (!photos || typeof photos !== "object" || Array.isArray(photos)) return [];
  const out: PhotoDraft[] = [];
  for (const [group, urls] of Object.entries(photos as Record<string, unknown>)) {
    if (!Array.isArray(urls)) continue;
    const category = API_PHOTO_CATEGORY[group] ?? "Дотор зураг";
    urls.forEach((url, i) => {
      if (typeof url === "string" && url) {
        out.push({ id: `photo-edit-${group}-${i}`, seed: `${group}-${i}`, category, url });
      }
    });
  }
  return out;
}

/**
 * Reverse of `buildCreateRequest`: populate a wizard draft from an existing
 * `ListingResource` so the user can EDIT a listing. Best-effort — core fields
 * round-trip exactly; enum labels, grouped tags and photos are reconstructed
 * from the live values (unknown tags land in the custom bucket).
 */
function draftFromListing(
  resource: ListingResource,
  classification: ClassificationLike | undefined
): SmartDraft {
  const base = createDefaultDraft();
  const r = resource as unknown as Record<string, unknown>;
  const str = (key: string): string => (typeof r[key] === "string" ? (r[key] as string) : "");
  const numStr = (key: string): string => {
    const v = r[key];
    return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
  };
  const int = (key: string): number => {
    const v = r[key];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };

  const category = String(r.propertyCategory ?? "");
  const propertyType = API_CATEGORY[category] ?? base.propertyType;
  const subtypeKey = str("propertySubtype");
  const subtypeLabel =
    classification?.categories?.[category]?.subtypes?.[subtypeKey]?.label ||
    subtypes[propertyType]?.[0] ||
    base.subtype;

  const masterIds = toRecord(r.addressMasterIds);
  const idOf = (key: string): string | null =>
    masterIds[key] != null ? String(masterIds[key]) : null;

  const rawLat = typeof r.lat === "number" ? r.lat : base.lat;
  const rawLng = typeof r.lng === "number" ? r.lng : base.lng;
  const hasCoords = typeof r.lat === "number" && r.lat > 1;

  return {
    ...base,
    goal: r.mode === "rent" || r.transactionType === "rent" ? "rent" : "sell",
    propertyType,
    subtype: subtypeLabel,
    desc: str("desc"),
    address: {
      ...base.address,
      district: str("district") || base.address.district,
      khoroo: str("khoroo"),
      khotkhon: str("khotkhon"),
      zip: str("zipcode"),
      streetNumber: str("streetNumber"),
      buildingNumber: str("buildingBlockNumber"),
      buildingName: str("buildingBlockName"),
      googleMapLink: str("googleMapLink"),
      note: str("addressDescription"),
      unit: str("unitNumber"),
      selectedFloor: str("selectedFloor") || str("floor") || base.address.selectedFloor,
      floorBasement: int("basementFloorCount"),
      floorAbove: int("mainFloorCount"),
      floorTotal: int("totalFloorCount"),
      provinceId: idOf("provinceId"),
      districtId: idOf("districtId"),
      khorooId: idOf("khorooId"),
      streetId: idOf("streetId"),
      khoroololId: idOf("khoroololId"),
      khotkonId: idOf("khotkonId"),
      buildingId: idOf("buildingId"),
    },
    specs: {
      ...base.specs,
      areaCert: numStr("area"),
      areaInterior: numStr("netInternalAreaM2"),
      areaBalcony: numStr("balconyTerraceVerandaLoggiaAreaM2"),
      areaGarage: numStr("indoorParkingAreaM2"),
      areaStorage: numStr("storageTechnicalRoomAreaM2"),
      rooms: numStr("rooms"),
      bedrooms: numStr("bedroomCount"),
      bathrooms: numStr("bathroomCount"),
    },
    infra: infraFromList(r.infrastructure, base.infra),
    community: distributeTags(r.amenities, communityGroups, "amenities", base.community),
    included: distributeTags(r.includedItems, includedGroups, "extra", base.included),
    state: {
      ...base.state,
      usage: r.commissionedStatus === "commissioned" ? "Ашиглалтад орсон" : base.state.usage,
      condition: labelFromKey(USAGE_KEY, r.usageCondition, base.state.condition),
      interior: labelFromKey(INTERIOR_KEY, r.interiorCondition, base.state.interior),
      certStatus: labelFromKey(CERT_KEY, r.certificateStatus, base.state.certStatus),
      current: labelFromKey(CURRENT_KEY, r.currentAvailabilityStatus, base.state.current),
      collateral: labelFromKey(COLLATERAL_KEY, r.collateralStatus, base.state.collateral),
      certNumber: str("propertyRegistrationNumber"),
      commissionYear: numStr("year") || numStr("commissionedYear"),
    },
    pricing: {
      ...base.pricing,
      totalPrice: numStr("price") || numStr("totalPrice"),
      monthlyPrice: numStr("monthlyTotalPrice"),
      deposit: numStr("deposit"),
      vatIncluded: Boolean(r.vatIncluded),
      ebarimt: Boolean(r.providesVatEbarimt),
      rentFrequency: labelFromKey(RENT_FREQ_KEY, r.rentPaymentFrequency, base.pricing.rentFrequency),
    },
    services: {
      ...base.services,
      relation: labelFromKey(RELATION_KEY, r.relationshipToProperty, base.services.relation),
    },
    media: { ...base.media, photos: photosFromResource(r.photos) },
    lat: hasCoords ? rawLat : base.lat,
    lng: hasCoords ? rawLng : base.lng,
    locationTouched: hasCoords,
  };
}

const SMART_LIST_PROP_DRAFT_KEY = "neomap.smartListPropertyDraft.v1";
const SMART_LIST_PROP_SUBMISSIONS_KEY = "neomap.smartListPropertySubmissions.v1";

type GoalKey = "sell" | "rent";
type PropertyKey =
  | "apartment"
  | "house"
  | "office"
  | "retail"
  | "industrial"
  | "parking"
  | "warehouse"
  | "fence_house"
  | "summer_land"
  | "summer_no_land"
  | "land"
  | "other";
type WindowKey =
  | "northwest"
  | "north"
  | "northeast"
  | "west"
  | "east"
  | "southwest"
  | "south"
  | "southeast";
type RentMonth = 1 | 2 | 3 | 4 | 6 | 12;
type WindowCounts = Record<WindowKey, number>;
type SelectOption = string | { label: string; value: string };

type RoomDetailDraft = {
  id: string;
  typeKey: string;
  label: string;
  floor: string;
  area: string;
  windows: WindowCounts;
  tags: string[];
  note: string;
};

type PhotoDraft = {
  id: string;
  seed: string;
  category: string;
  /** Optional real image URL; when set it is sent instead of a seed placeholder. */
  url?: string;
  /** Set when the file was uploaded to `/media`; linked by id on create. */
  mediaId?: number;
};

/** A brochure / document / certificate PDF uploaded to `/media`. */
type DocumentDraft = {
  id: string;
  category: DocumentCategory;
  name: string;
  url?: string;
  mediaId?: number;
};

type SmartDraft = {
  goal: GoalKey;
  propertyType: PropertyKey;
  subtype: string;
  desc: string;
  address: {
    country: string;
    city: string;
    district: string;
    khoroo: string;
    // Master ids resolved from the cascading address API (for the create payload).
    // Live cascade: Province → District → Khoroo → {Street, Khoroolol, Khotkhon, Building}.
    provinceId: string | null;
    districtId: string | null;
    khorooId: string | null;
    streetId: string | null;
    khoroololId: string | null;
    khotkonId: string | null;
    buildingId: string | null;
    zip: string;
    street: string;
    streetNumber: string;
    khotkhon: string;
    buildingNumber: string;
    buildingName: string;
    googleMapLink: string;
    note: string;
    floorBasement: number;
    floorAbove: number;
    floorTotal: number;
    selectedFloor: string;
    unit: string;
  };
  specs: {
    areaCert: string;
    areaInterior: string;
    areaBalcony: string;
    areaGarage: string;
    areaStorage: string;
    rooms: string;
    bedrooms: string;
    bathrooms: string;
    windows: WindowCounts;
    officeNeeds: string[];
  };
  infra: Record<InfraKey, string> & { note: string; heatingSub: string };
  community: Record<CommunityKey, string[]>;
  included: Record<IncludedKey, string[]>;
  state: {
    usage: string;
    certStatus: string;
    certNumber: string;
    condition: string;
    current: string;
    interior: string;
    collateral: string;
    certificateAttached: boolean;
    contractAttached: boolean;
    commissionYear: string;
    commissionDue: string;
    collateralNote: string;
  };
  pricing: {
    totalPrice: string;
    monthlyPrice: string;
    vatIncluded: boolean;
    ebarimt: boolean;
    paymentForms: string[];
    rentFrequency: string;
    deposit: string;
    rentDiscounts: Record<RentMonth, number>;
  };
  media: {
    photos: PhotoDraft[];
    documents: DocumentDraft[];
    videoLink: string;
    coverIndex: number;
  };
  declarations: {
    truth: boolean;
    authority: boolean;
    terms: boolean;
  };
  services: {
    verified: boolean;
    brokerage: boolean;
    sponsored: boolean;
    relation: string;
  };
  roomDetails: RoomDetailDraft[];
  lat: number;
  lng: number;
  locationTouched: boolean;
};

type Requirement = { id: string; label: string; ok: boolean; step: number };
type OptionalItem = { label: string; ok: boolean };
type SubmissionPayload = {
  id: number;
  createdAt: string;
  listing: {
    id: number;
    mode: "sale" | "rent";
    title: string;
    propertyType: string;
    subtype: string;
    district: string;
    khoroo: string;
    addressLine: string;
    area: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    floor: string;
    price: number;
    unitPrice: number;
    features: string[];
    lat: number;
    lng: number;
    coverSeed: string;
  };
  detail: SmartDraft;
};

type DraftActions = {
  setPath: (path: string, value: unknown) => void;
  toggleArray: (path: string, value: string) => void;
  toggleBoolean: (path: string) => void;
  mutate: (recipe: (draft: SmartDraft) => void) => void;
};

type InfraKey =
  | "heating"
  | "electric"
  | "waterCold"
  | "waterHot"
  | "sewage"
  | "road"
  | "internet";
type CommunityKey = "services" | "security" | "amenities";
type IncludedKey = "furniture" | "equipment" | "extra";

const groups: Array<{
  step: number;
  icon: LucideIcon;
  title: string;
  /** Short 1-word label for space-constrained UI (mobile bottom step bar). */
  shortTitle: string;
  sub: string;
  covers: string[];
}> = [
  {
    step: 1,
    icon: MapPin,
    title: "Хаяг, байршил ба үзүүлэлт",
    shortTitle: "Байршил",
    sub: "АЛХАМ 01-02",
    covers: ["Гараар оруулах", "Газрын зураг", "Үзүүлэлт"],
  },
  {
    step: 2,
    icon: Target,
    title: "Зорилго ба зориулалт",
    shortTitle: "Зорилго",
    sub: "АЛХАМ 03-05",
    covers: ["Зорилго", "ҮХЭХ зориулалт", "Дэд зориулалт"],
  },
  {
    step: 3,
    icon: Sparkles,
    title: "Дэд бүтэц ба дагалдах зүйлс",
    shortTitle: "Дэд бүтэц",
    sub: "АЛХАМ 06-08",
    covers: ["Дэд бүтэц", "Дундын хэрэглээ", "Үнэд багтсан"],
  },
  {
    step: 4,
    icon: Banknote,
    title: "Төлөв ба үнэ",
    shortTitle: "Үнэ",
    sub: "АЛХАМ 09-10",
    covers: ["ҮХЭХ төлөв", "Үнэ, төлбөрийн нөхцөл"],
  },
  {
    step: 5,
    icon: Images,
    title: "Зураг, бичлэг",
    shortTitle: "Зураг",
    sub: "АЛХАМ 11",
    covers: ["Зураг", "Бичлэг", "Танилцуулга"],
  },
  {
    step: 6,
    icon: ShieldCheck,
    title: "Шалгах, баталгаажуулах",
    shortTitle: "Шалгах",
    sub: "АЛХАМ 12-13",
    covers: ["Баталгаажуулах", "Verified", "Brokerage"],
  },
];

const goals = [
  {
    key: "sell" as const,
    mode: "sale" as const,
    label: "ХУДАЛДУУЛЪЯ",
    hint: "Бүх төрлийн үл хөдлөх эд хөрөнгөө худалдах",
    icon: Banknote,
  },
  {
    key: "rent" as const,
    mode: "rent" as const,
    label: "ТҮРЭЭСЛҮҮЛЬЕ / ХӨЛСЛҮҮЛЬЕ",
    hint: "Орон сууцны болон арилжааны зориулалттай хөрөнгө түрээслүүлэх, хөлслүүлэх",
    icon: KeyRound,
  },
];

const propertyTypes: Array<{
  key: PropertyKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  residential?: boolean;
  commercial?: boolean;
}> = [
  {
    key: "apartment",
    label: "Орон сууц",
    hint: "Олон давхар барилгын тусдаа бүртгэлтэй нэгж",
    icon: Building2,
    residential: true,
  },
  {
    key: "house",
    label: "Амины орон сууц",
    hint: "Тусдаа орцтой, дээрээ/доороо өөр айлгүй сууц",
    icon: Home,
    residential: true,
  },
  {
    key: "office",
    label: "Оффис",
    hint: "Байгууллага, бизнесийн өдөр тутмын ажлын байр",
    icon: BriefcaseBusiness,
    commercial: true,
  },
  {
    key: "retail",
    label: "Худалдаа, үйлчилгээ",
    hint: "Дэлгүүр, үйлчилгээний төв, салон, ресторан, кафе г.м.",
    icon: ShoppingBag,
    commercial: true,
  },
  {
    key: "industrial",
    label: "Аж үйлдвэрийн обьект",
    hint: "Үйлдвэрлэл, боловсруулах, засварлах зориулалттай обьект",
    icon: Factory,
    commercial: true,
  },
  {
    key: "parking",
    label: "Авто дулаан зогсоол",
    hint: "Орон сууц, оффис, үйлчилгээний барилгын доторх дулаан зогсоол",
    icon: ParkingCircle,
  },
  {
    key: "warehouse",
    label: "Агуулах",
    hint: "Орон сууц, гараж, оффисын доторх агуулахын өрөө, талбай",
    icon: Warehouse,
    commercial: true,
  },
  {
    key: "fence_house",
    label: "Хашаа байшин (газартай)",
    hint: "Газартай, дээр нь нэг айлын зориулалттай байшинтай",
    icon: Home,
  },
  {
    key: "summer_land",
    label: "Зуслангийн байшин (газартай)",
    hint: "Зуслангийн бүсэд байрлах газартай байшин",
    icon: Trees,
    residential: true,
  },
  {
    key: "summer_no_land",
    label: "Зуслангийн байшин (газаргүй)",
    hint: "Газрын эрх нь тусдаа, зөвхөн байшин нь обьект болох хөрөнгө",
    icon: TreePine,
    residential: true,
  },
  {
    key: "land",
    label: "Газар",
    hint: "Барилга байгууламжтай эсвэл барилгагүй газар",
    icon: Map,
  },
  {
    key: "other",
    label: "Бусад",
    hint: "Дээрх ангилалд шууд хамаарахгүй хөрөнгө",
    icon: CircleEllipsis,
  },
];

const subtypes: Record<PropertyKey, string[]> = {
  apartment: ["Энгийн", "Дуплекс", "Пентхаус"],
  house: ["Single house", "Twin house", "Town house", "Multihouse"],
  office: [
    "Давхар дахь тодорхой хэсэг, өрөө(нүүд)",
    "Давхар бүхлээрээ",
    "Обьект бүхлээрээ",
  ],
  retail: [
    "Давхар дахь тодорхой хэсэг, өрөө(нүүд)",
    "Давхар бүхлээрээ",
    "Обьект бүхлээрээ",
  ],
  industrial: ["Зориулалтын талаар тайлбар оруулах"],
  parking: [
    "Оффис, Үйлчилгээ, Орон сууцны доорх / доторх",
    "Тусдаа авто дулаан зогсоолын блок дахь",
  ],
  warehouse: ["Оффис, Үйлчилгээ, Орон сууцны доорх / доторх"],
  fence_house: ["Хашаа байшин (газартай)"],
  summer_land: ["Зуслангийн байшин (газартай)"],
  summer_no_land: ["Зуслангийн байшин (газаргүй)"],
  land: ["Газрын зориулалт сонгох"],
  other: ["Тайлбар оруулах"],
};

const windowDirections: Array<{
  key: WindowKey;
  label: string;
  short: string;
  detailKey: string;
  icon: LucideIcon;
  chipClass: string;
}> = [
  { key: "northwest", label: "Баруун-хойш", short: "БХ", detailKey: "БХ", icon: MoveUpLeft, chipClass: "left-[18px] top-[24px]" },
  { key: "north", label: "Хойд", short: "Х", detailKey: "Х", icon: ArrowUp, chipClass: "left-1/2 top-2 -translate-x-1/2" },
  { key: "northeast", label: "Зүүн-хойш", short: "ЗХ", detailKey: "ЗХ", icon: MoveUpRight, chipClass: "right-[18px] top-[24px]" },
  { key: "west", label: "Баруун", short: "Б", detailKey: "Б", icon: ArrowLeft, chipClass: "left-1 top-1/2 -translate-y-1/2" },
  { key: "east", label: "Зүүн", short: "З", detailKey: "З", icon: ArrowRight, chipClass: "right-1 top-1/2 -translate-y-1/2" },
  { key: "southwest", label: "Баруун-урагш", short: "БУ", detailKey: "БУ", icon: MoveDownLeft, chipClass: "bottom-[24px] left-[18px]" },
  { key: "south", label: "Урд", short: "У", detailKey: "У", icon: ArrowDown, chipClass: "bottom-2 left-1/2 -translate-x-1/2" },
  { key: "southeast", label: "Зүүн-урагш", short: "ЗУ", detailKey: "ЗУ", icon: MoveDownRight, chipClass: "bottom-[24px] right-[18px]" },
];

const officeNeeds = [
  "Ресепшн",
  "Хурлын өрөө",
  "Удирдлагын өрөө",
  "Open office",
  "Гал тогооны хэсэг",
  "Серверийн өрөө",
  "Агуулах өрөө",
  "Архив",
  "Дуудлагын өрөө",
  "Ариун цэврийн өрөө",
  "Агааржуулалт",
  "Галын дохиолол",
  "Access control",
  "24/7 нэвтрэх",
  "Зочны зогсоол",
  "Ачааны лифт",
];

const infraFields: Array<{
  key: InfraKey;
  label: string;
  icon: LucideIcon;
  required?: boolean;
  choices: string[];
}> = [
  {
    key: "heating",
    label: "Дулаан",
    icon: Flame,
    required: true,
    choices: ["Төсвийн (улсын)", "Төвлөрсөн (Хотхоны)", "Бие даасан"],
  },
  {
    key: "electric",
    label: "Цахилгаан",
    icon: Bolt,
    required: true,
    choices: ["Төвийн 100%", "Төвийн болон сэргээгдэх хосолмол", "Сэргээгдэх 100%", "Ямар нэг нөөцлүүргүй", "Ямар нэг нөөцлүүртэй", "Дизель генератортой", "Бусад"],
  },
  {
    key: "waterCold",
    label: "Цэвэр ус",
    icon: Droplets,
    required: true,
    choices: ["Төвийн шугам (улсын)", "Төвлөрсөн (хотхоны)", "Бие даасан", "Гүний худаг", "Ус зөөдөг", "Бусад"],
  },
  {
    key: "waterHot",
    label: "Хэрэглээний халуун ус",
    icon: ThermometerSun,
    choices: ["Төвийн шугам (улсын) - ялтсан бойлер", "Төвлөрсөн (хотхоны)", "Бие даасан", "Эзлэхүүний бойлер", "Түргэн халаагч бойлер", "Бусад"],
  },
  {
    key: "sewage",
    label: "Бохир",
    icon: Waves,
    required: true,
    choices: ["Төвийн шугам (улсын)", "Төвлөрсөн (хотхоны)", "Бие даасан", "Септик", "Соруулдаг", "Бусад"],
  },
  {
    key: "road",
    label: "Ирж, очих зам",
    icon: Route,
    required: true,
    choices: ["100% асфальт", "Шороон зам", "Холимог", "Бусад"],
  },
  {
    key: "internet",
    label: "Интернет, IPTV",
    icon: Wifi,
    choices: ["Univision", "DDISH, Гэр интернет", "Mobinet", "Бусад"],
  },
];

const heatingSubChoices: Record<string, string[]> = {
  "Төвлөрсөн (Хотхоны)": ["Уурын зуух (Нүүрсэн)", "Газар зуух", "Цахилгаан"],
  "Бие даасан": ["Газар зуух", "Цахилгаан зуух", "Цахилгаан радиатор"],
};

const communityGroups: Array<{
  key: CommunityKey;
  title: string;
  icon: LucideIcon;
  items: string[];
}> = [
  {
    key: "services",
    title: "Үйлчилгээ",
    icon: Store,
    items: [
      "Хүнсний дэлгүүр",
      "Барааны дэлгүүр",
      "Фитнес, иога, веллнесс",
      "Спа",
      "Бассейн",
      "Сауна",
      "Угаалга, хими цэвэрлэгээ",
      "Дундын өмчлөлийн цэвэрлэгээ",
      "Хувийн өмчийн цэвэрлэгээ",
      "Клабхаус",
      "Ресторан",
      "Кофешоп",
      "Цахилгаан машины цэнэглэл станц",
      "Бусад",
    ],
  },
  {
    key: "security",
    title: "Аюулгүй байдал",
    icon: ShieldCheck,
    items: [
      "Харуул, хамгаалалт 24/7",
      "Домофон, дохиолол",
      "Хотхоны нэгдсэн хашаа",
      "Явган орц, гарцны аксесстай хаалга",
      "Машины автомат хаалт",
      "Бусад",
    ],
  },
  {
    key: "amenities",
    title: "Тав тух",
    icon: Accessibility,
    items: [
      "Төлбөртэй ил зогсоол",
      "Төлбөргүй ил зогсоол",
      "Төлбөртэй дулаан зогсоол",
      "Машингүй бүс",
      "Хүүхдийн тоглоомын талбай",
      "Ногоон байгууламж, нарлах салхилах талбай",
      "Лифт - зорчигчийн 24/7",
      "Лифт - ачааны 24/7",
      "Нэгдсэн дулаан зогсоол",
      "Тусгай хэрэгцээт хүнд зориулсан дэд бүтэц (disabled friendly)",
      "Хүүхдэд ээлтэй орчин",
      "Бусад",
    ],
  },
];

const includedGroups: Array<{
  key: IncludedKey;
  title: string;
  icon: LucideIcon;
  items: string[];
}> = [
  {
    key: "furniture",
    title: "Тавилга",
    icon: Armchair,
    items: [
      "Гал тогооны тавилга",
      "Үүдний тавилга",
      "АЦӨ тавилга, тоноглол",
      "Зочны өрөөний ханын тавилга",
      "Хувцасны өрөөний тавилга",
      "Ажлын өрөөний ханын тавилга",
      "Gym-ний ханын тавилга",
      "B1 давхрын үүдний өрөөний тавилга",
    ],
  },
  {
    key: "equipment",
    title: "Тоног төхөөрөмж, цахилгаан бараа",
    icon: MonitorCog,
    items: [
      "Хөргөгч, хөлдөөгч",
      "Суурилагддаг зуух, плитка, шарах шүүгээ",
      "Ус цэвэршүүлэгч",
      "Биде",
      "Угаалгын машин",
      "Ялаа, шумуулны тор",
      "Агааржуулалт, эйр кондишн систем",
    ],
  },
  {
    key: "extra",
    title: "Нэмэлт тоноглол",
    icon: SlidersHorizontal,
    items: ["Домофон", "Автоматжуулалтын систем", "Гэрлийн бүрхүүл", "Хөшиг, тюль", "Бусад"],
  },
];

const salePaymentForms = [
  "Зөвхөн 100% бэлэн мөнгөөр, шууд төлөлтөөр",
  "Зөвхөн 100% бэлэн мөнгөөр, банкны зээл оролцуулж болно",
  "Зөвхөн 100% бэлэн мөнгөөр, хуваарьт төлөлтөөр",
  "100% хүртэл бартераар борлуулах боломжтой",
  "Үнийн дүнгийн тодорхой хувь хүртэл бартераар, бэлэн мөнгийг шууд төлөлтөөр",
  "Үнийн дүнгийн тодорхой хувь хүртэл бартераар, бэлэн мөнгийг хуваарьт төлөлтөөр",
];

const rentFrequencies = ["1 сар тутам", "2 сар тутам", "3 сар тутам", "4 сар тутам", "6 сар тутам", "12 сар тутам"];
const mediaCategories = [
  "Нүүрний зураг",
  "План зураг",
  "Дотор зураг",
  "Гадна орчны зураг",
  "Мастер төлөвлөгөө, хотхоны зураг",
  "Дотроос гадагшаа харагдацын зураг",
  "Хотхоны бусад үзүүлэлтийн зураг",
  "Бичлэг",
];

const relations = [
  "Өмчлөгч",
  "Эрх эзэмшигч",
  "Гэрээний эрх эзэмшигч",
  "Өмчлөгч, эрх эзэмшигч хуулийн этгээдийн ажилтан",
  "Хууль ёсны итгэмжлэгдсэн төлөөлөгч",
  "Өмчлөгч, эрх эзэмшигчийн ойр дотнын хүн",
  "Зуучлагч",
  "Бусад",
];

const certOptions = [
  "Бэлэн гэрчилгээтэй",
  "Дуусаагүй барилгын гэрчилгээтэй",
  "Гэрчилгээгүй - Гэрчилгээ гарахад бэлэн",
  "Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй",
  "Бусад",
];
const interiorOptions = [
  "",
  "Сүүлийн 1 жилийн хугацаанд засал хийсэн",
  "1-3 жилийн өмнө засал хийсэн",
  "3-с дээш жилийн өмнө засал хийсэн / Анхны заслаараа байгаа",
  "Засваргүй, Гэрээлэгч өөрөө засал хийнэ",
  "Бусад: Дотор засвар хийгдэж байгаа, хийгдэнэ",
];
const collateralOptions = [
  "Ямар нэг барьцаанд байхгүй",
  "Банк, ББСБ, санхүүгийн байгууллагын зээлийн барьцаанд байгаа",
  "Гуравдагч этгээдийн барьцаанд байгаа",
  "Бусад",
];

// Real WGS84 centres per UB district, so the Leaflet map opens on the right area.
const UB_CENTER = { lat: 47.9077, lng: 106.8832 };
const districtLocations: Record<string, { lat: number; lng: number }> = {
  "Хан-Уул": { lat: 47.8864, lng: 106.8964 },
  "Баянзүрх": { lat: 47.9174, lng: 106.977 },
  "Сүхбаатар": { lat: 47.9188, lng: 106.9199 },
  "Чингэлтэй": { lat: 47.928, lng: 106.905 },
  "Сонгинохайрхан": { lat: 47.92, lng: 106.8 },
  "Налайх": { lat: 47.7716, lng: 107.25 },
  "Баянгол": { lat: 47.91, lng: 106.85 },
  "Багануур": { lat: 47.83, lng: 108.24 },
  "Багахангай": { lat: 47.38, lng: 108.42 },
};

function defaultListPropLocation(district: string) {
  return districtLocations[district] ?? UB_CENTER;
}

function defaultWindows(): WindowCounts {
  return windowDirections.reduce((acc, dir) => {
    acc[dir.key] = 0;
    return acc;
  }, {} as WindowCounts);
}

function normalizeWindows(value?: unknown): WindowCounts {
  const out = defaultWindows();
  const assign = (key: unknown, count: unknown) => {
    if (!key) return;
    const raw = String(key).toLowerCase();
    const dir = windowDirections.find(
      (item) =>
        item.key === raw ||
        item.label === key ||
        item.short === key ||
        item.detailKey === key
    );
    if (dir) out[dir.key] = Math.max(0, parseInt(String(count), 10) || 0);
  };
  if (Array.isArray(value)) {
    value.forEach((item) => {
      const dir = windowDirections.find(
        (candidate) =>
          candidate.label === item ||
          candidate.short === item ||
          candidate.detailKey === item
      );
      if (dir) out[dir.key] += 1;
    });
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, count]) => assign(key, count));
  }
  return out;
}

function createDefaultDraft(): SmartDraft {
  const district = DISTRICTS[0];
  const loc = defaultListPropLocation(district);
  return {
    goal: "rent",
    propertyType: "apartment",
    subtype: subtypes.apartment[0],
    desc: "",
    address: {
      country: "Монгол",
      city: "Улаанбаатар",
      district,
      khoroo: "",
      provinceId: null,
      districtId: null,
      khorooId: null,
      streetId: null,
      khoroololId: null,
      khotkonId: null,
      buildingId: null,
      zip: "",
      street: "",
      streetNumber: "",
      khotkhon: "",
      buildingNumber: "",
      buildingName: "",
      googleMapLink: "",
      note: "",
      floorBasement: 0,
      floorAbove: 0,
      floorTotal: 0,
      selectedFloor: "F01",
      unit: "",
    },
    specs: {
      areaCert: "",
      areaInterior: "",
      areaBalcony: "",
      areaGarage: "",
      areaStorage: "",
      rooms: "",
      bedrooms: "",
      bathrooms: "",
      windows: defaultWindows(),
      officeNeeds: [],
    },
    infra: {
      heating: "Төсвийн (улсын)",
      heatingSub: "",
      electric: "Төвийн 100%",
      waterCold: "Төвийн шугам (улсын)",
      waterHot: "Төвийн шугам (улсын) - ялтсан бойлер",
      sewage: "Төвийн шугам (улсын)",
      road: "100% асфальт",
      internet: "Univision",
      note: "",
    },
    community: { services: [], security: [], amenities: [] },
    included: { furniture: [], equipment: [], extra: [] },
    state: {
      usage: "Ашиглалтад орсон",
      certStatus: "Бэлэн гэрчилгээтэй",
      certNumber: "",
      condition: "Цоо шинэ, ашиглаж байгаагүй",
      current: "Сул, чөлөөтэй байгаа",
      interior: "",
      collateral: "Ямар нэг барьцаанд байхгүй",
      certificateAttached: false,
      contractAttached: false,
      commissionYear: "",
      commissionDue: "",
      collateralNote: "",
    },
    pricing: {
      totalPrice: "",
      monthlyPrice: "",
      vatIncluded: false,
      ebarimt: false,
      paymentForms: [salePaymentForms[0]],
      rentFrequency: "1 сар тутам",
      deposit: "",
      rentDiscounts: { 1: 0, 2: 0, 3: 0, 4: 0, 6: 5, 12: 10 },
    },
    media: { photos: [], documents: [], videoLink: "", coverIndex: 0 },
    declarations: { truth: false, authority: false, terms: false },
    services: { verified: true, brokerage: false, sponsored: false, relation: "Өмчлөгч" },
    roomDetails: [],
    lat: loc.lat,
    lng: loc.lng,
    locationTouched: false,
  };
}

function cloneDraft(draft: SmartDraft): SmartDraft {
  return typeof structuredClone === "function"
    ? structuredClone(draft)
    : (JSON.parse(JSON.stringify(draft)) as SmartDraft);
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeRoom(value: unknown, fallbackIndex: number): RoomDetailDraft {
  const raw = toRecord(value);
  const typeKey = String(raw.typeKey || raw.type || "living");
  const meta = ROOM_TYPES.find((item) => item.key === typeKey) ?? ROOM_TYPES[0];
  return {
    id: String(raw.id || `room-${Date.now()}-${fallbackIndex}`),
    typeKey: meta.key,
    label: String(raw.label || meta.label),
    floor: String(raw.floor || "F01"),
    area: String(raw.area || ""),
    windows: normalizeWindows(raw.windows),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    note: String(raw.note || ""),
  };
}

function normalizeDraft(value?: unknown): SmartDraft {
  const base = createDefaultDraft();
  const raw = toRecord(value);
  const address = toRecord(raw.address);
  const specs = toRecord(raw.specs);
  const pricing = toRecord(raw.pricing);
  const media = toRecord(raw.media);
  const services = toRecord(raw.services);
  const serviceList = arrayOfStrings(raw.services);
  const state = toRecord(raw.state);

  const oldType = propertyTypes.find((item) => item.label === raw.propertyType);
  const propertyType = (oldType?.key || raw.propertyType || base.propertyType) as PropertyKey;
  const safeType = propertyTypes.some((item) => item.key === propertyType) ? propertyType : base.propertyType;
  const goal = raw.goal === "sell" || raw.goal === "rent" ? raw.goal : base.goal;
  const loc = defaultListPropLocation(String(address.district || raw.district || base.address.district));

  const out: SmartDraft = {
    ...base,
    ...raw,
    goal,
    propertyType: safeType,
    subtype: String(raw.subtype || subtypes[safeType][0]),
    address: {
      ...base.address,
      ...address,
      district: String(address.district || raw.district || base.address.district),
      khoroo: String(address.khoroo || raw.khoroo || ""),
      khotkhon: String(address.khotkhon || raw.khotkhon || ""),
      street: String(address.street || raw.street || ""),
      buildingNumber: String(address.buildingNumber || raw.buildingNumber || ""),
      unit: String(address.unit || raw.unit || ""),
      floorBasement: clampInt(address.floorBasement, 0, 20),
      floorAbove: clampInt(address.floorAbove || raw.floorAbove, 0, 80),
      selectedFloor: String(address.selectedFloor || raw.selectedFloor || base.address.selectedFloor),
    },
    specs: {
      ...base.specs,
      ...specs,
      areaCert: String(specs.areaCert || raw.area || ""),
      rooms: String(specs.rooms || raw.rooms || ""),
      bedrooms: String(specs.bedrooms || raw.bedrooms || ""),
      bathrooms: String(specs.bathrooms || raw.bathrooms || ""),
      windows: normalizeWindows(specs.windows),
      officeNeeds: Array.isArray(specs.officeNeeds) ? specs.officeNeeds.map(String) : [],
    },
    infra: {
      ...base.infra,
      ...toRecord(raw.infra),
    } as SmartDraft["infra"],
    community: {
      services: arrayOfStrings(toRecord(raw.community).services),
      security: arrayOfStrings(toRecord(raw.community).security),
      amenities: arrayOfStrings(toRecord(raw.community).amenities ?? raw.amenities),
    },
    included: {
      furniture: arrayOfStrings(toRecord(raw.included).furniture),
      equipment: arrayOfStrings(toRecord(raw.included).equipment),
      extra: arrayOfStrings(toRecord(raw.included).extra ?? raw.included),
    },
    state: {
      ...base.state,
      ...state,
      condition: String(state.condition || raw.condition || base.state.condition),
      current: String(state.current || raw.condition || base.state.current),
      commissionYear: String(state.commissionYear || raw.commissionYear || ""),
    },
    pricing: {
      ...base.pricing,
      ...pricing,
      monthlyPrice: String(pricing.monthlyPrice || raw.monthlyPrice || raw.price || ""),
      totalPrice: String(pricing.totalPrice || raw.totalPrice || ""),
      deposit: String(pricing.deposit || raw.deposit || ""),
      paymentForms: normalizePaymentForms(pricing.paymentForms),
      rentFrequency: normalizeRentFrequency(String(pricing.rentFrequency || raw.rentFrequency || base.pricing.rentFrequency)),
      rentDiscounts: normalizeRentDiscounts(pricing.rentDiscounts),
    },
    media: {
      ...base.media,
      ...media,
      photos: normalizePhotos(media.photos ?? raw.photos),
      documents: normalizeDocuments(media.documents),
      coverIndex: clampInt(media.coverIndex, 0, 999),
      videoLink: String(media.videoLink || ""),
    },
    declarations: {
      ...base.declarations,
      ...toRecord(raw.declarations),
      truth: Boolean(toRecord(raw.declarations).truth ?? raw.truth),
      authority: Boolean(toRecord(raw.declarations).authority ?? raw.authority),
      terms: Boolean(toRecord(raw.declarations).terms ?? raw.terms),
    },
    services: {
      ...base.services,
      ...services,
      verified: services.verified == null ? true : Boolean(services.verified || serviceList.includes("Verified болгох")),
      brokerage: services.brokerage == null ? serviceList.includes("Мэргэжлийн зуучлагчаар зуучлуулах") : Boolean(services.brokerage),
      sponsored: services.sponsored == null ? serviceList.includes("Sponsored болгох") : Boolean(services.sponsored),
      relation: String(services.relation || raw.relation || base.services.relation),
    },
    roomDetails: Array.isArray(raw.roomDetails)
      ? raw.roomDetails.map((room, index) => normalizeRoom(room, index))
      : [],
    // Coords are now real WGS84 (>1). Older drafts stored 0–1 normalized values —
    // discard those and fall back to the district centre.
    lat: typeof raw.lat === "number" && raw.lat > 1 ? raw.lat : loc.lat,
    lng: typeof raw.lng === "number" && raw.lng > 1 ? raw.lng : loc.lng,
    locationTouched:
      Boolean(raw.locationTouched) && typeof raw.lat === "number" && raw.lat > 1,
  };

  if (!subtypes[out.propertyType].includes(out.subtype)) out.subtype = subtypes[out.propertyType][0];
  out.specs.windows = normalizeWindows(out.specs.windows);
  out.address.floorTotal = out.address.floorBasement + out.address.floorAbove;
  normalizeSelectedFloor(out);
  infraFields.forEach((field) => {
    // internet is multi-select (comma-joined) and any field may hold a custom
    // "Бусад" free-text value — only backfill when the value is empty.
    if (field.key === "internet") return;
    if (!out.infra[field.key]) {
      out.infra[field.key] = field.choices[0];
    }
  });
  const heatingSubs = heatingSubChoices[out.infra.heating];
  if (heatingSubs) {
    if (!heatingSubs.includes(out.infra.heatingSub)) {
      out.infra.heatingSub = heatingSubs[0];
    }
  } else {
    out.infra.heatingSub = "";
  }
  if (!certOptions.includes(out.state.certStatus)) out.state.certStatus = base.state.certStatus;
  if (!collateralOptions.includes(out.state.collateral)) out.state.collateral = base.state.collateral;
  if (!rentFrequencies.includes(out.pricing.rentFrequency)) out.pricing.rentFrequency = base.pricing.rentFrequency;
  if (out.media.coverIndex >= out.media.photos.length) out.media.coverIndex = 0;
  // Coords are real WGS84 now. Clamp to valid ranges (and migrate away from the
  // old 0–1 normalized values, which fall outside UB and land in the ocean).
  const inUbRange = out.lat > 40 && out.lat < 55 && out.lng > 80 && out.lng < 120;
  if (!inUbRange) {
    out.lat = loc.lat;
    out.lng = loc.lng;
    out.locationTouched = false;
  }
  return out;
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function normalizePaymentForms(value: unknown): string[] {
  const paymentMap: Record<string, string> = {
    "Бэлэн": salePaymentForms[0],
    "Банкны зээл": salePaymentForms[1],
    "Бартер": salePaymentForms[3],
    "Хуваарьт төлөлт": salePaymentForms[2],
  };
  const items = arrayOfStrings(value).map((item) => paymentMap[item] || item);
  return items.length ? items : [salePaymentForms[0]];
}

function normalizeRentFrequency(value: string) {
  if (/^\d+\s*сар$/.test(value)) return `${value} тутам`;
  return rentFrequencies.includes(value) ? value : "1 сар тутам";
}

function normalizeRentDiscounts(value: unknown): Record<RentMonth, number> {
  const raw = toRecord(value);
  return {
    1: clampDecimal(raw[1] ?? raw["1"], 0, 100, 1),
    2: clampDecimal(raw[2] ?? raw["2"], 0, 100, 1),
    3: clampDecimal(raw[3] ?? raw["3"], 0, 100, 1),
    4: clampDecimal(raw[4] ?? raw["4"], 0, 100, 1),
    6: clampDecimal(raw[6] ?? raw["6"] ?? 5, 0, 100, 1),
    12: clampDecimal(raw[12] ?? raw["12"] ?? 10, 0, 100, 1),
  };
}

function normalizePhotos(value: unknown): PhotoDraft[] {
  if (!Array.isArray(value)) return [];
  const categoryMap: Record<string, string> = {
    "Нүүр зураг": "Нүүрний зураг",
    "План": "План зураг",
    "Дотор": "Дотор зураг",
    "Гадна": "Гадна орчны зураг",
    "Мастер төлөвлөгөө": "Мастер төлөвлөгөө, хотхоны зураг",
    "Харагдац": "Дотроос гадагшаа харагдацын зураг",
    "Хотхон": "Хотхоны бусад үзүүлэлтийн зураг",
  };
  return value.map((item, index) => {
    const raw = toRecord(item);
    const seed = String(raw.seed || raw.id || item || `${Date.now()}-${index}`);
    const url = typeof raw.url === "string" ? raw.url : undefined;
    const mediaId = typeof raw.mediaId === "number" ? raw.mediaId : undefined;
    return {
      id: String(raw.id || `photo-${seed}-${index}`),
      seed,
      category: categoryMap[String(raw.category)] || String(raw.category || (index ? "Дотор зураг" : "Нүүрний зураг")),
      ...(url ? { url } : {}),
      ...(mediaId != null ? { mediaId } : {}),
    };
  });
}

function normalizeDocuments(value: unknown): DocumentDraft[] {
  if (!Array.isArray(value)) return [];
  const valid = DOCUMENT_CATEGORIES as readonly string[];
  return value.map((item, index) => {
    const raw = toRecord(item);
    const category = valid.includes(String(raw.category))
      ? (String(raw.category) as DocumentCategory)
      : "document";
    const url = typeof raw.url === "string" ? raw.url : undefined;
    const mediaId = typeof raw.mediaId === "number" ? raw.mediaId : undefined;
    return {
      id: String(raw.id || `doc-${Date.now()}-${index}`),
      category,
      name: String(raw.name || "файл"),
      ...(url ? { url } : {}),
      ...(mediaId != null ? { mediaId } : {}),
    };
  });
}

function loadInitialDraft() {
  if (typeof window === "undefined") return createDefaultDraft();
  try {
    const raw = window.localStorage.getItem(SMART_LIST_PROP_DRAFT_KEY);
    return normalizeDraft(raw ? JSON.parse(raw) : undefined);
  } catch {
    return createDefaultDraft();
  }
}

function storeSubmission(payload: SubmissionPayload) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SMART_LIST_PROP_SUBMISSIONS_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(current) ? current : [];
    window.localStorage.setItem(
      SMART_LIST_PROP_SUBMISSIONS_KEY,
      JSON.stringify([payload, ...list].slice(0, 20))
    );
  } catch {
    // Local persistence is a UX enhancement; submission preview still works without it.
  }
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cursor = obj;
  parts.slice(0, -1).forEach((key) => {
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  });
  cursor[parts[parts.length - 1]] = value;
}

function clampInt(value: unknown, min = 0, max = 99) {
  const n = parseInt(String(value ?? ""), 10);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

function clampDecimal(value: unknown, min = 0, max = 99999, decimals = 0) {
  const n = parseFloat(String(value ?? ""));
  const clamped = Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
  if (!decimals) return Math.round(clamped);
  const pow = Math.pow(10, decimals);
  return Number((Math.round(clamped * pow) / pow).toFixed(decimals));
}

function steppedNumber(value: unknown, delta: number, min: number, max: number, decimals = 0) {
  const base = parseFloat(String(value ?? ""));
  const next = clampDecimal((Number.isFinite(base) ? base : min) + delta, min, max, decimals);
  return decimals ? String(next).replace(/\.0$/, "") : String(Math.round(next));
}

function getGoal(goal: GoalKey) {
  return goals.find((item) => item.key === goal) ?? goals[1];
}

function getPropertyType(type: PropertyKey) {
  return propertyTypes.find((item) => item.key === type) ?? propertyTypes[0];
}

function modeOf(goal: GoalKey): "sale" | "rent" {
  return getGoal(goal).mode;
}

function needsRooms(draft: SmartDraft) {
  return Boolean(getPropertyType(draft.propertyType).residential);
}

function isCommercial(draft: SmartDraft) {
  return Boolean(getPropertyType(draft.propertyType).commercial);
}

function areaLabel(draft: SmartDraft) {
  if (draft.propertyType === "land") return "Газрын талбай";
  if (draft.propertyType === "parking") return "Зогсоолын талбай";
  if (draft.propertyType === "warehouse") return "Агуулахын талбай";
  return "Нийт талбай (Гэрчилгээгээр)";
}

function priceOf(draft: SmartDraft) {
  return modeOf(draft.goal) === "sale"
    ? parseFloat(draft.pricing.totalPrice) || 0
    : parseFloat(draft.pricing.monthlyPrice) || 0;
}

function windowTotal(value: unknown) {
  const counts = normalizeWindows(value);
  return windowDirections.reduce((sum, dir) => sum + (Number(counts[dir.key]) || 0), 0);
}

function windowSummary(value: unknown) {
  const counts = normalizeWindows(value);
  return windowDirections
    .map((dir) => {
      const n = Number(counts[dir.key]) || 0;
      return n > 0 ? `${dir.label} ${n} цонх` : "";
    })
    .filter(Boolean)
    .join(" · ");
}

function floorList(draft: SmartDraft) {
  const basement = Math.max(0, draft.address.floorBasement || 0);
  const above = Math.max(1, draft.address.floorAbove || 1);
  return Array.from({ length: basement }, (_, i) => `B${basement - i}`).concat(
    Array.from({ length: Math.min(above, 80) }, (_, i) => `F${String(i + 1).padStart(2, "0")}`)
  );
}

/** The floors the unit itself occupies (from selectedFloor, which may be a
 *  range like "F01-F02"). Rooms pick their floor from these, not the whole
 *  building. Falls back to the full list if nothing is selected. */
function unitFloors(draft: SmartDraft): string[] {
  const all = floorList(draft);
  const parts = (draft.address.selectedFloor || "").split("-").filter(Boolean);
  if (parts.length === 0) return all;
  if (parts.length === 1) return parts;
  const i = all.indexOf(parts[0]);
  const j = all.indexOf(parts[1]);
  if (i >= 0 && j >= 0) return all.slice(Math.min(i, j), Math.max(i, j) + 1);
  return parts;
}

function normalizeSelectedFloor(draft: SmartDraft) {
  const floors = floorList(draft);
  // selectedFloor may be a single floor ("F01") or a range ("F01-F02").
  const parts = (draft.address.selectedFloor || "").split("-").filter(Boolean);
  const valid = parts.length > 0 && parts.every((p) => floors.includes(p));
  if (!valid) {
    draft.address.selectedFloor = floors.includes("F01") ? "F01" : floors[0] || "F01";
  }
}

function formatFloor(type: "B" | "F", num: unknown) {
  const n = clampInt(num, 1, 99);
  return type === "B" ? `B${n}` : `F${String(n).padStart(2, "0")}`;
}

function floorParts(draft: SmartDraft) {
  const raw = draft.address.selectedFloor || "F01";
  const type: "B" | "F" = raw[0] === "B" ? "B" : "F";
  const max = type === "B" ? Math.max(1, draft.address.floorBasement || 1) : Math.max(1, draft.address.floorAbove || 1);
  const num = clampInt(raw.replace(/\D/g, ""), 1, max);
  return { type, num, value: formatFloor(type, num) };
}

function floorTitle(value: string) {
  if (value[0] === "B") return `${value} · зоорийн ${parseInt(value.slice(1), 10) || 1}`;
  return `${value} · ${parseInt(value.slice(1), 10) || 1}-р давхар`;
}

function floorCandidates(draft: SmartDraft) {
  const basement = Math.max(0, draft.address.floorBasement || 0);
  const above = Math.max(0, draft.address.floorAbove || 0);
  const items: Array<{ type: "B" | "F"; num: number }> = [];
  if (basement > 1) items.push({ type: "B", num: basement });
  if (basement > 0) items.push({ type: "B", num: 1 });
  [1, 2, 3, Math.ceil((above || 1) / 2), above || 1]
    .filter((n) => n >= 1 && n <= Math.max(above, 1))
    .forEach((num) => items.push({ type: "F", num }));
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = formatFloor(item.type, item.num);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function addressLine(draft: SmartDraft) {
  return [
    draft.address.district,
    draft.address.khoroo ? `${draft.address.khoroo}-р хороо` : "",
    draft.address.khotkhon || draft.address.street,
    draft.address.buildingNumber ? `${draft.address.buildingNumber}-р байр` : draft.address.buildingName,
  ]
    .filter(Boolean)
    .join(", ");
}

function areaQuickValues(draft: SmartDraft) {
  if (draft.propertyType === "land") return [300, 500, 700, 1000, 1500];
  if (draft.propertyType === "parking") return [12, 15, 18, 24, 30];
  if (draft.propertyType === "warehouse" || draft.propertyType === "industrial") return [50, 100, 200, 500, 1000];
  if (isCommercial(draft)) return [30, 50, 80, 120, 200];
  return [30, 40, 50, 60, 80, 100];
}

function money(value: number) {
  return value ? `${value.toLocaleString("en-US")}₮` : "-";
}

function squareMeters(value: unknown) {
  const n = parseFloat(String(value || ""));
  return n > 0 ? `${n.toLocaleString("en-US")} м²` : "-";
}

function requiredItems(draft: SmartDraft): Requirement[] {
  return [
    { id: "goal", label: "Зорилго", ok: Boolean(draft.goal), step: 2 },
    { id: "propertyType", label: "ҮХЭХ зориулалт", ok: Boolean(draft.propertyType), step: 2 },
    { id: "subtype", label: "Дэд зориулалт", ok: Boolean(draft.subtype), step: 2 },
    { id: "district", label: "Дүүрэг/Сум", ok: Boolean(draft.address.district), step: 1 },
    { id: "khoroo", label: "Хороо/Баг", ok: Boolean(draft.address.khoroo.trim()), step: 1 },
    {
      id: "khotkhonOrStreet",
      label: "Хотхон, хороолол эсвэл гудамж",
      ok: Boolean((draft.address.khotkhon || draft.address.street).trim()),
      step: 1,
    },
    { id: "areaCert", label: areaLabel(draft), ok: (parseFloat(draft.specs.areaCert) || 0) > 0, step: 1 },
    { id: "rooms", label: "Нийт өрөөний тоо", ok: !needsRooms(draft) || Boolean(draft.specs.rooms), step: 1 },
    {
      id: "price",
      label: modeOf(draft.goal) === "sale" ? "Нийт үнэ" : "Нийт үнэ/сар",
      ok: priceOf(draft) > 0,
      step: 4,
    },
    { id: "photos", label: "Зураг", ok: draft.media.photos.length > 0, step: 5 },
    { id: "relation", label: "Холбоо хамаарал", ok: Boolean(draft.services.relation), step: 6 },
    { id: "truth", label: "Дээрх мэдээлэл үнэн зөв", ok: draft.declarations.truth, step: 6 },
    { id: "authority", label: "Эрх бүхий этгээд", ok: draft.declarations.authority, step: 6 },
    { id: "terms", label: "Үйлчилгээний нөхцөл зөвшөөрөх", ok: draft.declarations.terms, step: 6 },
  ];
}

/**
 * Whether the user has put anything into a requirement-free step. Currently
 * only step 3 (АЛХАМ 06-08: infra / amenities / included) is requirement-free —
 * it's "engaged with" once any amenity or included item is selected.
 */
function stepHasContent(draft: SmartDraft, step: number): boolean {
  if (step === 3) {
    return (
      communityGroups.some((group) => draft.community[group.key].length > 0) ||
      includedGroups.some((group) => draft.included[group.key].length > 0)
    );
  }
  return false;
}

function optionalItems(draft: SmartDraft): OptionalItem[] {
  return [
    { label: "Map pin эсвэл Google Maps линк", ok: draft.locationTouched || Boolean(draft.address.googleMapLink.trim()) },
    { label: "Хотхоны үйлчилгээ", ok: communityGroups.some((group) => draft.community[group.key].length > 0) },
    { label: "Дагалдах зүйлс", ok: includedGroups.some((group) => draft.included[group.key].length > 0) },
    { label: "Гэрчилгээний дугаар", ok: Boolean(draft.state.certNumber.trim()) },
    { label: "Баримт хавсаргасан", ok: draft.state.certificateAttached || draft.state.contractAttached },
    { label: "Видео/линк", ok: Boolean(draft.media.videoLink.trim()) },
  ];
}

function completionPercent(draft: SmartDraft) {
  const req = requiredItems(draft);
  const opt = optionalItems(draft);
  return Math.round(
    (req.filter((item) => item.ok).length / req.length) * 74 +
      (opt.filter((item) => item.ok).length / opt.length) * 26
  );
}

function buildSubmission(draft: SmartDraft): SubmissionPayload {
  const id = Date.now();
  const type = getPropertyType(draft.propertyType);
  const price = priceOf(draft);
  const area = parseFloat(draft.specs.areaCert) || 0;
  const unitPrice = area && price ? Math.round(price / area) : 0;
  const titlePlace = draft.address.khotkhon || draft.address.street || draft.address.district;
  const features = [
    ...communityGroups.flatMap((group) => draft.community[group.key]),
    ...includedGroups.flatMap((group) => draft.included[group.key]),
    ...draft.specs.officeNeeds,
  ];

  return {
    id,
    createdAt: new Date().toISOString(),
    listing: {
      id,
      mode: modeOf(draft.goal),
      title: `${type.label} · ${titlePlace}`,
      propertyType: type.label,
      subtype: draft.subtype,
      district: draft.address.district,
      khoroo: draft.address.khoroo,
      addressLine: addressLine(draft),
      area,
      rooms: parseInt(draft.specs.rooms, 10) || 0,
      bedrooms: parseInt(draft.specs.bedrooms, 10) || 0,
      bathrooms: parseInt(draft.specs.bathrooms, 10) || 0,
      floor: draft.address.selectedFloor,
      price,
      unitPrice,
      features,
      lat: draft.lat,
      lng: draft.lng,
      coverSeed: draft.media.photos[draft.media.coverIndex]?.seed || "neomap-cover",
    },
    detail: cloneDraft(draft),
  };
}

function Field({
  id,
  label,
  required,
  children,
  hint,
}: {
  id?: string;
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div id={id} className="min-w-0 scroll-mt-24 space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required ? (
          <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
            заавал
          </Badge>
        ) : (
          <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">
            дараа нөхөж болно
          </Badge>
        )}
      </Label>
      {children}
      {hint ? <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
    >
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function ToggleChip({
  active,
  children,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto min-h-8 justify-start whitespace-normal rounded-md px-2.5 py-1.5 text-left",
        active && "shadow-none"
      )}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
      {children}
    </Button>
  );
}

function NumberStepper({
  id,
  label,
  value,
  onChange,
  required,
  min = 0,
  max = 99999,
  step = 1,
  decimals = 0,
  placeholder = "",
  quick,
  quickSuffix = "",
  hint,
}: {
  id?: string;
  label: string;
  value: string | number | null;
  onChange: (value: string) => void;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  placeholder?: string;
  quick?: number[];
  quickSuffix?: string;
  hint?: string;
}) {
  const rawValue = value == null ? "" : String(value);
  const numeric = parseFloat(rawValue);
  return (
    <div className="lp-step-control">
      <Field id={id} label={label} required={required} hint={hint}>
        <div className="lp-stepper">
          <button
            type="button"
            className="lp-step-btn"
            disabled={Number.isFinite(numeric) && numeric <= min}
            onClick={() => onChange(steppedNumber(rawValue, -step, min, max, decimals))}
            aria-label={`${label} хасах`}
          >
            <Minus className="size-3.5" />
          </button>
          <input
            className="lp-step-value"
            type="number"
            inputMode={decimals ? "decimal" : "numeric"}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            value={rawValue}
            onChange={(event) => onChange(event.target.value)}
          />
          <button
            type="button"
            className="lp-step-btn primary"
            disabled={Number.isFinite(numeric) && numeric >= max}
            onClick={() => onChange(steppedNumber(rawValue, step, min, max, decimals))}
            aria-label={`${label} нэмэх`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </Field>
      {quick?.length ? (
        <div className="lp-quick-row">
          {quick.map((item) => (
            <button
              key={item}
              type="button"
              className={cn("lp-quick-chip", Number.isFinite(numeric) && Math.abs(numeric - item) < 0.001 && "is-active")}
              onClick={() => onChange(String(item))}
            >
              {item}
              {quickSuffix}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WindowStepper({
  value,
  onChange,
  compact,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
  label: string;
}) {
  return (
    <div className={cn("lp-window-stepper", compact && "compact")}>
      <button
        type="button"
        className="lp-window-step-btn"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label={`${label} цонх хасах`}
      >
        <Minus className="size-3" />
      </button>
      <input
        className="lp-window-value"
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(event) => onChange(clampInt(event.target.value, 0, 99))}
        aria-label={`${label} харсан цонхны тоо`}
      />
      <button
        type="button"
        className="lp-window-step-btn primary"
        onClick={() => onChange(Math.min(99, value + 1))}
        aria-label={`${label} цонх нэмэх`}
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  title,
  sub,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  sub?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        {sub ? <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{sub}</span> : null}
      </span>
    </label>
  );
}

function StepHeader({ step }: { step: number }) {
  const group = groups.find((item) => item.step === step) ?? groups[0];
  const Icon = group.icon;
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase text-[color:var(--gold-text)]">
          {group.sub}
        </div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Icon className="size-5 text-accent" />
          {group.title}
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5 md:justify-end">
        {group.covers.map((cover) => (
          <Badge key={cover} variant="outline" className="rounded-full">
            {cover}
          </Badge>
        ))}
      </div>
    </div>
  );
}

type AddressDraft = SmartDraft["address"];

/**
 * Cascading Улс → Хот → Дүүрэг → Хороо selectors backed by the live address
 * API. Stores both the display name and the master id on the draft so the
 * create payload carries real ids. Each level is fetched lazily (only when its
 * parent is chosen) and cached.
 */
function AddressCascade({
  address,
  setPath,
}: {
  address: AddressDraft;
  setPath: (path: string, value: unknown) => void;
}) {
  const provinces = useProvinces();
  const districts = useDistricts(address.provinceId ?? undefined);
  const khoroos = useKhoroos(address.districtId ?? undefined);
  const streets = useStreets(address.khorooId ?? undefined);
  const khoroolols = useKhoroolols(address.khorooId ?? undefined);
  const khotkhons = useKhotkhons(address.khorooId ?? undefined);
  const buildings = useBuildings(address.khorooId ?? undefined);

  // Auto-select when there is exactly one province (e.g. Улаанбаатар only).
  useEffect(() => {
    if (address.provinceId == null && provinces.data?.length === 1) {
      const p = provinces.data[0];
      setPath("address.provinceId", String(p.id));
      setPath("address.city", optionName(p));
    }
  }, [address.provinceId, provinces.data, setPath]);

  const toOptions = (items: AddressOption[] | undefined) => [
    { label: "— сонгох —", value: "" },
    ...(items ?? []).map((i) => ({ value: String(i.id), label: optionName(i) })),
  ];

  const pick = (items: AddressOption[] | undefined, value: string) =>
    (items ?? []).find((i) => String(i.id) === value);

  // The provinces table can be empty until the backend seeds it; surface that
  // instead of showing an inexplicably blank dropdown.
  const provincesEmpty =
    provinces.isSuccess && (provinces.data?.length ?? 0) === 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Хот / Аймаг" required>
        <NativeSelect
          value={address.provinceId != null ? String(address.provinceId) : ""}
          options={toOptions(provinces.data)}
          onChange={(value) => {
            const item = pick(provinces.data, value);
            setPath("address.provinceId", item ? String(item.id) : null);
            setPath("address.city", item ? optionName(item) : "");
            setPath("address.districtId", null);
            setPath("address.district", "");
            setPath("address.khorooId", null);
            setPath("address.khoroo", "");
          }}
        />
        {provincesEmpty ? (
          <p className="mt-1 text-xs text-amber-600">
            Хаягийн жагсаалт серверт хараахан ороогүй байна — доорх талбаруудыг гараар бөглөнө үү.
          </p>
        ) : null}
      </Field>
      <Field id="field-district" label="Дүүрэг / Сум" required>
        <NativeSelect
          value={address.districtId != null ? String(address.districtId) : ""}
          options={toOptions(districts.data)}
          onChange={(value) => {
            const item = pick(districts.data, value);
            setPath("address.districtId", item ? String(item.id) : null);
            setPath("address.district", item ? optionName(item) : "");
            setPath("address.khorooId", null);
            setPath("address.khoroo", "");
            setPath("address.streetId", null);
            setPath("address.khoroololId", null);
            setPath("address.khotkonId", null);
            setPath("address.buildingId", null);
          }}
        />
      </Field>
      <Field id="field-khoroo" label="Хороо / Баг" required>
        <NativeSelect
          value={address.khorooId != null ? String(address.khorooId) : ""}
          options={toOptions(khoroos.data)}
          onChange={(value) => {
            const item = pick(khoroos.data, value);
            setPath("address.khorooId", item ? String(item.id) : null);
            setPath("address.khoroo", item ? optionName(item) : "");
            setPath("address.streetId", null);
            setPath("address.khoroololId", null);
            setPath("address.khotkonId", null);
            setPath("address.buildingId", null);
          }}
        />
      </Field>
      <Field label="Гудамж" hint="Заавал биш">
        <NativeSelect
          value={address.streetId != null ? String(address.streetId) : ""}
          options={toOptions(streets.data)}
          onChange={(value) => {
            const item = pick(streets.data, value);
            setPath("address.streetId", item ? String(item.id) : null);
            if (item) setPath("address.street", optionName(item));
          }}
        />
      </Field>
      <Field label="Хороолол" hint="Заавал биш">
        <NativeSelect
          value={address.khoroololId != null ? String(address.khoroololId) : ""}
          options={toOptions(khoroolols.data)}
          onChange={(value) => {
            const item = pick(khoroolols.data, value);
            setPath("address.khoroololId", item ? String(item.id) : null);
            if (item) setPath("address.zip", optionName(item));
          }}
        />
      </Field>
      <Field label="Хотхон / цогцолбор" hint="Заавал биш">
        <NativeSelect
          value={address.khotkonId != null ? String(address.khotkonId) : ""}
          options={toOptions(khotkhons.data)}
          onChange={(value) => {
            const item = pick(khotkhons.data, value);
            setPath("address.khotkonId", item ? String(item.id) : null);
            if (item) setPath("address.khotkhon", optionName(item));
          }}
        />
      </Field>
      <Field label="Барилга" hint="Заавал биш">
        <NativeSelect
          value={address.buildingId != null ? String(address.buildingId) : ""}
          options={toOptions(buildings.data)}
          onChange={(value) => {
            const item = pick(buildings.data, value);
            setPath("address.buildingId", item ? String(item.id) : null);
            if (item) setPath("address.buildingNumber", optionName(item));
          }}
        />
      </Field>
    </div>
  );
}

export function ListPropertyWizard() {
  const [step, setStep] = useState(1);
  // Steps the user has opened — used to mark requirement-free sections (e.g.
  // step 3, which is entirely optional) as "done" once they've been reviewed.
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([1]));
  // Start from defaults on both server and client so the initial render matches;
  // the persisted draft is loaded in an effect below to avoid a hydration mismatch.
  const [draft, setDraft] = useState<SmartDraft>(createDefaultDraft);
  const [submitted, setSubmitted] = useState<SubmissionPayload | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const draftLoadedRef = useRef(false);
  const editLoadedRef = useRef(false);
  // `/list-property?edit=<id>` opens the wizard in EDIT mode for an existing
  // listing. Read from the URL on the client to avoid a Suspense boundary.
  const [editId, setEditId] = useState<number | null>(null);
  const pushToast = useStore((s) => s.pushToast);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const formOptions = useFormOptions();
  const editListing = useListing(editId);
  const router = useRouter();
  const createListingMutation = useCreateListing();
  const updateListingMutation = useUpdateListing(editId ?? 0);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("edit");
    const id = raw ? Number(raw) : NaN;
    if (Number.isInteger(id) && id > 0) setEditId(id);
  }, []);

  // Load the persisted draft once, after mount (client only). Skip when editing
  // — the listing being edited loads the draft instead (below).
  useEffect(() => {
    if (draftLoadedRef.current) return;
    const raw = new URLSearchParams(window.location.search).get("edit");
    if (raw) return; // edit mode: don't clobber with the local "new listing" draft
    draftLoadedRef.current = true;
    const saved = loadInitialDraft();
    setDraft(saved);
  }, []);

  // Populate the draft from the fetched listing once (edit mode).
  useEffect(() => {
    if (editId == null || editLoadedRef.current) return;
    const resource = editListing.data?.resource;
    if (!resource) return;
    editLoadedRef.current = true;
    setDraft(draftFromListing(resource, formOptions.data?.classification));
  }, [editId, editListing.data?.resource, formOptions.data?.classification]);

  useEffect(() => {
    // Don't persist an edited listing over the user's in-progress new draft.
    if (editId != null) return;
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(SMART_LIST_PROP_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Ignore storage errors; the in-memory form stays usable.
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [draft, editId]);

  // Scroll back to the top whenever the step changes so each new step starts at
  // its header instead of wherever the previous step was scrolled to.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    setVisitedSteps((prev) => (prev.has(step) ? prev : new Set(prev).add(step)));
  }, [step]);

  const selectedType = getPropertyType(draft.propertyType);
  const SelectedTypeIcon = selectedType.icon;
  const isRent = modeOf(draft.goal) === "rent";
  const price = priceOf(draft);
  const area = parseFloat(draft.specs.areaCert) || 0;
  const unitPrice = price && area ? Math.round(price / area) : 0;
  const required = useMemo(() => requiredItems(draft), [draft]);
  const optional = useMemo(() => optionalItems(draft), [draft]);
  const completion = useMemo(() => completionPercent(draft), [draft]);
  const missing = required.filter((item) => !item.ok);

  const mutate = (recipe: (next: SmartDraft) => void) => {
    setDraft((current) => {
      const next = cloneDraft(current);
      recipe(next);
      setSubmitted(null);
      return next;
    });
  };

  const actions: DraftActions = {
    setPath: (path, value) => {
      mutate((next) => {
        const prevType = next.propertyType;
        const prevDistrict = next.address.district;
        setByPath(next as unknown as Record<string, unknown>, path, value);
        if (path === "propertyType" && next.propertyType !== prevType) {
          next.subtype = subtypes[next.propertyType][0];
        }
        if (path === "address.district" && next.address.district !== prevDistrict && !next.locationTouched) {
          const loc = defaultListPropLocation(next.address.district);
          next.lat = loc.lat;
          next.lng = loc.lng;
        }
      });
    },
    toggleArray: (path, value) => {
      mutate((next) => {
        const current = arrayOfStrings(getByPath(next, path));
        const set = new Set(current);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        setByPath(next as unknown as Record<string, unknown>, path, Array.from(set));
      });
    },
    toggleBoolean: (path) => {
      mutate((next) => {
        setByPath(next as unknown as Record<string, unknown>, path, !getByPath(next, path));
      });
    },
    mutate,
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem(SMART_LIST_PROP_DRAFT_KEY, JSON.stringify(draft));
      setSavedAt(new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setSavedAt("хадгалах боломжгүй");
    }
  };

  const resetDraft = () => {
    const next = createDefaultDraft();
    setDraft(next);
    setSubmitted(null);
    setSavedAt(null);
    // Otherwise a step visited in the previous listing (e.g. step 2 — goal/
    // category, whose fields ship with non-empty defaults) stays marked done
    // in the sidebar for the brand-new draft, before the user has touched it.
    setVisitedSteps(new Set([1]));
    try {
      window.localStorage.removeItem(SMART_LIST_PROP_DRAFT_KEY);
    } catch {
      // noop
    }
  };

  /**
   * Jumps to a missing required field's step, scrolls it into view, and
   * flashes it — used whenever the user tries to move on (Next / Submit)
   * without satisfying a requirement, instead of just leaving a disabled
   * button with no explanation.
   */
  const focusMissingField = (item: Requirement) => {
    setStep(item.step);
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      const el = document.getElementById(`field-${item.id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("lp-field-flash");
      window.setTimeout(() => el.classList.remove("lp-field-flash"), 1600);
    }, 80);
  };

  const submit = async () => {
    if (submitting) return;
    if (missing.length) {
      pushToast(`«${missing[0].label}» талбарыг бөглөнө үү`, "danger");
      focusMissingField(missing[0]);
      return;
    }
    const payload = buildSubmission(draft);
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (isLoggedIn) {
        // Logged-in users create/update a real listing via the API, mapping the
        // wizard draft to a StoreListingRequest (subtype keys resolved from
        // the live form-options metadata).
        const body = buildCreateRequest(
          draft,
          formOptions.data?.classification,
          formOptions.data?.enumOptions
        );
        if (editId != null) {
          await updateListingMutation.mutateAsync(body);
        } else {
          await createListingMutation.mutateAsync(body);
        }
      } else {
        await submitListingDraft(payload);
      }
      // Persist to local history + show the success banner ONLY after the server
      // accepted it. resetDraft() nulls `submitted`, so set it again afterwards.
      storeSubmission(payload);
      pushToast(editId != null ? "Зар амжилттай шинэчлэгдлээ" : "Зар амжилттай илгээгдлээ", "success");
      if (editId != null) {
        // Editing an existing listing: the caches are already invalidated by
        // the mutation hooks above, so "Миний зарууд" shows the fresh data —
        // send the user back there instead of leaving them on the wizard.
        router.push("/profile");
        return;
      }
      resetDraft();
      setSubmitted(payload);
      setStep(1);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? Object.values(err.validationErrors ?? {})[0]?.[0] ??
            "Серверийн алдаа гарлаа"
          : err instanceof Error
            ? err.message
            : "Илгээх үед алдаа гарлаа";
      setSubmitError(message);
      pushToast("Зар илгээхэд алдаа гарлаа — дахин оролдоно уу", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    const blocking = missing.find((item) => item.step === step);
    if (blocking) {
      pushToast(`«${blocking.label}» талбарыг бөглөнө үү`, "danger");
      focusMissingField(blocking);
      return;
    }
    setStep((current) => Math.min(6, current + 1));
  };
  const goBack = () => setStep((current) => Math.max(1, current - 1));

  return (
    <div className="lp-shadcn min-h-screen px-4 py-5 pb-24 lg:px-8 lg:pb-5">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Image
                src="/images/logo/horizontal-light.png"
                alt="NEOMAP"
                width={120}
                height={40}
                className="shrink-0"
              />
              <Badge className="rounded-full bg-accent text-accent-foreground hover:bg-accent">
                <WandSparkles className="size-3.5" />
                Ухаалаг зарын туслах
              </Badge>
              {editId != null ? (
                <Badge variant="outline" className="h-6 rounded-full border-amber-400 px-2 text-amber-600">
                  <Pencil className="size-3" />
                  Засварлаж байна #{editId}
                </Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold">{editId != null ? "Зар засах" : "Зар оруулах"}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {editId != null
                ? editListing.isLoading
                  ? "Зарын мэдээллийг ачаалж байна…"
                  : "Одоо байгаа зараа шинэчилж, дахин илгээнэ."
                : "Зар оруулах 13 алхмын мэдээлэл, логик, баталгаажуулалтыг 6 хэсэгт нэгтгэсэн хялбар урсгал."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="h-8 rounded-full px-3">
              {isRent ? <KeyRound className="size-3.5" /> : <Banknote className="size-3.5" />}
              {isRent ? "Түрээс / хөлслүүлэх" : "Худалдаа"}
            </Badge>
            <Badge variant="outline" className="h-8 rounded-full px-3">
              <SelectedTypeIcon className="size-3.5" />
              {selectedType.label}
            </Badge>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden space-y-3 lg:block lg:sticky lg:top-5 lg:self-start">
            <Card className="rounded-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Бүрэн байдал</CardTitle>
                  <div className="text-xl font-semibold tabular-nums text-[color:var(--gold-text)]">
                    {completion}%
                  </div>
                </div>
                <Progress value={completion} />
                <CardDescription>
                  {missing.length
                    ? `${missing.length} заавал бөглөх зүйл үлдсэн`
                    : "Нийтлэх хүсэлт илгээхэд бэлэн"}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="rounded-md py-2">
              <CardContent className="grid gap-1 px-2">
                {groups.map((group) => {
                  const Icon = group.icon;
                  const groupReqs = required.filter((item) => item.step === group.step);
                  // A section with required items is "done" when they're all
                  // satisfied. A requirement-free section (e.g. step 3 —
                  // infra/amenities/included, all optional) is "done" once the
                  // user has filled something in it OR simply reviewed it, so it
                  // can actually be checked off instead of never completing.
                  // Also gated on `visitedSteps`: some fields (goal/propertyType/
                  // subtype) ship with non-empty defaults so their requirements
                  // read as satisfied from the very first render — without this
                  // gate, that step's checkmark would show as done before the
                  // user ever opened it.
                  const done =
                    visitedSteps.has(group.step) &&
                    (groupReqs.length > 0
                      ? groupReqs.every((item) => item.ok)
                      : stepHasContent(draft, group.step));
                  const active = step === group.step;
                  return (
                    <Button
                      key={group.step}
                      type="button"
                      variant={active ? "secondary" : "ghost"}
                      onClick={() => setStep(group.step)}
                      className="h-auto justify-start rounded-md px-2 py-2 text-left"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md border bg-background",
                          active && "border-primary bg-primary text-primary-foreground",
                          done && !active && "border-emerald-600 bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {done && !active ? <Check className="size-4" /> : <Icon className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block whitespace-normal text-sm font-semibold">{group.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{group.sub}</span>
                      </span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="text-sm">13 алхмын хамрах хүрээ</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
                {Array.from({ length: 13 }, (_, index) => {
                  const item = index + 1;
                  const groupStep = item <= 3 ? 1 : item <= 5 ? 2 : item <= 8 ? 3 : item <= 10 ? 4 : item <= 11 ? 5 : 6;
                  return (
                    <span
                      key={item}
                      className={cn(
                        "flex h-7 items-center justify-center rounded-md border bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground",
                        groupStep <= step && "border-primary/30 bg-primary/10 text-primary",
                        groupStep === step && "border-primary"
                      )}
                    >
                      {String(item).padStart(2, "0")}
                    </span>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0 space-y-4">
            <StepHeader step={step} />
            {step === 1 ? (
              <StepTwo draft={draft} actions={actions} selectedType={selectedType} />
            ) : step === 2 ? (
              <StepOne draft={draft} actions={actions} />
            ) : step === 3 ? (
              <StepThree draft={draft} actions={actions} />
            ) : step === 4 ? (
              <StepFour
                draft={draft}
                actions={actions}
                isRent={isRent}
                price={price}
                area={area}
                unitPrice={unitPrice}
              />
            ) : step === 5 ? (
              <MediaSection draft={draft} actions={actions} />
            ) : (
              <StepFive
                draft={draft}
                actions={actions}
                missing={missing}
                optional={optional}
                price={price}
                selectedType={selectedType}
                onJumpToMissing={focusMissingField}
              />
            )}

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={step === 1 ? resetDraft : goBack}>
                  {step === 1 ? <X className="size-4" /> : <ChevronLeft className="size-4" />}
                  {step === 1 ? "Цэвэрлэх" : "Буцах"}
                </Button>
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="size-4" />
                  Түр хадгалах
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {savedAt ? <span className="text-xs text-muted-foreground">Draft: {savedAt}</span> : null}
                {step < 6 ? (
                  <Button onClick={goNext}>
                    Дараагийнх
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={submit}
                    disabled={submitting}
                    className="bg-primary text-primary-foreground"
                  >
                    <Send className="size-4" />
                    {submitting
                      ? editId != null
                        ? "Шинэчилж байна…"
                        : "Илгээж байна…"
                      : editId != null
                        ? "Зарын өөрчлөлтийг хадгалах"
                        : "Зар нийтлэх хүсэлт илгээх"}
                  </Button>
                )}
              </div>
            </div>
            {submitted ? (
              <Card className="rounded-md border-emerald-600 bg-emerald-50 text-emerald-950">
                <CardContent className="flex items-start gap-3 py-4">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0" />
                  <span className="text-sm font-medium">
                    Зар нийтлэх хүсэлт бэлэн боллоо. #{submitted.id} draft хадгалагдсан ба дэлгэрэнгүй мэдээллийн бүх задаргаа багтсан.
                  </span>
                </CardContent>
              </Card>
            ) : null}
            {submitError ? (
              <Card className="rounded-md border-destructive bg-destructive/10 text-destructive">
                <CardContent className="flex items-start gap-3 py-4">
                  <CircleAlert className="mt-0.5 size-5 shrink-0" />
                  <span className="text-sm font-medium">{submitError}</span>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </div>
      </div>

      {/* Mobile-only: replaces the app's global bottom tab bar with the
          wizard's own step navigation, since the sidebar step list above is
          hidden below the lg breakpoint. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-0.5 overflow-x-auto border-t bg-background/95 px-1 py-1.5 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" }}
      >
        {groups.map((group) => {
          const Icon = group.icon;
          const groupReqs = required.filter((item) => item.step === group.step);
          const done =
            visitedSteps.has(group.step) &&
            (groupReqs.length > 0
              ? groupReqs.every((item) => item.ok)
              : stepHasContent(draft, group.step));
          const active = step === group.step;
          return (
            <button
              key={group.step}
              type="button"
              onClick={() => setStep(group.step)}
              className={cn(
                "flex min-w-16 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium text-muted-foreground",
                active && "bg-primary/10 text-primary"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border bg-background",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && !active && "border-emerald-600 bg-emerald-50 text-emerald-700"
                )}
              >
                {done && !active ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
              </span>
              <span className="w-full truncate text-center leading-none">{group.shortTitle}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function StepOne({ draft, actions }: { draft: SmartDraft; actions: DraftActions }) {
  return (
    <div className="space-y-4">
      <Card id="field-goal" className="scroll-mt-24 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-accent" />
            03. Зар оруулах
          </CardTitle>
          <CardDescription>Худалдах эсвэл түрээслүүлэх, хөлслүүлэх зорилгоо сонгоно.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const active = draft.goal === goal.key;
            return (
              <button
                key={goal.key}
                type="button"
                onClick={() => actions.setPath("goal", goal.key)}
                className={cn(
                  "rounded-md border bg-card p-4 text-left transition-colors hover:border-primary",
                  active && "border-primary bg-primary/10"
                )}
              >
                <span
                  className={cn(
                    "mb-3 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary",
                    active && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="block text-sm font-semibold">{goal.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{goal.hint}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card id="field-propertyType" className="scroll-mt-24 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-accent" />
            04. Үл хөдлөх эд хөрөнгийн зориулалт
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {propertyTypes.map((type) => {
            const Icon = type.icon;
            const active = draft.propertyType === type.key;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => actions.setPath("propertyType", type.key)}
                className={cn(
                  "flex min-h-24 gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-muted",
                  active && "border-primary bg-primary/10"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
                    active && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{type.label}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{type.hint}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card id="field-subtype" className="scroll-mt-24 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="size-4 text-accent" />
            05. Үл хөдлөх эд хөрөнгийн зориулалт - дэд зориулалт
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {subtypes[draft.propertyType].map((item) => (
            <ToggleChip
              key={item}
              active={draft.subtype === item}
              onClick={() => actions.setPath("subtype", item)}
            >
              {item}
            </ToggleChip>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StepTwo({
  draft,
  actions,
  selectedType,
}: {
  draft: SmartDraft;
  actions: DraftActions;
  selectedType: (typeof propertyTypes)[number];
}) {
  const areaCert = parseFloat(draft.specs.areaCert) || 0;
  const areaInterior = parseFloat(draft.specs.areaInterior) || 0;
  const extraArea =
    (parseFloat(draft.specs.areaBalcony) || 0) +
    (parseFloat(draft.specs.areaGarage) || 0) +
    (parseFloat(draft.specs.areaStorage) || 0);
  const areaWarn = areaCert > 0 && areaInterior > areaCert;
  const roomSummary = needsRooms(draft)
    ? draft.specs.rooms
      ? `${draft.specs.rooms} өрөө`
      : "Сонгоогүй"
    : selectedType.label;
  // Map stays large by default even after a pin is dropped; the user can
  // still shrink it back down via the toggle in MapPanel's corner. It always
  // renders in the same spot (above the address form) so picking a pin never
  // reflows the page or moves the map out from under the user.
  const [mapExpanded, setMapExpanded] = useState(true);

  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" />
                01. Хаяг, байршил
              </CardTitle>
              <CardDescription>
                Дүүрэг, хороо, хотхон/гудамжаа бөглөөд барилга, давхар, map pin-ээ нарийвчилна.
              </CardDescription>
            </div>
            <Badge variant={draft.locationTouched ? "default" : "outline"} className="rounded-full">
              {draft.locationTouched ? <CircleCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />}
              {draft.locationTouched ? "Байршил сонгосон" : "Pin сонгоогүй"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent
          className={
            draft.locationTouched
              ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]"
              : "space-y-4"
          }
        >
          <div className="space-y-2">
            <MapPanel
              draft={draft}
              actions={actions}
              expanded={mapExpanded}
              onToggleExpanded={() => setMapExpanded((v) => !v)}
            />
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-accent" />
              Байршлаа тодорхойлохын тулд газрын зураг дээр дараад pin байрлуулна уу. Хаягийн талбарууд
              автоматаар бөглөгдөнө.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">
                  <Lock className="size-3.5" />
                  {draft.address.country}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <Building2 className="size-3.5" />
                  {draft.address.city}
                </Badge>
              </div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Navigation className="size-4 text-accent" />
                Үндсэн байршил
              </div>
              <AddressCascade address={draft.address} setPath={actions.setPath} />
              <div id="field-khotkhonOrStreet" className="mt-3 grid scroll-mt-24 gap-3 sm:grid-cols-2">
                <Field label="Хотхон, хороолол" required hint="Гудамжтай бол хоосон үлдээж болно.">
                  <Input
                    value={draft.address.khotkhon}
                    list="khotkhon-options"
                    onChange={(event) => actions.setPath("address.khotkhon", event.target.value)}
                    placeholder="Time Tower"
                  />
                  <datalist id="khotkhon-options">
                    {KHOTKHON.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Гудамж" hint="Хотхон байхгүй үед гудамж нь заавалд тооцогдоно.">
                  <Input
                    value={draft.address.street}
                    onChange={(event) => actions.setPath("address.street", event.target.value)}
                    placeholder="Нарны зам"
                  />
                </Field>
              </div>
            </div>

            <FloorSection draft={draft} actions={actions} />

            <div className="rounded-md border bg-card p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Signpost className="size-4 text-accent" />
                Нарийвчилсан хаяг
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Хаягийн бүс / zipcode">
                  <Input
                    value={draft.address.zip}
                    onChange={(event) => actions.setPath("address.zip", event.target.value)}
                    placeholder="17011"
                  />
                </Field>
                <Field label="Гудамжны дугаар">
                  <Input
                    value={draft.address.streetNumber}
                    onChange={(event) => actions.setPath("address.streetNumber", event.target.value)}
                    placeholder="12"
                  />
                </Field>
                <Field label="Барилга, байр, блокын дугаар">
                  <Input
                    value={draft.address.buildingNumber}
                    onChange={(event) => actions.setPath("address.buildingNumber", event.target.value)}
                    placeholder="204"
                  />
                </Field>
                <Field label="Барилга, байр, блокын нэр">
                  <Input
                    value={draft.address.buildingName}
                    onChange={(event) => actions.setPath("address.buildingName", event.target.value)}
                    placeholder="A block"
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Хаяг, байршлын тайлбар">
                  <Textarea
                    value={draft.address.note}
                    onChange={(event) => actions.setPath("address.note", event.target.value)}
                    placeholder="Орц, хашаа, орох зам, таних тэмдэг..."
                  />
                </Field>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="size-4 text-accent" />
            02. Үзүүлэлт
          </CardTitle>
          <CardDescription>
            Гэрчилгээний талбай нь үнэлгээ, нэгжийн үнэ, хайлтын шүүлтэд ашиглагдана.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_280px]">
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Maximize2 className="size-4 text-accent" />
                Талбай
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <NumberStepper
                  id="field-areaCert"
                  label={`${areaLabel(draft)} (м²)`}
                  required
                  value={draft.specs.areaCert}
                  onChange={(value) => actions.setPath("specs.areaCert", value)}
                  min={0}
                  max={99999}
                  step={1}
                  decimals={1}
                  placeholder="0"
                  hint="Гэрчилгээний үндсэн талбай."
                />
                <NumberStepper
                  label="Дотор цэвэр талбай (м²)"
                  value={draft.specs.areaInterior}
                  onChange={(value) => actions.setPath("specs.areaInterior", value)}
                  min={0}
                  max={99999}
                  step={1}
                  decimals={1}
                />
                <NumberStepper
                  label="Тагт / террас / лодж (м²)"
                  value={draft.specs.areaBalcony}
                  onChange={(value) => actions.setPath("specs.areaBalcony", value)}
                  min={0}
                  max={99999}
                  step={0.5}
                  decimals={1}
                />
                <NumberStepper
                  label="Авто дулаан зогсоол (м²)"
                  value={draft.specs.areaGarage}
                  onChange={(value) => actions.setPath("specs.areaGarage", value)}
                  min={0}
                  max={99999}
                  step={1}
                  decimals={1}
                />
                <NumberStepper
                  label="Агуулах, техникийн өрөө (м²)"
                  value={draft.specs.areaStorage}
                  onChange={(value) => actions.setPath("specs.areaStorage", value)}
                  min={0}
                  max={99999}
                  step={1}
                  decimals={1}
                />
              </div>
              {areaWarn ? (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-50 p-3 text-sm text-amber-900">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  Дотор цэвэр талбай гэрчилгээний талбайгаас их байна. Тоогоо дахин шалгана уу.
                </div>
              ) : null}
            </div>
            <div className="grid gap-2">
              <AreaTile label={areaLabel(draft)} value={squareMeters(areaCert)} strong />
              <AreaTile label="Дотор цэвэр талбай" value={squareMeters(areaInterior)} />
              <AreaTile label="Нэмэлт талбай" value={squareMeters(extraArea)} />
              <AreaTile label="Өрөөний бүтэц" value={roomSummary} />
            </div>
          </div>

          {needsRooms(draft) ? (
            <div className="rounded-md border bg-card p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <DoorOpen className="size-4 text-accent" />
                Өрөөний бүтэц
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <NumberStepper
                  id="field-rooms"
                  label="Нийт өрөөний тоо"
                  required
                  value={draft.specs.rooms}
                  onChange={(value) => actions.setPath("specs.rooms", value)}
                  min={1}
                  max={20}
                  quick={[1, 2, 3, 4, 5]}
                />
                <NumberStepper
                  label="Унтлагын өрөөний нийт тоо"
                  value={draft.specs.bedrooms}
                  onChange={(value) => actions.setPath("specs.bedrooms", value)}
                  min={0}
                  max={20}
                  quick={[0, 1, 2, 3, 4]}
                />
                <NumberStepper
                  label="Ариун цэврийн өрөөний нийт тоо"
                  value={draft.specs.bathrooms}
                  onChange={(value) => actions.setPath("specs.bathrooms", value)}
                  min={0}
                  max={20}
                  quick={[0, 1, 2, 3, 4]}
                />
              </div>
              <WindowDirectionMap draft={draft} actions={actions} />
            </div>
          ) : null}

          {isCommercial(draft) ? (
            <div className="rounded-md border bg-card p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <BriefcaseBusiness className="size-4 text-accent" />
                Тохиромжтой чиглэл
              </div>
              <div className="flex flex-wrap gap-2">
                {officeNeeds.map((item) => (
                  <ToggleChip
                    key={item}
                    active={draft.specs.officeNeeds.includes(item)}
                    onClick={() => actions.toggleArray("specs.officeNeeds", item)}
                    icon={draft.specs.officeNeeds.includes(item) ? Check : undefined}
                  >
                    {item}
                  </ToggleChip>
                ))}
              </div>
            </div>
          ) : null}

          <Field label="Өрөөнүүдийн талаар нэмэлт мэдээлэл, тайлбар">
            <Textarea
              value={draft.desc}
              onChange={(event) => actions.setPath("desc", event.target.value)}
              placeholder="Обьектын онцлог, давуу тал, тохиромжтой хэрэглээг товч бичнэ үү"
            />
          </Field>
        </CardContent>
      </Card>

      <RoomDetailsEditor draft={draft} actions={actions} />
    </div>
  );
}

function FloorSection({ draft, actions }: { draft: SmartDraft; actions: DraftActions }) {
  const floorTotal = draft.address.floorBasement + draft.address.floorAbove;
  const floors = floorList(draft);
  // A unit may span several floors → selectedFloor can be "F01-F02".
  const [fromFloor, toFloor] = (() => {
    const raw = draft.address.selectedFloor || floors[0] || "F01";
    const parts = raw.split("-");
    return [parts[0], parts[1] ?? ""] as const;
  })();
  const setRange = (from: string, to: string) => {
    const value = to && to !== from ? `${from}-${to}` : from;
    actions.setPath("address.selectedFloor", value);
  };

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Layers3 className="size-4 text-accent" />
        Давхар, хаалга
      </div>
      <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-md border bg-muted/50 p-3 text-center">
          <div className="text-xs text-muted-foreground">Нийт давхар</div>
          <div className="text-3xl font-semibold tabular-nums">{floorTotal || "-"}</div>
          <div className="text-[11px] text-muted-foreground">
            {draft.address.floorBasement ? `B${draft.address.floorBasement} хүртэл` : "Зоорьгүй"} ·{" "}
            {draft.address.floorAbove ? `F${String(draft.address.floorAbove).padStart(2, "0")} хүртэл` : "Үндсэн давхаргүй"}
          </div>
        </div>
        <NumberStepper
          label="Зоорийн давхрын тоо"
          value={draft.address.floorBasement}
          onChange={(value) => actions.setPath("address.floorBasement", clampInt(value, 0, 20))}
          min={0}
          max={20}
          hint="B1, B2 гэх мэт."
        />
        <NumberStepper
          label="Үндсэн давхрын тоо"
          value={draft.address.floorAbove}
          onChange={(value) => actions.setPath("address.floorAbove", clampInt(value, 0, 80))}
          min={0}
          max={80}
          hint="F01, F02 гэх мэт."
        />
      </div>
      <div className="mt-3 rounded-md border bg-muted/50 p-3">
        <div className="mb-2 text-xs text-muted-foreground">
          Байрлах давхар{" "}
          <span className="text-[11px]">(нэгж олон давхарт бол «хүртэл»-ээ сонго — ж: F01–F02)</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <Field label="Давхар (эхлэл)">
            <NativeSelect value={fromFloor} onChange={(value) => setRange(value, toFloor)} options={floors} />
          </Field>
          <Field label="Хүртэл (олон давхарт)">
            <NativeSelect
              value={toFloor}
              onChange={(value) => setRange(fromFloor, value)}
              options={[{ value: "", label: "— нэг давхар —" }, ...floors.map((f) => ({ value: f, label: f }))]}
            />
          </Field>
          <div className="rounded-md border bg-background px-3 py-2 text-center">
            <div className="text-[11px] text-muted-foreground">Сонгосон</div>
            <div className="text-base font-semibold tabular-nums">{draft.address.selectedFloor || fromFloor}</div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Тоот / хаалга">
          <Input
            value={draft.address.unit}
            onChange={(event) => actions.setPath("address.unit", event.target.value)}
            placeholder="301"
          />
        </Field>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
        <Calculator className="mt-0.5 size-4 shrink-0 text-accent" />
        <span>
          {floorTotal
            ? `${draft.address.floorBasement ? `${draft.address.floorBasement} зоорь` : "зоорьгүй"} · ${draft.address.floorAbove ? `${draft.address.floorAbove} үндсэн` : "үндсэн давхаргүй"} · ${floorTitle(draft.address.selectedFloor)}`
            : "Давхрын мэдээлэл хоосон"}
        </span>
      </div>
    </div>
  );
}

/** Real interactive Leaflet map (client-only). */
const WizardLocationMap = dynamic(
  () => import("@/components/place-picker/PlacePickerMap").then((m) => m.PlacePickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Газрын зураг ачаалж байна…
      </div>
    ),
  }
);

/** Build a shareable Google Maps link from coordinates. */
function mapsUrlFrom(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function MapPanel({
  draft,
  actions,
  expanded,
  onToggleExpanded,
}: {
  draft: SmartDraft;
  actions: DraftActions;
  /** Large by default; the user can shrink it back down via onToggleExpanded. */
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const hasLink = Boolean(draft.address.googleMapLink.trim());
  const manualLine = addressLine(draft) || `${draft.address.country}, ${draft.address.city}`;
  const openHref = hasLink ? draft.address.googleMapLink : mapsUrlFrom(draft.lat, draft.lng);
  const [polygons, setPolygons] = useState<MapPolygon[]>([]);

  const pickLocation = (lat: number, lng: number) => {
    actions.mutate((next) => {
      next.lat = lat;
      next.lng = lng;
      next.locationTouched = true;
      // Auto-fill a shareable Google Maps link from the dropped pin.
      next.address.googleMapLink = mapsUrlFrom(lat, lng);
    });
  };

  // Once the map re-centers on the dropped pin (at zoom 18), send its real
  // rendered bbox to the neodata layer service and try to auto-fill
  // district/khoroo. Best-effort: the neodata bbox filter and its id->name
  // bbox filter is currently broken server-side (see
  // docs/api-listing-wizard-requirements.md §9), so this silently does
  // nothing today — manual selection in <AddressCascade> still works exactly
  // as before. Will start actually auto-filling once that's fixed — the id
  // lookup itself (neodata ids == core address cascade ids, confirmed live)
  // is already correct and needs no further backend fix.
  const autoFillFromMapPin = async (bbox: Bbox) => {
    try {
      const result = await getLayerCacheDataByBbox(bbox, {
        zoom: 18,
        perPage: 50,
        onlyHasZznm: true,
      });
      // Draw whatever layer polygons came back, styled with each feature's
      // own border/fill colors from the API (not a hardcoded color) — the
      // GIS data already encodes how each layer_type_id should look.
      setPolygons(
        result.data
          .filter((item) => item.geometry != null)
          .map((item) => ({
            geometry: item.geometry as GeoJsonObject,
            borderColor: item.border_color as string | null,
            fillColor: item.fill_color as string | null,
            fillOpacity: item.fill_opacity as number | null,
            borderWidth: item.border_width as number | null,
          }))
      );
      const neodataAddress = resolveAddressFromLayerCacheData(result.data);
      if (!neodataAddress) return;
      // Fill whatever building-level data the matched feature carries, even
      // without a resolvable province/district/khoroo — only into fields the
      // user hasn't already typed something into, so re-nudging the pin never
      // clobbers a manual edit.
      if (neodataAddress.objectName) {
        actions.mutate((next) => {
          if (!next.address.khotkhon.trim()) next.address.khotkhon = neodataAddress.objectName!;
        });
      }
      if (neodataAddress.addressNo) {
        actions.mutate((next) => {
          if (!next.address.buildingNumber.trim()) next.address.buildingNumber = neodataAddress.addressNo!;
        });
      }
      if (neodataAddress.zipCodeId != null) {
        // No core-API zipcode lookup exists to resolve this id to a real
        // postal code (see domain/schemas/neodata.ts) — fill the raw id
        // anyway per product decision to surface whatever data is available,
        // rather than leave it blank.
        actions.mutate((next) => {
          if (!next.address.zip.trim()) next.address.zip = String(neodataAddress.zipCodeId);
        });
      }
      if (neodataAddress.provinceId == null) return;
      const core = await resolveCoreAddressFromNeodataIds(
        neodataAddress.provinceId,
        neodataAddress.districtId,
        neodataAddress.khorooId
      );
      if (!core) return;
      actions.setPath("address.provinceId", String(core.provinceId));
      actions.setPath("address.city", core.provinceName);
      actions.setPath("address.districtId", String(core.districtId));
      actions.setPath("address.district", core.districtName);
      actions.setPath("address.khorooId", String(core.khorooId));
      actions.setPath("address.khoroo", core.khorooName);
    } catch {
      // Best-effort — leave manual address selection untouched on any failure.
    }
  };

  return (
    <div className="lp-map-panel">
      <div className={cn("relative overflow-hidden rounded-md border bg-muted/40", expanded ? "h-[560px]" : "h-[280px]")}>
        <WizardLocationMap
          lat={draft.lat}
          lng={draft.lng}
          kind="other"
          onPick={pickLocation}
          pinZoom={18}
          onSettled={autoFillFromMapPin}
          polygons={polygons}
        />
        <div className="pointer-events-none absolute left-2 top-2 z-[500] flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow">
          {draft.locationTouched ? (
            <CircleCheck className="size-3.5 text-emerald-600" />
          ) : (
            <MapPin className="size-3.5 text-accent" />
          )}
          {draft.locationTouched ? "Байршил тэмдэглэсэн" : "Зураг дээр дарж цэг тавина"}
        </div>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="absolute right-2 top-2 z-[500] flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow hover:bg-background"
          title={expanded ? "Газрын зургийг жижигрүүлэх" : "Газрын зургийг томруулах"}
        >
          {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          {expanded ? "Жижигрүүлэх" : "Томруулах"}
        </button>
      </div>
      <div className="lp-map-meta">
        <MetaTile label="Гараар оруулсан хаяг" value={manualLine} icon={MapPinned} />
        <MetaTile
          label="Баталгаажуулалт"
          value={draft.locationTouched ? "Газрын зураг дээр сонгосон" : hasLink ? "Линкээр дэмжсэн" : "Сонгоогүй"}
          icon={ShieldCheck}
        />
      </div>
      {draft.locationTouched || hasLink ? (
        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <MapPin className="size-4" />
          Google Maps-д нээх
        </a>
      ) : null}
    </div>
  );
}

function MetaTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="lp-meta-tile">
      <div className="lp-meta-label">
        <Icon className="size-3.5 text-accent" />
        {label}
      </div>
      <div className="lp-meta-value">{value || "-"}</div>
    </div>
  );
}

function AreaTile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("rounded-md border bg-card p-3", strong && "border-primary bg-primary/10")}>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function WindowDirectionMap({ draft, actions }: { draft: SmartDraft; actions: DraftActions }) {
  const total = windowTotal(draft.specs.windows);
  const rows: Array<Array<WindowKey | "total">> = [
    ["northwest", "north", "northeast"],
    ["west", "total", "east"],
    ["southwest", "south", "southeast"],
  ];
  const setWindow = (key: WindowKey, value: number) => actions.setPath(`specs.windows.${key}`, clampInt(value, 0, 99));

  return (
    <div className="mt-4">
      <Field label="Цонхны тоо, байрлал">
        <div className="grid items-stretch gap-4 xl:grid-cols-[300px_1fr]">
          <div className="flex min-h-[300px] items-center justify-center rounded-md border bg-muted/40 p-4">
            <div className="relative size-[240px] rounded-full border bg-[radial-gradient(circle_at_center,var(--background)_0_34%,transparent_35%),conic-gradient(from_0deg,rgba(201,162,39,.16),transparent_16%,rgba(10,31,68,.08)_25%,transparent_34%,rgba(201,162,39,.16)_50%,transparent_66%,rgba(10,31,68,.08)_75%,transparent_84%,rgba(201,162,39,.16))] shadow-sm">
              <div className="absolute inset-[82px] flex flex-col items-center justify-center rounded-full border-2 border-accent bg-accent/10 text-center">
                <Compass className="mb-1 size-5 text-accent" />
                <span className="text-xl font-bold leading-tight tabular-nums">{total}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">нийт цонх</span>
              </div>
              {windowDirections.map((dir) => {
                const count = draft.specs.windows[dir.key] || 0;
                return (
                  <button
                    key={dir.key}
                    type="button"
                    onClick={() => setWindow(dir.key, count + 1)}
                    className={cn("lp-window-map-chip", dir.chipClass, count && "is-active")}
                    aria-label={`${dir.label} цонх нэмэх`}
                  >
                    <span className="text-[11px] font-semibold leading-none">{dir.short}</span>
                    <span className="text-sm font-bold leading-tight tabular-nums">{count}</span>
                    <Plus className="lp-window-map-plus" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-hidden rounded-md border bg-card">
            <div className="grid grid-cols-3 gap-px bg-border">
              {rows.flatMap((row) =>
                row.map((key) => {
                  if (key === "total") {
                    return (
                      <div key="total" className="bg-card">
                        <div className="lp-window-total-cell">
                          <span className="text-xs font-semibold text-muted-foreground">Нийт</span>
                          <span className="text-2xl font-bold leading-tight tabular-nums">{total}</span>
                          {total ? (
                            <button
                              type="button"
                              className="lp-window-reset-btn"
                              onClick={() => actions.setPath("specs.windows", defaultWindows())}
                              aria-label="Цонхны тоог тэглэх"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  const dir = windowDirections.find((item) => item.key === key)!;
                  const count = draft.specs.windows[dir.key] || 0;
                  const Icon = dir.icon;
                  return (
                    <div key={key} className="bg-card">
                      <div className={cn("lp-window-cell", count && "is-active")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{dir.short}</span>
                          <Icon className={cn("size-4", count ? "text-accent" : "text-muted-foreground")} />
                        </div>
                        <WindowStepper value={count} onChange={(value) => setWindow(dir.key, value)} label={dir.label} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Field>
      {total ? <div className="mt-2 text-xs text-muted-foreground">{windowSummary(draft.specs.windows)}</div> : null}
    </div>
  );
}

/** Pop-up form to add or edit one room (type, name, floor, area, tags, windows, note). */
function RoomFormModal({
  draft,
  actions,
  onClose,
  editId,
}: {
  draft: SmartDraft;
  actions: DraftActions;
  onClose: () => void;
  editId?: string;
}) {
  const existing = editId ? draft.roomDetails.find((item) => item.id === editId) : undefined;
  const [typeKey, setTypeKey] = useState(existing?.typeKey ?? ROOM_TYPES[0].key);
  const [label, setLabel] = useState(existing?.label ?? ROOM_TYPES[0].label);
  const [floor, setFloor] = useState(existing?.floor ?? unitFloors(draft)[0] ?? "F01");
  const [area, setArea] = useState(existing?.area ?? "");
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [note, setNote] = useState(existing?.note ?? "");
  const [windows, setWindows] = useState<WindowCounts>(existing?.windows ?? defaultWindows());
  const meta = ROOM_TYPES.find((item) => item.key === typeKey) ?? ROOM_TYPES[0];
  const tagOptions = ROOM_TAGS_BY_TYPE[meta.tagGroup] ?? [];

  const chooseType = (value: string) => {
    const nextMeta = ROOM_TYPES.find((item) => item.key === value) ?? ROOM_TYPES[0];
    // Follow the type's default name unless the user typed a custom one.
    if (label === meta.label || !label.trim()) setLabel(nextMeta.label);
    setTypeKey(nextMeta.key);
    setTags([]);
  };

  const save = () => {
    actions.mutate((next) => {
      if (editId) {
        const room = next.roomDetails.find((item) => item.id === editId);
        if (room) {
          room.typeKey = meta.key;
          room.label = label.trim() || meta.label;
          room.floor = floor;
          room.area = area;
          room.tags = tags;
          room.note = note;
          room.windows = windows;
        }
      } else {
        next.roomDetails.push({
          id: `room-${Date.now()}-${next.roomDetails.length}`,
          typeKey: meta.key,
          label: label.trim() || meta.label,
          floor,
          area,
          windows,
          tags,
          note,
        });
      }
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-base font-semibold">
        <DoorOpen className="size-5 text-accent" />
        {editId ? "Өрөө засах" : "Өрөө нэмэх"}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Өрөөний төрөл">
          <NativeSelect
            value={typeKey}
            onChange={chooseType}
            options={ROOM_TYPES.map((item) => ({ value: item.key, label: item.label }))}
          />
        </Field>
        <Field label="Нэр">
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={meta.label} />
        </Field>
        <Field label="Давхар">
          <NativeSelect value={floor} onChange={setFloor} options={unitFloors(draft)} />
        </Field>
        <NumberStepper
          label="Талбай (м²)"
          value={area}
          onChange={setArea}
          min={0}
          max={99999}
          step={0.5}
          decimals={1}
        />
      </div>
      {tagOptions.length ? (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Pencil className="size-3.5 text-accent" />
            Өрөөний онцлог (tag)
          </div>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const active = tags.includes(tag);
              return (
                <ToggleChip
                  key={tag}
                  active={active}
                  onClick={() =>
                    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]))
                  }
                  icon={active ? Check : undefined}
                >
                  {tag}
                </ToggleChip>
              );
            })}
          </div>
        </div>
      ) : null}
      <details className="rounded-md border bg-muted/40" open={windowTotal(windows) > 0}>
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold">
          Цонхны чиглэл, тоо (заавал биш)
        </summary>
        <div className="grid gap-2 p-3 pt-0 sm:grid-cols-2 lg:grid-cols-4">
          {windowDirections.map((dir) => (
            <div key={dir.key} className="rounded-md border bg-background p-2">
              <div className="mb-1 text-xs font-semibold">{dir.label}</div>
              <WindowStepper
                compact
                value={windows[dir.key] || 0}
                label={dir.label}
                onChange={(value) => setWindows((prev) => ({ ...prev, [dir.key]: value }))}
              />
            </div>
          ))}
        </div>
      </details>
      <Field label="Өрөөний тайлбар">
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Тус өрөөний онцлог..." />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Болих
        </Button>
        <Button type="button" onClick={save}>
          {editId ? "Хадгалах" : "Нэмэх"}
        </Button>
      </div>
    </div>
  );
}

function RoomDetailsEditor({ draft, actions }: { draft: SmartDraft; actions: DraftActions }) {
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const rooms = draft.roomDetails;
  const totalArea = rooms.reduce((sum, room) => sum + (parseFloat(room.area) || 0), 0);

  const openForm = (editId?: string) =>
    openModal(<RoomFormModal draft={draft} actions={actions} onClose={closeModal} editId={editId} />, "md");
  const removeRoom = (id: string) =>
    actions.mutate((next) => {
      next.roomDetails = next.roomDetails.filter((item) => item.id !== id);
    });

  return (
    <Card className="rounded-md">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="size-4 text-accent" />
              Өрөөний мэдээлэл нарийвчилж оруулах уу?
            </CardTitle>
            <CardDescription>
              Өрөө бүрийн төрөл, талбай, tag, цонхыг нэмж болно. Заавал биш.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => openForm()}>
            <Plus className="size-4" />
            Өрөө нэмэх
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.length ? (
          <>
            <div className="text-xs font-semibold tracking-wide text-muted-foreground">ӨРӨӨНҮҮД</div>
            <div className="divide-y overflow-hidden rounded-md border">
              {rooms.map((room, index) => (
                <div key={room.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{room.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {room.floor} · {room.area ? `${room.area} м²` : "талбай —"} · {windowTotal(room.windows)} цонх
                      {room.tags.length ? ` · ${room.tags.length} tag` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openForm(room.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted"
                    aria-label="Засах"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRoom(room.id)}
                    className="rounded-md p-1.5 text-destructive transition hover:bg-destructive/10"
                    aria-label="Устгах"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">Нийт {rooms.length} өрөө</span>
              <span className="font-semibold tabular-nums">
                {totalArea ? `${totalArea.toLocaleString("en-US")} м²` : "— м²"}
              </span>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            Өрөөний задаргаа заавал биш. «Өрөө нэмэх»-ээр өрөө бүрийн мэдээллийг оруулж болно.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A wizard section rendered as a collapsible Card with an optional completion
 * badge (e.g. "3/7" or "5 сонгосон") and progress bar. Lets long sections be
 * folded away and shows at a glance how much of each group is filled in.
 */
function CollapsibleGroup({
  icon: Icon,
  title,
  description,
  badge,
  percent,
  defaultOpen = true,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  percent?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="rounded-md">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((value) => !value)}
        role="button"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Icon className="size-4 text-accent" />
            {title}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            {badge ? (
              <Badge variant="outline" className="tabular-nums">
                {badge}
              </Badge>
            ) : null}
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </div>
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {percent != null ? (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        ) : null}
      </CardHeader>
      {open ? <CardContent className="space-y-4">{children}</CardContent> : null}
    </Card>
  );
}

function StepThree({ draft, actions }: { draft: SmartDraft; actions: DraftActions }) {
  const communitySelected = communityGroups.reduce(
    (sum, group) => sum + (draft.community[group.key]?.length ?? 0),
    0
  );
  const includedSelected = includedGroups.reduce(
    (sum, group) => sum + (draft.included[group.key]?.length ?? 0),
    0
  );
  const popular = isCommercial(draft)
    ? [
        "Харуул, хамгаалалт 24/7",
        "Домофон, дохиолол",
        "Лифт - зорчигчийн 24/7",
        "Төлбөртэй дулаан зогсоол",
        "Фитнес, иога, веллнесс",
        "Ресторан",
        "Цахилгаан машины цэнэглэл станц",
        "Лифт - ачааны 24/7",
      ]
    : [
        "Хүнсний дэлгүүр",
        "Фитнес, иога, веллнесс",
        "Хүүхдийн тоглоомын талбай",
        "Лифт - зорчигчийн 24/7",
        "Төлбөргүй ил зогсоол",
        "Харуул, хамгаалалт 24/7",
        "Домофон, дохиолол",
        "Ногоон байгууламж, нарлах салхилах талбай",
      ];

  return (
    <div className="space-y-4">
      <CollapsibleGroup icon={PlugZap} title="06. Үзүүлэлт - Дэд бүтэц">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {infraFields.map((field) => {
              const Icon = field.icon;
              // Internet / IPTV can have several providers → multi-select chips
              // stored as a comma-joined string in the same field.
              if (field.key === "internet") {
                const chosen = draft.infra.internet
                  ? draft.infra.internet.split(", ").filter(Boolean)
                  : [];
                const toggleInternet = (item: string) => {
                  const set = new Set(chosen);
                  if (set.has(item)) set.delete(item);
                  else set.add(item);
                  actions.setPath("infra.internet", Array.from(set).join(", "));
                };
                return (
                  <Field key={field.key} label={field.label} hint="Олон сонголт">
                    <div className="flex flex-wrap gap-2 pt-1">
                      {field.choices.map((item) => (
                        <ToggleChip
                          key={item}
                          active={chosen.includes(item)}
                          onClick={() => toggleInternet(item)}
                          icon={chosen.includes(item) ? Check : undefined}
                        >
                          {item}
                        </ToggleChip>
                      ))}
                    </div>
                  </Field>
                );
              }
              const subOptions = field.key === "heating" ? heatingSubChoices[draft.infra.heating] : undefined;
              const rawValue = draft.infra[field.key];
              const hasOther = field.choices.includes("Бусад");
              const isOther = hasOther && (rawValue === "Бусад" || !field.choices.includes(rawValue));
              const selectValue = field.choices.includes(rawValue)
                ? rawValue
                : hasOther
                  ? "Бусад"
                  : field.choices[0];
              return (
                <Field key={field.key} label={field.label} required={field.required}>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
                      <select
                        value={selectValue}
                        onChange={(event) => {
                          actions.setPath(`infra.${field.key}`, event.target.value);
                          if (field.key === "heating") {
                            const nextSubs = heatingSubChoices[event.target.value];
                            actions.setPath("infra.heatingSub", nextSubs ? nextSubs[0] : "");
                          }
                        }}
                        className="h-9 w-full rounded-md border border-input bg-background py-1 pl-9 pr-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                      >
                        {field.choices.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    {subOptions ? (
                      <select
                        value={subOptions.includes(draft.infra.heatingSub) ? draft.infra.heatingSub : subOptions[0]}
                        onChange={(event) => actions.setPath("infra.heatingSub", event.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background py-1 px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                      >
                        {subOptions.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {isOther ? (
                      <Input
                        value={rawValue === "Бусад" ? "" : rawValue}
                        onChange={(event) =>
                          actions.setPath(`infra.${field.key}`, event.target.value || "Бусад")
                        }
                        placeholder="Бусадыг бичнэ үү…"
                      />
                    ) : null}
                  </div>
                </Field>
              );
            })}
          </div>
          <Field label="Дэд бүтцийн бусад тайлбар">
            <Textarea
              value={draft.infra.note}
              onChange={(event) => actions.setPath("infra.note", event.target.value)}
              placeholder="Бусад эх үүсвэр, нөөцлүүр, хүчин чадал..."
            />
          </Field>
      </CollapsibleGroup>

      <CollapsibleGroup
        icon={BadgeCheck}
        title="07. Хотхон, төслийн дундын хэрэглээ, үйлчилгээ, аюулгүй байдал, тав тух"
        description="Түгээмэл сонголтууд болон бүх бүлгийн сонголтууд filter/match-д ашиглагдана."
        badge={`${communitySelected} сонгосон`}
      >
          <div className="flex flex-wrap gap-2">
            {popular.map((item) => {
              const group = communityGroups.find((candidate) => candidate.items.includes(item)) ?? communityGroups[2];
              const active = draft.community[group.key].includes(item);
              return (
                <ToggleChip
                  key={item}
                  active={active}
                  onClick={() => actions.toggleArray(`community.${group.key}`, item)}
                  icon={active ? Check : undefined}
                >
                  {item}
                </ToggleChip>
              );
            })}
          </div>
          <details className="rounded-md border bg-muted/40">
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Бүх үйлчилгээ, аюулгүй байдал, тав тухыг харах</summary>
            <div className="space-y-4 p-3">
              {communityGroups.map((group) => (
                <GroupedChips
                  key={group.key}
                  title={group.title}
                  icon={group.icon}
                  items={group.items}
                  selected={draft.community[group.key]}
                  onToggle={(item) => actions.toggleArray(`community.${group.key}`, item)}
                />
              ))}
            </div>
          </details>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Plus className="size-3.5 text-accent" />
              Өөрийн сонголт нэмэх (жагсаалтад байхгүй бол)
            </div>
            <CustomTags
              storeKey="community"
              group="amenities"
              selected={draft.community.amenities}
              onToggle={(tag) => actions.toggleArray("community.amenities", tag)}
              placeholder="Жишээ: Гэрэлт хашаа, EV цэнэглэгч…"
            />
          </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        icon={PackageCheck}
        title="08. Үнэд багтсан дагалдах зүйлс"
        badge={`${includedSelected} сонгосон`}
      >
          {includedGroups.map((group) => (
            <GroupedChips
              key={group.key}
              title={group.title}
              icon={group.icon}
              items={group.items}
              selected={draft.included[group.key]}
              onToggle={(item) => actions.toggleArray(`included.${group.key}`, item)}
            />
          ))}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Plus className="size-3.5 text-accent" />
              Өөрийн зүйл нэмэх (жагсаалтад байхгүй бол)
            </div>
            <CustomTags
              storeKey="included"
              group="included"
              selected={draft.included.extra}
              onToggle={(tag) => actions.toggleArray("included.extra", tag)}
              placeholder="Жишээ: Хөшиг, агааржуулагч…"
            />
          </div>
      </CollapsibleGroup>
    </div>
  );
}

function GroupedChips({
  title,
  icon: Icon,
  items,
  selected,
  onToggle,
}: {
  title: string;
  icon: LucideIcon;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5 text-accent" />
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <ToggleChip
            key={item}
            active={selected.includes(item)}
            onClick={() => onToggle(item)}
            icon={selected.includes(item) ? Check : undefined}
          >
            {item}
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}

/* Remembered user-added tags (per group), persisted so they can be reused. */
const CUSTOM_TAGS_PREFIX = "neomap.customTags.";
function loadCustomTags(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_TAGS_PREFIX + key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}
function rememberCustomTag(key: string, tag: string): string[] {
  const list = loadCustomTags(key).filter((t) => t !== tag);
  list.unshift(tag);
  const trimmed = list.slice(0, 40);
  try {
    window.localStorage.setItem(CUSTOM_TAGS_PREFIX + key, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }
  return trimmed;
}

/**
 * Free-form tag adder (LinkedIn-skills style): type a tag → it's selected and
 * remembered (localStorage) so it can be reused on the next listing. Remembered
 * tags render as reselectable chips.
 */
function CustomTags({
  storeKey,
  group,
  selected,
  onToggle,
  placeholder,
}: {
  storeKey: string;
  group: TagGroup;
  selected: string[];
  onToggle: (tag: string) => void;
  placeholder?: string;
}) {
  const [remembered, setRemembered] = useState<string[]>([]);
  const [input, setInput] = useState("");
  useEffect(() => setRemembered(loadCustomTags(storeKey)), [storeKey]);

  // Server-side suggestions (tags other listings have used), filtered by input.
  const suggestions = useTagSuggestions(group, input);
  const suggested = (suggestions.data ?? [])
    .map((t) => t.label)
    .filter((label) => !remembered.includes(label) && !selected.includes(label))
    .slice(0, 8);

  const add = (value?: string) => {
    const tag = (value ?? input).trim();
    if (!tag) return;
    setRemembered(rememberCustomTag(storeKey, tag));
    if (!selected.includes(tag)) onToggle(tag);
    setInput("");
  };

  return (
    <div className="space-y-2">
      {remembered.length ? (
        <div className="flex flex-wrap gap-2">
          {remembered.map((tag) => (
            <ToggleChip
              key={tag}
              active={selected.includes(tag)}
              onClick={() => onToggle(tag)}
              icon={selected.includes(tag) ? Check : undefined}
            >
              {tag}
            </ToggleChip>
          ))}
        </div>
      ) : null}
      {suggested.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Бусдын нэмсэн:</span>
          {suggested.map((label) => (
            <ToggleChip key={label} active={false} onClick={() => add(label)} icon={Plus}>
              {label}
            </ToggleChip>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Өөрийн шошго нэмэх…"}
        />
        <Button type="button" variant="outline" onClick={() => add()}>
          <Plus className="size-4" />
          Нэмэх
        </Button>
      </div>
    </div>
  );
}

function StepFour({
  draft,
  actions,
  isRent,
  price,
  area,
  unitPrice,
}: {
  draft: SmartDraft;
  actions: DraftActions;
  isRent: boolean;
  price: number;
  area: number;
  unitPrice: number;
}) {
  // Ашиглалтад орсон эсэхээс хамаарч нэг л огнооны талбар харуулна.
  const isCommissioned = draft.state.usage === "Ашиглалтад орсон";
  // Гэрчилгээтэй сонголтууд дээр л бүртгэлийн дугаар асууна.
  const hasCertificate =
    draft.state.certStatus.includes("гэрчилгээтэй") &&
    !draft.state.certStatus.startsWith("Гэрчилгээгүй");
  return (
    <div className="space-y-4">
      <CollapsibleGroup icon={SearchCheck} title="09. Үл хөдлөх эд хөрөнгийн төлөв">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Ашиглалтад орсон эсэх">
              <NativeSelect
                value={draft.state.usage}
                onChange={(value) =>
                  actions.mutate((next) => {
                    next.state.usage = value;
                    // A not-yet-commissioned property can't have a ready certificate.
                    if (value !== "Ашиглалтад орсон" && next.state.certStatus === "Бэлэн гэрчилгээтэй") {
                      next.state.certStatus = "Гэрчилгээгүй - Гэрчилгээ гарахад бэлэн";
                    }
                  })
                }
                options={["Ашиглалтад орсон", "Ашиглалтад ороогүй"]}
              />
            </Field>
            {isCommissioned ? (
              <Field label="Ашиглалтад орсон он">
                <Input
                  type="number"
                  min={1950}
                  max={2035}
                  value={draft.state.commissionYear}
                  onChange={(event) => actions.setPath("state.commissionYear", event.target.value)}
                  placeholder="2020"
                />
              </Field>
            ) : (
              <Field label="Ашиглалтад орох (тооцоолсон) хугацаа">
                <Input
                  value={draft.state.commissionDue}
                  onChange={(event) => actions.setPath("state.commissionDue", event.target.value)}
                  placeholder="2026.IV"
                />
              </Field>
            )}
            <Field label="Улсын бүртгэлийн гэрчилгээтэй эсэх">
              <NativeSelect
                value={draft.state.certStatus}
                onChange={(value) => actions.setPath("state.certStatus", value)}
                options={
                  isCommissioned
                    ? certOptions
                    : certOptions.filter((option) => option !== "Бэлэн гэрчилгээтэй")
                }
              />
            </Field>
            {hasCertificate ? (
              <Field label="ҮХЭХ улсын бүртгэлийн дугаар">
                <Input
                  value={draft.state.certNumber}
                  onChange={(event) => actions.setPath("state.certNumber", event.target.value)}
                  placeholder="Ү220#######"
                />
              </Field>
            ) : null}
            <Field label="Ашиглагдаж байсан байдал">
              <NativeSelect
                value={draft.state.condition}
                onChange={(value) => actions.setPath("state.condition", value)}
                options={["Цоо шинэ, ашиглаж байгаагүй", "Ашиглагдаж байсан"]}
              />
            </Field>
            <Field label="Одоогийн байдал (гэрээ байгуулах үеийн)">
              <NativeSelect
                value={draft.state.current}
                onChange={(value) => actions.setPath("state.current", value)}
                options={["Түрээсийн эсхүл хөлслүүлэх гэрээтэй байгаа", "Амьдарч, ашиглаж байгаа", "Сул, чөлөөтэй байгаа", "Бусад"]}
              />
            </Field>
            <Field label="Дотор засал">
              <NativeSelect
                value={draft.state.interior}
                onChange={(value) => actions.setPath("state.interior", value)}
                options={interiorOptions.map((item) => ({ value: item, label: item || "Сонгох" }))}
              />
            </Field>
            <Field label="Барьцаанд байгаа эсэх">
              <NativeSelect
                value={draft.state.collateral}
                onChange={(value) => actions.setPath("state.collateral", value)}
                options={collateralOptions}
              />
            </Field>
          </div>
          <Field label="Барьцаа, төлөвийн тайлбар">
            <Textarea
              value={draft.state.collateralNote}
              onChange={(event) => actions.setPath("state.collateralNote", event.target.value)}
              placeholder="Хэрэв аливаа хэлбэрийн барьцаанд байгаа бол тайлбар..."
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {hasCertificate ? (
              <ToggleChip
                active={draft.state.certificateAttached}
                onClick={() => actions.toggleBoolean("state.certificateAttached")}
                icon={Paperclip}
              >
                Гэрчилгээ хавсаргах
              </ToggleChip>
            ) : null}
            <ToggleChip
              active={draft.state.contractAttached}
              onClick={() => actions.toggleBoolean("state.contractAttached")}
              icon={Paperclip}
            >
              Захиалгын гэрээ / улсын комиссын акт хавсаргах
            </ToggleChip>
          </div>
      </CollapsibleGroup>

      <PricingSection draft={draft} actions={actions} isRent={isRent} price={price} area={area} unitPrice={unitPrice} />
    </div>
  );
}

/** Display an integer string with thousands separators (raw digits are stored). */
function formatThousands(value: string): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

function PricingSection({
  draft,
  actions,
  isRent,
  price,
  area,
  unitPrice,
}: {
  draft: SmartDraft;
  actions: DraftActions;
  isRent: boolean;
  price: number;
  area: number;
  unitPrice: number;
}) {
  const deposit = parseFloat(draft.pricing.deposit) || 0;

  return (
    <CollapsibleGroup icon={Banknote} title="10. Үнэ, төлбөрийн нөхцөл">
        <div className="grid gap-3 md:grid-cols-2">
          <Field id="field-price" label={isRent ? "Нийт үнэ/сар (₮)" : "Нийт үнэ (₮)"} required>
            <Input
              type="text"
              inputMode="numeric"
              value={formatThousands(isRent ? draft.pricing.monthlyPrice : draft.pricing.totalPrice)}
              onChange={(event) =>
                actions.setPath(
                  isRent ? "pricing.monthlyPrice" : "pricing.totalPrice",
                  event.target.value.replace(/\D/g, "")
                )
              }
              placeholder={isRent ? "4,000,000" : "450,000,000"}
            />
          </Field>
          <Field label={isRent ? "Нэгжийн үнэ/сар (₮/м²/сар)" : "Нэгжийн үнэ (₮/м²)"}>
            <Input value={unitPrice ? unitPrice.toLocaleString("en-US") : ""} disabled placeholder="Нийт үнийг нийт м²-т хувааж гаргана" />
          </Field>

          {isRent ? (
            <>
              <Field label="Давтамж">
                <NativeSelect
                  value={draft.pricing.rentFrequency}
                  onChange={(value) => actions.setPath("pricing.rentFrequency", value)}
                  options={rentFrequencies}
                />
              </Field>
              <Field label="Барьцаа (₮)">
                <Input
                  type="number"
                  min={0}
                  value={draft.pricing.deposit}
                  onChange={(event) => actions.setPath("pricing.deposit", event.target.value)}
                  placeholder="4000000"
                />
              </Field>
            </>
          ) : null}
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <CheckboxRow
            checked={draft.pricing.vatIncluded}
            onChange={(value) => actions.setPath("pricing.vatIncluded", value)}
            title="Дээрх үнэд НӨАТ багтсан"
          />
          <CheckboxRow
            checked={draft.pricing.ebarimt}
            onChange={(value) => actions.setPath("pricing.ebarimt", value)}
            title="Худалдан авагчид НӨАТ-тэй и-баримт олгоно"
          />
        </div>

        {isRent ? (
          (() => {
            // Show only the chosen frequency, and split "анхны" vs "дараагийн" төлбөр.
            const selectedMonth = (parseInt(draft.pricing.rentFrequency, 10) || 1) as RentMonth;
            const discount = draft.pricing.rentDiscounts[selectedMonth] || 0;
            const monthly = price ? Math.round(price * (1 - discount / 100)) : 0;
            const periodAmount = monthly * selectedMonth; // нэг удаагийн төлбөр
            const firstPayment = periodAmount ? periodAmount + deposit : 0;
            return (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label={`Хөнгөлөлт % (${selectedMonth} сар тутамд)`}>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={discount}
                      onChange={(event) =>
                        actions.setPath(`pricing.rentDiscounts.${selectedMonth}`, clampDecimal(event.target.value, 0, 100, 1))
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">
                      Анхны төлбөр (барьцаа + эхний {selectedMonth} сар)
                    </div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">{money(firstPayment)}</div>
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">
                      Дараагийн төлбөр бүр ({selectedMonth} сар тутам)
                    </div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">{money(periodAmount)}</div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">ТӨЛБӨРИЙН НӨХЦӨЛ</div>
            <div className="flex flex-wrap gap-2">
              {salePaymentForms.map((item) => (
                <ToggleChip
                  key={item}
                  active={draft.pricing.paymentForms.includes(item)}
                  onClick={() => actions.toggleArray("pricing.paymentForms", item)}
                  icon={draft.pricing.paymentForms.includes(item) ? Check : undefined}
                >
                  {item}
                </ToggleChip>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {area && price
            ? `Нийт ${area.toLocaleString("en-US")} м² · ${unitPrice.toLocaleString("en-US")}₮/м²`
            : "Үнэ ба талбайгаа оруулахад нэгжийн үнэ автоматаар гарна."}
        </p>
    </CollapsibleGroup>
  );
}

/** Photo thumbnail that falls back to a neutral placeholder if the image
 *  fails to load (e.g. a backend localhost URL or a dead link). */
function PhotoTileImage({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
        <ImageOff className="size-5" />
        <span className="text-[10px]">зураг алга</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Video tile — a plain <img> can't decode a video file (it just fires
 * onError and falls back to "зураг алга"), so the uploaded clip needs its
 * own preview: the video itself as the thumbnail (browsers show its first
 * frame) with a play-icon overlay, click-to-toggle playback.
 */
function VideoTile({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  if (!url) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
        <Video className="size-5" />
        <span className="text-[10px]">бичлэг алга</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="absolute inset-0"
      onClick={() => {
        const video = ref.current;
        if (!video) return;
        if (video.paused) {
          void video.play();
          setPlaying(true);
        } else {
          video.pause();
          setPlaying(false);
        }
      }}
    >
      <video
        ref={ref}
        src={url}
        muted
        playsInline
        preload="metadata"
        loop
        className="absolute inset-0 h-full w-full object-cover"
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 grid place-items-center bg-black/30 text-white">
          <PlayCircle className="size-8" />
        </div>
      )}
    </button>
  );
}

function MediaSection({ draft, actions }: { draft: SmartDraft; actions: DraftActions }) {
  const [urlInput, setUrlInput] = useState("");
  const [urlCategory, setUrlCategory] = useState(mediaCategories[0]);
  const [uploading, setUploading] = useState(false);
  // Transient local previews shown WHILE an upload is in-flight (blob URLs),
  // so the user sees their image + a spinner immediately. Replaced by the real
  // server photos on success, dropped on failure. Not part of the saved draft.
  const [pending, setPending] = useState<{ id: string; url: string; category: string }[]>([]);
  const pushToast = useStore((s) => s.pushToast);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const addPhoto = (category: string, url?: string) => {
    actions.mutate((next) => {
      next.media.photos.push({
        id: `photo-${Date.now()}-${next.media.photos.length}`,
        seed: `${category}-${Date.now()}-${next.media.photos.length}`,
        category,
        ...(url ? { url } : {}),
      });
      if (next.media.photos.length === 1) next.media.coverIndex = 0;
    });
  };
  /** Upload selected files to /media. Requires a live session; rejects files
   *  that violate the server limits up front so the user gets a clear message
   *  instead of a silent 422 that degrades to a placeholder image. */
  const handleFiles = async (category: string, fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    if (!isLoggedIn || !getToken()) {
      pushToast("Зураг байршуулахын тулд нэвтэрнэ үү", "danger");
      return;
    }
    const invalid = validateMediaFiles(files);
    if (invalid) {
      pushToast(invalid, "danger");
      return;
    }
    const apiCategory = PHOTO_CATEGORY_API[category] as MediaCategory | undefined;
    // Instant optimistic previews (blob) with a spinner while uploading.
    const previews = files.map((file, i) => ({
      id: `pending-${Date.now()}-${i}`,
      url: typeof URL !== "undefined" ? URL.createObjectURL(file) : "",
      category,
    }));
    setPending((prev) => [...prev, ...previews]);
    const clearPreviews = () => {
      setPending((prev) => prev.filter((p) => !previews.some((q) => q.id === p.id)));
      previews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    };
    setUploading(true);
    try {
      const media = await uploadMedia({ files, category: apiCategory });
      actions.mutate((next) => {
        const wasEmpty = next.media.photos.length === 0;
        for (const m of media) {
          next.media.photos.push({
            id: `photo-${m.id}`,
            seed: `media-${m.id}`,
            category,
            url: m.url,
            mediaId: m.id,
          });
        }
        if (wasEmpty) next.media.coverIndex = 0;
      });
      pushToast(`${media.length} зураг байршууллаа`, "success");
    } catch (err) {
      // Do NOT keep a local blob preview on failure — it would look uploaded but
      // silently become a placeholder image on submit. Surface the error instead.
      const message =
        err instanceof ApiError
          ? Object.values(err.validationErrors ?? {})[0]?.[0] ??
            `Серверийн алдаа (${err.status})`
          : "Сүлжээний алдаа";
      pushToast(`Зураг байршуулж чадсангүй: ${message}`, "danger");
    } finally {
      clearPreviews();
      setUploading(false);
    }
  };
  /** Upload brochure/document/certificate PDFs to /media and store their ids. */
  const handleDocuments = async (
    category: DocumentCategory,
    fileList: FileList | null
  ) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    if (!isLoggedIn || !getToken()) {
      pushToast("Файл байршуулахын тулд нэвтэрнэ үү", "danger");
      return;
    }
    const invalid = validateDocumentFiles(files);
    if (invalid) {
      pushToast(invalid, "danger");
      return;
    }
    setUploading(true);
    try {
      const media = await uploadMedia({ files, category });
      actions.mutate((next) => {
        media.forEach((m, i) => {
          next.media.documents.push({
            id: `doc-${m.id}`,
            category,
            name: files[i]?.name ?? "файл",
            url: m.url,
            mediaId: m.id,
          });
        });
      });
      pushToast(`${media.length} файл байршууллаа`, "success");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? Object.values(err.validationErrors ?? {})[0]?.[0] ??
            `Серверийн алдаа (${err.status})`
          : "Сүлжээний алдаа";
      pushToast(`Файл байршуулж чадсангүй: ${message}`, "danger");
    } finally {
      setUploading(false);
    }
  };
  const removeDocument = (index: number) => {
    actions.mutate((next) => {
      next.media.documents.splice(index, 1);
    });
  };
  const addPhotoByUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    addPhoto(urlCategory, url);
    setUrlInput("");
  };
  const removePhoto = (index: number) => {
    actions.mutate((next) => {
      next.media.photos.splice(index, 1);
      // Keep the cover pointing at the SAME photo: shift left if a photo before
      // it was removed, then clamp to the new bounds.
      let cover = next.media.coverIndex;
      if (index < cover) cover -= 1;
      next.media.coverIndex = Math.min(cover, Math.max(0, next.media.photos.length - 1));
    });
  };

  return (
    <Card id="field-photos" className="scroll-mt-24 rounded-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="size-4 text-accent" />
          11. Зураг, бичлэг
        </CardTitle>
        <CardDescription>Хамгийн багадаа нэг зураг нэмнэ. Cover index болон category нь detail payload-д хадгалагдана.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="lp-upload-grid">
          {mediaCategories.map((category) => {
            const Icon = category === "Нүүрний зураг" ? ImageUp : category === "План зураг" ? Scan : category === "Бичлэг" ? Video : Upload;
            const accept = category === "Бичлэг" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp";
            return (
              <label key={category} className={cn("lp-upload-card cursor-pointer", uploading && "pointer-events-none opacity-60")}>
                <input
                  type="file"
                  multiple
                  accept={accept}
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    void handleFiles(category, event.target.files);
                    event.target.value = "";
                  }}
                />
                <Icon className="size-4" />
                <div className="lp-upload-title">{category}</div>
                <div className="lp-upload-count">
                  {draft.media.photos.filter((photo) => photo.category === category).length} файл
                </div>
              </label>
            );
          })}
        </div>
        {uploading ? (
          <p className="text-xs text-muted-foreground">Зураг байршуулж байна…</p>
        ) : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {draft.media.photos.map((photo, index) => {
            const isCover = draft.media.coverIndex === index;
            return (
              <div
                key={photo.id}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border-2 bg-muted",
                  isCover ? "border-accent" : "border-border"
                )}
              >
                {photo.category === "Бичлэг" ? (
                  <VideoTile url={photo.url ? normalizeMediaUrl(photo.url) : ""} />
                ) : (
                  <PhotoTileImage url={photo.url ? normalizeMediaUrl(photo.url) : ""} alt={photo.category} />
                )}
                {photo.category !== "Бичлэг" && (
                  <Button
                    type="button"
                    size="xs"
                    variant={isCover ? "default" : "secondary"}
                    onClick={() => actions.setPath("media.coverIndex", index)}
                    className="absolute left-1 top-1 h-6"
                  >
                    {isCover ? "Нүүр" : "Сонгох"}
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  onClick={() => removePhoto(index)}
                  className="absolute right-1 top-1"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <div className="absolute inset-x-0 bottom-0 truncate bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white">
                  {photo.category}
                </div>
              </div>
            );
          })}
          {pending.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-md border-2 border-dashed border-primary/50 bg-muted"
            >
              {p.url ? (
                <img src={p.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-[10px] font-semibold">Байршуулж байна…</span>
              </div>
            </div>
          ))}
          {draft.media.photos.length < 15 ? (
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  void handleFiles("Дотор зураг", event.target.files);
                  event.target.value = "";
                }}
              />
              <Plus className="size-5" />
            </label>
          ) : null}
        </div>
        <Field label="Зургийн линкээр нэмэх" hint="Интернэт дэх зургийн URL-ийг ангилалтай нь оруулна. Хадгалахад зурагнууд серверт хадгалагдана.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={urlCategory}
              onChange={(event) => setUrlCategory(event.target.value)}
              className="h-9 shrink-0 rounded-md border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20 sm:w-56"
            >
              {mediaCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPhotoByUrl();
                }
              }}
              placeholder="https://...jpg"
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={addPhotoByUrl} disabled={!urlInput.trim()}>
              Нэмэх
            </Button>
          </div>
        </Field>
        <Field label="Зураг, бичлэг агуулсан линк">
          <Input
            value={draft.media.videoLink}
            onChange={(event) => actions.setPath("media.videoLink", event.target.value)}
            placeholder="https://..."
          />
        </Field>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <FileText className="size-4 text-accent" />
            Танилцуулга, баримт бичиг (PDF)
          </div>
          <p className="text-xs text-muted-foreground">
            Брошур/танилцуулга, гэрээ/баримт, гэрчилгээг PDF (эсвэл DOC) хэлбэрээр хавсаргана. Дээд хэмжээ 25MB.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DOCUMENT_CATEGORIES.map((category) => {
              const count = draft.media.documents.filter((d) => d.category === category).length;
              return (
                <label
                  key={category}
                  className={cn(
                    "lp-upload-card cursor-pointer",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,.pdf,.doc,.docx"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(event) => {
                      void handleDocuments(category, event.target.files);
                      event.target.value = "";
                    }}
                  />
                  <Upload className="size-4" />
                  <div className="lp-upload-title">{DOCUMENT_LABELS[category]}</div>
                  <div className="lp-upload-count">{count} файл</div>
                </label>
              );
            })}
          </div>
          {draft.media.documents.length ? (
            <ul className="divide-y rounded-md border">
              {draft.media.documents.map((doc, index) => (
                <li key={doc.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{doc.name}</span>
                  <Badge variant="outline" className="ml-auto shrink-0 rounded-full text-[10px]">
                    {DOCUMENT_LABELS[doc.category]}
                  </Badge>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeDocument(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

const DOCUMENT_LABELS: Record<DocumentCategory, string> = {
  brochure: "Танилцуулга / брошур",
  document: "Гэрээ / баримт",
  certificate: "Гэрчилгээ",
};

function StepFive({
  draft,
  actions,
  missing,
  optional,
  price,
  selectedType,
  onJumpToMissing,
}: {
  draft: SmartDraft;
  selectedType: (typeof propertyTypes)[number];
  price: number;
  missing: Requirement[];
  optional: OptionalItem[];
  actions: DraftActions;
  onJumpToMissing: (item: Requirement) => void;
}) {
  const suggested = optional.filter((item) => !item.ok).slice(0, 4);
  const review = [
    { label: "Зорилго", value: getGoal(draft.goal).label, icon: Target },
    { label: "Төрөл", value: `${selectedType.label} · ${draft.subtype}`, icon: Building2 },
    { label: "Байршил", value: `${draft.address.district}, ${draft.address.khoroo || "-"}-р хороо`, icon: MapPin },
    { label: "Үнэ", value: price ? `${price.toLocaleString("en-US")}₮${modeOf(draft.goal) === "rent" ? "/сар" : ""}` : "-", icon: Banknote },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchCheck className="size-4 text-accent" />
            12. Шалгах, баталгаажуулах
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {review.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-md border bg-card p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Icon className="size-3.5 text-accent" />
                    {item.label}
                  </div>
                  <div className="truncate text-sm font-semibold">{item.value}</div>
                </div>
              );
            })}
          </div>
          {missing.length ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/5 p-3">
              <div className="mb-2 text-sm font-semibold text-destructive">
                Заавал бөглөх {missing.length} зүйл байна
              </div>
              <div className="flex flex-wrap gap-2">
                {missing.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onJumpToMissing(item)}
                    className="h-auto min-h-7 whitespace-normal"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {suggested.length ? (
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="mb-2 text-sm font-semibold">Нийтлэсний дараа нөхөж болох зүйлс</div>
              <div className="flex flex-wrap gap-2">
                {suggested.map((item) => (
                  <Badge key={item.label} variant="outline" className="rounded-full">
                    {item.label}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <div id="field-truth" className="scroll-mt-24">
              <CheckboxRow
                checked={draft.declarations.truth}
                onChange={(value) => actions.setPath("declarations.truth", value)}
                title="Дээрх мэдээлэл үнэн зөв"
                sub="Дээрх мэдээлэл нь үнэн зөв, бүрэн, бодитой гэдгийг би баталж байна."
              />
            </div>
            <div id="field-authority" className="scroll-mt-24">
              <CheckboxRow
                checked={draft.declarations.authority}
                onChange={(value) => actions.setPath("declarations.authority", value)}
                title="Эрх бүхий этгээд мөн"
                sub="Би энэхүү зарыг оруулж, олон нийтэд мэдээлэх эрх бүхий этгээд мөн гэдгийг баталж байна."
              />
            </div>
            <div id="field-terms" className="scroll-mt-24">
              <CheckboxRow
                checked={draft.declarations.terms}
                onChange={(value) => actions.setPath("declarations.terms", value)}
                title="Үйлчилгээний нөхцөл зөвшөөрөх"
                sub="www.neomap.mn веб сайтын ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ-ийг бүрэн уншиж танилцсан бөгөөд бүрэн хүлээн зөвшөөрч байна."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="size-4 text-accent" />
            13. Verified and Brokerage service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              active={draft.services.verified}
              onClick={() => actions.toggleBoolean("services.verified")}
              icon={BadgeCheck}
            >
              Та өөрийн зарыг VERIFIED болгохыг хүсэж байна уу? ТЭГЬЕ.
            </ToggleChip>
            <ToggleChip
              active={draft.services.brokerage}
              onClick={() => actions.toggleBoolean("services.brokerage")}
              icon={Users}
            >
              Та энэ үл хөдлөх эд хөрөнгөө манай мэргэжлийн зуучлагчаар зуучлуулах уу? ТЭГЬЕ.
            </ToggleChip>
            <ToggleChip
              active={draft.services.sponsored}
              onClick={() => actions.toggleBoolean("services.sponsored")}
              icon={Megaphone}
            >
              Та энэхүү зарыг SPONSORED болгохыг хүсэж байна уу? ТЭГЬЕ.
            </ToggleChip>
          </div>
          <Field id="field-relation" label="Та энэ үл хөдлөх эд хөрөнгөтэй ямар холбоотой вэ?" required>
            <div className="flex flex-wrap gap-2">
              {relations.map((relation) => (
                <ToggleChip
                  key={relation}
                  active={draft.services.relation === relation}
                  onClick={() => actions.setPath("services.relation", relation)}
                >
                  {relation}
                </ToggleChip>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
