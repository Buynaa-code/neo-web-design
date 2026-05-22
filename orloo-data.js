/* ============== ORLOO DATA ============== */

const DISTRICTS = ['Хан-Уул', 'Баянзүрх', 'Сүхбаатар', 'Чингэлтэй', 'Сонгинохайрхан', 'Налайх'];

const KHOTKHON = [
  'Time Tower', 'Encanto', 'Olympic Residence', 'Twin Tower', 'Energy Residence',
  'Sky Tower', 'Buyant-Ukhaa-2', 'Tokyo Residence', 'Global Garden', 'Riverside',
  'Khan Palace', 'Royal County', 'Central Tower'
];

const AGENTS = [
  { id: 1, name: 'Б. Эрдэнэбаатар', initials: 'БЭ', agency: 'Marco Realty', verified: true, phone: '+976 9911 5544', activity: '5 мин өмнө идэвхтэй', listings: 24, rating: 4.8, reviewCount: 47 },
  { id: 2, name: 'Д. Болормаа', initials: 'ДБ', agency: 'RE/MAX Mongolia', verified: true, phone: '+976 8855 7722', activity: 'Өнөөдөр идэвхтэй', listings: 18, rating: 4.9, reviewCount: 62 },
  { id: 3, name: 'Г. Энхтайван', initials: 'ГЭ', agency: 'MGG Real Estate', verified: true, phone: '+976 9988 3311', activity: '1 цагийн өмнө', listings: 31, rating: 4.7, reviewCount: 38 },
  { id: 4, name: 'Ц. Сарангэрэл', initials: 'ЦС', agency: 'Бие даасан агент', verified: false, phone: '+976 9900 2244', activity: '3 цагийн өмнө', listings: 8, rating: 4.6, reviewCount: 14 },
  { id: 5, name: 'Н. Мөнхбат', initials: 'НМ', agency: 'Chestertons', verified: true, phone: '+976 8811 9933', activity: 'Өнөөдөр идэвхтэй', listings: 22, rating: 4.8, reviewCount: 41 }
];

/* Listings: mix of rent + sale.
   lat/lng: 0-1 normalized coords for the fake map (% positions).
   Map layout reflects real УБ geography loosely:
     Сүхбаатар (top-center)
     Чингэлтэй (top-left)
     Хан-Уул (bottom-left)
     Баянзүрх (right)
     Сонгинохайрхан (far-left)
*/
const LISTINGS = [
  // ----- RENT (түрээс) -----
  { id: 1, mode: 'rent', district: 'Хан-Уул', khoroo: '15', khotkhon: 'Time Tower', rooms: 3, area: 92, floor: '8/22', year: 2019,
    price: 1800000, photos: 1, status: 'new', listedDays: 2, viewCount: 87, viewingCount: 3,
    features: ['Бэлэн орох','Тавилгатай','Гараж','Тагт'], agentId: 1, lat: 0.30, lng: 0.65,
    desc: 'Шинээр заслагдсан, бүрэн тавилгатай 3 өрөө байр. Time Tower хотхон, метрод 5 минут. Гэр бүлд тохиромжтой.',
    priceHistory: [{ d: '2026-04-01', p: 1900000 }, { d: '2026-05-01', p: 1800000 }] },
  { id: 2, mode: 'rent', district: 'Сүхбаатар', khoroo: '1', khotkhon: 'Encanto', rooms: 2, area: 65, floor: '12/16', year: 2021,
    price: 1450000, photos: 2, status: 'active', listedDays: 8, viewCount: 124, viewingCount: 5,
    features: ['Тавилгатай','Тэжээвэр амьтантай','Шинээр заслагдсан'], agentId: 2, lat: 0.42, lng: 0.28,
    desc: 'Төв хороололын 2 өрөө байр. Каррефур, Шангрила Молл-д 10 минут. Тавилга, ахуйн хэрэгсэлтэй.' },
  { id: 3, mode: 'rent', district: 'Баянзүрх', khoroo: '5', khotkhon: 'Energy Residence', rooms: 4, area: 145, floor: '14/18', year: 2018,
    price: 3200000, photos: 3, status: 'hot', listedDays: 5, viewCount: 156, viewingCount: 8,
    features: ['Гэр бүлд','2 гараж','Тагт','Шонхор шил'], agentId: 3, lat: 0.62, lng: 0.45,
    desc: 'Том гэр бүлд зориулсан 4 өрөө байр. 145м², 2 гараж, том тагт, тавиур ширээ багтсан.' },
  { id: 4, mode: 'rent', district: 'Хан-Уул', khoroo: '11', khotkhon: 'Olympic Residence', rooms: 3, area: 110, floor: '6/14', year: 2020,
    price: 2400000, photos: 4, status: 'drop', listedDays: 12, viewCount: 98, viewingCount: 4,
    features: ['Усан сан','Биеийн тамирын танхим','Тавилгатай'], agentId: 1, lat: 0.28, lng: 0.68,
    desc: 'Дотоод дэд бүтэцтэй premium 3 өрөө. Усан сан, fitness, podzemny зогсоол.',
    priceHistory: [{ d: '2026-04-15', p: 2700000 }, { d: '2026-05-10', p: 2500000 }, { d: '2026-05-15', p: 2400000 }] },
  { id: 5, mode: 'rent', district: 'Сүхбаатар', khoroo: '8', khotkhon: 'Sky Tower', rooms: 1, area: 45, floor: '18/24', year: 2022,
    price: 1100000, photos: 5, status: 'new', listedDays: 1, viewCount: 42, viewingCount: 2,
    features: ['Шинэ','Студент болоход тохиромжтой','Гараж'], agentId: 5, lat: 0.44, lng: 0.32,
    desc: '18-р давхрын студио. Хотын төв харагдана. Гудамжтай ойрхон, MIAT-д 8 минут.' },
  { id: 6, mode: 'rent', district: 'Чингэлтэй', khoroo: '4', khotkhon: 'Tokyo Residence', rooms: 2, area: 70, floor: '4/12', year: 2017,
    price: 1350000, photos: 6, status: 'active', listedDays: 15, viewCount: 67, viewingCount: 2,
    features: ['Тавилгатай','Усан халаалт','Хүүхдийн тоглоомын талбай'], agentId: 4, lat: 0.32, lng: 0.18,
    desc: 'Гэр бүлийн орон. Гадаа тоглоомын талбайтай, цэцэрлэгт хүрэхэд хялбар.' },
  { id: 7, mode: 'rent', district: 'Хан-Уул', khoroo: '15', khotkhon: 'Twin Tower', rooms: 3, area: 105, floor: '10/20', year: 2019,
    price: 2100000, photos: 7, status: 'active', listedDays: 22, viewCount: 73, viewingCount: 3,
    features: ['Гараж','Тагт','Шонхор шил'], agentId: 2, lat: 0.32, lng: 0.62 },
  { id: 8, mode: 'rent', district: 'Баянзүрх', khoroo: '14', khotkhon: 'Global Garden', rooms: 2, area: 58, floor: '7/9', year: 2015,
    price: 1050000, photos: 8, status: 'active', listedDays: 18, viewCount: 51, viewingCount: 1,
    features: ['Тавилгагүй','Машины зогсоол'], agentId: 3, lat: 0.68, lng: 0.5 },

  // ----- SALE (зарах) -----
  { id: 9, mode: 'sale', district: 'Хан-Уул', khoroo: '15', khotkhon: 'Time Tower', rooms: 3, area: 92, floor: '8/22', year: 2019,
    price: 420000000, photos: 9, status: 'new', listedDays: 4, viewCount: 142, viewingCount: 7,
    features: ['Бэлэн орох','Зээлээр авч болно','Гараж','Тагт'], agentId: 1, lat: 0.30, lng: 0.65,
    desc: 'Шинээр заслагдсан 3 өрөөтэй сууц. Зээлээр авч болно, эзний нэрсэн дээр шилжүүлэх боломжтой.',
    priceHistory: [{ d: '2026-03-01', p: 450000000 }, { d: '2026-05-01', p: 420000000 }] },
  { id: 10, mode: 'sale', district: 'Сүхбаатар', khoroo: '1', khotkhon: 'Encanto', rooms: 2, area: 65, floor: '12/16', year: 2021,
    price: 400000000, photos: 10, status: 'active', listedDays: 14, viewCount: 89, viewingCount: 4,
    features: ['Зээлээр авч болно','Тавилгатай'], agentId: 2, lat: 0.42, lng: 0.28 },
  { id: 11, mode: 'sale', district: 'Баянзүрх', khoroo: '5', khotkhon: 'Energy Residence', rooms: 4, area: 145, floor: '14/18', year: 2018,
    price: 640000000, photos: 11, status: 'hot', listedDays: 6, viewCount: 198, viewingCount: 9,
    features: ['Бэлэн орох','2 гараж','Том тагт','Premium хороолол'], agentId: 3, lat: 0.62, lng: 0.45,
    desc: 'Том 4 өрөөтэй сууц. Бүх тавилга үлдээх боломжтой. Зээлгүй, бэлэн.' },
  { id: 12, mode: 'sale', district: 'Хан-Уул', khoroo: '11', khotkhon: 'Olympic Residence', rooms: 3, area: 110, floor: '6/14', year: 2020,
    price: 510000000, photos: 12, status: 'active', listedDays: 30, viewCount: 134, viewingCount: 5,
    features: ['Усан сан','Биеийн тамирын танхим','Гараж'], agentId: 1, lat: 0.28, lng: 0.68 },
  { id: 13, mode: 'sale', district: 'Сүхбаатар', khoroo: '8', khotkhon: 'Sky Tower', rooms: 1, area: 45, floor: '18/24', year: 2022,
    price: 280000000, photos: 13, status: 'new', listedDays: 3, viewCount: 76, viewingCount: 2,
    features: ['Шинэ','Зээлээр','Хотын төв'], agentId: 5, lat: 0.44, lng: 0.32 },
  { id: 14, mode: 'sale', district: 'Чингэлтэй', khoroo: '4', khotkhon: 'Khan Palace', rooms: 3, area: 98, floor: '5/12', year: 2017,
    price: 380000000, photos: 14, status: 'drop', listedDays: 21, viewCount: 102, viewingCount: 3,
    features: ['Бэлэн орох','Тагт','Шонхор шил'], agentId: 4, lat: 0.30, lng: 0.2,
    priceHistory: [{ d: '2026-04-01', p: 420000000 }, { d: '2026-04-20', p: 400000000 }, { d: '2026-05-10', p: 380000000 }] },
  { id: 15, mode: 'sale', district: 'Хан-Уул', khoroo: '3', khotkhon: 'Royal County', rooms: 4, area: 165, floor: 'Хаус', year: 2016,
    price: 1280000000, photos: 15, status: 'active', listedDays: 45, viewCount: 287, viewingCount: 11,
    features: ['Хаус','2 машины гараж','Цэцэрлэгтэй','Premium'], agentId: 5, lat: 0.22, lng: 0.75,
    desc: 'Royal County хороололын 165м² хаус. Хувийн цэцэрлэг, 2 машины гараж. Premium хороолол.' },
  { id: 16, mode: 'sale', district: 'Баянзүрх', khoroo: '2', khotkhon: 'Riverside', rooms: 3, area: 102, floor: '9/16', year: 2020,
    price: 465000000, photos: 16, status: 'active', listedDays: 18, viewCount: 91, viewingCount: 4,
    features: ['Голын харц','Тавилгатай','Гараж','Зээлээр'], agentId: 3, lat: 0.7, lng: 0.55 },
  { id: 17, mode: 'rent', district: 'Сонгинохайрхан', khoroo: '20', khotkhon: 'Buyant-Ukhaa-2', rooms: 2, area: 62, floor: '5/12', year: 2014,
    price: 850000, photos: 17, status: 'active', listedDays: 11, viewCount: 38, viewingCount: 1,
    features: ['Тавилгагүй','Хотноос гарах хялбар'], agentId: 4, lat: 0.12, lng: 0.5 },
  { id: 18, mode: 'sale', district: 'Сүхбаатар', khoroo: '1', khotkhon: 'Central Tower', rooms: 2, area: 72, floor: '15/22', year: 2023,
    price: 495000000, photos: 18, status: 'new', listedDays: 5, viewCount: 67, viewingCount: 3,
    features: ['Шинэ','Зээлээр','Хотын төвд','Тагт'], agentId: 2, lat: 0.46, lng: 0.3 }
];

/* District labels for the map background — positioned as % */
const MAP_LABELS = [
  { name: 'СҮХБААТАР', x: 52, y: 19 },
  { name: 'ЧИНГЭЛТЭЙ', x: 20, y: 19 },
  { name: 'ХАН-УУЛ', x: 38, y: 69 },
  { name: 'БАЯНЗҮРХ', x: 78, y: 22 },
  { name: 'СОНГИНОХАЙРХАН', x: 11, y: 70 }
];

/* District polygon zones for the fake map (SVG viewBox 0..100 on both axes).
   x = lat*100, y = lng*100 — same convention as LISTINGS pin positions. */
const DISTRICT_ZONES = [
  { name: 'Чингэлтэй',       points: '0,0 40,0 40,38 0,38',                              label: { x: 20, y: 19 } },
  { name: 'Сүхбаатар',       points: '40,0 65,0 65,38 40,38',                            label: { x: 52, y: 19 } },
  { name: 'Баянзүрх',        points: '65,0 100,0 100,100 55,100 55,38 65,38',            label: { x: 78, y: 22 } },
  { name: 'Сонгинохайрхан',  points: '0,38 22,38 22,100 0,100',                          label: { x: 11, y: 70 } },
  { name: 'Хан-Уул',         points: '22,38 55,38 55,100 22,100',                        label: { x: 38, y: 69 } }
];

/* Aggregate price stats for one district from a listings list */
function districtStats(districtName, listings) {
  const arr = listings.filter(l => l.district === districtName);
  if (!arr.length) return { count: 0, listings: [] };
  const prices = arr.map(l => l.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((s,p)=>s+p,0) / prices.length;
  const ppm = arr.reduce((s,l)=>s + (l.price/l.area), 0) / arr.length;
  return { count: arr.length, min, max, avg, ppm, listings: arr };
}

/* ============== BUS STOPS ==============
   Хотын автобусны томоохон буудлууд. lat/lng — газрын зургийн % координат
   (LISTINGS-ийн адил 0-1 хэвийн утга). routes — буудлаар өнгөрөх маршрутын дугаарууд. */
const BUS_STOPS = [
  { id: 'bs-bayanzurkh',  name: '13-р хороолол',       district: 'Баянзүрх',      routes: ['7','22','27'],    lat: 0.62, lng: 0.45 },
  { id: 'bs-misheel',     name: 'Мишээл Экспо',         district: 'Хан-Уул',       routes: ['11','19','43'],   lat: 0.30, lng: 0.66 },
  { id: 'bs-sansar',      name: 'Сансар',               district: 'Баянзүрх',      routes: ['3','18','24'],    lat: 0.66, lng: 0.42 },
  { id: 'bs-sukhbaatar',  name: 'Сүхбаатарын талбай',   district: 'Сүхбаатар',     routes: ['1','5','13','21'],lat: 0.44, lng: 0.30 },
  { id: 'bs-tedy',        name: 'Тэдийн худалдаа',      district: 'Чингэлтэй',     routes: ['9','15'],         lat: 0.32, lng: 0.20 },
  { id: 'bs-officer',     name: 'Офицерын ордон',       district: 'Сүхбаатар',     routes: ['1','5','7'],      lat: 0.42, lng: 0.32 },
  { id: 'bs-misheel-2',   name: 'Олимпийн гудамж',      district: 'Хан-Уул',       routes: ['8','11','19'],    lat: 0.28, lng: 0.68 },
  { id: 'bs-zaisan',      name: 'Зайсан',               district: 'Хан-Уул',       routes: ['7','32'],         lat: 0.34, lng: 0.78 },
  { id: 'bs-shineurguu',  name: 'Шинэ Үргөө',           district: 'Сонгинохайрхан',routes: ['16','30'],        lat: 0.12, lng: 0.52 },
  { id: 'bs-narantuul',   name: 'Нарантуул',            district: 'Баянзүрх',      routes: ['3','7','22'],     lat: 0.68, lng: 0.50 },
  { id: 'bs-tokyo',       name: 'Токио резиденс',       district: 'Чингэлтэй',     routes: ['9','15','21'],    lat: 0.32, lng: 0.18 },
  { id: 'bs-encanto',     name: 'Энканто',              district: 'Сүхбаатар',     routes: ['5','13'],         lat: 0.42, lng: 0.28 }
];
/* Зар буудлын ойролцоо тооцох радиус (хэвийн координатад). ~0.08 ≈ 600-800м. */
const BUS_STOP_RADIUS = 0.08;

/* ============== ҮХ-ИЙН ТӨРӨЛ ============== */
const PROPERTY_TYPES = [
  { key: 'apartment',  label: 'Орон сууц',          icon: 'building-2',   mode: 'sale', count: 4892, hint: 'Хотын байр, цогцолбор' },
  { key: 'house',      label: 'Гэр, хаус',          icon: 'home',         mode: 'sale', count: 1284, hint: 'Хувийн орон сууц' },
  { key: 'rent',       label: 'Түрээс',             icon: 'key-round',    mode: 'rent', count: 2156, hint: 'Сарын болон жилийн' },
  { key: 'hotel',      label: 'Зочид буудал',       icon: 'bed-double',   mode: 'rent', count: 312,  hint: 'Богино хугацаа' },
  { key: 'land',       label: 'Газар',              icon: 'map',          mode: 'sale', count: 1845, hint: 'Хашаа, талбай' },
  { key: 'office',     label: 'Оффис',              icon: 'briefcase',    mode: 'rent', count: 723,  hint: 'А, B, C ангилал' },
  { key: 'commercial', label: 'Худалдаа үйлчилгээ', icon: 'shopping-bag', mode: 'rent', count: 567,  hint: 'Дэлгүүр, үйлчилгээ' },
  { key: 'industrial', label: 'Үйлдвэрлэлийн',      icon: 'factory',      mode: 'sale', count: 198,  hint: 'Агуулах, цех' }
];

/* ============== AI ТУСЛАХ — САНАЛТ АСУУЛТ + ХАРИУ ============== */
const AI_ASSISTANT_QUESTIONS = [
  { icon: 'graduation-cap', text: 'Сургуультай ойрхон 3 өрөө' },
  { icon: 'landmark',       text: 'Ипотекийн зээлд тохирох сууц' },
  { icon: 'trending-up',    text: 'Хөрөнгө оруулалтад тохирох' },
  { icon: 'users',          text: 'Гэр бүлд төв байршил' }
];

/* Saved searches with alert config */
const SAVED_SEARCHES = [
  { id: 1, mode: 'rent', name: 'Эхний орон сууц', districts: ['Хан-Уул'], rooms: [2,3], priceRange: [1200000, 2000000], newMatches: 4, alertFreq: 'daily', sms: true, email: true, push: true, lastAlert: 'Өчигдөр' },
  { id: 2, mode: 'rent', name: 'Сүхбаатарын төв', districts: ['Сүхбаатар','Чингэлтэй'], rooms: [1,2], priceRange: [800000, 1500000], newMatches: 2, alertFreq: 'instant', sms: true, email: false, push: true, lastAlert: '2 цагийн өмнө' },
  { id: 3, mode: 'sale', name: 'Гэр бүлд тохирох сууц', districts: ['Хан-Уул','Сүхбаатар'], rooms: [3,4], priceRange: [350000000, 550000000], newMatches: 7, alertFreq: 'weekly', sms: false, email: true, push: true, lastAlert: '3 хоногийн өмнө' },
  { id: 4, mode: 'sale', name: 'Premium хаус', districts: ['Хан-Уул'], rooms: [4], priceRange: [800000000, 1500000000], newMatches: 0, alertFreq: 'weekly', sms: false, email: true, push: false, lastAlert: 'Шинэ зар алга' }
];

/* User's saved listings — multiple named lists */
const SAVED_LISTS = [
  { id: 1, name: 'Эхний орон сууц', icon: 'heart', listingIds: [1, 2, 5, 6, 7, 8] },
  { id: 2, name: 'Гэр бүлд тохирох', icon: 'home', listingIds: [3, 4, 11, 12] },
  { id: 3, name: 'Хан-Уул зорилт', icon: 'map-pin', listingIds: [9, 12, 15] }
];

/* User has favorited these (default heart-filled set) */
const SAVED_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15]);

/* Scheduled viewings */
const VIEWINGS = [
  { id: 1, listingId: 1, date: '2026-05-20', time: '16:00', status: 'confirmed', dayLabel: 'Маргааш', countdown: '1 хоног', note: 'Гэр бүлийн хамт' },
  { id: 2, listingId: 11, date: '2026-05-21', time: '14:00', status: 'confirmed', dayLabel: 'Нөгөөдөр', countdown: '2 хоног' },
  { id: 3, listingId: 4, date: '2026-05-22', time: '11:00', status: 'pending', dayLabel: 'Лхагва', countdown: '3 хоног', note: 'Хүлээгдэж буй' }
];

/* Past viewings */
const PAST_VIEWINGS = [
  { id: 10, listingId: 5, date: '2026-05-12', time: '15:00', status: 'completed', outcome: 'Сонирхолгүй' },
  { id: 11, listingId: 7, date: '2026-05-08', time: '17:00', status: 'completed', outcome: 'Хүлээгдэж буй шийдэл' }
];

/* Messages with agents */
const MESSAGES = [
  { id: 1, agentId: 1, lastMsg: 'Тийм, маргааш 16:00-д уулзах боломжтой. Time Tower-ийн ресепшн дээр уулзана уу.', time: '14:32', unread: 1, listingId: 1 },
  { id: 2, agentId: 2, lastMsg: 'Encanto-ийн 2 өрөө байрны нэмэлт зургийг илгээж байна.', time: '11:15', unread: 2, listingId: 2 },
  { id: 3, agentId: 3, lastMsg: 'Energy Residence-ын дотоод дэд бүтцийн талаар хариу өгье.', time: 'Өчигдөр', unread: 0, listingId: 3 },
  { id: 4, agentId: 5, lastMsg: 'Sky Tower-ийн зээлийн нөхцөл талаар банкны зөвлөгөө хүсэх үү?', time: '2 хоног', unread: 0, listingId: 5 },
  { id: 5, agentId: 4, lastMsg: 'Үзэлт амжилттай байсан уу? Бусад тохирох зар санал болгож болох уу?', time: '3 хоног', unread: 0, listingId: 6 }
];

/* Helpers */
const STATUS_PILL = {
  new: ['pill-new', 'Шинэ'],
  drop: ['pill-drop', 'Үнэ буурсан'],
  hot: ['pill-hot', 'Эрэлттэй'],
  active: ['', ''],
  reserved: ['pill-reserved', 'Захиалагдсан'],
  sold: ['pill-sold', 'Зарагдсан']
};

/* ============== BAIRMAP — рекламдсан data helpers ============== */

/* Full price (formal MNT representation: 238,000,000₮) */
function fmtFullPrice(n, mode) {
  const base = n.toLocaleString('en-US') + '₮';
  return mode === 'rent' ? base + '/сар' : base;
}

/* m² rate: full integer formatted */
function listingPpm(l) { return Math.round(l.price / l.area); }
function fmtPpm(l) { return listingPpm(l).toLocaleString('en-US') + '₮/м²'; }

/* Listing flags (synthesized from data — keeps mock data minimal) */
function isListingVerified(l) {
  const ag = AGENTS.find(a => a.id === l.agentId);
  return !!(ag && ag.verified);
}
function hasIpoteh(l) {
  return (l.features || []).some(f => /Зээ?л|Ипотек/i.test(f)) || l.mode === 'sale';
}
function isNewProject(l) { return l.year >= 2022 || l.status === 'new'; }
function listingTimeAgo(l) {
  const d = l.listedDays || 0;
  if (d === 0) return 'Дөнгөж сая';
  if (d === 1) return '1 хоногийн өмнө';
  if (d < 7) return d + ' хоногийн өмнө';
  if (d < 30) return Math.floor(d/7) + ' долоо хоногийн өмнө';
  return Math.floor(d/30) + ' сарын өмнө';
}
/* Минут-аар сүүлийн зар хэдийгээр өмнө орсныг харуулна */
function listingMinutesAgo(l) {
  const seed = (l.id * 17 + l.photos * 5) % 240;
  if (seed < 60) return seed + ' минутын өмнө';
  if (seed < 120) return Math.floor(seed/60) + ' цагийн өмнө';
  return Math.floor(seed/60) + ' цагийн өмнө';
}

/* Property orientation (Баруун харсан / Зүүн / Урд / Хойд) — deterministic from lat */
function listingOrientation(l) {
  const opts = ['Баруун харсан', 'Зүүн харсан', 'Урд харсан', 'Хойд харсан'];
  return opts[(l.id + l.photos) % opts.length];
}
function listingHeating(l) {
  return l.year >= 2018 ? 'Төвийн халаалт' : 'Зуухтай';
}

/* District zone counts for hero cluster map */
function districtClusterCounts() {
  return DISTRICTS.map(d => ({
    name: d,
    count: LISTINGS.filter(l => l.district === d && l.status !== 'sold').length
  }));
}

/* Mortgage calculation (annuity formula) */
function mortgageMonthly(price, downPct = 30, years = 20, annualRate = 12) {
  const loan = price * (1 - downPct/100);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(loan / n);
  const m = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
  return Math.round(m);
}

function fmtSale(n) { return '₮' + n.toLocaleString('en-US'); }
function fmtRent(n) { return '₮' + n.toLocaleString('en-US') + '/сар'; }
function fmtCompact(n) {
  if (n >= 1000000000) return '₮' + (n/1000000000).toFixed(2) + 'тэрбум';
  if (n >= 1000000) return '₮' + (n/1000000).toFixed(0) + 'сая';
  if (n >= 1000) return '₮' + (n/1000).toFixed(0) + 'мянган';
  return '₮' + n;
}
function fmtPinPrice(n, mode) {
  if (mode === 'rent') return '₮' + (n/1000).toFixed(0) + 'к';
  if (n >= 1000000000) return '₮' + (n/1000000000).toFixed(1) + 'тэр';
  return '₮' + (n/1000000).toFixed(0) + 'M';
}
function listingPrice(l) { return l.mode === 'rent' ? fmtRent(l.price) : fmtSale(l.price); }
function listingPriceShort(l) { return l.mode === 'rent' ? fmtCompact(l.price) + '/сар' : fmtCompact(l.price); }
function getAgent(id) { return AGENTS.find(a => a.id === id); }
function getListing(id) { return LISTINGS.find(l => l.id === id); }

/* Photo seeds — multiple per listing */
function photoUrl(listing, n=0, size='800/600') {
  return `https://picsum.photos/seed/orloo-${listing.photos}-${n}/${size}`;
}
