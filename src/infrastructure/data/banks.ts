import type { Bank } from "@/domain/types";

export const BANKS: Bank[] = [
  { id: "khan", name: "Хаан Банк", short: "Хаан", rate: 11.5, maxYears: 25, minDownPct: 20, badge: "Шинэ хүү", color: "#3D7C2A", tag: "Эхний айлд тусгай хүү" },
  { id: "golomt", name: "Голомт Банк", short: "Голомт", rate: 12.0, maxYears: 20, minDownPct: 25, color: "#0050A0", tag: "20 жилийн ипотек" },
  { id: "tdb", name: "Худалдаа Хөгжлийн Банк (TDB)", short: "TDB", rate: 12.5, maxYears: 20, minDownPct: 30, color: "#C8102E", tag: "Premium ипотек" },
  { id: "xacbank", name: "ХасБанк", short: "Хас", rate: 12.8, maxYears: 20, minDownPct: 25, color: "#E87722", tag: "Хурдан зөвшөөрөл" },
  { id: "state", name: "Төрийн Банк", short: "Төрийн", rate: 8.0, maxYears: 30, minDownPct: 10, badge: "Засгийн", color: "#0A1F44", tag: "8% ипотек (хязгаарлагдмал)" },
  { id: "capitron", name: "Капитрон Банк", short: "Капитрон", rate: 13.0, maxYears: 15, minDownPct: 30, color: "#5B2E91", tag: "Уян хатан төлбөр" },
];

export function getBank(id: string): Bank {
  return BANKS.find((b) => b.id === id) ?? BANKS[0];
}
