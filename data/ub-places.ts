export interface UbPlace {
  name: string;
  kind: "school" | "office" | "mall" | "hospital" | "landmark" | "transport";
  district: string;
  lat: number;
  lng: number;
  alt?: string[];
}

export const UB_PLACES: UbPlace[] = [
  // Sургуулиуд
  { name: "British School of Ulaanbaatar", kind: "school", district: "Хан-Уул", lat: 47.892, lng: 106.9325, alt: ["BSU"] },
  { name: "American School of Ulaanbaatar", kind: "school", district: "Хан-Уул", lat: 47.886, lng: 106.918 },
  { name: "Mongol Aspiration International School", kind: "school", district: "Хан-Уул", lat: 47.892, lng: 106.928 },
  { name: "ШУТИС", kind: "school", district: "Сүхбаатар", lat: 47.918, lng: 106.916, alt: ["MUST"] },
  { name: "МУИС", kind: "school", district: "Сүхбаатар", lat: 47.923, lng: 106.918, alt: ["NUM"] },
  { name: "ХААИС", kind: "school", district: "Хан-Уул", lat: 47.871, lng: 106.93 },
  { name: "АШУҮИС", kind: "school", district: "Сүхбаатар", lat: 47.927, lng: 106.92 },
  { name: "СЭЗИС", kind: "school", district: "Сүхбаатар", lat: 47.918, lng: 106.92, alt: ["UFE"] },
  { name: "ХАА биржийн дунд сургууль", kind: "school", district: "Сүхбаатар", lat: 47.923, lng: 106.914 },
  { name: "23-р сургууль", kind: "school", district: "Чингэлтэй", lat: 47.928, lng: 106.913 },
  { name: "Шинэ Монгол сургууль", kind: "school", district: "Баянзүрх", lat: 47.917, lng: 106.95 },
  { name: "Орчлон сургууль", kind: "school", district: "Хан-Уул", lat: 47.895, lng: 106.925 },
  { name: "Хобби сургууль", kind: "school", district: "Баянзүрх", lat: 47.921, lng: 106.97 },
  { name: "1-р цэцэрлэг", kind: "school", district: "Сүхбаатар", lat: 47.921, lng: 106.918 },
  { name: "10-р цэцэрлэг", kind: "school", district: "Чингэлтэй", lat: 47.927, lng: 106.91 },

  // Оффис / Бизнес төв
  { name: "Time Tower", kind: "office", district: "Сүхбаатар", lat: 47.913, lng: 106.918, alt: ["Тайм Тауэр"] },
  { name: "Galaxy Tower", kind: "office", district: "Сүхбаатар", lat: 47.917, lng: 106.917 },
  { name: "Blue Sky Tower", kind: "office", district: "Сүхбаатар", lat: 47.916, lng: 106.917 },
  { name: "Shangri-La Centre", kind: "office", district: "Сүхбаатар", lat: 47.913, lng: 106.918 },
  { name: "Central Tower", kind: "office", district: "Сүхбаатар", lat: 47.917, lng: 106.918 },
  { name: "Naadam Tower", kind: "office", district: "Сүхбаатар", lat: 47.917, lng: 106.916 },
  { name: "Туушин зочид буудал", kind: "office", district: "Сүхбаатар", lat: 47.918, lng: 106.917 },
  { name: "Soyombo Tower", kind: "office", district: "Чингэлтэй", lat: 47.92, lng: 106.913 },
  { name: "Peace Tower", kind: "office", district: "Сүхбаатар", lat: 47.918, lng: 106.913 },
  { name: "MCS Plaza", kind: "office", district: "Сүхбаатар", lat: 47.918, lng: 106.919 },
  { name: "Хүннү Молл оффис", kind: "office", district: "Хан-Уул", lat: 47.886, lng: 106.91, alt: ["Хүннү молл"] },

  // Худалдааны төв
  { name: "Хүннү Молл", kind: "mall", district: "Хан-Уул", lat: 47.886, lng: 106.91 },
  { name: "Шангри-Ла Молл", kind: "mall", district: "Сүхбаатар", lat: 47.913, lng: 106.919 },
  { name: "State Department Store", kind: "mall", district: "Сүхбаатар", lat: 47.92, lng: 106.917, alt: ["Их дэлгүүр"] },
  { name: "Тэнгис кино театр", kind: "mall", district: "Чингэлтэй", lat: 47.924, lng: 106.911 },
  { name: "Урт цагаан", kind: "mall", district: "Сүхбаатар", lat: 47.92, lng: 106.916 },
  { name: "Тэдй молл", kind: "mall", district: "Хан-Уул", lat: 47.894, lng: 106.928, alt: ["Тэдь молл"] },
  { name: "UB Department Store", kind: "mall", district: "Чингэлтэй", lat: 47.928, lng: 106.913 },
  { name: "Гранд Плаза", kind: "mall", district: "Баянзүрх", lat: 47.918, lng: 106.95 },

  // Эмнэлэг
  { name: "Интермед эмнэлэг", kind: "hospital", district: "Хан-Уул", lat: 47.898, lng: 106.917 },
  { name: "Гранд Мед эмнэлэг", kind: "hospital", district: "Хан-Уул", lat: 47.892, lng: 106.92 },
  { name: "Улсын 1-р эмнэлэг", kind: "hospital", district: "Сүхбаатар", lat: 47.92, lng: 106.93 },
  { name: "ЭХЭМҮТ", kind: "hospital", district: "Сүхбаатар", lat: 47.92, lng: 106.91, alt: ["Эх хүүхдийн төв"] },
  { name: "Хавдар судлалын төв", kind: "hospital", district: "Баянзүрх", lat: 47.917, lng: 106.96 },
  { name: "Songdo эмнэлэг", kind: "hospital", district: "Хан-Уул", lat: 47.886, lng: 106.918 },

  // Тээвэр
  { name: "Чингис хаан ОУ Нисэх Буудал", kind: "transport", district: "Хан-Уул", lat: 47.643, lng: 106.819, alt: ["Аэропорт", "ОУНБ"] },
  { name: "Төв авто буудал", kind: "transport", district: "Баянзүрх", lat: 47.913, lng: 106.97 },
  { name: "УБ төмөр зам", kind: "transport", district: "Баянгол", lat: 47.911, lng: 106.882, alt: ["Вокзал"] },
  { name: "Зайсангийн эцэс", kind: "transport", district: "Хан-Уул", lat: 47.877, lng: 106.913 },
  { name: "Дунд гол гүүр", kind: "transport", district: "Хан-Уул", lat: 47.898, lng: 106.91 },
  { name: "Драмын театрын буудал", kind: "transport", district: "Сүхбаатар", lat: 47.92, lng: 106.918 },

  // Газар нутаг / landmark
  { name: "Чингисийн талбай", kind: "landmark", district: "Сүхбаатар", lat: 47.918, lng: 106.917, alt: ["Сүхбаатарын талбай"] },
  { name: "Гандан хийд", kind: "landmark", district: "Сүхбаатар", lat: 47.923, lng: 106.894 },
  { name: "Зайсангийн дов", kind: "landmark", district: "Хан-Уул", lat: 47.875, lng: 106.911 },
  { name: "Богд Ханы Уулын байгалийн хүрээлэн", kind: "landmark", district: "Хан-Уул", lat: 47.85, lng: 106.97 },
  { name: "Үндэсний амралтын газар", kind: "landmark", district: "Сонгинохайрхан", lat: 47.93, lng: 106.79 },
  { name: "Усан спорт цогцолбор", kind: "landmark", district: "Хан-Уул", lat: 47.885, lng: 106.928 },
];

export function searchPlaces(query: string, limit = 8): UbPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches: { place: UbPlace; score: number }[] = [];
  for (const p of UB_PLACES) {
    const name = p.name.toLowerCase();
    let score = 0;
    if (name.startsWith(q)) score = 100;
    else if (name.includes(q)) score = 60;
    if (!score && p.alt) {
      for (const a of p.alt) {
        const al = a.toLowerCase();
        if (al.startsWith(q)) {
          score = Math.max(score, 90);
          break;
        }
        if (al.includes(q)) {
          score = Math.max(score, 50);
        }
      }
    }
    if (score) matches.push({ place: p, score });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, limit).map((m) => m.place);
}
