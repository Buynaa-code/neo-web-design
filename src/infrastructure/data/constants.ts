import type { PropertyType, RoomType } from "@/domain/types";

export const DISTRICTS = [
  "Хан-Уул",
  "Баянзүрх",
  "Сүхбаатар",
  "Чингэлтэй",
  "Сонгинохайрхан",
  "Налайх",
  "Баянгол",
  "Багануур",
  "Багахангай",
] as const;

export const ROOM_TAGS_BY_TYPE: Record<string, string[]> = {
  generic: [],
  bedroom: ["Хувцасны өрөөтэй", "Тагттай", "Террастай", "Ариун цэврийн өрөөтэй"],
  master: ["Хувцасны өрөөтэй", "Тагттай", "Террастай", "Ажлын хэсэгтэй"],
  bath: ["Угаалтуур", "Суултуур", "Душ", "Ванн", "Жакуза", "Сауна", "Гоо сайхны хэсэг", "Цонхтой"],
  livingrm: ["Тагттай", "Террастай"],
  kitchen: ["Цонхтой"],
  dining: ["Тагттай", "Террастай"],
};

export const ROOM_TYPES: RoomType[] = [
  { key: "entry", label: "Үүдний өрөө, хэсэг", tagGroup: "generic", group: "living" },
  { key: "foyer", label: "Үүдний танхим", tagGroup: "generic", group: "living" },
  { key: "coat", label: "Үүдний хувцасны өрөө", tagGroup: "generic", group: "living" },
  { key: "mudroom", label: "Хөлийн өрөө", tagGroup: "generic", group: "living" },
  { key: "living", label: "Зочны өрөө", tagGroup: "livingrm", group: "living" },
  { key: "dining", label: "Хооллох хэсэг", tagGroup: "dining", group: "living" },
  { key: "kitchen", label: "Гал тогоо", tagGroup: "kitchen", group: "kitchen" },
  { key: "kitchen-aux", label: "Туслах гал тогоо", tagGroup: "kitchen", group: "kitchen" },
  { key: "pantry", label: "Гал тогооны агуулах", tagGroup: "generic", group: "kitchen" },
  { key: "bedroom", label: "Унтлагын өрөө", tagGroup: "bedroom", group: "sleep" },
  { key: "bedroom-master", label: "Мастер унтлагын өрөө", tagGroup: "master", group: "sleep" },
  { key: "bath", label: "Ариун цэврийн өрөө", tagGroup: "bath", group: "sleep" },
  { key: "closet", label: "Хувцасны өрөө", tagGroup: "generic", group: "sleep" },
  { key: "office", label: "Ажлын өрөө", tagGroup: "generic", group: "utility" },
  { key: "laundry", label: "Угаалгын өрөө (Laundry)", tagGroup: "generic", group: "utility" },
  { key: "family", label: "Гэр бүлийн хэсэг", tagGroup: "generic", group: "living" },
  { key: "stairs", label: "Шат", tagGroup: "generic", group: "transit" },
  { key: "landing", label: "Шатны хонгил", tagGroup: "generic", group: "transit" },
  { key: "corridor", label: "Коридор", tagGroup: "generic", group: "transit" },
  { key: "balcony", label: "Тагт", tagGroup: "generic", group: "outdoor" },
  { key: "terrace", label: "Террас", tagGroup: "generic", group: "outdoor" },
  { key: "roof-deck", label: "Ашиглалттай дээвэр / Дээврийн террас", tagGroup: "generic", group: "outdoor" },
  { key: "veranda", label: "Веранд", tagGroup: "generic", group: "outdoor" },
  { key: "loggia", label: "Лодж", tagGroup: "generic", group: "outdoor" },
  { key: "garage", label: "Авто дулаан зогсоол", tagGroup: "generic", group: "utility" },
  { key: "tech", label: "Техникийн өрөө", tagGroup: "generic", group: "utility" },
  { key: "storage", label: "Агуулах", tagGroup: "generic", group: "utility" },
  { key: "entertainment", label: "Энтертайнмент өрөө", tagGroup: "livingrm", group: "leisure" },
  { key: "mens-cave", label: "Men's cave", tagGroup: "livingrm", group: "leisure" },
  { key: "playroom", label: "Тоглоомын өрөө", tagGroup: "livingrm", group: "leisure" },
  { key: "wine", label: "Дарсны агуулах", tagGroup: "generic", group: "leisure" },
  { key: "sauna", label: "Сауна", tagGroup: "generic", group: "leisure" },
  { key: "pool", label: "Усан бассейн", tagGroup: "generic", group: "leisure" },
  { key: "lounge", label: "Амралтын өрөө", tagGroup: "livingrm", group: "leisure" },
  { key: "maid", label: "Үйлчлэгчийн өрөө", tagGroup: "generic", group: "service" },
  { key: "waiting", label: "Хүлээлгийн өрөө", tagGroup: "generic", group: "service" },
  { key: "smoking", label: "Тамхины өрөө", tagGroup: "generic", group: "leisure" },
];

export const KHOTKHON = [
  "Time Tower",
  "Encanto",
  "Olympic Residence",
  "Twin Tower",
  "Energy Residence",
  "Sky Tower",
  "Buyant-Ukhaa-2",
  "Tokyo Residence",
  "Global Garden",
  "Riverside",
  "Khan Palace",
  "Royal County",
  "Central Tower",
] as const;

export const PROPERTY_TYPES: PropertyType[] = [
  { key: "apartment", label: "Орон сууц", icon: "building-2", mode: "sale", count: 4892, hint: "Хотын байр, цогцолбор" },
  { key: "house", label: "Гэр, хаус", icon: "home", mode: "sale", count: 1284, hint: "Хувийн орон сууц" },
  { key: "rent", label: "Түрээс", icon: "key-round", mode: "rent", count: 2156, hint: "Сарын болон жилийн" },
  { key: "hotel", label: "Зочид буудал", icon: "bed-double", mode: "rent", count: 312, hint: "Богино хугацаа" },
  { key: "land", label: "Газар", icon: "map", mode: "sale", count: 1845, hint: "Хашаа, талбай" },
  { key: "office", label: "Оффис", icon: "briefcase", mode: "rent", count: 723, hint: "А, B, C ангилал" },
  { key: "commercial", label: "Худалдаа үйлчилгээ", icon: "shopping-bag", mode: "rent", count: 567, hint: "Дэлгүүр, үйлчилгээ" },
  { key: "industrial", label: "Үйлдвэрлэлийн", icon: "factory", mode: "sale", count: 198, hint: "Агуулах, цех" },
];

export const AI_ASSISTANT_QUESTIONS = [
  { icon: "graduation-cap", text: "Сургуультай ойрхон 3 өрөө" },
  { icon: "landmark", text: "Ипотекийн зээлд тохирох сууц" },
  { icon: "trending-up", text: "Хөрөнгө оруулалтад тохирох" },
  { icon: "users", text: "Гэр бүлд төв байршил" },
];

export const ADDRESS_LEVELS = [
  { key: "country", label: "Улс", placeholder: "Монгол Улс" },
  { key: "city", label: "Хот / Аймаг", placeholder: "Улаанбаатар" },
  { key: "district", label: "Дүүрэг / Сум", placeholder: "Хан-Уул" },
  { key: "khoroo", label: "Хороо / Баг", placeholder: "11" },
  { key: "zip", label: "Хаягийн бүс (zip)", placeholder: "17061" },
  { key: "street", label: "Гудамж", placeholder: "Грийн Вилла" },
  { key: "streetNumber", label: "Гудамжны дугаар", placeholder: "" },
  { key: "project", label: "Төсөл / хотхоны нэр", placeholder: "Грийн Вилла хотхон" },
  { key: "buildingNumber", label: "Барилга / блокын дугаар", placeholder: "204" },
  { key: "buildingName", label: "Барилга / блокын нэр", placeholder: "" },
  { key: "entranceName", label: "Орц / section нэр", placeholder: "" },
  { key: "entranceNumber", label: "Орц / section дугаар", placeholder: "" },
  { key: "floor", label: "Давхар", placeholder: "3" },
  { key: "unit", label: "Тоот", placeholder: "301" },
] as const;

export const WINDOW_DIRECTIONS = [
  { code: "З", label: "Зүүн" },
  { code: "ЗУ", label: "Зүүн-Урд" },
  { code: "У", label: "Урд" },
  { code: "БУ", label: "Баруун-Урд" },
  { code: "Б", label: "Баруун" },
  { code: "БХ", label: "Баруун-Хойд" },
  { code: "Х", label: "Хойд" },
  { code: "ЗХ", label: "Зүүн-Хойд" },
] as const;

export const STATUS_PILL: Record<string, [string, string]> = {
  new: ["pill-new", "Шинэ"],
  drop: ["pill-drop", "Үнэ буурсан"],
  hot: ["pill-hot", "Эрэлттэй"],
  active: ["", ""],
  reserved: ["pill-reserved", "Захиалагдсан"],
  sold: ["pill-sold", "Зарагдсан"],
};

export const APP_SCREENS = [
  "home",
  "results",
  "property",
  "schedule",
  "confirmation",
  "activity",
  "saved",
  "alerts",
  "auth",
  "profile",
  "news",
  "rental-mgmt",
  "list-property",
  "interests",
] as const;

export const PROTECTED_SCREENS = ["activity", "saved", "alerts", "profile", "rental-mgmt"] as const;
