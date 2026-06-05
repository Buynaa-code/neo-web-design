/* ============== NEOMAP LISTINGS + AGENTS + GEO + BANKS ============== */

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
