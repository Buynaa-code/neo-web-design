export interface InterestLifestyle {
  key: "family" | "young-pro" | "student" | "investor";
  icon: string;
  label: string;
  sub: string;
  presetBedrooms: number[];
  presetBathroomsMin: number;
  presetOffice: boolean;
  presetMustHaves: string[];
}

export interface InterestVibe {
  key: "downtown" | "quiet-street" | "park-near" | "new-area";
  icon: string;
  label: string;
  sub: string;
}

export interface InterestMustHave {
  key: string;
  icon: string;
  label: string;
}

export interface InterestPurposeSubtype {
  key: string;
  label: string;
}

export interface InterestPurpose {
  key: string;
  icon: string;
  label: string;
  hint: string;
  subTypes: InterestPurposeSubtype[];
}

export interface InterestCondition {
  key: string;
  icon: string;
  label: string;
  groupKey: "usage" | "cert" | "history" | "legal" | "occupy" | "reno";
}

export interface InterestNotificationChannel {
  key: "app" | "email" | "sms" | "call";
  icon: string;
  label: string;
  sub: string;
}

export const INTEREST_LIFESTYLES: InterestLifestyle[] = [
  {
    key: "family",
    icon: "users",
    label: "Гэр бүл",
    sub: "2-3 унтл., сургууль ойр, цэцэрлэг",
    presetBedrooms: [2, 3],
    presetBathroomsMin: 2,
    presetOffice: false,
    presetMustHaves: ["school", "park", "quiet", "parking"],
  },
  {
    key: "young-pro",
    icon: "briefcase",
    label: "Залуу мэргэжилтэн",
    sub: "1 унтл., хотын төв, шинэ барилга",
    presetBedrooms: [1],
    presetBathroomsMin: 1,
    presetOffice: true,
    presetMustHaves: ["newproject", "furnished"],
  },
  {
    key: "student",
    icon: "graduation-cap",
    label: "Оюутан",
    sub: "Хямд, сургуулийн ойролцоо",
    presetBedrooms: [1],
    presetBathroomsMin: 1,
    presetOffice: false,
    presetMustHaves: ["school", "furnished"],
  },
  {
    key: "investor",
    icon: "trending-up",
    label: "Хөрөнгө оруулагч",
    sub: "Үнэ цэн өсөх, шинэ хороолол",
    presetBedrooms: [1, 2],
    presetBathroomsMin: 0,
    presetOffice: false,
    presetMustHaves: ["newproject", "view"],
  },
];

export const INTEREST_MUST_HAVES: InterestMustHave[] = [
  { key: "school", icon: "school", label: "Сургууль ойр" },
  { key: "park", icon: "trees", label: "Цэцэрлэгт хүрээлэн" },
  { key: "newproject", icon: "sparkles", label: "Шинэ барилга" },
  { key: "view", icon: "mountain", label: "Сайхан үзэмж" },
  { key: "elevator", icon: "arrow-up", label: "Лифттэй" },
  { key: "parking", icon: "square-parking", label: "Зогсоол" },
  { key: "quiet", icon: "volume-x", label: "Чимээгүй гудамж" },
  { key: "pet", icon: "paw-print", label: "Тэжээвэртэй" },
  { key: "furnished", icon: "sofa", label: "Тавилгатай" },
];

export const INTEREST_VIBES: InterestVibe[] = [
  { key: "downtown", icon: "building-2", label: "Хотын төв", sub: "Идэвхтэй амьдрал, дэлгүүр, ресторан" },
  { key: "quiet-street", icon: "leaf", label: "Чимээгүй гудамж", sub: "Тайван, амралттай орчин" },
  { key: "park-near", icon: "trees", label: "Цэцэрлэгт хүрээлэнтэй", sub: "Алхах, спортоор хичээллэх боломж" },
  { key: "new-area", icon: "construction", label: "Шинэ хороолол", sub: "Орчин үеийн дэд бүтэц" },
];

export const INTEREST_PURPOSES: InterestPurpose[] = [
  {
    key: "any",
    icon: "compass",
    label: "Хамаагүй",
    hint: "Бүх төрлийг харах",
    subTypes: [],
  },
  {
    key: "apartment",
    icon: "building-2",
    label: "Орон сууц",
    hint: "Олон давхар, апартмент",
    subTypes: [
      { key: "simple", label: "Энгийн" },
      { key: "duplex", label: "Дуплекс" },
      { key: "penthouse", label: "Пентхаус" },
      { key: "other", label: "Бусад" },
    ],
  },
  {
    key: "house",
    icon: "home",
    label: "Амины сууц",
    hint: "Single / Twin / Town house",
    subTypes: [
      { key: "single", label: "Single house" },
      { key: "twin", label: "Twin house" },
      { key: "town", label: "Town house" },
      { key: "multi", label: "Multihouse" },
      { key: "other", label: "Бусад" },
    ],
  },
  {
    key: "office",
    icon: "briefcase",
    label: "Оффис",
    hint: "Ажлын байр",
    subTypes: [
      { key: "partial", label: "Давхрын хэсэг, өрөө" },
      { key: "floor", label: "Давхар бүхлээрээ" },
      { key: "whole", label: "Обьект бүхлээрээ" },
    ],
  },
  {
    key: "commercial",
    icon: "shopping-bag",
    label: "Худалдаа, үйлчилгээ",
    hint: "Дэлгүүр, ресторан, салон",
    subTypes: [
      { key: "partial", label: "Давхрын хэсэг, өрөө" },
      { key: "floor", label: "Давхар бүхлээрээ" },
      { key: "whole", label: "Обьект бүхлээрээ" },
    ],
  },
  {
    key: "industrial",
    icon: "factory",
    label: "Аж үйлдвэрийн обьект",
    hint: "Үйлдвэр, цех",
    subTypes: [],
  },
  {
    key: "garage",
    icon: "square-parking",
    label: "Авто дулаан зогсоол",
    hint: "Орон сууцны зогсоолын блок",
    subTypes: [
      { key: "inside", label: "Орон сууц/Оффисын доор" },
      { key: "block", label: "Тусдаа зогсоолын блок" },
    ],
  },
  {
    key: "storage",
    icon: "package",
    label: "Агуулах",
    hint: "Гараж/орон сууцны доторх",
    subTypes: [],
  },
  {
    key: "fenced-house",
    icon: "square-dashed",
    label: "Хашаа байшин",
    hint: "Газартай",
    subTypes: [],
  },
  {
    key: "cottage-land",
    icon: "tent-tree",
    label: "Зуслан (газартай)",
    hint: "Зуслангийн бүсэд, газартай",
    subTypes: [],
  },
  {
    key: "cottage-no",
    icon: "tent",
    label: "Зуслан (газаргүй)",
    hint: "Зөвхөн байшин",
    subTypes: [],
  },
  {
    key: "land",
    icon: "map",
    label: "Газар",
    hint: "Барилгатай эсвэл хоосон газар",
    subTypes: [],
  },
  {
    key: "other",
    icon: "square-dashed",
    label: "Бусад",
    hint: "Тусгай зориулалттай",
    subTypes: [],
  },
];

export const INTEREST_CONDITIONS: InterestCondition[] = [
  { key: "commissioned", icon: "badge-check", label: "Ашиглалтад орсон", groupKey: "usage" },
  { key: "pre-comm", icon: "construction", label: "Удахгүй ашиглалтад орох", groupKey: "usage" },
  { key: "certified", icon: "file-check", label: "Гэрчилгээтэй", groupKey: "cert" },
  { key: "pre-cert", icon: "file-clock", label: "Гэрчилгээ удахгүй", groupKey: "cert" },
  { key: "brand-new", icon: "sparkle", label: "Цоо шинэ", groupKey: "history" },
  { key: "used", icon: "history", label: "Ашиглагдаж байсан", groupKey: "history" },
  { key: "no-collateral", icon: "shield-check", label: "Барьцаагүй", groupKey: "legal" },
  { key: "vacant", icon: "door-open", label: "Сул, чөлөөтэй", groupKey: "occupy" },
  { key: "fresh-reno", icon: "paintbrush", label: "Сүүлд заслагдсан", groupKey: "reno" },
  { key: "no-reno", icon: "hammer", label: "Засваргүй (өөрөө хийнэ)", groupKey: "reno" },
];

export const INTEREST_NOTIF_CHANNELS: InterestNotificationChannel[] = [
  { key: "app", icon: "smartphone", label: "Аппликейшнээр", sub: "Push notification" },
  { key: "email", icon: "mail", label: "И-мэйл", sub: "Өдөрт нэг дайджест" },
  { key: "sms", icon: "message-square", label: "SMS", sub: "Утсан дээр шууд" },
  { key: "call", icon: "phone-call", label: "Дуудлагаар", sub: "Зөвхөн чухал тохиолдолд" },
];
