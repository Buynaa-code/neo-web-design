import type { Listing } from "@/domain/types";
import { ADDRESS_LEVELS } from "./constants";

export function fmtFullPrice(n: number, mode?: "sale" | "rent"): string {
  const base = n.toLocaleString("en-US") + "₮";
  return mode === "rent" ? base + "/сар" : base;
}

export function listingPpm(l: Listing): number {
  return Math.round(l.price / l.area);
}

export function fmtPpm(l: Listing): string {
  return listingPpm(l).toLocaleString("en-US") + "₮/м²";
}

export function isNewProject(l: Listing): boolean {
  return l.year >= 2022 || l.status === "new";
}

export function listingTimeAgo(l: Listing): string {
  const d = l.listedDays || 0;
  if (d === 0) return "Дөнгөж сая";
  if (d === 1) return "1 хоногийн өмнө";
  if (d < 7) return d + " хоногийн өмнө";
  if (d < 30) return Math.floor(d / 7) + " долоо хоногийн өмнө";
  return Math.floor(d / 30) + " сарын өмнө";
}

export function listingMinutesAgo(l: Listing): string {
  const d = l.listedDays || 0;
  if (d > 0) return listingTimeAgo(l);
  const seed = (l.id * 17 + l.photos * 5) % 240;
  if (seed < 60) return Math.max(1, seed) + " минутын өмнө";
  return Math.floor(seed / 60) + " цагийн өмнө";
}

export function listingOrientation(l: Listing): string {
  const opts = ["Баруун харсан", "Зүүн харсан", "Урд харсан", "Хойд харсан"];
  return opts[(l.id + l.photos) % opts.length];
}

export function listingHeating(l: Listing): string {
  return l.year >= 2018 ? "Төвийн халаалт" : "Зуухтай";
}

export function mortgageMonthly(
  price: number,
  downPct = 30,
  years = 20,
  annualRate = 12
): number {
  const loan = price * (1 - downPct / 100);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(loan / n);
  const m = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(m);
}

export function fmtSale(n: number): string {
  return "₮" + n.toLocaleString("en-US");
}

export function fmtRent(n: number): string {
  return "₮" + n.toLocaleString("en-US") + "/сар";
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return "₮" + (n / 1_000_000_000).toFixed(2) + "тэрбум";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return "₮" + (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : Math.round(v)) + "сая";
  }
  if (n >= 1000) return "₮" + Math.round(n / 1000) + "мянган";
  return "₮" + n;
}

export function fmtPinPrice(n: number, mode?: "sale" | "rent"): string {
  if (mode === "rent") return "₮" + (n / 1000).toFixed(0) + "к";
  if (n >= 1_000_000_000) return "₮" + (n / 1_000_000_000).toFixed(1) + "тэр";
  return "₮" + (n / 1_000_000).toFixed(0) + "M";
}

export function fmtMapPinPrice(l: Listing): string {
  const n = Number(l.price) || 0;
  if (l.mode === "rent") {
    if (n >= 1_000_000)
      return "₮" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M/сар";
    return "₮" + Math.round(n / 1000) + "K/сар";
  }
  if (n >= 1_000_000_000)
    return (
      "₮" +
      (n / 1_000_000_000)
        .toFixed(2)
        .replace(/0$/, "")
        .replace(/\.0$/, "") +
      "тэр"
    );
  return "₮" + Math.round(n / 1_000_000) + "M";
}

export function fmtListingArea(area: number): string {
  const n = Number(area);
  if (!Number.isFinite(n) || n <= 0) return "";
  return (Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, "")) + "м²";
}

export function fmtMapPinMeta(l: Listing): string {
  const area = fmtListingArea(l.area);
  return [l.rooms ? l.rooms + "ө" : "", area].filter(Boolean).join(" · ");
}

export function fmtPinPpm(l: Listing): string {
  if (!l.area || l.area <= 0) return fmtPinPrice(l.price, l.mode);
  const ppm = l.price / l.area;
  if (l.mode === "rent") return "₮" + Math.round(ppm / 1000) + "к/м²";
  if (ppm >= 1_000_000) return "₮" + (ppm / 1_000_000).toFixed(1) + "M/м²";
  return "₮" + Math.round(ppm / 1000) + "к/м²";
}

export function listingPrice(l: Listing): string {
  return l.mode === "rent" ? fmtRent(l.price) : fmtSale(l.price);
}

export function listingPriceShort(l: Listing): string {
  return l.mode === "rent" ? fmtCompact(l.price) + "/сар" : fmtCompact(l.price);
}

export function formatAddressLine(
  addr: Record<string, string | number | null | undefined> | null | undefined
): string {
  if (!addr) return "";
  const parts = ADDRESS_LEVELS.map((lvl) => addr[lvl.key]).filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  );
  return parts.join(", ");
}
