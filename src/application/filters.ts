import type { Listing, ListingPropertyKind } from "@/domain/types";
import { LISTINGS } from "@/infrastructure/data/listings";
import { AGENTS } from "@/infrastructure/data/agents";
import { BUS_STOPS, BUS_STOP_RADIUS } from "@/infrastructure/data/bus-stops";
import { geoDistance, pointInPolygon } from "@/lib/utils";

export const LIFESTYLE_DEFS = [
  { key: "family", label: "Гэр бүлд тохиромжтой", icon: "users" },
  { key: "work-close", label: "Ажил руу ойр", icon: "briefcase" },
  { key: "school-near", label: "Сургууль ойр", icon: "graduation-cap" },
  { key: "investment", label: "Хөрөнгө оруулалт", icon: "trending-up" },
  { key: "pet", label: "Тэжээвэр амьтантай", icon: "paw-print" },
  { key: "furnished", label: "Тавилгатай", icon: "sofa" },
  { key: "mortgage", label: "Зээлээр авч болно", icon: "banknote" },
] as const;

const CENTRAL_DISTRICTS = new Set(["Сүхбаатар", "Чингэлтэй"]);

export function activeListings(): Listing[] {
  return LISTINGS.filter((l) => l.status !== "sold");
}

export function baseListingsForMode(mode: "sale" | "rent"): Listing[] {
  return activeListings().filter(
    (l) => l.mode === mode && (mode !== "sale" || getPropertyKind(l) === "apartment")
  );
}

export function isListingVerified(l: Listing): boolean {
  const ag = AGENTS.find((a) => a.id === l.agentId);
  return !!ag?.verified;
}

export function hasIpoteh(l: Listing): boolean {
  return (l.features ?? []).some((f) => /Зээ?л|Ипотек/i.test(f)) || l.mode === "sale";
}

export function isNewProject(l: Listing): boolean {
  return l.year >= 2022 || l.status === "new";
}

export function getPropertyKind(l: Listing): ListingPropertyKind {
  if (l.propertyKind) return l.propertyKind;
  const feats = (l.features ?? []).join(" ").toLowerCase();
  const floor = (l.floor ?? "").toLowerCase();
  if (/хаус|вилла|амины орон сууц|townhouse/.test(feats + " " + floor)) return "house";
  if (/оффис|худалдаа|агуулах|зочид буудал|service|commercial/.test(feats)) return "other";
  return "apartment";
}

export function getLifestyleTags(l: Listing): string[] {
  const feats = (l.features ?? []).join(" ").toLowerCase();
  const tags: string[] = [];
  if (l.rooms >= 3 || l.area >= 100 || feats.includes("гэр бүл") || feats.includes("хүүхд"))
    tags.push("family");
  if (CENTRAL_DISTRICTS.has(l.district) || feats.includes("хотын төв"))
    tags.push("work-close");
  if (l.year >= 2017 && l.rooms >= 2) tags.push("school-near");
  if (l.mode === "sale" && (l.year >= 2019 || CENTRAL_DISTRICTS.has(l.district)))
    tags.push("investment");
  if (feats.includes("тэжээвэр")) tags.push("pet");
  if (feats.includes("тавилгатай") || feats.includes("бэлэн орох")) tags.push("furnished");
  if (feats.includes("зээл")) tags.push("mortgage");
  return tags;
}

export interface FilterState {
  mode: "sale" | "rent";
  filterPropertyKind: ListingPropertyKind | null;
  filterDistrict: string | null;
  filterRooms: number[] | null;
  filterBusStop: string | null;
  filterLifestyle: string[];
  filterVerified: boolean;
  filterIpoteh: boolean;
  filterNewProject: boolean;
  filterSchool: boolean;
  filterIncome: boolean;
  filterPriceMin: number | null;
  filterPriceMax: number | null;
  filterPpmMin: number | null;
  filterPpmMax: number | null;
  filterAreaMin: number | null;
  filterAreaMax: number | null;
  drawnPolygon: { x: number; y: number }[] | null;
  sortBy: "newest" | "price-asc" | "price-desc" | "area-asc" | "area-desc" | "ppm-asc";
}

export function filteredListings(s: FilterState): Listing[] {
  let list = baseListingsForMode(s.mode);

  if (s.mode !== "sale" && s.filterPropertyKind)
    list = list.filter((l) => getPropertyKind(l) === s.filterPropertyKind);
  if (s.filterDistrict) list = list.filter((l) => l.district === s.filterDistrict);
  if (s.filterRooms && s.filterRooms.length)
    list = list.filter((l) => s.filterRooms!.includes(l.rooms));

  if (s.filterBusStop) {
    const stop = BUS_STOPS.find((b) => b.id === s.filterBusStop);
    if (stop)
      list = list.filter(
        (l) => geoDistance({ lat: l.lat, lng: l.lng }, { lat: stop.lat, lng: stop.lng }) <= BUS_STOP_RADIUS
      );
  }

  if (s.filterLifestyle.length) {
    list = list.filter((l) => {
      const tags = getLifestyleTags(l);
      return s.filterLifestyle.every((k) => tags.includes(k));
    });
  }

  if (s.filterVerified) list = list.filter(isListingVerified);
  if (s.filterIpoteh) list = list.filter(hasIpoteh);
  if (s.filterNewProject) list = list.filter(isNewProject);
  if (s.filterSchool)
    list = list.filter((l) => ["Сүхбаатар", "Чингэлтэй", "Хан-Уул"].includes(l.district));
  if (s.filterIncome)
    list = list.filter((l) => (l.mode === "sale" ? l.price >= 300_000_000 : true));

  if (s.filterPriceMin != null) list = list.filter((l) => l.price >= s.filterPriceMin!);
  if (s.filterPriceMax != null) list = list.filter((l) => l.price <= s.filterPriceMax!);
  if (s.filterPpmMin != null) list = list.filter((l) => l.price / l.area >= s.filterPpmMin!);
  if (s.filterPpmMax != null) list = list.filter((l) => l.price / l.area <= s.filterPpmMax!);
  if (s.filterAreaMin != null) list = list.filter((l) => l.area >= s.filterAreaMin!);
  if (s.filterAreaMax != null) list = list.filter((l) => l.area <= s.filterAreaMax!);

  if (s.drawnPolygon && s.drawnPolygon.length >= 3)
    list = list.filter((l) => pointInPolygon({ x: l.lat, y: l.lng }, s.drawnPolygon!));

  switch (s.sortBy) {
    case "newest":
      list = [...list].sort((a, b) => a.listedDays - b.listedDays);
      break;
    case "price-asc":
      list = [...list].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list = [...list].sort((a, b) => b.price - a.price);
      break;
    case "area-asc":
      list = [...list].sort((a, b) => a.area - b.area);
      break;
    case "area-desc":
      list = [...list].sort((a, b) => b.area - a.area);
      break;
    case "ppm-asc":
      list = [...list].sort((a, b) => a.price / a.area - b.price / b.area);
      break;
  }
  return list;
}

export interface AIExtracted {
  mode: "sale" | "rent" | null;
  district: string | null;
  rooms: number | null;
  maxPrice: number | null;
  minYear: number | null;
  lifestyle: string[];
}

const DISTRICTS_LOWER = [
  "Хан-Уул",
  "Баянзүрх",
  "Сүхбаатар",
  "Чингэлтэй",
  "Сонгинохайрхан",
  "Налайх",
  "Баянгол",
  "Багануур",
  "Багахангай",
];

export function parseAIQuery(text: string): AIExtracted {
  const t = (text || "").toLowerCase();
  const out: AIExtracted = {
    mode: null,
    district: null,
    rooms: null,
    maxPrice: null,
    minYear: null,
    lifestyle: [],
  };

  if (/(худал[дн]|зар(а|ы)|авах|худалдаж)/.test(t)) out.mode = "sale";
  else if (/(түрээс|сар(ын)?\s?\d|\bсар\b)/.test(t)) out.mode = "rent";

  for (const d of DISTRICTS_LOWER) {
    if (t.includes(d.toLowerCase())) {
      out.district = d;
      break;
    }
  }

  const room = t.match(/(\d)\s*өрөө/);
  if (room) out.rooms = Math.min(4, parseInt(room[1], 10));

  const sayaa = t.match(/(\d+(?:[.,]\d+)?)\s*(тэрбум|саяас|сая|сар(ын)?|мянган)/);
  if (sayaa) {
    const n = parseFloat(sayaa[1].replace(",", "."));
    if (/тэрбум/.test(sayaa[2])) out.maxPrice = n * 1_000_000_000;
    else if (/сая/.test(sayaa[2])) out.maxPrice = n * 1_000_000;
    else if (/мянган/.test(sayaa[2])) out.maxPrice = n * 1000;
  }

  const yr = t.match(/(20\d{2})\s*(он(оос)?|оноос)/);
  if (yr) out.minYear = parseInt(yr[1], 10);

  if (/(сургууль|цэцэрлэг|еб)/.test(t)) out.lifestyle.push("school-near");
  if (/(ажил|төв|метро|оффис)/.test(t)) out.lifestyle.push("work-close");
  if (/(гэр бүл|хүүхд|том)/.test(t)) out.lifestyle.push("family");
  if (/(хөрөнгө|өгөөж|инвест)/.test(t)) out.lifestyle.push("investment");
  if (/(тэжээвэр|нохой|муур)/.test(t)) out.lifestyle.push("pet");
  if (/(тавилга|бэлэн орох)/.test(t)) out.lifestyle.push("furnished");
  if (/зээл/.test(t)) out.lifestyle.push("mortgage");

  return out;
}

export const AI_EXAMPLES = [
  { icon: "graduation-cap", text: "Хан-Уулд 3 өрөө, 450 саяс доош, сургууль ойр" },
  { icon: "home", text: "Сүхбаатарт 2 өрөө түрээс, 1.5 саяс доош" },
  { icon: "briefcase", text: "Хотын төв ажилд ойр, 1 өрөө түрээс" },
  { icon: "users", text: "Гэр бүлд том 4 өрөө, Баянзүрх, 600 сая хүртэл" },
  { icon: "trending-up", text: "Хөрөнгө оруулалт, шинэ төсөл, 2020 оноос" },
  { icon: "landmark", text: "3 өрөө, зээлээр авч болно, бэлэн орох" },
];
