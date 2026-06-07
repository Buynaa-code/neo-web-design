import type { Listing, ListingMode } from "@/domain/types";
import type { InterestsProfile } from "@/infrastructure/store";
import { LISTINGS } from "@/infrastructure/data/listings";
import { INTEREST_MUST_HAVES } from "@/infrastructure/data/interests";

export interface MatchReason {
  icon: string;
  text: string;
  kind: "good" | "soft";
}

export interface MatchResult {
  listing: Listing;
  score: number;
  reasons: MatchReason[];
}

function getListingDetails(l: Listing): { bedrooms: number; bathrooms: number; hasOffice: boolean } {
  const rooms = Number(l.rooms) || 1;
  const area = Number(l.area) || 0;
  const bedrooms = Math.max(0, rooms - 1);
  let bathrooms: number;
  if (area >= 150) bathrooms = l.id % 2 === 0 ? 3 : 2;
  else if (area >= 100) bathrooms = 2;
  else if (area >= 70) bathrooms = l.id % 3 === 0 ? 2 : 1;
  else bathrooms = 1;
  const feats = (l.features || []).join(" ").toLowerCase();
  const desc = String(l.desc || "").toLowerCase();
  const hasOffice =
    /ажлын|кабинет|office/.test(feats + " " + desc) || (rooms >= 4 && area >= 130);
  return { bedrooms, bathrooms, hasOffice };
}

const FEATURE_MAP: Record<string, string[]> = {
  school: ["сургууль"],
  park: ["цэцэрлэгт", "хүрээлэн", "парк"],
  newproject: ["шинэ", "новый"],
  view: ["харц", "үзэмж", "уулын", "голын"],
  elevator: ["лифт"],
  parking: ["зогсоол", "гараж"],
  quiet: ["чимээгүй", "тайван"],
  pet: ["тэжээвэр"],
  furnished: ["тавилга"],
};

const HOUSE_PURPOSES = new Set(["house", "fenced-house", "cottage-land", "cottage-no"]);

function listingHaystack(listing: Listing): string {
  return [
    listing.khotkhon,
    listing.floor,
    listing.desc,
    ...(listing.features || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function listingPurpose(listing: Listing): "apartment" | "house" {
  const haystack = listingHaystack(listing);
  if (/хаус|house|вилла|villa|хашаа|зуслан|country|eco|эко/.test(haystack)) {
    return "house";
  }
  return "apartment";
}

function conditionMatches(key: string, listing: Listing): boolean {
  const haystack = listingHaystack(listing);
  if (key === "commissioned") return /бэлэн|орсон/.test(haystack) || listing.year <= new Date().getFullYear();
  if (key === "pre-comm") return listing.year >= new Date().getFullYear();
  if (key === "certified") return /гэрчилгээ|зээл/.test(haystack);
  if (key === "pre-cert") return listing.year >= 2024;
  if (key === "brand-new") return /шинэ|цоо/.test(haystack) || listing.year >= 2021;
  if (key === "used") return listing.year < 2021;
  if (key === "no-collateral") return !/барьцаа/.test(haystack);
  if (key === "vacant") return /бэлэн|сул|чөлөөтэй/.test(haystack);
  if (key === "fresh-reno") return /заслагдсан|шинээр зас/.test(haystack);
  if (key === "no-reno") return /засваргүй|тавилгагүй/.test(haystack);
  return false;
}

function vibeMatches(vibe: string | undefined, listing: Listing): boolean {
  if (!vibe) return false;
  const haystack = listingHaystack(listing);
  if (vibe === "downtown") {
    return listing.district === "Сүхбаатар" || listing.district === "Чингэлтэй" || /хотын төв|central/.test(haystack);
  }
  if (vibe === "quiet-street") return /чимээгүй|тайван|гэр бүлд/.test(haystack);
  if (vibe === "park-near") return /цэцэрлэг|парк|ногоон|хүрээлэн/.test(haystack);
  if (vibe === "new-area") return /шинэ|new/.test(haystack) || listing.year >= 2021;
  return false;
}

export function computeMatchScore(
  listing: Listing,
  interests: InterestsProfile
): { score: number; reasons: MatchReason[] } {
  if (!listing || !interests || !interests.lifestyle) {
    return { score: 0, reasons: [] };
  }
  if (interests.mode && listing.mode !== interests.mode) {
    return { score: 0, reasons: [] };
  }
  let score = 0;
  const reasons: MatchReason[] = [];

  const purpose = interests.purpose || "any";
  if (purpose !== "any") {
    const derivedPurpose = listingPurpose(listing);
    const matchesPurpose =
      (purpose === "apartment" && derivedPurpose === "apartment") ||
      (HOUSE_PURPOSES.has(purpose) && derivedPurpose === "house");
    if (matchesPurpose) {
      score += 8;
      reasons.push({
        icon: derivedPurpose === "house" ? "home" : "building-2",
        text: derivedPurpose === "house" ? "Амины сууц төрөл" : "Орон сууц төрөл",
        kind: "good",
      });
    } else if (purpose === "apartment" || HOUSE_PURPOSES.has(purpose)) {
      return { score: 0, reasons: [] };
    }
  }

  const districts = interests.districts || [];
  if (districts.length === 0) score += 15;
  else if (districts.includes(listing.district)) {
    score += 30;
    reasons.push({ icon: "map-pin", text: `${listing.district} дүүрэгт`, kind: "good" });
  }

  const bMin = interests.budgetMin;
  const bMax = interests.budgetMax;
  if (bMin == null && bMax == null) score += 12;
  else {
    const inMin = bMin == null || listing.price >= bMin;
    const inMax = bMax == null || listing.price <= bMax;
    if (inMin && inMax) {
      score += 25;
      reasons.push({ icon: "banknote", text: "Танай төсөвт тохирно", kind: "good" });
    } else if (!inMax && bMax && listing.price <= bMax * 1.15) {
      score += 12;
      reasons.push({ icon: "banknote", text: "Төсвөөс бага зэрэг дээгүүр", kind: "soft" });
    }
  }

  const details = getListingDetails(listing);
  const bedrooms = interests.bedrooms || [];
  if (bedrooms.length === 0) score += 6;
  else if (
    bedrooms.includes(details.bedrooms) ||
    (bedrooms.includes(4) && details.bedrooms >= 4)
  ) {
    score += 12;
    const label = details.bedrooms === 0 ? "Студио" : `${details.bedrooms} унтлагатай`;
    reasons.push({ icon: "bed-double", text: label, kind: "good" });
  }

  const bathMin = interests.bathroomsMin || 0;
  if (bathMin === 0) score += 2;
  else if (details.bathrooms >= bathMin) {
    score += 5;
    if (reasons.length < 4)
      reasons.push({ icon: "bath", text: `${details.bathrooms} нойл`, kind: "good" });
  }

  if (interests.office) {
    if (details.hasOffice) {
      score += 4;
      if (reasons.length < 4)
        reasons.push({ icon: "briefcase", text: "Ажлын өрөөтэй", kind: "good" });
    }
  } else {
    score += 2;
  }

  const mh = interests.mustHaves || [];
  if (mh.length === 0) score += 15;
  else {
    const features = (listing.features || []).map((f) => String(f).toLowerCase());
    const desc = String(listing.desc || "").toLowerCase();
    const haystack = features.join(" ") + " " + desc;
    let matched = 0;
    mh.forEach((key) => {
      const terms = FEATURE_MAP[key] || [];
      if (terms.some((t) => haystack.includes(t))) {
        matched++;
        const meta = INTEREST_MUST_HAVES.find((x) => x.key === key);
        if (meta && reasons.length < 4)
          reasons.push({ icon: meta.icon, text: meta.label, kind: "good" });
      }
      if (key === "newproject" && listing.year && listing.year >= 2021) {
        if (!terms.some((t) => haystack.includes(t))) {
          matched++;
          if (reasons.length < 4)
            reasons.push({ icon: "sparkles", text: "Шинэ барилга", kind: "good" });
        }
      }
    });
    score += Math.round((matched / mh.length) * 30);
  }

  const conditions = interests.conditions || [];
  if (conditions.length > 0) {
    const matchedConditions = conditions.filter((key) => conditionMatches(key, listing)).length;
    if (matchedConditions > 0) {
      score += Math.min(8, matchedConditions * 3);
      if (reasons.length < 4) {
        reasons.push({ icon: "badge-check", text: "Төлөв таарч байна", kind: "good" });
      }
    }
  }

  if (vibeMatches(interests.vibe, listing)) {
    score += 5;
    if (reasons.length < 4) {
      reasons.push({ icon: "sparkles", text: "Орчны мэдрэмж таарна", kind: "soft" });
    }
  }

  if (listing.status === "hot") score += 3;
  if (listing.status === "new") score += 2;
  if (listing.status === "drop") {
    score += 2;
    if (reasons.length < 4)
      reasons.push({ icon: "trending-down", text: "Үнэ буурсан", kind: "soft" });
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}

export function matchedListings(
  interests: InterestsProfile | null,
  dismissedIds: number[] = [],
  minScore = 40
): MatchResult[] {
  if (!interests) return [];
  const dismissed = new Set(dismissedIds);
  return LISTINGS.filter((l) => l.status !== "sold")
    .map((l) => ({ listing: l, ...computeMatchScore(l, interests) }))
    .filter((x) => x.score >= minScore && !dismissed.has(x.listing.id))
    .sort((a, b) => b.score - a.score);
}

export function inferInterestsFromBehavior(
  savedListingIds: number[],
  fallbackMode: ListingMode
): Partial<InterestsProfile> | null {
  const saved = LISTINGS.filter((listing) => savedListingIds.includes(listing.id));
  if (saved.length === 0) return null;

  const tally = <T extends string | number>(values: T[]): T[] => {
    const counts = new Map<T, number>();
    values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value]) => value);
  };

  const mode = tally(saved.map((listing) => listing.mode))[0] ?? fallbackMode;
  const districts = tally(saved.map((listing) => listing.district)).slice(0, 3);
  const bedrooms = [
    ...new Set(
      tally(saved.map((listing) => listing.rooms))
        .slice(0, 3)
        .map((rooms) => Math.max(1, Math.min(4, rooms - 1)))
    ),
  ];
  const avgPrice = saved.reduce((sum, listing) => sum + listing.price, 0) / saved.length;

  return {
    mode,
    districts,
    bedrooms,
    budgetMin: null,
    budgetMax: Math.round(avgPrice * 1.2),
    budgetAny: false,
  };
}
