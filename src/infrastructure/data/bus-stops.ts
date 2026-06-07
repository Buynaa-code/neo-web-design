import type { BusStop } from "@/domain/types";

export const BUS_STOPS: BusStop[] = [
  { id: "bs-bayanzurkh", name: "13-р хороолол", district: "Баянзүрх", routes: ["7", "22", "27"], lat: 0.62, lng: 0.45 },
  { id: "bs-misheel", name: "Мишээл Экспо", district: "Хан-Уул", routes: ["11", "19", "43"], lat: 0.3, lng: 0.66 },
  { id: "bs-sansar", name: "Сансар", district: "Баянзүрх", routes: ["3", "18", "24"], lat: 0.66, lng: 0.42 },
  { id: "bs-sukhbaatar", name: "Сүхбаатарын талбай", district: "Сүхбаатар", routes: ["1", "5", "13", "21"], lat: 0.44, lng: 0.3 },
  { id: "bs-tedy", name: "Тэдийн худалдаа", district: "Чингэлтэй", routes: ["9", "15"], lat: 0.32, lng: 0.2 },
  { id: "bs-officer", name: "Офицерын ордон", district: "Сүхбаатар", routes: ["1", "5", "7"], lat: 0.42, lng: 0.32 },
  { id: "bs-misheel-2", name: "Олимпийн гудамж", district: "Хан-Уул", routes: ["8", "11", "19"], lat: 0.28, lng: 0.68 },
  { id: "bs-zaisan", name: "Зайсан", district: "Хан-Уул", routes: ["7", "32"], lat: 0.34, lng: 0.78 },
  { id: "bs-shineurguu", name: "Шинэ Үргөө", district: "Сонгинохайрхан", routes: ["16", "30"], lat: 0.12, lng: 0.52 },
  { id: "bs-narantuul", name: "Нарантуул", district: "Баянзүрх", routes: ["3", "7", "22"], lat: 0.68, lng: 0.5 },
  { id: "bs-tokyo", name: "Токио резиденс", district: "Чингэлтэй", routes: ["9", "15", "21"], lat: 0.32, lng: 0.18 },
  { id: "bs-encanto", name: "Энканто", district: "Сүхбаатар", routes: ["5", "13"], lat: 0.42, lng: 0.28 },
];

export const BUS_STOP_RADIUS = 0.08;
