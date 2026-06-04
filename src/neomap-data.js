/* ============== ORLOO DATA ============== */

const DISTRICTS = ['Хан-Уул', 'Баянзүрх', 'Сүхбаатар', 'Чингэлтэй', 'Сонгинохайрхан', 'Налайх', 'Баянгол', 'Багануур', 'Багахангай'];

/* ============== ӨРӨӨНИЙ ТӨРӨЛ (room types lookup) — Wizard Excel sheet 2 ============== */
/* Орон сууц, амины сууц, оффис, үйлчилгээний барилгад ашиглах өрөөнүүд.
   Tag-уудыг өрөөний нэрнээс хамаарч динамикаар үзүүлнэ. */
const ROOM_TAGS_BY_TYPE = {
  generic:  ['Тагттай', 'Террастай', 'Цонхтой'],
  bedroom:  ['Хувцасны өрөөтэй', 'Тагттай', 'Террастай', 'Цонхтой'],
  master:   ['Ариун цэврийн өрөөтэй', 'Хувцасны өрөөтэй', 'Тагттай', 'Террастай', 'Ажлын хэсэгтэй', 'Цонхтой'],
  bath:     ['Угаалтуур', 'Суултуур', 'Душ', 'Ванн', 'Жакуза', 'Сауна', 'Гоо сайхны хэсэг', 'Цонхтой'],
  livingrm: ['Тагттай', 'Террастай', 'Цонхтой'],
  kitchen:  ['Тагттай', 'Цонхтой'],
  dining:   ['Тагттай', 'Цонхтой'],
};

const ROOM_TYPES = [
  { key: 'entry',         label: 'Үүдний өрөө, хэсэг',          tagGroup: 'generic',  group: 'living' },
  { key: 'foyer',         label: 'Үүдний танхим',               tagGroup: 'generic',  group: 'living' },
  { key: 'coat',          label: 'Үүдний хувцасны өрөө',        tagGroup: 'generic',  group: 'living' },
  { key: 'mudroom',       label: 'Хөлийн өрөө',                 tagGroup: 'generic',  group: 'living' },
  { key: 'living',        label: 'Зочны өрөө',                  tagGroup: 'livingrm', group: 'living' },
  { key: 'dining',        label: 'Хооллох хэсэг',               tagGroup: 'dining',   group: 'living' },
  { key: 'kitchen',       label: 'Гал тогоо',                   tagGroup: 'kitchen',  group: 'kitchen' },
  { key: 'kitchen-aux',   label: 'Туслах гал тогоо',            tagGroup: 'kitchen',  group: 'kitchen' },
  { key: 'pantry',        label: 'Гал тогооны агуулах',         tagGroup: 'generic',  group: 'kitchen' },
  { key: 'bedroom',       label: 'Унтлагын өрөө',               tagGroup: 'bedroom',  group: 'sleep' },
  { key: 'bedroom-master',label: 'Мастер унтлагын өрөө',        tagGroup: 'master',   group: 'sleep' },
  { key: 'bath',          label: 'Ариун цэврийн өрөө',          tagGroup: 'bath',     group: 'sleep' },
  { key: 'closet',        label: 'Хувцасны өрөө',               tagGroup: 'generic',  group: 'sleep' },
  { key: 'office',        label: 'Ажлын өрөө',                  tagGroup: 'generic',  group: 'utility' },
  { key: 'laundry',       label: 'Угаалгын өрөө (Laundry)',     tagGroup: 'generic',  group: 'utility' },
  { key: 'family',        label: 'Гэр бүлийн хэсэг',            tagGroup: 'livingrm', group: 'living' },
  { key: 'stairs',        label: 'Шат',                         tagGroup: 'generic',  group: 'transit' },
  { key: 'landing',       label: 'Шатны хонгил',                tagGroup: 'generic',  group: 'transit' },
  { key: 'corridor',      label: 'Коридор',                     tagGroup: 'generic',  group: 'transit' },
  { key: 'balcony',       label: 'Тагт',                        tagGroup: 'generic',  group: 'outdoor' },
  { key: 'terrace',       label: 'Террас',                      tagGroup: 'generic',  group: 'outdoor' },
  { key: 'roof-deck',     label: 'Ашиглалттай дээвэр / Дээврийн террас', tagGroup: 'generic', group: 'outdoor' },
  { key: 'veranda',       label: 'Веранд',                      tagGroup: 'generic',  group: 'outdoor' },
  { key: 'loggia',        label: 'Лодж',                        tagGroup: 'generic',  group: 'outdoor' },
  { key: 'garage',        label: 'Авто дулаан зогсоол',         tagGroup: 'generic',  group: 'utility' },
  { key: 'tech',          label: 'Техникийн өрөө',              tagGroup: 'generic',  group: 'utility' },
  { key: 'storage',       label: 'Агуулах',                     tagGroup: 'generic',  group: 'utility' },
  { key: 'entertainment', label: 'Энтертайнмент өрөө',          tagGroup: 'livingrm', group: 'leisure' },
  { key: 'mens-cave',     label: "Men's cave",                  tagGroup: 'livingrm', group: 'leisure' },
  { key: 'playroom',      label: 'Тоглоомын өрөө',              tagGroup: 'livingrm', group: 'leisure' },
  { key: 'wine',          label: 'Дарсны агуулах',              tagGroup: 'generic',  group: 'leisure' },
  { key: 'sauna',         label: 'Сауна',                       tagGroup: 'generic',  group: 'leisure' },
  { key: 'pool',          label: 'Усан бассейн',                tagGroup: 'generic',  group: 'leisure' },
  { key: 'lounge',        label: 'Амралтын өрөө',               tagGroup: 'livingrm', group: 'leisure' },
  { key: 'maid',          label: 'Үйлчлэгчийн өрөө',            tagGroup: 'bedroom',  group: 'service' },
  { key: 'waiting',       label: 'Хүлээлгийн өрөө',             tagGroup: 'generic',  group: 'service' },
  { key: 'smoking',       label: 'Тамхины өрөө',                tagGroup: 'generic',  group: 'leisure' },
];

/* Цонхны 8 чиглэл — талбайн хажуудаа цонхны тоог оруулна */
const WIND_DIRECTIONS = [
  { key: 'N',  short: 'З',  label: 'Зүүн (N)' },
  { key: 'NE', short: 'ЗУ', label: 'Зүүн-урагш (NE)' },
  { key: 'E',  short: 'У',  label: 'Урд (E)' },
  { key: 'SE', short: 'БУ', label: 'Баруун-урагш (SE)' },
  { key: 'S',  short: 'Б',  label: 'Баруун (S)' },
  { key: 'SW', short: 'БХ', label: 'Баруун-хойш (SW)' },
  { key: 'W',  short: 'Х',  label: 'Хойд (W)' },
  { key: 'NW', short: 'ЗХ', label: 'Зүүн-хойш (NW)' },
];

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
    features: ['Шинэ','Зээлээр','Хотын төвд','Тагт'], agentId: 2, lat: 0.46, lng: 0.3 },

  // ----- ADDITIONAL MOCK LISTINGS (19-42) -----
  { id: 19, mode: 'rent', district: 'Хан-Уул', khoroo: '4', khotkhon: 'Zaisan Hills', rooms: 4, area: 180, floor: '3/6', year: 2021,
    price: 4500000, photos: 19, status: 'hot', listedDays: 3, viewCount: 234, viewingCount: 12,
    features: ['Premium','Уулын харц','Том тагт','Цэцэрлэгтэй','2 гараж'], agentId: 5, lat: 0.18, lng: 0.78,
    desc: 'Зайсангийн толгод дээрх premium 4 өрөө байр. Уулын өргөн харц, хувийн цэцэрлэгтэй.' },
  { id: 20, mode: 'sale', district: 'Чингэлтэй', khoroo: '7', khotkhon: 'Capital Plaza', rooms: 2, area: 68, floor: '9/14', year: 2022,
    price: 365000000, photos: 20, status: 'hot', listedDays: 4, viewCount: 178, viewingCount: 6,
    features: ['Бэлэн орох','Тавилгатай','Зээлээр'], agentId: 4, lat: 0.26, lng: 0.16,
    desc: 'Чингэлтэйн дүүргийн төв хороололд байрлах хямд үнэтэй 2 өрөө байр.' },
  { id: 21, mode: 'rent', district: 'Баянзүрх', khoroo: '8', khotkhon: 'Selbe Garden', rooms: 1, area: 38, floor: '5/9', year: 2019,
    price: 750000, photos: 21, status: 'new', listedDays: 2, viewCount: 56, viewingCount: 1,
    features: ['Студент','Хямд','Тавилгатай','Лифттэй'], agentId: 3, lat: 0.74, lng: 0.38 },
  { id: 22, mode: 'sale', district: 'Хан-Уул', khoroo: '17', khotkhon: 'Star Apartments', rooms: 3, area: 88, floor: '11/18', year: 2020,
    price: 385000000, photos: 22, status: 'drop', listedDays: 28, viewCount: 112, viewingCount: 4,
    features: ['Үнэ буурсан','Зээлээр','Тавилгатай','Гараж'], agentId: 1, lat: 0.34, lng: 0.7,
    priceHistory: [{ d: '2026-04-01', p: 410000000 }, { d: '2026-05-01', p: 385000000 }] },
  { id: 23, mode: 'rent', district: 'Сүхбаатар', khoroo: '3', khotkhon: 'Tokyo Plaza', rooms: 2, area: 72, floor: '8/16', year: 2020,
    price: 1650000, photos: 23, status: 'active', listedDays: 9, viewCount: 95, viewingCount: 3,
    features: ['Гэр бүлд','Бэлэн орох','Тавилгатай','Гараж'], agentId: 2, lat: 0.5, lng: 0.24 },
  { id: 24, mode: 'sale', district: 'Налайх', khoroo: '2', khotkhon: 'Эко хаус', rooms: 4, area: 220, floor: 'Хаус', year: 2022,
    price: 580000000, photos: 24, status: 'new', listedDays: 6, viewCount: 89, viewingCount: 2,
    features: ['Хаус','Хашаатай','3 машины гараж','Эко технологи'], agentId: 5, lat: 0.92, lng: 0.85,
    desc: 'Налайхын төв хороололд байрлах эко технологитой 4 өрөө хаус.' },
  { id: 25, mode: 'rent', district: 'Чингэлтэй', khoroo: '11', khotkhon: 'Khangai Tower', rooms: 3, area: 95, floor: '6/12', year: 2018,
    price: 1850000, photos: 25, status: 'active', listedDays: 16, viewCount: 78, viewingCount: 2,
    features: ['Тавилгатай','Тэжээвэр амьтан','Бэлэн орох'], agentId: 4, lat: 0.22, lng: 0.22 },
  { id: 26, mode: 'sale', district: 'Сонгинохайрхан', khoroo: '15', khotkhon: 'New West', rooms: 2, area: 60, floor: '7/12', year: 2021,
    price: 245000000, photos: 26, status: 'active', listedDays: 11, viewCount: 64, viewingCount: 3,
    features: ['Хямд','Шинэ','Зээлээр','Лифттэй'], agentId: 4, lat: 0.08, lng: 0.48,
    desc: 'Сонгинохайрхан дүүрэгт байх хямд 2 өрөө сууц, шинэ ашиглалттай.' },
  { id: 27, mode: 'rent', district: 'Баянзүрх', khoroo: '12', khotkhon: 'Eastern Heights', rooms: 4, area: 165, floor: '15/20', year: 2022,
    price: 3850000, photos: 27, status: 'hot', listedDays: 4, viewCount: 187, viewingCount: 9,
    features: ['Premium','Хотын харц','Усан сан','Биеийн тамирын танхим','Тавилгатай'], agentId: 3, lat: 0.66, lng: 0.6,
    desc: 'Зүүн эх орны premium 4 өрөө байр. Хотын панораматай харц.' },
  { id: 28, mode: 'sale', district: 'Сүхбаатар', khoroo: '6', khotkhon: 'Diamond Tower', rooms: 3, area: 112, floor: '20/30', year: 2024,
    price: 720000000, photos: 28, status: 'new', listedDays: 1, viewCount: 42, viewingCount: 1,
    features: ['Шинэ','Premium','Гараж','24/7 хамгаалалт','Лифт'], agentId: 2, lat: 0.48, lng: 0.36,
    desc: '20-р давхрын шинэ premium байр. Бүх төрлийн тав тухтай үйлчилгээ.' },
  { id: 29, mode: 'rent', district: 'Хан-Уул', khoroo: '2', khotkhon: 'Riverside Park', rooms: 2, area: 64, floor: '10/14', year: 2019,
    price: 1380000, photos: 29, status: 'active', listedDays: 13, viewCount: 71, viewingCount: 2,
    features: ['Голын харц','Тавилгатай','Лифттэй'], agentId: 1, lat: 0.24, lng: 0.74 },
  { id: 30, mode: 'sale', district: 'Баянзүрх', khoroo: '20', khotkhon: 'Mountain View', rooms: 4, area: 145, floor: '8/14', year: 2020,
    price: 525000000, photos: 30, status: 'active', listedDays: 24, viewCount: 134, viewingCount: 5,
    features: ['Уулын харц','Гэр бүлд','2 гараж','Том тагт'], agentId: 3, lat: 0.7, lng: 0.42 },
  { id: 31, mode: 'rent', district: 'Хан-Уул', khoroo: '6', khotkhon: 'Olympic Village', rooms: 2, area: 78, floor: '5/12', year: 2017,
    price: 1250000, photos: 31, status: 'drop', listedDays: 18, viewCount: 88, viewingCount: 3,
    features: ['Үнэ буурсан','Тавилгатай','Гараж','Тагт'], agentId: 1, lat: 0.3, lng: 0.66,
    priceHistory: [{ d: '2026-04-20', p: 1450000 }, { d: '2026-05-15', p: 1250000 }] },
  { id: 32, mode: 'sale', district: 'Сүхбаатар', khoroo: '11', khotkhon: 'Sky Garden', rooms: 1, area: 42, floor: '14/22', year: 2023,
    price: 250000000, photos: 32, status: 'new', listedDays: 7, viewCount: 102, viewingCount: 4,
    features: ['Шинэ','Студио','Хямд','Зээлээр','Тагт'], agentId: 2, lat: 0.52, lng: 0.18 },
  { id: 33, mode: 'rent', district: 'Чингэлтэй', khoroo: '9', khotkhon: 'Heritage Plaza', rooms: 3, area: 105, floor: '7/10', year: 2016,
    price: 1950000, photos: 33, status: 'active', listedDays: 20, viewCount: 84, viewingCount: 3,
    features: ['Гэр бүлд','Тавилгатай','Сургуультай ойр','Бэлэн орох'], agentId: 4, lat: 0.18, lng: 0.26 },
  { id: 34, mode: 'sale', district: 'Хан-Уул', khoroo: '8', khotkhon: 'Bogd Palace', rooms: 5, area: 285, floor: 'Хаус', year: 2018,
    price: 1850000000, photos: 34, status: 'hot', listedDays: 9, viewCount: 312, viewingCount: 14,
    features: ['Luxury','Хаус','Усан сан','Кино театр','3 машины гараж','Хувийн цэцэрлэг'], agentId: 5, lat: 0.16, lng: 0.82,
    desc: 'Premium luxury хаус. Усан сан, кино театр, хувийн цэцэрлэгтэй. Зайсангийн төв.' },
  { id: 35, mode: 'rent', district: 'Баянзүрх', khoroo: '6', khotkhon: 'City Plaza', rooms: 1, area: 35, floor: '4/8', year: 2015,
    price: 680000, photos: 35, status: 'active', listedDays: 25, viewCount: 41, viewingCount: 1,
    features: ['Хямд','Студент','Бэлэн орох'], agentId: 3, lat: 0.76, lng: 0.46 },
  { id: 36, mode: 'sale', district: 'Сүхбаатар', khoroo: '2', khotkhon: 'Royal Garden', rooms: 3, area: 95, floor: '12/18', year: 2021,
    price: 510000000, photos: 36, status: 'active', listedDays: 15, viewCount: 156, viewingCount: 6,
    features: ['Premium','Зээлээр','Тавилгатай','Лифт','Хамгаалалт'], agentId: 2, lat: 0.46, lng: 0.32 },
  { id: 37, mode: 'rent', district: 'Сонгинохайрхан', khoroo: '8', khotkhon: 'West Park', rooms: 2, area: 55, floor: '6/10', year: 2018,
    price: 780000, photos: 37, status: 'new', listedDays: 3, viewCount: 35, viewingCount: 1,
    features: ['Хямд','Хотын зах','Тавилгагүй','Лифттэй'], agentId: 4, lat: 0.14, lng: 0.54 },
  { id: 38, mode: 'sale', district: 'Чингэлтэй', khoroo: '2', khotkhon: 'North Gate', rooms: 2, area: 70, floor: '8/14', year: 2020,
    price: 340000000, photos: 38, status: 'active', listedDays: 19, viewCount: 92, viewingCount: 4,
    features: ['Зээлээр','Тавилгатай','Сургуультай ойр'], agentId: 4, lat: 0.28, lng: 0.14 },
  { id: 39, mode: 'rent', district: 'Хан-Уул', khoroo: '13', khotkhon: 'Sunset Tower', rooms: 3, area: 110, floor: '16/20', year: 2023,
    price: 2400000, photos: 39, status: 'hot', listedDays: 5, viewCount: 198, viewingCount: 8,
    features: ['Шинэ','Premium','Хотын харц','Тавилгатай','Гараж','Усан сан'], agentId: 1, lat: 0.36, lng: 0.72,
    desc: '16-р давхрын premium 3 өрөө байр. Жаргалын харц, шинэ ашиглалт.' },
  { id: 40, mode: 'sale', district: 'Баянзүрх', khoroo: '4', khotkhon: 'Selbe Garden', rooms: 3, area: 92, floor: '7/12', year: 2019,
    price: 415000000, photos: 40, status: 'drop', listedDays: 31, viewCount: 168, viewingCount: 7,
    features: ['Үнэ буурсан','Бэлэн орох','Гараж','Зээлээр'], agentId: 3, lat: 0.72, lng: 0.36,
    priceHistory: [{ d: '2026-03-15', p: 445000000 }, { d: '2026-04-25', p: 430000000 }, { d: '2026-05-15', p: 415000000 }] },
  { id: 41, mode: 'sale', district: 'Налайх', khoroo: '5', khotkhon: 'Country Side', rooms: 5, area: 320, floor: 'Хаус', year: 2020,
    price: 850000000, photos: 41, status: 'active', listedDays: 42, viewCount: 187, viewingCount: 6,
    features: ['Хаус','Том хашаа','3 машины гараж','Эко','Цэцэрлэгтэй'], agentId: 5, lat: 0.9, lng: 0.9 },
  { id: 42, mode: 'rent', district: 'Сүхбаатар', khoroo: '5', khotkhon: 'Global Plaza', rooms: 2, area: 68, floor: '11/16', year: 2022,
    price: 1750000, photos: 42, status: 'new', listedDays: 2, viewCount: 58, viewingCount: 2,
    features: ['Шинэ','Premium','Тавилгатай','Хотын төв','Лифт'], agentId: 2, lat: 0.48, lng: 0.28 }
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

/* Scheduled viewings — relative to today so labels stay accurate */
const VIEWINGS = (() => {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  return [
    { id: 1, listingId: 1,  date: iso(1), time: '16:00', status: 'confirmed', dayLabel: 'Маргааш',  countdown: '1 хоног', note: 'Гэр бүлийн хамт' },
    { id: 2, listingId: 11, date: iso(2), time: '14:00', status: 'confirmed', dayLabel: 'Нөгөөдөр', countdown: '2 хоног' },
    { id: 3, listingId: 4,  date: iso(3), time: '11:00', status: 'pending',   dayLabel: '3 хоног',  countdown: '3 хоног', note: 'Хүлээгдэж буй' }
  ];
})();

/* Past viewings — relative to today */
const PAST_VIEWINGS = (() => {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  return [
    { id: 10, listingId: 5, date: iso(15), time: '15:00', status: 'completed', outcome: 'Сонирхолгүй' },
    { id: 11, listingId: 7, date: iso(19), time: '17:00', status: 'completed', outcome: 'Хүлээгдэж буй шийдэл' }
  ];
})();

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
/* Минут-аар сүүлийн зар хэдийгээр өмнө орсныг харуулна.
   listedDays>0 бол хоног, өнөөдрийн зар бол синтетик минут/цаг. */
function listingMinutesAgo(l) {
  const d = l.listedDays || 0;
  if (d > 0) return listingTimeAgo(l);
  const seed = (l.id * 17 + l.photos * 5) % 240;
  if (seed < 60) return Math.max(1, seed) + ' минутын өмнө';
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

/* ============== BANKS — Ипотекийн нөхцөл ============== */
const BANKS = [
  { id: 'khan',     name: 'Хаан Банк',           short: 'Хаан',     rate: 11.5, maxYears: 25, minDownPct: 20, badge: 'Шинэ хүү', color: '#3D7C2A', tag: 'Эхний айлд тусгай хүү' },
  { id: 'golomt',   name: 'Голомт Банк',          short: 'Голомт',   rate: 12.0, maxYears: 20, minDownPct: 25, color: '#0050A0', tag: '20 жилийн ипотек' },
  { id: 'tdb',      name: 'Худалдаа Хөгжлийн Банк (TDB)', short: 'TDB', rate: 12.5, maxYears: 20, minDownPct: 30, color: '#C8102E', tag: 'Premium ипотек' },
  { id: 'xacbank',  name: 'ХасБанк',              short: 'Хас',      rate: 12.8, maxYears: 20, minDownPct: 25, color: '#E87722', tag: 'Хурдан зөвшөөрөл' },
  { id: 'state',    name: 'Төрийн Банк',          short: 'Төрийн',   rate: 8.0,  maxYears: 30, minDownPct: 10, badge: 'Засгийн', color: '#0A1F44', tag: '8% ипотек (хязгаарлагдмал)' },
  { id: 'capitron', name: 'Капитрон Банк',        short: 'Капитрон', rate: 13.0, maxYears: 15, minDownPct: 30, color: '#5B2E91', tag: 'Уян хатан төлбөр' }
];
function getBank(id) { return BANKS.find(b => b.id === id) || BANKS[0]; }

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
  if (n >= 1000000) {
    const v = n / 1000000;
    return '₮' + (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'сая';
  }
  if (n >= 1000) return '₮' + Math.round(n/1000) + 'мянган';
  return '₮' + n;
}
function fmtPinPrice(n, mode) {
  if (mode === 'rent') return '₮' + (n/1000).toFixed(0) + 'к';
  if (n >= 1000000000) return '₮' + (n/1000000000).toFixed(1) + 'тэр';
  return '₮' + (n/1000000).toFixed(0) + 'M';
}
function fmtMapPinPrice(l) {
  const n = Number(l.price) || 0;
  if (l.mode === 'rent') {
    if (n >= 1000000) return '₮' + (n/1000000).toFixed(1).replace(/\.0$/, '') + 'M/сар';
    return '₮' + Math.round(n/1000) + 'K/сар';
  }
  if (n >= 1000000000) return '₮' + (n/1000000000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + 'тэр';
  return '₮' + Math.round(n/1000000) + 'M';
}
function fmtListingArea(area) {
  const n = Number(area);
  if (!Number.isFinite(n) || n <= 0) return '';
  return (Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, '')) + 'м²';
}
function fmtMapPinMeta(l) {
  const area = fmtListingArea(l.area);
  return [l.rooms ? l.rooms + 'ө' : '', area].filter(Boolean).join(' · ');
}
function fmtPinPpm(l) {
  if (!l.area || l.area <= 0) return fmtPinPrice(l.price, l.mode);
  const ppm = l.price / l.area;
  if (l.mode === 'rent') return '₮' + Math.round(ppm/1000) + 'к/м²';
  if (ppm >= 1000000) return '₮' + (ppm/1000000).toFixed(1) + 'M/м²';
  return '₮' + Math.round(ppm/1000) + 'к/м²';
}
function listingPrice(l) { return l.mode === 'rent' ? fmtRent(l.price) : fmtSale(l.price); }
function listingPriceShort(l) { return l.mode === 'rent' ? fmtCompact(l.price) + '/сар' : fmtCompact(l.price); }
function getAgent(id) { return AGENTS.find(a => a.id === id); }
function getListing(id) { return LISTINGS.find(l => l.id === id); }

/* Photo seeds — multiple per listing */
function photoUrl(listing, n=0, size='800/600') {
  if (listing.photoSeeds && listing.photoSeeds.length) {
    const seed = listing.photoSeeds[n % listing.photoSeeds.length];
    return `https://picsum.photos/seed/${seed}/${size}`;
  }
  return `https://picsum.photos/seed/orloo-${listing.photos}-${n}/${size}`;
}

/* ==================================================================== */
/* ============== ӨРГӨТГӨСӨН СХЕМ — ГЭРЭЭНИЙ ЗАГВАРЫН ДАГУУ =============== */
/* ==================================================================== */
/* Эх сурвалж: "01 Single property for sales and rental 2026.05.25" гэрээний
   загвар дахь "ГЭРЭЭНИЙ ЗҮЙЛИЙН МЭДЭЭЛЭЛ" хэсэг.
   Хуучин LISTING талбарууд (district/khoroo/khotkhon/rooms/area/...) хэвээр
   үлдэх ба detail нь нэмэлт бүрэн схемийн утгуудыг агуулна. */

/* ============== 1. ҮЛ ХӨДЛӨХИЙН ТӨРӨЛ ============== */
const HDLH_TYPES = [
  { key: 'apartment',      label: 'Орон сууц',
    subs: ['Энгийн', 'Duplex', 'Penthouse', 'Бусад'] },
  { key: 'amini',          label: 'Амины орон сууц',
    subs: ['Single', 'Twin', 'Town', 'Multi', 'Газартай'] },
  { key: 'land_village',   label: 'Газар хотхоны' },
  { key: 'industrial',     label: 'Аж үйлдвэр, обьект, агуулах' },
  { key: 'office',         label: 'Оффис' },
  { key: 'commercial',     label: 'Худалдаа, үйлчилгээ' },
  { key: 'parking',        label: 'Авто дулаан зогсоол' },
  { key: 'storage',        label: 'Агуулах (орон сууц, гараж, оффисын доторх)' },
  { key: 'fence_house',    label: 'Хашаа байшин - газартай' },
  { key: 'summer_w_land',  label: 'Зуслангийн байшин – газартай' },
  { key: 'summer_no_land', label: 'Зуслангийн байшин - газаргүй' },
  { key: 'other_property', label: 'Бусад' },
  { key: 'land',           label: 'Газар' }
];

const LAND_RIGHTS      = ['Өмчлөх эрхтэй', 'Эзэмших эрхтэй', 'Ашиглах эрхтэй'];
const LAND_DECISION_BY = ['Нийслэл', 'Дүүрэг', 'Байгаль орчны яам', 'Бусад'];

/* ============== 2. ХАЯГ, БАЙРШЛЫН ИЕРАРХИ ==============
   Бүх боломжит түвшнүүд — формд дарааллаар нь оруулна.
   [Улс] → [Хот/Аймаг] → [Дүүрэг/Сум] → [Хороо/Баг] → [Хаягийн бүс zip]
        → [Гудамж] [гудамжны дугаар] → [Төсөл/хотхоны нэр]
        → [Барилга/блокын дугаар] [Барилга/блокын нэр]
        → [Орц/section нэр] [Орц/Section дугаар]
        → [Давхар] [тоот]
*/
const ADDRESS_LEVELS = [
  { key: 'country',        label: 'Улс',                     placeholder: 'Монгол Улс' },
  { key: 'city',           label: 'Хот / Аймаг',             placeholder: 'Улаанбаатар' },
  { key: 'district',       label: 'Дүүрэг / Сум',            placeholder: 'Хан-Уул' },
  { key: 'khoroo',         label: 'Хороо / Баг',             placeholder: '11' },
  { key: 'zip',            label: 'Хаягийн бүс (zip)',       placeholder: '17061' },
  { key: 'street',         label: 'Гудамж',                  placeholder: 'Грийн Вилла' },
  { key: 'streetNumber',   label: 'Гудамжны дугаар',         placeholder: '' },
  { key: 'project',        label: 'Төсөл / хотхоны нэр',     placeholder: 'Грийн Вилла хотхон' },
  { key: 'buildingNumber', label: 'Барилга / блокын дугаар', placeholder: '204' },
  { key: 'buildingName',   label: 'Барилга / блокын нэр',    placeholder: '' },
  { key: 'entranceName',   label: 'Орц / section нэр',       placeholder: '' },
  { key: 'entranceNumber', label: 'Орц / section дугаар',    placeholder: '' },
  { key: 'floor',          label: 'Давхар',                  placeholder: '3' },
  { key: 'unit',           label: 'Тоот',                    placeholder: '301' }
];

/* Хаягийн нэг мөртэд харуулах форматтэр (зөвхөн утга оруулсан түвшингүүдийг авна) */
function formatAddressLine(addr) {
  if (!addr) return '';
  const parts = ADDRESS_LEVELS.map(lvl => addr[lvl.key]).filter(v => v && String(v).trim() !== '');
  return parts.join(', ');
}

/* ============== 3. ЦОНХНЫ 8 ЧИГЛЭЛ ============== */
const WINDOW_DIRECTIONS = [
  { code: 'З',  label: 'Зүүн' },
  { code: 'ЗУ', label: 'Зүүн-Урд' },
  { code: 'У',  label: 'Урд' },
  { code: 'БУ', label: 'Баруун-Урд' },
  { code: 'Б',  label: 'Баруун' },
  { code: 'БХ', label: 'Баруун-Хойд' },
  { code: 'Х',  label: 'Хойд' },
  { code: 'ЗХ', label: 'Зүүн-Хойд' }
];

/* ============== 4. ДЭД БҮТЭЦ — СОНГОЛТУУД ============== */
const HEATING_PRIMARY  = ['Төвийн (улсын)', 'Төвлөрсөн (хотхоны)', 'Бие даасан',
                          'Уурын зуух (нүүрсэн)', 'Газан зуух', 'Цахилгаан', 'Бусад'];
const HEATING_BACKUP   = ['Газан зуух', 'Цахилгаан зуух', 'Цахилгаан радиатор', 'Бусад'];

const ELECTRIC_PRIMARY = ['Төвийн 100%', 'Төвийн болон сэргээгдэх хосолмол',
                          'Сэргээгдэх 100%', 'Бусад'];
const ELECTRIC_BACKUP  = ['Ямар нэг нөөцлүүргүй', 'Ямар нэг нөөцлүүртэй',
                          'Дизель генератортой', 'Бусад'];

const WATER_COLD_PRIMARY = ['Төвийн шугам (улсын)', 'Төвлөрсөн (хотхоны)',
                            'Бие даасан', 'Гүний худаг', 'Бусад'];
const WATER_COLD_BACKUP  = ['Гүний худаг', 'Ус зөөдөг', 'Бусад'];

const WATER_HOT_PRIMARY  = ['Төвийн шугам (улсын) – ялтсан бойлер', 'Төвлөрсөн (хотхоны)',
                            'Бие даасан', 'Эзлэхүүний бойлер', 'Бусад'];
const WATER_HOT_BACKUP   = ['Түргэн халаагч бойлер', 'Эзлэхүүний бойлер', 'Бусад'];

const SEWAGE_PRIMARY = ['Төвийн шугам (улсын)', 'Төвлөрсөн (хотхоны)', 'Бие даасан',
                        'Септик', 'Соруулдаг', 'Бусад'];
const SEWAGE_BACKUP  = ['Септик', 'Соруулдаг', 'Бусад'];

const INTERNET_PROVIDERS = ['Univision', 'DDISH, Гэр интернет', 'Mobinet', 'Бусад'];

/* ============== 5. ҮНЭД БАГТСАН ЗҮЙЛС ============== */
const FURNITURE_GROUPS = [
  'Гал тогооны тавилга', 'Үүдний тавилга', 'АЦӨ тавилга, тоноглол',
  'Зочны өрөөний ханын тавилга', 'Хувцасны өрөөний тавилга',
  'Ажлын өрөөний ханын тавилга', 'Gym-ний ханын тавилга',
  'B1 давхрын үүдний өрөөний тавилга'
];
const EQUIPMENT_ITEMS = [
  'Хөргөгч, хөлдөөгч', 'Суурилагддаг зуух, плитка, шарах шүүгээ',
  'Ус цэвэршүүлэгч', 'Бидэ', 'Угаалгын машин'
];
const EXTRA_EQUIPMENT = [
  'Ялаа, шумуулны тор', 'Агааржуулалт, эйр кондишн систем',
  'Домофон', 'Автоматжуулалтын систем', 'Гэрлийн бүрхүүл', 'Хөшиг, тюль'
];

/* ============== 6. ХОТХОН/ТӨСЛИЙН ДУНДЫН ============== */
const COMMUNITY_SERVICES = [
  'Хүнсний дэлгүүр', 'Барааны дэлгүүр', 'Фитнес, иога, веллнесс',
  'Спа', 'Бассейн', 'Сауна', 'Угаалга, хими цэвэрлэгээ',
  'Дундын өмчлөлийн цэвэрлэгээ', 'Хувийн өмчийн цэвэрлэгээ',
  'Клабхаус', 'Ресторан', 'Кофешоп', 'Цахилгаан машины цэнэглэл станц'
];
const COMMUNITY_SECURITY = [
  'Харуул, хамгаалалт 24/7', 'Домофон, дохиолол',
  'Хотхоны нэгдсэн хашаа', 'Явган орц, гарцны аксесстай хаалга'
];
const COMMUNITY_AMENITIES = [
  'Төлбөртэй ил зогсоол', 'Төлбөргүй ил зогсоол', 'Төлбөртэй дулаан зогсоол',
  'Машингүй бүс', 'Машины автомат хаалт',
  'Хүүхдийн тоглоомын талбай', 'Ногоон байгууламж, нарлах салхилах талбай',
  'Лифт – зорчигчийн 24/7', 'Лифт – ачааны 24/7',
  'Нэгдсэн дулаан зогсоол', 'Тусгай хэрэгцээт хүнд зориулсан дэд бүтэц',
  'Хүүхдэд ээлтэй орчин'
];

/* ============== 7. ҮЛ ХӨДЛӨХИЙН ТӨЛӨВ ============== */
const CERT_STATUS = [
  'Бэлэн гэрчилгээтэй',
  'Дуусаагүй барилгын гэрчилгээтэй',
  'Гэрчилгээгүй - Гэрчилгээ гарахад бэлэн',
  'Гэрчилгээгүй – Баригдаж байгаа, захиалгын гэрээтэй',
  'Бусад'
];
const COLLATERAL_STATUS = [
  'Ямар нэг барьцаанд байхгүй',
  'Банк, ББСБ, санхүүгийн байгууллагын зээлийн барьцаанд байгаа',
  'Гуравдагч этгээдийн барьцаанд байгаа'
];
const CURRENT_STATE = [
  'Түрээсийн эсхүл хөлслүүлэх гэрээтэй байгаа',
  'Амьдарч, ашиглаж байгаа',
  'Сул, чөлөөтэй байгаа',
  'Бусад'
];
const INTERIOR_AGE = [
  'Сүүлийн 1 жилийн хугацаанд засал хийсэн',
  '1-3 жилийн өмнө засал хийсэн',
  '3-аас дээш жилийн өмнө засал хийсэн / Анхны заслаараа',
  'Засваргүй, Гэрээлэгч өөрөө засал хийнэ',
  'Дотор засвар хийгдэж байгаа'
];
const USED_STATUS = ['Цоо шинэ, ашиглаж байгаагүй', 'Ашиглагдаж байсан'];

/* ============== 8. ТӨЛБӨРИЙН НӨХЦӨЛИЙН ХЭЛБЭРҮҮД ============== */
const PAYMENT_FORMS = [
  { key:'cash_now',          label:'Зөвхөн 100% бэлэн мөнгөөр, шууд төлөлтөөр',
    cashPct:100, barterPct:0, scheduleMonths:0, prepayMinPct:100 },
  { key:'cash_schedule',     label:'Зөвхөн 100% бэлэн мөнгөөр, хуваарьт төлөлтөөр',
    cashPct:100, barterPct:0 },
  { key:'barter_only',       label:'100% хүртэл бартераар борлуулах боломжтой',
    cashPct:0, barterPctMax:100, scheduleMonths:0 },
  { key:'barter_cash_now',   label:'Үнийн дүнгийн тодорхой хувь хүртэл бартераар, бэлэн мөнгийг шууд төлөлтөөр',
    barterPctMax:50, scheduleMonths:0, prepayMinPct:50 },
  { key:'barter_cash_sched', label:'Үнийн дүнгийн тодорхой хувь хүртэл бартераар, бэлэн мөнгийг хуваарьт төлөлтөөр' },
  { key:'bank_loan',         label:'Бусад (Банкны зээл)' }
];

/* ============== 9. СУРТАЛЧИЛГААНЫ СУВАГ ============== */
const AD_CHANNELS = {
  social: ['Фэйсбүүк', 'Инстаграм', 'X (twitter)', 'Threads'],
  web:    ['unegui.mn', 'neolimit.mn', 'Бусад web хуудас, платформ'],
  media:  ['Сонин, сэтгүүл', 'Телевиз', 'FM радио'],
  other:  ['Утсаар хийх дуудлага (cold call)', 'Масс и-мэйл', 'Масс смс',
           'Төрөл бүрийн event', 'Биечилсэн болон цахим уулзалт']
};

/* ============== 10. ЗУУЧЛАЛЫН ҮЙЛЧИЛГЭЭНИЙ ЭРХИЙН ХЭЛБЭР + ХӨЛСНИЙ МАТРИЦ ============== */
const BROKERAGE_MODES = [
  { key:'exclusive', label:'Цор ганц, онцгой эрхт зуучлалын үйлчилгээ' },
  { key:'open',      label:'Энгийн, нээлттэй зуучлалын үйлчилгээ' },
  { key:'urgent',    label:'Яаралтай горим' }
];

/* Хувь = НӨАТ багтсан / тооцох тохирсон % / Яаралтай нэмэлт %.
   1 тэрбум доош (below1bn) ба дээш (above1bn) гэсэн 2 түвшинтэй. */
const BROKERAGE_FEE_MATRIX = {
  apartment:    { below1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 },
                  above1bn:{ inclVAT:2.64, agreed:3.30, urgentExtra:1.00 } },
  parking:      { below1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 },
                  above1bn:{ inclVAT:2.64, agreed:3.30, urgentExtra:1.00 } },
  office:       { below1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 },
                  above1bn:{ inclVAT:2.64, agreed:3.30, urgentExtra:1.00 } },
  commercial:   { below1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 },
                  above1bn:{ inclVAT:2.64, agreed:3.30, urgentExtra:1.00 } },
  storage:      { below1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 },
                  above1bn:{ inclVAT:2.64, agreed:3.30, urgentExtra:1.00 } },
  amini:        { below1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 },
                  above1bn:{ inclVAT:2.64, agreed:3.30, urgentExtra:1.00 } },
  amini_no_land:{ below1bn:{ inclVAT:4.40, agreed:5.50, urgentExtra:1.00 },
                  above1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 } },
  fence_house:  { below1bn:{ inclVAT:4.40, agreed:5.50, urgentExtra:1.00 },
                  above1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 } },
  industrial:   { below1bn:{ inclVAT:4.40, agreed:5.50, urgentExtra:1.00 },
                  above1bn:{ inclVAT:3.52, agreed:4.40, urgentExtra:1.00 } },
  other:        { below1bn:{ inclVAT:4.40, agreed:5.50, urgentExtra:1.00 },
                  above1bn:{ inclVAT:4.40, agreed:5.50, urgentExtra:1.00 } }
};

/* Хөлс тооцох туслах: gross/net + дотоод томьёо */
function calcBrokerageFee({ typeKey, totalPrice, rightForm = 'open', urgent = false }) {
  const tier = (totalPrice >= 1000000000) ? 'above1bn' : 'below1bn';
  const row  = (BROKERAGE_FEE_MATRIX[typeKey] || BROKERAGE_FEE_MATRIX.other)[tier];
  const base = (rightForm === 'exclusive') ? row.inclVAT : row.agreed;
  const pct  = base + (urgent ? row.urgentExtra : 0);
  return { tier, pct, amount: Math.round(totalPrice * pct / 100) };
}

/* ============== 11. ХОЛБОО БАРИХ СУВГУУД ============== */
const CONTACT_CHANNELS = [
  { key:'email',     label:'Цахим шуудан' },
  { key:'web',       label:'Веб' },
  { key:'phone',     label:'Утас' },
  { key:'fb',        label:'Facebook' },
  { key:'ig',        label:'Instagram' },
  { key:'messenger', label:'Messenger' },
  { key:'viber',     label:'Viber' },
  { key:'telegram',  label:'Telegram' },
  { key:'whatsapp',  label:'WhatsApp' },
  { key:'wechat',    label:'WeChat' }
];

/* ============== 12. ЗУУЧЛАГЧ ТАЛ — АНХДАГЧ ============== */
const DEFAULT_BROKER = {
  name: '"НЕО ЛИМИТ ПРОПЕРТИ" ХХК',
  registry: '7268833',
  address: 'Монгол Улс, Улаанбаатар хот, Сүхбаатар дүүрэг, 3-р хороо, Усны гудамж -1, Үндэсний хөрөнгө оруулалтын банкны төв байр, 201 тоот',
  contacts: {
    email: 'info@neolimit.mn',
    web:   'www.neolimit.mn',
    phone: '+976 55171010',
    fb:    'https://www.facebook.com/neolimitproperty/',
    ig:    'neolimitproperty',
    messenger: 'NEOMAP - НЕО мап',
    viber:     '+976 55171010',
    telegram:  '+976 55171010',
    whatsapp:  '+976 55171010',
    wechat:    '+976 55171010'
  },
  bankAccount: {
    holder: 'Нео лимит проперти ХХК',
    bank:   'Худалдаа хөгжлийн банк',
    accountNumber: 'MN490004000 440036376'
  }
};

/* Гэрээний дугаар — формат: ЗҮГ + YYYYMM + 4 оронтой ord */
function genContractNumber(date, ord) {
  const d = date ? new Date(date) : new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const n  = String(ord || 1).padStart(4, '0');
  return `ЗҮГ${yy}${mm}${n}`;
}

/* ============== 13. ЛИСТИНГ-ИЙН БҮРЭН СХЕМИЙН ХООСОН ТЕМПЛЭЙТ ============== */
function emptyListingDetail() {
  return {
    // ҮЛ ХӨДЛӨХИЙН ТӨРӨЛ, ЗОРИУЛАЛТ
    type: {
      primary: '', subtype: '', landIncluded: false, purpose: '',
      landRight: '', landRightExpiry: null, decisionBy: ''
    },
    // ХАЯГ, БАЙРШИЛ
    address: {
      country:'Монгол Улс', city:'Улаанбаатар', district:'', khoroo:'', zip:'',
      street:'', streetNumber:'', project:'', buildingNumber:'', buildingName:'',
      entranceName:'', entranceNumber:'', floor:'', unit:'',
      note:'', locationTag:'', parcelNumber:'',
      googleMapLink:'', lat:null, lng:null
    },
    // ҮЗҮҮЛЭЛТ
    specs: {
      basementFloors:0, aboveFloors:0, totalFloors:0,
      unitOnFloor:null, unitInternalFloors:1,
      floorHeight:null, ceilingHeight:null, unitsPerFloor:null,
      areaCert:null, areaInterior:null, areaBalcony:null,
      areaGarage:null, areaStorage:null,
      bedrooms:0, bathrooms:0, extraNote:'',
      rooms: [],
      windowCounts: { 'З':0,'ЗУ':0,'У':0,'БУ':0,'Б':0,'БХ':0,'Х':0,'ЗХ':0,'total':0 }
    },
    // ДЭД БҮТЭЦ
    infra: {
      greenCert: false,
      heating:   { primary:'', backup:'', note:'' },
      electric:  { primary:'', backup:'', note:'' },
      waterCold: { primary:'', backup:'', note:'' },
      waterHot:  { primary:'', backup:'', note:'' },
      sewage:    { primary:'', backup:'', note:'' },
      road:      { asphaltPct:0, dirtKm:0 },
      internet:  [],
      note: ''
    },
    // ҮНЭД БАГТСАН ЗҮЙЛС  -- furniture/equipment/extra: [{ item, has, note }]
    included: { furniture: [], equipment: [], extra: [] },
    excluded: '',
    // ХОТХОН/ТӨСЛИЙН ДУНДЫН
    community: { services: [], security: [], amenities: [], note: '' },
    // ТӨЛӨВ
    state: {
      commissioned:false, commissionYear:null, commissionDue:'',
      certStatus:'', certNumber:'', constructionPct:null,
      usage:'', collateral:'', collateralNote:'',
      current:'', interior:'', notes:''
    },
    // ҮНЭ
    pricing: {
      mode:'sale',
      primary:{ unitPrice:0, area:0, totalPrice:0 },
      floor:  { unitPrice:0, area:0, totalPrice:0 },
      vatIncluded:true, ebarimtVat:false,
      rentMinMonths:null, rentMaxMonths:null,
      extensionAllowed:false, extensionNote:'',
      startDate:'', startImmediate:false
    },
    // ТӨЛБӨРИЙН НӨХЦӨЛ
    payment: {
      forms: [],
      cashNow:         { active:false },
      cashSchedule:    { active:false, scheduleMonths:0, prepayMinPct:0 },
      barterOnly:      { active:false, barterPctMax:100 },
      barterCashNow:   { active:false, barterPctMax:50, prepayMinPct:50 },
      barterCashSched: { active:false, barterPctMax:0, scheduleMonths:0, prepayMinPct:0 },
      bankLoan:        { active:false },
      rentDeposit: 0,
      rentSchedule: []   // [{ months, discount, monthly, total, firstPay }]
    },
    // СУРТАЛЧИЛГААНЫ СУВАГ
    channels: { social: [], web: [], media: [], other: [] },
    // ЗУУЧЛАЛЫН ҮЙЛЧИЛГЭЭ
    brokerage: {
      rightForm:'open',
      startDate:'', durationMonths:12, endDate:'',
      convertToOpen:false, openDurationMonths:0,
      feePct:0, feeAgreedPct:0, feeUrgentExtra:0, feeEstimate:0,
      contractNumber:'',
      paymentAccount: DEFAULT_BROKER.bankAccount
    },
    // ТАЛУУД
    parties: {
      broker: DEFAULT_BROKER,
      client: {
        type:'individual', name:'', registry:'', address:'',
        contacts: {}, hasRepresentative:false, representative:null
      }
    },
    // ХАВСРАЛТ 01 - МЭДЭГДЭЛ, БАТАЛГАА, ЗӨВШӨӨРӨЛ
    declarations: {
      coOwnership:false, coOwnerConsentNeeded:false, coOwnerConsentAttached:false,
      coOwnerOthers:'',
      rights: {
        collateral:false, collateralNote:'',
        court:false, seizure:false,
        thirdParty:false, thirdPartyNote:''
      },
      permissions: {
        marketing:true, viewing:true, registryCheck:true,
        contact:true, subcontract:true, crmRecord:true,
        assetDb:true, otherAgentSale:true, collaboratorSale:true
      },
      viewingTerms: {
        workdays:true, weekends:true,
        advanceNoticeHours:null,
        representativeRequired:false, selfAccessAllowed:false,
        hourLimit:'', other:''
      }
    }
  };
}

/* Туслах: чекбоксын жагсаалтыг {item, has, note} массив болгож хувиргана */
function fillCheckList(itemNames, hasItems = []) {
  const set = new Set(hasItems);
  return itemNames.map(name => ({ item: name, has: set.has(name), note: '' }));
}

/* ============== 14. БҮРЭН ЖИШЭЭ — ГРИЙН ВИЛЛА ХОТХОН 204-Р БАЙР 301 ============== */
/* Гэрээний загвар дотроос авсан жинхэнэ хаяг, үнэ, эрхийн хэлбэр г.м. */
const SAMPLE_DETAIL_GREEN_VILLA = {
  type: {
    primary:'amini', subtype:'Single', landIncluded:true, purpose:'',
    landRight:'', landRightExpiry:null, decisionBy:'Байгаль орчны яам'
  },
  address: {
    country:'Монгол Улс', city:'Улаанбаатар', district:'Хан-Уул', khoroo:'11', zip:'17061',
    street:'Грийн Вилла', streetNumber:'1',
    project:'Грийн Вилла хотхон',
    buildingNumber:'204', buildingName:'',
    entranceName:'', entranceNumber:'',
    floor:'3', unit:'301',
    note:'Зайсан, Энканто молын ард, БНК ойролцоо',
    locationTag:'Зайсан',
    parcelNumber:'',
    googleMapLink:'https://maps.app.goo.gl/a4XV8WnXUETngymR6',
    lat:47.849552854889936, lng:107.0760397416879
  },
  specs: {
    basementFloors:1, aboveFloors:3, totalFloors:4,
    unitOnFloor:1, unitInternalFloors:4,
    floorHeight:3.2, ceilingHeight:2.8, unitsPerFloor:1,
    areaCert:320, areaInterior:290, areaBalcony:18, areaGarage:36, areaStorage:12,
    bedrooms:4, bathrooms:3, extraNote:'B1-д gym, sauna, агуулах',
    rooms: [
      { no:1,  floor:'B1', name:'B01', type:'B1', area:30, windows:[],          checked:true, note:'Gym' },
      { no:2,  floor:'B1', name:'B02', type:'B1', area:25, windows:[],          checked:true, note:'Sauna' },
      { no:3,  floor:'B1', name:'B03', type:'B1', area:18, windows:[],          checked:true, note:'Агуулах' },
      { no:4,  floor:'1',  name:'101', type:'1',  area:42, windows:['У','БУ'],  checked:true, note:'Зочин' },
      { no:5,  floor:'1',  name:'102', type:'1',  area:18, windows:['БУ'],      checked:true, note:'Гал тогоо' },
      { no:6,  floor:'1',  name:'103', type:'1',  area:14, windows:['Б'],       checked:true, note:'А/Ц өрөө' },
      { no:7,  floor:'1',  name:'104', type:'1',  area:12, windows:[],          checked:true, note:'Үүдэн' },
      { no:8,  floor:'1',  name:'105', type:'1',  area:16, windows:['Х'],       checked:true, note:'Ажлын өрөө' },
      { no:9,  floor:'2',  name:'201', type:'2',  area:28, windows:['Б','БХ'],  checked:true, note:'Мастер унтлага' },
      { no:10, floor:'2',  name:'202', type:'2',  area:18, windows:['Х'],       checked:true, note:'Унтлага 2' },
      { no:11, floor:'2',  name:'203', type:'2',  area:18, windows:['ЗХ'],      checked:true, note:'Унтлага 3' },
      { no:12, floor:'2',  name:'204', type:'2',  area:14, windows:['З'],       checked:true, note:'Унтлага 4' },
      { no:13, floor:'2',  name:'205', type:'2',  area:9,  windows:['У'],       checked:true, note:'А/Ц 2' },
      { no:14, floor:'2',  name:'206', type:'2',  area:7,  windows:[],          checked:true, note:'А/Ц 3' }
    ],
    windowCounts: { 'З':1,'ЗУ':2,'У':4,'БУ':1,'Б':2,'БХ':1,'Х':3,'ЗХ':1,'total':15 }
  },
  infra: {
    greenCert: false,
    heating:   { primary:'Төвлөрсөн (хотхоны)', backup:'Уурын зуух (нүүрсэн)', note:'' },
    electric:  { primary:'Төвийн 100%',         backup:'Ямар нэг нөөцлүүртэй', note:'' },
    waterCold: { primary:'Төвлөрсөн (хотхоны)', backup:'Гүний худаг',          note:'' },
    waterHot:  { primary:'Төвлөрсөн (хотхоны)', backup:'Бусад',                note:'' },
    sewage:    { primary:'Төвлөрсөн (хотхоны)', backup:'Септик',               note:'' },
    road:      { asphaltPct:100, dirtKm:0 },
    internet:  ['Univision'],
    note: ''
  },
  included: {
    furniture: fillCheckList(FURNITURE_GROUPS, FURNITURE_GROUPS),
    equipment: fillCheckList(EQUIPMENT_ITEMS, []),
    extra:     fillCheckList(EXTRA_EQUIPMENT, [])
  },
  excluded: '',
  community: {
    services: fillCheckList(COMMUNITY_SERVICES, [
      'Хүнсний дэлгүүр','Фитнес, иога, веллнесс','Спа',
      'Дундын өмчлөлийн цэвэрлэгээ','Клабхаус','Ресторан','Кофешоп',
      'Цахилгаан машины цэнэглэл станц'
    ]),
    security: fillCheckList(COMMUNITY_SECURITY, COMMUNITY_SECURITY),
    amenities: fillCheckList(COMMUNITY_AMENITIES, [
      'Төлбөртэй ил зогсоол','Төлбөргүй ил зогсоол','Төлбөртэй дулаан зогсоол',
      'Машингүй бүс','Машины автомат хаалт',
      'Хүүхдийн тоглоомын талбай','Ногоон байгууламж, нарлах салхилах талбай',
      'Лифт – зорчигчийн 24/7','Лифт – ачааны 24/7'
    ]),
    note: ''
  },
  state: {
    commissioned:false, commissionYear:null, commissionDue:'2026.IV',
    certStatus:'Гэрчилгээгүй – Баригдаж байгаа, захиалгын гэрээтэй',
    certNumber:'', constructionPct:null,
    usage:'Цоо шинэ, ашиглаж байгаагүй',
    collateral:'Ямар нэг барьцаанд байхгүй', collateralNote:'',
    current:'Сул, чөлөөтэй байгаа',
    interior:'Дотор засвар хийгдэж байгаа',
    notes:''
  },
  pricing: {
    mode:'sale',
    primary: { unitPrice:23437500, area:320, totalPrice:7500000000 },
    floor:   { unitPrice:21875000, area:320, totalPrice:7000000000 },
    vatIncluded:true, ebarimtVat:false,
    rentMinMonths:null, rentMaxMonths:null,
    extensionAllowed:true, extensionNote:'',
    startDate:'2026-08-01', startImmediate:false
  },
  payment: {
    forms: ['cash_now'],
    cashNow:         { active:true },
    cashSchedule:    { active:false, scheduleMonths:0, prepayMinPct:0 },
    barterOnly:      { active:false, barterPctMax:100 },
    barterCashNow:   { active:false, barterPctMax:50, prepayMinPct:50 },
    barterCashSched: { active:false, barterPctMax:0, scheduleMonths:0, prepayMinPct:0 },
    bankLoan:        { active:false },
    rentDeposit: 4000000,
    rentSchedule: [
      { months:3,  discount:0,  monthly:4000000, total:12000000, firstPay:16000000 },
      { months:4,  discount:0,  monthly:4000000, total:16000000, firstPay:20000000 },
      { months:6,  discount:5,  monthly:3800000, total:22800000, firstPay:26800000 },
      { months:12, discount:10, monthly:3600000, total:43200000, firstPay:47200000 }
    ]
  },
  channels: {
    social: ['Фэйсбүүк','Инстаграм','X (twitter)','Threads'],
    web:    ['unegui.mn','neolimit.mn','Бусад web хуудас, платформ'],
    media:  ['Сонин, сэтгүүл','Телевиз','FM радио'],
    other:  ['Утсаар хийх дуудлага (cold call)','Масс и-мэйл','Масс смс',
             'Төрөл бүрийн event','Биечилсэн болон цахим уулзалт']
  },
  brokerage: {
    rightForm:'open',
    startDate:'2026-05-01', durationMonths:12, endDate:'2027-04-30',
    convertToOpen:true, openDurationMonths:6,
    feePct:2.64, feeAgreedPct:3.30, feeUrgentExtra:1.00, feeEstimate:105000000,
    contractNumber:'ЗҮГ2026050001',
    paymentAccount: DEFAULT_BROKER.bankAccount
  },
  parties: {
    broker: DEFAULT_BROKER,
    client: {
      type:'individual',
      name:'Б. БАТЖАРГАЛ',
      registry:'ДЮ62031217',
      address:'Монгол Улс, Улаанбаатар, Хан-Уул дүүрэг, 11-р хороо, Грийн Вилла хотхон, 204-р байр, 301 тоот',
      contacts: {
        email:'client@example.com', phone:'99119935',
        fb:'https://www.facebook.com/XXX', ig:'xxx.yyy',
        viber:'99119935', telegram:'99119935', whatsapp:'99119935', wechat:'99119935'
      },
      hasRepresentative:false, representative:null
    }
  },
  declarations: {
    coOwnership:false, coOwnerConsentNeeded:false, coOwnerConsentAttached:false,
    coOwnerOthers:'',
    rights: {
      collateral:false, collateralNote:'',
      court:false, seizure:false,
      thirdParty:false, thirdPartyNote:''
    },
    permissions: {
      marketing:true, viewing:true, registryCheck:true,
      contact:true, subcontract:true, crmRecord:true,
      assetDb:true, otherAgentSale:true, collaboratorSale:true
    },
    viewingTerms: {
      workdays:true, weekends:true,
      advanceNoticeHours:null,
      representativeRequired:false, selfAccessAllowed:true,
      hourLimit:'', other:''
    }
  }
};

/* ============== 15. LISTING ↔ DETAIL ХАМААРАЛ ============== */
/* Хуучин LISTING-үүдэд detail байхгүй бол legacy талбараас үүсгэж буцаана. */
const LISTING_DETAILS = {
  // Грийн Вилла демо — шинэ ID 100-р оруулав. LISTINGS-д ч мөн нэмэгдсэн.
  100: SAMPLE_DETAIL_GREEN_VILLA
};

/* Хуучин LISTING-ийг detail руу хөрвүүлэх (хэсэгчилсэн) */
function legacyToDetail(l) {
  const d = emptyListingDetail();
  d.address.district = l.district || '';
  d.address.khoroo   = l.khoroo   || '';
  d.address.project  = l.khotkhon || '';
  // floor: "8/22" эсвэл "Хаус"
  if (l.floor && typeof l.floor === 'string' && l.floor.includes('/')) {
    const [unitFloor, total] = l.floor.split('/');
    d.address.floor    = unitFloor;
    d.specs.totalFloors = parseInt(total) || 0;
  }
  d.specs.areaCert = l.area;
  d.specs.bedrooms = l.rooms;
  d.state.commissionYear = l.year;
  d.state.commissioned   = !!l.year;
  d.pricing.mode = l.mode;
  d.pricing.primary.area = l.area;
  d.pricing.primary.totalPrice = l.price;
  d.pricing.primary.unitPrice  = l.area ? Math.round(l.price / l.area) : 0;
  // Зар жил >= 2018 бол төвийн халаалттай гэж тооцох
  d.infra.heating.primary = (l.year >= 2018) ? 'Төвлөрсөн (хотхоны)' : 'Бие даасан';
  return d;
}

/* Дэлгэрэнгүй авах — байхгүй бол legacy-аас үүсгэнэ */
function getListingDetail(id) {
  if (LISTING_DETAILS[id]) return LISTING_DETAILS[id];
  const l = getListing(id);
  return l ? legacyToDetail(l) : null;
}

/* ============== 16. БҮРЭН СХЕМТЭЙ ЖИШЭЭ ЛИСТИНГ — LISTINGS-Д НЭМНЭ ============== */
/* Хуучин LISTINGS массивыг өөрчлөхгүй — энд тусад нь push хийнэ.
   Ингэснээр UI-ийн жагсаалт, шүүлтүүр гэх мэт legacy логик ажиллах. */
LISTINGS.push({
  id: 100, mode: 'sale',
  district: 'Хан-Уул', khoroo: '11', khotkhon: 'Грийн Вилла хотхон',
  rooms: 4, area: 320, floor: '3/4', year: 2026,
  price: 7500000000, photos: 19, status: 'new', listedDays: 1,
  viewCount: 12, viewingCount: 1,
  features: ['Шинэ','Single','Зайсан','Premium хотхон','Хувийн gym','Sauna'],
  agentId: 1, lat: 0.28, lng: 0.78,
  desc: 'Грийн Вилла хотхон 204-р байр 301 тоот. Зайсаны premium амины орон сууц. 320м² 4 өрөө, B1 давхарт gym+sauna+агуулах. 7.5 тэрбум, доод үнэ 7.0 тэрбум. Гэрчилгээгүй – захиалгын гэрээтэй, 2026.IV улирлын ашиглалт.'
});
