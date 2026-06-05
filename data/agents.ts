import type { Agent } from "@/lib/types";

export const AGENTS: Agent[] = [
  { id: 1, name: "Б. Эрдэнэбаатар", initials: "БЭ", agency: "Marco Realty", verified: true, phone: "+976 9911 5544", activity: "5 мин өмнө идэвхтэй", listings: 24, rating: 4.8, reviewCount: 47 },
  { id: 2, name: "Д. Болормаа", initials: "ДБ", agency: "RE/MAX Mongolia", verified: true, phone: "+976 8855 7722", activity: "Өнөөдөр идэвхтэй", listings: 18, rating: 4.9, reviewCount: 62 },
  { id: 3, name: "Г. Энхтайван", initials: "ГЭ", agency: "MGG Real Estate", verified: true, phone: "+976 9988 3311", activity: "1 цагийн өмнө", listings: 31, rating: 4.7, reviewCount: 38 },
  { id: 4, name: "Ц. Сарангэрэл", initials: "ЦС", agency: "Бие даасан агент", verified: false, phone: "+976 9900 2244", activity: "3 цагийн өмнө", listings: 8, rating: 4.6, reviewCount: 14 },
  { id: 5, name: "Н. Мөнхбат", initials: "НМ", agency: "Chestertons", verified: true, phone: "+976 8811 9933", activity: "Өнөөдөр идэвхтэй", listings: 22, rating: 4.8, reviewCount: 41 },
];

export function getAgent(id: number): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}
