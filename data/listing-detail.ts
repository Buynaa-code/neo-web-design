import type { Listing, ListingMode } from "@/lib/types";
import { listingHeating } from "@/data/formatters";

export interface DetailCheckItem {
  item: string;
  has?: boolean;
  note?: string;
}

export interface DetailRoom {
  no: number;
  floor: string;
  name: string;
  type: string;
  area: number;
  windows: string[];
  checked: boolean;
  note: string;
}

export interface ListingDetail {
  type: {
    primary: string;
    subtype: string;
    landIncluded?: boolean;
    purpose: ListingMode;
    landRight?: string;
    landRightExpiry?: string | null;
    decisionBy?: string;
  };
  address: {
    country: string;
    city: string;
    district: string;
    khoroo: string;
    zip?: string;
    street?: string;
    streetNumber?: string;
    project: string;
    buildingNumber?: string;
    buildingName?: string;
    entranceName?: string;
    entranceNumber?: string;
    floor?: string;
    unit?: string;
    note?: string;
    locationTag?: string;
    parcelNumber?: string;
    googleMapLink?: string;
    lat?: number | null;
    lng?: number | null;
  };
  specs: {
    basementFloors: number;
    aboveFloors: number;
    totalFloors: number;
    unitOnFloor?: number | null;
    unitInternalFloors?: number;
    floorHeight?: number | null;
    ceilingHeight?: number | null;
    unitsPerFloor?: number | null;
    areaCert: number;
    areaInterior?: number | null;
    areaBalcony?: number | null;
    areaGarage?: number | null;
    areaStorage?: number | null;
    bedrooms: number;
    bathrooms: number;
    extraNote?: string;
    rooms: DetailRoom[];
    windowCounts: Record<string, number>;
  };
  infra: {
    greenCert?: boolean;
    heating: { primary: string; backup?: string; note?: string };
    electric: { primary: string; backup?: string; note?: string };
    waterCold: { primary: string; backup?: string; note?: string };
    waterHot: { primary: string; backup?: string; note?: string };
    sewage: { primary: string; backup?: string; note?: string };
    road: { asphaltPct: number; dirtKm: number };
    internet: string[];
    note?: string;
  };
  included: {
    furniture: DetailCheckItem[];
    equipment: DetailCheckItem[];
    extra: DetailCheckItem[];
  };
  excluded?: string;
  community: {
    services: DetailCheckItem[];
    security: DetailCheckItem[];
    amenities: DetailCheckItem[];
    note?: string;
  };
  state: {
    commissioned: boolean;
    commissionYear: number | null;
    commissionDue?: string;
    certStatus?: string;
    certNumber?: string;
    constructionPct?: number | null;
    usage?: string;
    collateral?: string;
    collateralNote?: string;
    current?: string;
    interior?: string;
    notes?: string;
  };
  pricing: {
    mode: ListingMode;
    primary: { unitPrice: number; area: number; totalPrice: number };
    floor?: { unitPrice: number; area: number; totalPrice: number };
    vatIncluded?: boolean;
    ebarimtVat?: boolean;
    rentMinMonths?: number | null;
    rentMaxMonths?: number | null;
    extensionAllowed?: boolean;
    extensionNote?: string;
    startDate?: string;
    startImmediate?: boolean;
  };
  payment: {
    forms: string[];
    rentDeposit?: number;
    rentSchedule?: Array<{
      months: number;
      discount: number;
      monthly: number;
      total: number;
      firstPay: number;
    }>;
  };
  brokerage?: {
    rightForm: string;
    startDate: string;
    durationMonths: number;
    endDate: string;
    feePct: number;
    feeAgreedPct: number;
    feeUrgentExtra: number;
    feeEstimate: number;
    contractNumber: string;
  };
}

const FURNITURE_GROUPS = [
  "Гал тогооны тавилга",
  "Үүдний тавилга",
  "АЦӨ тавилга, тоноглол",
  "Зочны өрөөний ханын тавилга",
  "Хувцасны өрөөний тавилга",
  "Ажлын өрөөний ханын тавилга",
  "Gym-ний ханын тавилга",
  "B1 давхрын үүдний өрөөний тавилга",
];

const COMMUNITY_SECURITY = [
  "Харуул, хамгаалалт 24/7",
  "Домофон, дохиолол",
  "Хотхоны нэгдсэн хашаа",
  "Явган орц, гарцны аксесстай хаалга",
];

const COMMUNITY_AMENITIES = [
  "Төлбөртэй ил зогсоол",
  "Төлбөргүй ил зогсоол",
  "Төлбөртэй дулаан зогсоол",
  "Машингүй бүс",
  "Машины автомат хаалт",
  "Хүүхдийн тоглоомын талбай",
  "Ногоон байгууламж, нарлах салхилах талбай",
  "Лифт - зорчигчийн 24/7",
  "Лифт - ачааны 24/7",
];

const COMMUNITY_SERVICES = [
  "Хүнсний дэлгүүр",
  "Фитнес, иога, веллнесс",
  "Спа",
  "Дундын өмчлөлийн цэвэрлэгээ",
  "Клабхаус",
  "Ресторан",
  "Кофешоп",
  "Цахилгаан машины цэнэглэл станц",
];

const EQUIPMENT_ITEMS = [
  "Хөргөгч, хөлдөөгч",
  "Суурилагддаг зуух, плитка, шарах шүүгээ",
  "Ус цэвэршүүлэгч",
  "Бидэ",
  "Угаалгын машин",
];

const EXTRA_EQUIPMENT = [
  "Ялаа, шумуулны тор",
  "Агааржуулалт, эйр кондишн систем",
  "Домофон",
  "Автоматжуулалтын систем",
  "Гэрлийн бүрхүүл",
  "Хөшиг, тюль",
];

const fillCheckList = (items: string[], enabled = items): DetailCheckItem[] => {
  const set = new Set(enabled);
  return items.map((item) => ({ item, has: set.has(item), note: "" }));
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Орон сууц",
  amini: "Амины орон сууц",
  land_village: "Газар хотхоны",
  industrial: "Аж үйлдвэр, обьект, агуулах",
  office: "Оффис",
  commercial: "Худалдаа, үйлчилгээ",
  parking: "Авто дулаан зогсоол",
  storage: "Агуулах",
  fence_house: "Хашаа байшин - газартай",
  summer_w_land: "Зуслангийн байшин - газартай",
  summer_no_land: "Зуслангийн байшин - газаргүй",
  other_property: "Бусад",
  land: "Газар",
};

export const GREEN_VILLA_LISTING_DETAIL: ListingDetail = {
  type: {
    primary: "amini",
    subtype: "Single",
    landIncluded: true,
    purpose: "sale",
    landRight: "",
    landRightExpiry: null,
    decisionBy: "Байгаль орчны яам",
  },
  address: {
    country: "Монгол Улс",
    city: "Улаанбаатар",
    district: "Хан-Уул",
    khoroo: "11",
    zip: "17061",
    street: "Грийн Вилла",
    streetNumber: "1",
    project: "Грийн Вилла хотхон",
    buildingNumber: "204",
    floor: "3",
    unit: "301",
    note: "Зайсан, Энканто молын ард, БНК ойролцоо",
    locationTag: "Зайсан",
    googleMapLink: "https://maps.app.goo.gl/a4XV8WnXUETngymR6",
    lat: 47.849552854889936,
    lng: 107.0760397416879,
  },
  specs: {
    basementFloors: 1,
    aboveFloors: 3,
    totalFloors: 4,
    unitOnFloor: 1,
    unitInternalFloors: 4,
    floorHeight: 3.2,
    ceilingHeight: 2.8,
    unitsPerFloor: 1,
    areaCert: 320,
    areaInterior: 290,
    areaBalcony: 18,
    areaGarage: 36,
    areaStorage: 12,
    bedrooms: 4,
    bathrooms: 3,
    extraNote: "B1-д gym, sauna, агуулах",
    rooms: [
      { no: 1, floor: "B1", name: "B01", type: "B1", area: 30, windows: [], checked: true, note: "Gym" },
      { no: 2, floor: "B1", name: "B02", type: "B1", area: 25, windows: [], checked: true, note: "Sauna" },
      { no: 3, floor: "B1", name: "B03", type: "B1", area: 18, windows: [], checked: true, note: "Агуулах" },
      { no: 4, floor: "1", name: "101", type: "1", area: 42, windows: ["У", "БУ"], checked: true, note: "Зочин" },
      { no: 5, floor: "1", name: "102", type: "1", area: 18, windows: ["БУ"], checked: true, note: "Гал тогоо" },
      { no: 6, floor: "1", name: "103", type: "1", area: 14, windows: ["Б"], checked: true, note: "А/Ц өрөө" },
      { no: 7, floor: "1", name: "104", type: "1", area: 12, windows: [], checked: true, note: "Үүдэн" },
      { no: 8, floor: "1", name: "105", type: "1", area: 16, windows: ["Х"], checked: true, note: "Ажлын өрөө" },
      { no: 9, floor: "2", name: "201", type: "2", area: 28, windows: ["Б", "БХ"], checked: true, note: "Мастер унтлага" },
      { no: 10, floor: "2", name: "202", type: "2", area: 18, windows: ["Х"], checked: true, note: "Унтлага 2" },
      { no: 11, floor: "2", name: "203", type: "2", area: 18, windows: ["ЗХ"], checked: true, note: "Унтлага 3" },
      { no: 12, floor: "2", name: "204", type: "2", area: 14, windows: ["З"], checked: true, note: "Унтлага 4" },
      { no: 13, floor: "2", name: "205", type: "2", area: 9, windows: ["У"], checked: true, note: "А/Ц 2" },
      { no: 14, floor: "2", name: "206", type: "2", area: 7, windows: [], checked: true, note: "А/Ц 3" },
    ],
    windowCounts: { З: 1, ЗУ: 2, У: 4, БУ: 1, Б: 2, БХ: 1, Х: 3, ЗХ: 1, total: 15 },
  },
  infra: {
    greenCert: false,
    heating: { primary: "Төвлөрсөн (хотхоны)", backup: "Уурын зуух (нүүрсэн)", note: "" },
    electric: { primary: "Төвийн 100%", backup: "Ямар нэг нөөцлүүртэй", note: "" },
    waterCold: { primary: "Төвлөрсөн (хотхоны)", backup: "Гүний худаг", note: "" },
    waterHot: { primary: "Төвлөрсөн (хотхоны)", backup: "Бусад", note: "" },
    sewage: { primary: "Төвлөрсөн (хотхоны)", backup: "Септик", note: "" },
    road: { asphaltPct: 100, dirtKm: 0 },
    internet: ["Univision"],
    note: "",
  },
  included: {
    furniture: fillCheckList(FURNITURE_GROUPS),
    equipment: fillCheckList(EQUIPMENT_ITEMS, []),
    extra: fillCheckList(EXTRA_EQUIPMENT, []),
  },
  excluded: "",
  community: {
    services: fillCheckList(COMMUNITY_SERVICES),
    security: fillCheckList(COMMUNITY_SECURITY),
    amenities: fillCheckList(COMMUNITY_AMENITIES),
    note: "",
  },
  state: {
    commissioned: false,
    commissionYear: null,
    commissionDue: "2026.IV",
    certStatus: "Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй",
    certNumber: "",
    constructionPct: null,
    usage: "Цоо шинэ, ашиглаж байгаагүй",
    collateral: "Ямар нэг барьцаанд байхгүй",
    collateralNote: "",
    current: "Сул, чөлөөтэй байгаа",
    interior: "Дотор засвар хийгдэж байгаа",
    notes: "",
  },
  pricing: {
    mode: "sale",
    primary: { unitPrice: 23_437_500, area: 320, totalPrice: 7_500_000_000 },
    floor: { unitPrice: 21_875_000, area: 320, totalPrice: 7_000_000_000 },
    vatIncluded: true,
    ebarimtVat: false,
    extensionAllowed: true,
    extensionNote: "",
    startDate: "2026-08-01",
    startImmediate: false,
  },
  payment: {
    forms: ["cash_now"],
    rentDeposit: 4_000_000,
    rentSchedule: [
      { months: 3, discount: 0, monthly: 4_000_000, total: 12_000_000, firstPay: 16_000_000 },
      { months: 4, discount: 0, monthly: 4_000_000, total: 16_000_000, firstPay: 20_000_000 },
      { months: 6, discount: 5, monthly: 3_800_000, total: 22_800_000, firstPay: 26_800_000 },
      { months: 12, discount: 10, monthly: 3_600_000, total: 43_200_000, firstPay: 47_200_000 },
    ],
  },
  brokerage: {
    rightForm: "open",
    startDate: "2026-05-01",
    durationMonths: 12,
    endDate: "2027-04-30",
    feePct: 2.64,
    feeAgreedPct: 3.3,
    feeUrgentExtra: 1,
    feeEstimate: 105_000_000,
    contractNumber: "ЗҮГ2026050001",
  },
};

const LISTING_DETAILS: Record<number, ListingDetail> = {
  100: GREEN_VILLA_LISTING_DETAIL,
};

function legacyToDetail(listing: Listing): ListingDetail {
  const [unitFloor, totalFloors] = listing.floor.includes("/")
    ? listing.floor.split("/")
    : [listing.floor, ""];
  const total = Number.parseInt(totalFloors, 10) || (listing.floor === "Хаус" ? 2 : 0);

  return {
    type: {
      primary: listing.floor === "Хаус" ? "amini" : "apartment",
      subtype: listing.floor === "Хаус" ? "Single" : "Энгийн",
      landIncluded: listing.floor === "Хаус",
      purpose: listing.mode,
    },
    address: {
      country: "Монгол Улс",
      city: "Улаанбаатар",
      district: listing.district,
      khoroo: listing.khoroo,
      project: listing.khotkhon,
      floor: unitFloor,
      lat: listing.lat,
      lng: listing.lng,
    },
    specs: {
      basementFloors: 0,
      aboveFloors: total,
      totalFloors: total,
      areaCert: listing.area,
      bedrooms: Math.max(listing.rooms - 1, 1),
      bathrooms: listing.rooms >= 4 ? 2 : 1,
      rooms: [],
      windowCounts: { total: 0 },
    },
    infra: {
      greenCert: false,
      heating: { primary: listingHeating(listing), backup: "" },
      electric: { primary: "Төвийн 100%", backup: "" },
      waterCold: { primary: "Төвийн шугам", backup: "" },
      waterHot: { primary: "Төвийн шугам", backup: "" },
      sewage: { primary: "Төвийн шугам", backup: "" },
      road: { asphaltPct: 100, dirtKm: 0 },
      internet: [],
    },
    included: {
      furniture: fillCheckList(listing.features.filter((f) => /тавилга/i.test(f))),
      equipment: [],
      extra: [],
    },
    community: {
      services: [],
      security: fillCheckList(listing.features.filter((f) => /хамгаалалт|харуул/i.test(f))),
      amenities: fillCheckList(listing.features),
    },
    state: {
      commissioned: true,
      commissionYear: listing.year,
      certStatus: "Мэдээлэл оруулаагүй",
      usage: listing.year >= 2022 ? "Шинэ ашиглалт" : "Ашиглагдаж байсан",
      collateral: "Мэдээлэл оруулаагүй",
      current: listing.mode === "rent" ? "Сул, чөлөөтэй байгаа" : "Борлуулахад бэлэн",
      interior: listing.features.some((f) => /шинэ|зас/i.test(f))
        ? "Сүүлийн 1 жилийн хугацаанд засал хийсэн"
        : "Мэдээлэл оруулаагүй",
    },
    pricing: {
      mode: listing.mode,
      primary: {
        unitPrice: Math.round(listing.price / listing.area),
        area: listing.area,
        totalPrice: listing.price,
      },
      vatIncluded: true,
      ebarimtVat: false,
    },
    payment: {
      forms: listing.mode === "sale" ? ["bank_loan"] : ["rent_monthly"],
      rentDeposit: listing.mode === "rent" ? listing.price : undefined,
    },
  };
}

export function checkedItems(items: DetailCheckItem[] | undefined): string[] {
  return (items ?? []).filter((item) => item.has !== false).map((item) => item.item);
}

export function getListingDetail(input: Listing | number | null | undefined): ListingDetail | null {
  if (input == null) return null;
  const id = typeof input === "number" ? input : input.id;
  if (LISTING_DETAILS[id]) return LISTING_DETAILS[id];
  return typeof input === "number" ? null : legacyToDetail(input);
}
