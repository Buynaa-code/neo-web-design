import { DISTRICTS } from "@/data/constants";
import type { ListingMode } from "@/lib/types";

export interface AIExtracted {
  mode: ListingMode | null;
  district: string | null;
  rooms: number | null;
  maxPrice: number | null;
  minYear: number | null;
  lifestyle: string[];
}

export const AI_EXAMPLES: { icon: string; text: string }[] = [
  { icon: "graduation-cap", text: "Хан-Уулд 3 өрөө, 450 саяс доош, сургууль ойр" },
  { icon: "home", text: "Сүхбаатарт 2 өрөө түрээс, 1.5 саяс доош" },
  { icon: "briefcase", text: "Хотын төв ажилд ойр, 1 өрөө түрээс" },
  { icon: "users", text: "Гэр бүлд том 4 өрөө, Баянзүрх, 600 сая хүртэл" },
  { icon: "trending-up", text: "Хөрөнгө оруулалт, шинэ төсөл, 2020 оноос" },
  { icon: "landmark", text: "3 өрөө, зээлээр авч болно, бэлэн орох" },
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

  for (const d of DISTRICTS) {
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
    else if (/мянган/.test(sayaa[2])) out.maxPrice = n * 1_000;
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

export function extractedToChips(
  ex: AIExtracted | null
): { icon: string; label: string }[] {
  if (!ex) return [];
  const chips: { icon: string; label: string }[] = [];
  if (ex.mode)
    chips.push({
      icon: ex.mode === "rent" ? "key" : "tag",
      label: ex.mode === "rent" ? "Түрээс" : "Худалдах",
    });
  if (ex.district) chips.push({ icon: "map-pin", label: ex.district });
  if (ex.rooms) chips.push({ icon: "bed", label: `${ex.rooms} өрөө` });
  if (ex.maxPrice) {
    const v =
      ex.maxPrice >= 1_000_000_000
        ? `≤ ${(ex.maxPrice / 1_000_000_000).toFixed(2)} тэрбум`
        : `≤ ${(ex.maxPrice / 1_000_000).toFixed(0)} сая`;
    chips.push({ icon: "tag", label: v });
  }
  if (ex.minYear) chips.push({ icon: "calendar", label: `${ex.minYear} оноос` });

  const lifeMap: Record<string, [string, string]> = {
    "school-near": ["graduation-cap", "Сургууль ойр"],
    "work-close": ["briefcase", "Ажил руу ойр"],
    family: ["users", "Гэр бүлд"],
    investment: ["trending-up", "Хөрөнгө оруулалт"],
    pet: ["paw-print", "Тэжээвэртэй"],
    furnished: ["sofa", "Тавилгатай"],
    mortgage: ["landmark", "Зээлээр"],
  };
  ex.lifestyle.forEach((k) => {
    const m = lifeMap[k];
    if (m) chips.push({ icon: m[0], label: m[1] });
  });
  if (!chips.length) chips.push({ icon: "sparkles", label: "Чөлөөт хайлт" });
  return chips;
}
