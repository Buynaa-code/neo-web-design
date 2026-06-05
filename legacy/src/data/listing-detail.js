/* ============== NEOMAP LISTING DETAIL — empty/sample/getListingDetail ============== */

function genContractNumber(date, ord) {
  const d = date ? new Date(date) : new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const n  = String(ord || 1).padStart(4, '0');
  return `ЗҮГ${yy}${mm}${n}`;
}


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
function getListingDetail(input) {
  const l = input && typeof input === 'object' ? input : getListing(input);
  const id = l ? l.id : input;
  if (l && l.detail) return l.detail;
  if (LISTING_DETAILS[id]) return LISTING_DETAILS[id];
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
