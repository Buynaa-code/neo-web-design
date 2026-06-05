/* ============== NEOMAP CONSTANTS — pure lookup data ============== */

/* ============== ORLOO DATA ============== */

const DISTRICTS = ['Хан-Уул', 'Баянзүрх', 'Сүхбаатар', 'Чингэлтэй', 'Сонгинохайрхан', 'Налайх', 'Баянгол', 'Багануур', 'Багахангай'];

/* ============== ӨРӨӨНИЙ ТӨРӨЛ (room types lookup) — Wizard Excel sheet 2 ============== */
/* Орон сууц, амины сууц, оффис, үйлчилгээний барилгад ашиглах өрөөнүүд.
   Tag-уудыг өрөөний нэрнээс хамаарч динамикаар үзүүлнэ. */
const ROOM_TAGS_BY_TYPE = {
  generic:  [],
  bedroom:  ['Хувцасны өрөөтэй', 'Тагттай', 'Террастай', 'Ариун цэврийн өрөөтэй'],
  master:   ['Хувцасны өрөөтэй', 'Тагттай', 'Террастай', 'Ажлын хэсэгтэй'],
  bath:     ['Угаалтуур', 'Суултуур', 'Душ', 'Ванн', 'Жакуза', 'Сауна', 'Гоо сайхны хэсэг', 'Цонхтой'],
  livingrm: ['Тагттай', 'Террастай'],
  kitchen:  ['Цонхтой'],
  dining:   ['Тагттай', 'Террастай'],
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
  { key: 'family',        label: 'Гэр бүлийн хэсэг',            tagGroup: 'generic',  group: 'living' },
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
  { key: 'maid',          label: 'Үйлчлэгчийн өрөө',            tagGroup: 'generic',  group: 'service' },
  { key: 'waiting',       label: 'Хүлээлгийн өрөө',             tagGroup: 'generic',  group: 'service' },
  { key: 'smoking',       label: 'Тамхины өрөө',                tagGroup: 'generic',  group: 'leisure' },
];

/* Цонхны 8 чиглэл — талбайн хажуудаа цонхны тоог оруулна */
const WIND_DIRECTIONS = [
  { key: 'N',  short: 'З',  label: 'Зүүн' },
  { key: 'NE', short: 'ЗУ', label: 'Зүүн-урагш' },
  { key: 'E',  short: 'У',  label: 'Урд' },
  { key: 'SE', short: 'БУ', label: 'Баруун-урагш' },
  { key: 'S',  short: 'Б',  label: 'Баруун' },
  { key: 'SW', short: 'БХ', label: 'Баруун-хойш' },
  { key: 'W',  short: 'Х',  label: 'Хойд' },
  { key: 'NW', short: 'ЗХ', label: 'Зүүн-хойш' },
];

const KHOTKHON = [
  'Time Tower', 'Encanto', 'Olympic Residence', 'Twin Tower', 'Energy Residence',
  'Sky Tower', 'Buyant-Ukhaa-2', 'Tokyo Residence', 'Global Garden', 'Riverside',
  'Khan Palace', 'Royal County', 'Central Tower'
];

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

