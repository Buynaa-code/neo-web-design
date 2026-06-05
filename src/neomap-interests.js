/* ============== USER INTERESTS — Wizard + Match + Feed ============== */
/* state.userInterests схем:
   {
     lifestyle: 'family' | 'young-pro' | 'student' | 'investor',
     mode: 'sale' | 'rent',
     budgetMin: number | null,
     budgetMax: number | null,
     bedrooms: [1,2,3,4],   // унтлагын өрөөний тоо (1 = 2-өрөө, 2 = 3-өрөө г.м, 4 = 4+ өрөө)
     bathroomsMin: 0|1|2|3, // нойлын хамгийн бага тоо (0 = хамаагүй)
     office: boolean,       // ажлын өрөө заавал байх уу
     districts: ['Хан-Уул', ...],
     mustHaves: ['school','metro','park','newproject','view','elevator','parking','quiet','pet','furnished'],
     vibe: 'downtown' | 'quiet-street' | 'park-near' | 'new-area',
     updatedAt: ISO string
   }
*/

const INTEREST_LIFESTYLES = [
  {
    key: 'family',
    icon: 'users',
    label: 'Гэр бүл',
    sub: '2-3 унтл., сургууль ойр, цэцэрлэг',
    presetBedrooms: [2, 3],
    presetBathroomsMin: 2,
    presetOffice: false,
    presetMustHaves: ['school', 'park', 'quiet', 'parking'],
  },
  {
    key: 'young-pro',
    icon: 'briefcase',
    label: 'Залуу мэргэжилтэн',
    sub: '1 унтл., хотын төв, шинэ барилга',
    presetBedrooms: [1],
    presetBathroomsMin: 1,
    presetOffice: true,
    presetMustHaves: ['newproject', 'furnished'],
  },
  {
    key: 'student',
    icon: 'graduation-cap',
    label: 'Оюутан',
    sub: 'Хямд, сургуулийн ойролцоо',
    presetBedrooms: [1],
    presetBathroomsMin: 1,
    presetOffice: false,
    presetMustHaves: ['school', 'furnished'],
  },
  {
    key: 'investor',
    icon: 'trending-up',
    label: 'Хөрөнгө оруулагч',
    sub: 'Үнэ цэн өсөх, шинэ хороолол',
    presetBedrooms: [1, 2],
    presetBathroomsMin: 0,
    presetOffice: false,
    presetMustHaves: ['newproject', 'view'],
  },
];

/* Бэлэн листинг дээр унтлагын өрөө/нойл/ажлын өрөөний тоо байхгүй учир хэлбэрээр нь тооцно.
   Монгол практик: rooms (нийт өрөө) = унтлагын өрөө + зочны өрөө.
     1 өрөө = студио (унтлага 0), 2 өрөө = 1 унтлага, 3 өрөө = 2 унтлага, 4 өрөө = 3 унтлага ...
   Нойлыг талбайн хэмжээгээр, ажлын өрөөг features-ээс баримжаалж дүгнэнэ. */
function getListingDetails(l) {
  if (!l) return { bedrooms: 0, bathrooms: 1, hasOffice: false };
  const rooms = Number(l.rooms) || 1;
  const area = Number(l.area) || 0;
  const bedrooms = Math.max(0, rooms - 1);
  let bathrooms;
  if (area >= 150) bathrooms = l.id % 2 === 0 ? 3 : 2;
  else if (area >= 100) bathrooms = 2;
  else if (area >= 70) bathrooms = l.id % 3 === 0 ? 2 : 1;
  else bathrooms = 1;
  const feats = (l.features || []).join(' ').toLowerCase();
  const desc = String(l.desc || '').toLowerCase();
  const hasOffice = /ажлын|кабинет|office/.test(feats + ' ' + desc) || (rooms >= 4 && area >= 130);
  return { bedrooms, bathrooms, hasOffice };
}
window.getListingDetails = getListingDetails;

const INTEREST_MUST_HAVES = [
  { key: 'school', icon: 'school', label: 'Сургууль ойр' },
  { key: 'park', icon: 'trees', label: 'Цэцэрлэгт хүрээлэн' },
  { key: 'newproject', icon: 'sparkles', label: 'Шинэ барилга' },
  { key: 'view', icon: 'mountain', label: 'Сайхан үзэмж' },
  { key: 'elevator', icon: 'arrow-up', label: 'Лифттэй' },
  { key: 'parking', icon: 'square-parking', label: 'Зогсоол' },
  { key: 'quiet', icon: 'volume-x', label: 'Чимээгүй гудамж' },
  { key: 'pet', icon: 'paw-print', label: 'Тэжээвэртэй' },
  { key: 'furnished', icon: 'sofa', label: 'Тавилгатай' },
];

const INTEREST_VIBES = [
  { key: 'downtown', icon: 'building-2', label: 'Хотын төв', sub: 'Идэвхтэй амьдрал, дэлгүүр, ресторан' },
  { key: 'quiet-street', icon: 'leaf', label: 'Чимээгүй гудамж', sub: 'Тайван, амралттай орчин' },
  { key: 'park-near', icon: 'trees', label: 'Цэцэрлэгт хүрээлэнтэй', sub: 'Алхах, спортоор хичээллэх боломж' },
  { key: 'new-area', icon: 'construction', label: 'Шинэ хороолол', sub: 'Орчин үеийн дэд бүтэц' },
];

/* ============== ҮХ-ИЙН ЗОРИУЛАЛТ — Excel: МИНИЙ ХҮСЭЛ Алхам 02–03 ============== */
const INTEREST_PURPOSES = [
  { key: 'any',          icon: 'compass',          label: 'Хамаагүй',                hint: 'Бүх төрлийг харах',
    subTypes: [] },
  { key: 'apartment',    icon: 'building-2',       label: 'Орон сууц',               hint: 'Олон давхар, апартмент',
    subTypes: [
      { key: 'simple',    label: 'Энгийн' },
      { key: 'duplex',    label: 'Дуплекс' },
      { key: 'penthouse', label: 'Пентхаус' },
      { key: 'other',     label: 'Бусад' },
    ] },
  { key: 'house',        icon: 'home',             label: 'Амины сууц',              hint: 'Single / Twin / Town house',
    subTypes: [
      { key: 'single', label: 'Single house' },
      { key: 'twin',   label: 'Twin house' },
      { key: 'town',   label: 'Town house' },
      { key: 'multi',  label: 'Multihouse' },
      { key: 'other',  label: 'Бусад' },
    ] },
  { key: 'office',       icon: 'briefcase',        label: 'Оффис',                   hint: 'Ажлын байр',
    subTypes: [
      { key: 'partial', label: 'Давхрын хэсэг, өрөө' },
      { key: 'floor',   label: 'Давхар бүхлээрээ' },
      { key: 'whole',   label: 'Обьект бүхлээрээ' },
    ] },
  { key: 'commercial',   icon: 'shopping-bag',     label: 'Худалдаа, үйлчилгээ',     hint: 'Дэлгүүр, ресторан, салон',
    subTypes: [
      { key: 'partial', label: 'Давхрын хэсэг, өрөө' },
      { key: 'floor',   label: 'Давхар бүхлээрээ' },
      { key: 'whole',   label: 'Обьект бүхлээрээ' },
    ] },
  { key: 'industrial',   icon: 'factory',          label: 'Аж үйлдвэрийн обьект',    hint: 'Үйлдвэр, цех',
    subTypes: [] },
  { key: 'garage',       icon: 'square-parking',   label: 'Авто дулаан зогсоол',     hint: 'Орон сууцны зогсоолын блок',
    subTypes: [
      { key: 'inside',  label: 'Орон сууц/Оффисын доор' },
      { key: 'block',   label: 'Тусдаа зогсоолын блок' },
    ] },
  { key: 'storage',      icon: 'package',          label: 'Агуулах',                 hint: 'Гараж/орон сууцны доторх',
    subTypes: [] },
  { key: 'fenced-house', icon: 'fence',            label: 'Хашаа байшин',            hint: 'Газартай',
    subTypes: [] },
  { key: 'cottage-land', icon: 'tent-tree',        label: 'Зуслан (газартай)',       hint: 'Зуслангийн бүсэд, газартай',
    subTypes: [] },
  { key: 'cottage-no',   icon: 'tent',             label: 'Зуслан (газаргүй)',       hint: 'Зөвхөн байшин',
    subTypes: [] },
  { key: 'land',         icon: 'map',              label: 'Газар',                   hint: 'Барилгатай эсвэл хоосон газар',
    subTypes: [] },
  { key: 'other',        icon: 'square-dashed',    label: 'Бусад',                   hint: 'Тусгай зориулалттай',
    subTypes: [] },
];

/* ============== ҮЛ ХӨДЛӨХИЙН ТӨЛӨВ — Excel: МИНИЙ ХҮСЭЛ Алхам 09 ============== */
const INTEREST_CONDITIONS = [
  { key: 'commissioned',  icon: 'badge-check',  label: 'Ашиглалтад орсон',           groupKey: 'usage' },
  { key: 'pre-comm',      icon: 'construction', label: 'Удахгүй ашиглалтад орох',    groupKey: 'usage' },
  { key: 'certified',     icon: 'file-check',   label: 'Гэрчилгээтэй',               groupKey: 'cert' },
  { key: 'pre-cert',      icon: 'file-clock',   label: 'Гэрчилгээ удахгүй',          groupKey: 'cert' },
  { key: 'brand-new',     icon: 'sparkle',      label: 'Цоо шинэ',                   groupKey: 'history' },
  { key: 'used',          icon: 'history',      label: 'Ашиглагдаж байсан',          groupKey: 'history' },
  { key: 'no-collateral', icon: 'shield-check', label: 'Барьцаагүй',                 groupKey: 'legal' },
  { key: 'vacant',        icon: 'door-open',    label: 'Сул, чөлөөтэй',              groupKey: 'occupy' },
  { key: 'fresh-reno',    icon: 'paintbrush',   label: 'Сүүлд заслагдсан',           groupKey: 'reno' },
  { key: 'no-reno',       icon: 'hammer',       label: 'Засваргүй (өөрөө хийнэ)',    groupKey: 'reno' },
];

/* ============== МЭДЭГДЭЛ — Excel: МИНИЙ ХҮСЭЛ Алхам 13 ============== */
const INTEREST_NOTIF_CHANNELS = [
  { key: 'app',   icon: 'smartphone',     label: 'Аппликейшнээр',  sub: 'Push notification' },
  { key: 'email', icon: 'mail',           label: 'И-мэйл',          sub: 'Өдөрт нэг дайджест' },
  { key: 'sms',   icon: 'message-square', label: 'SMS',             sub: 'Утсан дээр шууд' },
  { key: 'call',  icon: 'phone-call',     label: 'Дуудлагаар',      sub: 'Зөвхөн чухал тохиолдолд' },
];

/* ============== MATCH SCORING ============== */
/* Буцаах: { score: 0..100, reasons: [{ icon, text, kind:'good'|'soft' }] } */
function computeMatchScore(listing, interests) {
  if (!listing || !interests || !interests.lifestyle) return { score: 0, reasons: [] };
  let score = 0;
  const reasons = [];

  // Mode (sale/rent) — заавал тааруулах нөхцөл, тааралцахгүй бол 0 буцаана
  if (interests.mode && listing.mode !== interests.mode) {
    return { score: 0, reasons: [] };
  }

  // 1. District (30 oноо)
  const districts = interests.districts || [];
  if (districts.length === 0) {
    score += 15; // нейтрал — сонгоогүй бол хагас
  } else if (districts.includes(listing.district)) {
    score += 30;
    reasons.push({ icon: 'map-pin', text: `${listing.district} дүүрэгт`, kind: 'good' });
  }

  // 2. Budget (25 оноо)
  const bMin = interests.budgetMin,
    bMax = interests.budgetMax;
  if (bMax == null && bMin == null) {
    score += 12; // нейтрал
  } else {
    const inMin = bMin == null || listing.price >= bMin;
    const inMax = bMax == null || listing.price <= bMax;
    if (inMin && inMax) {
      score += 25;
      reasons.push({ icon: 'banknote', text: 'Танай төсөвт тохирно', kind: 'good' });
    } else if (!inMax && bMax && listing.price <= bMax * 1.15) {
      score += 12; // 15% хүртэл хэтэрсэн — хагас
      reasons.push({ icon: 'banknote', text: 'Төсвөөс бага зэрэг дээгүүр', kind: 'soft' });
    }
  }

  // 3. Bedrooms / Bathrooms / Office (нийт 21 оноо)
  const details = getListingDetails(listing);
  // 3a. Bedrooms (12 оноо) — 4 = "4+" гэсэн утгатай
  const bedrooms = interests.bedrooms || [];
  if (bedrooms.length === 0) {
    score += 6;
  } else if (bedrooms.includes(details.bedrooms) || (bedrooms.includes(4) && details.bedrooms >= 4)) {
    score += 12;
    const label = details.bedrooms === 0 ? 'Студио' : `${details.bedrooms} унтлагатай`;
    reasons.push({ icon: 'bed-double', text: label, kind: 'good' });
  }
  // 3b. Bathrooms (5 оноо)
  const bathMin = interests.bathroomsMin || 0;
  if (bathMin === 0) {
    score += 2;
  } else if (details.bathrooms >= bathMin) {
    score += 5;
    if (reasons.length < 4) reasons.push({ icon: 'bath', text: `${details.bathrooms} нойл`, kind: 'good' });
  }
  // 3c. Office (4 оноо)
  if (interests.office) {
    if (details.hasOffice) {
      score += 4;
      if (reasons.length < 4) reasons.push({ icon: 'briefcase', text: 'Ажлын өрөөтэй', kind: 'good' });
    }
  } else {
    score += 2;
  }

  // 4. Must-haves (30 оноо) — feature matching эзлэх хувиар тооцно
  const mh = interests.mustHaves || [];
  if (mh.length === 0) {
    score += 15;
  } else {
    const features = (listing.features || []).map((f) => String(f).toLowerCase());
    const desc = String(listing.desc || '').toLowerCase();
    const haystack = features.join(' ') + ' ' + desc;
    let matched = 0;
    const featureMap = {
      school: ['сургууль'],
      park: ['цэцэрлэгт', 'хүрээлэн', 'парк'],
      newproject: ['шинэ', 'новый'],
      view: ['харц', 'үзэмж', 'уулын', 'голын'],
      elevator: ['лифт'],
      parking: ['зогсоол', 'гараж'],
      quiet: ['чимээгүй', 'тайван'],
      pet: ['тэжээвэр'],
      furnished: ['тавилга'],
    };
    mh.forEach((key) => {
      const terms = featureMap[key] || [];
      if (terms.some((t) => haystack.includes(t))) {
        matched++;
        const meta = INTEREST_MUST_HAVES.find((x) => x.key === key);
        if (meta && reasons.length < 4) reasons.push({ icon: meta.icon, text: meta.label, kind: 'good' });
      }
      // 'newproject' үед year-ийг ч шалгах
      if (key === 'newproject' && listing.year && listing.year >= 2021) {
        if (!terms.some((t) => haystack.includes(t))) {
          matched++;
          if (reasons.length < 4) reasons.push({ icon: 'sparkles', text: 'Шинэ барилга', kind: 'good' });
        }
      }
    });
    score += Math.round((matched / mh.length) * 30);
  }

  // 5. Bonus: status — hot/new онцлох
  if (listing.status === 'hot') score += 3;
  if (listing.status === 'new') score += 2;
  if (listing.status === 'drop') {
    score += 2;
    if (reasons.length < 4) reasons.push({ icon: 'trending-down', text: 'Үнэ буурсан', kind: 'soft' });
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}
window.computeMatchScore = computeMatchScore;

/* Listings-ийг match score-оор эрэмбэлж буцаана */
function matchedListings(opts = {}) {
  const interests = state.userInterests;
  if (!interests) return [];
  const minScore = opts.minScore != null ? opts.minScore : 40;
  const excludeDismissed = opts.excludeDismissed !== false;
  const dismissed = new Set(state.interestsDismissedIds || []);
  const source = (typeof LISTINGS !== 'undefined' ? LISTINGS : []).filter((l) => l.status !== 'sold');
  return source
    .map((l) => ({ listing: l, ...computeMatchScore(l, interests) }))
    .filter((x) => x.score >= minScore)
    .filter((x) => !excludeDismissed || !dismissed.has(x.listing.id))
    .sort((a, b) => b.score - a.score);
}
window.matchedListings = matchedListings;

/* Шинэ зарын тоо badge-д харуулна (хадгалаагүй, шинэ + match >= 65) */
function newMatchCount() {
  if (!state.userInterests) return 0;
  const dismissed = new Set(state.interestsDismissedIds || []);
  const list = typeof LISTINGS !== 'undefined' ? LISTINGS : [];
  const savedSet = typeof SAVED_IDS !== 'undefined' ? SAVED_IDS : null;
  return list
    .filter((l) => l.status === 'new' || (l.listedDays != null && l.listedDays <= 7))
    .filter((l) => !dismissed.has(l.id))
    .filter((l) => !(savedSet && savedSet.has(l.id)))
    .map((l) => computeMatchScore(l, state.userInterests))
    .filter((m) => m.score >= 65).length;
}
window.newMatchCount = newMatchCount;

/* Behavior learning — хадгалсан зараас implicit interests суурь нь болно */
function inferInterestsFromBehavior() {
  const savedSet = typeof SAVED_IDS !== 'undefined' ? SAVED_IDS : null;
  const list = typeof LISTINGS !== 'undefined' ? LISTINGS : null;
  if (!savedSet || !list) return null;
  const savedListings = list.filter((l) => savedSet.has(l.id));
  if (savedListings.length < 2) return null;
  // Хамгийн их давтагдсан district, mode, rooms, дунд үнэ
  const tally = (arr) =>
    arr.reduce((m, v) => {
      m[v] = (m[v] || 0) + 1;
      return m;
    }, {});
  const topKeys = (obj, n) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map((x) => x[0]);
  const distTally = tally(savedListings.map((l) => l.district));
  const roomsTally = tally(savedListings.map((l) => l.rooms));
  const modeTally = tally(savedListings.map((l) => l.mode));
  const avgPrice = savedListings.reduce((s, l) => s + l.price, 0) / savedListings.length;
  return {
    districts: topKeys(distTally, 2),
    rooms: topKeys(roomsTally, 2).map(Number),
    mode: topKeys(modeTally, 1)[0] || 'sale',
    avgPrice,
  };
}
window.inferInterestsFromBehavior = inferInterestsFromBehavior;

/* ============== HEADER BADGE — refresh ============== */
function refreshInterestsBadge() {
  const btn = document.getElementById('taste-nav-btn');
  const badge = document.getElementById('taste-nav-badge');
  if (!btn || !badge) return;
  if (!state.userInterests) {
    // Setup хийгээгүй — pulse "!" badge
    badge.style.display = 'inline-flex';
    badge.className = 'taste-badge new';
    badge.textContent = '!';
    btn.title = 'Хүслээ тохируулж эхэл';
  } else {
    const n = newMatchCount();
    if (n > 0) {
      badge.style.display = 'inline-flex';
      badge.className = 'taste-badge';
      badge.textContent = String(n);
      btn.title = `${n} шинэ тохирох зар`;
    } else {
      badge.style.display = 'none';
      btn.title = 'Миний хүсэлд тохирсон зар';
    }
  }
}
window.refreshInterestsBadge = refreshInterestsBadge;

/* ============== ENTRY: openInterests() ============== */
function openInterests() {
  if (!(state.userInterestsList || []).length) {
    startInterestsWizard('edit');
  } else {
    goTo('interests');
  }
}
window.openInterests = openInterests;

/* Шинэ профайл нэмэх оролдлого — free + ≥1 бол upgrade modal */
function tryAddInterestsProfile() {
  const list = state.userInterestsList || [];
  if (state.userTier !== 'pro' && list.length >= 1) {
    showInterestsUpgradeModal();
    return;
  }
  startInterestsWizard('create');
}
window.tryAddInterestsProfile = tryAddInterestsProfile;

function switchInterestsProfile(id) {
  state.activeInterestsId = id;
  syncActiveInterests();
  saveInterests();
  refreshInterestsBadge();
  renderAppScreen('interests');
}
window.switchInterestsProfile = switchInterestsProfile;

function removeInterestsProfile(id) {
  const list = state.userInterestsList || [];
  if (list.length <= 1) {
    showToast('Сүүлчийн профайлыг устгах боломжгүй', 'info', { duration: 1500 });
    return;
  }
  const p = list.find((x) => x.id === id);
  if (!confirm(`"${p ? p.name : 'Профайл'}"-ыг устгах уу?`)) return;
  state.userInterestsList = list.filter((x) => x.id !== id);
  if (state.activeInterestsId === id) {
    state.activeInterestsId = state.userInterestsList[0].id;
  }
  syncActiveInterests();
  saveInterests();
  refreshInterestsBadge();
  renderAppScreen('interests');
  showToast('Профайл устгагдлаа', 'info', { duration: 1500 });
}
window.removeInterestsProfile = removeInterestsProfile;

/* ============== WIZARD ============== */
function startInterestsWizard(mode) {
  // mode: 'edit' = идэвхтэй профайл засах / эхний удаа тохируулах; 'create' = шинэ профайл нэмэх
  const m = mode || 'edit';
  // Дэлгэрэнгүй шалгалт нь tryAddInterestsProfile дотор хийгдэнэ, гэхдээ давтан шалгая
  if (m === 'create' && state.userTier !== 'pro' && (state.userInterestsList || []).length >= 1) {
    showInterestsUpgradeModal();
    return;
  }
  state.interestsWizardMode = m;
  // Behavior learning — хадгалсан зараас урьдчилсан утга
  const inferred = inferInterestsFromBehavior();
  // 'edit' үед одоогийн идэвхтэй профайлаас уншина; 'create' үед шинээр эхэлнэ
  const cur = m === 'edit' ? state.userInterests : null;
  // inferred.rooms нь нийт өрөө учир унтлагын өрөө руу хөрвүүлнэ
  const inferredBedrooms = inferred ? [...new Set(inferred.rooms.map((r) => Math.max(1, Math.min(4, r - 1))))] : [];
  state.interestsWizardStep = 1;
  state.interestsWizardDraft = {
    lifestyle: cur ? cur.lifestyle : null,
    purpose: cur && cur.purpose ? cur.purpose : 'any',
    subTypes: cur && cur.subTypes ? [...cur.subTypes] : [],
    mode: cur ? cur.mode : inferred ? inferred.mode : state.mode || 'sale',
    budgetMin: cur ? cur.budgetMin : null,
    budgetMax: cur ? cur.budgetMax : inferred ? Math.round(inferred.avgPrice * 1.2) : null,
    budgetAny: cur && cur.budgetAny ? true : false,
    bedrooms: cur && cur.bedrooms ? [...cur.bedrooms] : inferredBedrooms,
    bathroomsMin: cur && cur.bathroomsMin != null ? cur.bathroomsMin : null,
    office: cur && cur.office != null ? cur.office : null,
    districts: cur && cur.districts ? [...cur.districts] : inferred ? inferred.districts : [],
    mustHaves: cur && cur.mustHaves ? [...cur.mustHaves] : [],
    conditions: cur && cur.conditions ? [...cur.conditions] : [],
    vibe: cur ? cur.vibe : null,
    notifChannels: cur && cur.notifChannels ? [...cur.notifChannels] : ['app'],
  };
  renderWizardModal();
}
window.startInterestsWizard = startInterestsWizard;

function renderWizardModal() {
  const step = state.interestsWizardStep;
  const draft = state.interestsWizardDraft;
  const total = 9;
  const progress = Math.round(((step - 1) / total) * 100);
  const stepBody = (() => {
    if (step === 1) return wizardStepLifestyle(draft);
    if (step === 2) return wizardStepPurpose(draft);
    if (step === 3) return wizardStepBudget(draft);
    if (step === 4) return wizardStepRooms(draft);
    if (step === 5) return wizardStepDistricts(draft);
    if (step === 6) return wizardStepMustHaves(draft);
    if (step === 7) return wizardStepCondition(draft);
    if (step === 8) return wizardStepVibe(draft);
    if (step === 9) return wizardStepNotifications(draft);
    return '';
  })();
  const canNext = (() => {
    if (step === 1) return !!draft.lifestyle;
    if (step === 2) return !!draft.purpose;
    if (step === 3) return draft.budgetAny || (draft.budgetMax != null && draft.budgetMax > 0) || draft.budgetMin != null;
    if (step === 4) return (draft.bedrooms && draft.bedrooms.length > 0) || draft.bathroomsMin === 0;
    if (step === 5) return true; // дүүрэг алгасаж болно — бүх дүүрэг гэж тооцно
    if (step === 6) return true; // must-haves алгасаж болно
    if (step === 7) return true; // condition алгасаж болно
    if (step === 8) return !!draft.vibe;
    if (step === 9) return (draft.notifChannels || []).length > 0;
    return false;
  })();
  const isSkippable = [5, 6, 7].includes(step);

  openModal(
    `
    <div style="padding: 0; width: 100%;">
      <!-- Header: progress + step label + close -->
      <div style="padding: 18px 24px 14px 24px; border-bottom: 1px solid var(--border);">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--gold-brand)); display:inline-flex;align-items:center;justify-content:center;">
              <i data-lucide="sparkles" class="w-4 h-4" style="color: #fff;"></i>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-3); font-weight: 600; letter-spacing: .08em; text-transform: uppercase;">Алхам ${step} / ${total}</div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text);">${stepTitle(step)}</div>
            </div>
          </div>
          <button onclick="cancelInterestsWizard()" style="color: var(--text-3); padding: 6px;" title="Хаах"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div style="height: 4px; background: var(--surface-2); border-radius: 999px; overflow: hidden;">
          <div style="height: 100%; width: ${progress}%; background: linear-gradient(90deg, var(--primary), var(--gold-brand)); transition: width .3s ease;"></div>
        </div>
      </div>

      <!-- Body -->
      <div style="padding: 22px 24px; max-height: 60vh; overflow-y: auto;">
        ${stepBody}
      </div>

      <!-- Footer -->
      <div style="padding: 14px 24px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 10px;">
        <button onclick="wizardBack()" ${step === 1 ? 'style="visibility:hidden"' : ''} class="btn btn-ghost" style="padding: 10px 16px;">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Буцах
        </button>
        ${isSkippable ? `<button onclick="wizardNext(true)" class="btn btn-ghost" style="margin-left:auto; color: var(--text-3);">Алгасах</button>` : '<div style="flex:1"></div>'}
        <button onclick="wizardNext()" ${canNext ? '' : 'disabled style="opacity:.5; cursor:not-allowed;"'} class="btn btn-primary" style="padding: 10px 22px;">
          ${step === total ? '<i data-lucide="check" class="w-4 h-4"></i> Дуусгах' : 'Үргэлжлүүлэх <i data-lucide="arrow-right" class="w-4 h-4"></i>'}
        </button>
      </div>
    </div>
  `,
    'wide',
  );
  setTimeout(() => lucide.createIcons(), 0);
}
window.renderWizardModal = renderWizardModal;

function stepTitle(step) {
  return (
    [
      'Та өөрийгөө хэн гэж бодож вэ?',
      'Ямар үл хөдлөх хайж байна?',
      'Танай төсөв хэр вэ?',
      'Хэдэн өрөөтэй байр хайж байна?',
      'Аль дүүрэг танд илүү таалагдах вэ?',
      'Танд юу чухал вэ?',
      'Ямар төлөвт байгаа хөрөнгө хайж байна?',
      'Ямар орчинд амьдрах дуртай?',
      'Танд хэрхэн мэдэгдэх вэ?',
    ][step - 1] || ''
  );
}

/* ----- Wizard steps ----- */
function wizardStepLifestyle(d) {
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 16px;">Танд хамгийн илүү тохирох сонголтыг олгохын тулд.</p>
    <div class="grid grid-cols-2 gap-3">
      ${INTEREST_LIFESTYLES.map(
        (opt) => `
        <button onclick="wizardSetLifestyle('${opt.key}')"
          class="interest-card ${d.lifestyle === opt.key ? 'selected' : ''}"
          style="text-align: left; padding: 16px; border-radius: 14px; border: 1.5px solid ${d.lifestyle === opt.key ? 'var(--gold-brand)' : 'var(--border)'}; background: ${d.lifestyle === opt.key ? 'rgba(201,162,39,.06)' : 'var(--surface)'}; transition: all .15s;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: ${d.lifestyle === opt.key ? 'var(--gold-brand)' : 'var(--surface-2)'}; color: ${d.lifestyle === opt.key ? '#07111F' : 'var(--text-2)'}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <i data-lucide="${opt.icon}" class="w-5 h-5"></i>
          </div>
          <div style="font-weight: 700; color: var(--text); font-size: 14px; margin-bottom: 4px;">${opt.label}</div>
          <div style="font-size: 11.5px; color: var(--text-3); line-height: 1.4;">${opt.sub}</div>
        </button>
      `,
      ).join('')}
    </div>
  `;
}

function wizardStepBudget(d) {
  const isRent = d.mode === 'rent';
  const ranges = isRent
    ? [
        { label: 'Хамаагүй / Бүх үнэ', min: null, max: null, any: true },
        { label: '< 1сая', min: null, max: 1000000 },
        { label: '1-2сая', min: 1000000, max: 2000000 },
        { label: '2-3сая', min: 2000000, max: 3000000 },
        { label: '3-5сая', min: 3000000, max: 5000000 },
        { label: '5сая+', min: 5000000, max: null },
      ]
    : [
        { label: 'Хамаагүй / Бүх үнэ', min: null, max: null, any: true },
        { label: '< 200сая', min: null, max: 200000000 },
        { label: '200-400сая', min: 200000000, max: 400000000 },
        { label: '400-600сая', min: 400000000, max: 600000000 },
        { label: '600сая-1тэрбум', min: 600000000, max: 1000000000 },
        { label: '1тэрбум+', min: 1000000000, max: null },
      ];
  return `
    <div class="flex gap-2 mb-4">
      <button onclick="wizardSetMode('sale')" class="${d.mode === 'sale' ? 'btn btn-primary' : 'btn btn-secondary'}" style="padding: 8px 16px; font-size: 13px;">Худалдах</button>
      <button onclick="wizardSetMode('rent')" class="${d.mode === 'rent' ? 'btn btn-primary' : 'btn btn-secondary'}" style="padding: 8px 16px; font-size: 13px;">Түрээслэх</button>
    </div>
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 14px;">Танд тохирох үнийн хязгаарыг сонгоно уу.</p>
    <div class="grid grid-cols-1 gap-2">
      ${ranges
        .map((r) => {
          const isAny = !!r.any;
          const active = isAny
            ? !!d.budgetAny
            : !d.budgetAny && d.budgetMin === r.min && d.budgetMax === r.max;
          return `
          <button onclick="wizardSetBudget(${r.min}, ${r.max}, ${isAny})"
            style="text-align: left; padding: 14px 16px; border-radius: 12px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.06)' : 'var(--surface)'}; display: flex; align-items: center; gap: 12px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${active ? 'var(--gold-brand)' : 'var(--border-strong)'}; background: ${active ? 'var(--gold-brand)' : 'transparent'}; display:inline-flex;align-items:center;justify-content:center;">
              ${active ? '<i data-lucide="check" class="w-3 h-3" style="color:#07111F"></i>' : ''}
            </div>
            <span style="font-weight: 600; color: var(--text); font-size: 14px;">${r.label}${isRent || isAny ? '' : ' ₮'}</span>
          </button>
        `;
        })
        .join('')}
    </div>
  `;
}

/* ===== NEW STEP 2: Зориулалт + дэд төрөл ===== */
function wizardStepPurpose(d) {
  const selPurpose = d.purpose || 'any';
  const purposeMeta = INTEREST_PURPOSES.find((p) => p.key === selPurpose);
  const selSubs = d.subTypes || [];
  const hasSubs = purposeMeta && Array.isArray(purposeMeta.subTypes) && purposeMeta.subTypes.length > 0;
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 14px;">Хайж буй үл хөдлөхийн зориулалтыг сонгоно уу. "Хамаагүй" гэвэл бүгдийг харна.</p>
    <div class="grid grid-cols-2 gap-2 mb-3">
      ${INTEREST_PURPOSES.map((p) => {
        const active = p.key === selPurpose;
        return `
          <button onclick="wizardSetPurpose('${p.key}')"
            style="text-align: left; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.08)' : 'var(--surface)'}; display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; border-radius: 9px; background: ${active ? 'var(--gold-brand)' : 'var(--surface-2)'}; color: ${active ? '#07111F' : 'var(--text-2)'}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="${p.icon}" class="w-4 h-4"></i>
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 700; color: var(--text); font-size: 13px; line-height: 1.2;">${p.label}</div>
              <div style="font-size: 11px; color: var(--text-3); margin-top: 2px; line-height: 1.3;">${p.hint}</div>
            </div>
          </button>
        `;
      }).join('')}
    </div>
    ${
      hasSubs
        ? `
      <div style="margin-top: 12px; padding-top: 14px; border-top: 1px dashed var(--border);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom: 10px;">
          <i data-lucide="list-tree" class="w-4 h-4" style="color: var(--gold-brand);"></i>
          <div style="font-weight: 700; color: var(--text); font-size: 13.5px;">Дэд төрөл</div>
          <div style="font-size: 11.5px; color: var(--text-3); margin-left: auto;">олныг сонгож болно — заавал биш</div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${purposeMeta.subTypes
            .map((s) => {
              const on = selSubs.includes(s.key);
              return `
              <button onclick="wizardToggleSubType('${s.key}')"
                style="padding: 8px 13px; border-radius: 999px; border: 1.5px solid ${on ? 'var(--gold-brand)' : 'var(--border)'}; background: ${on ? 'rgba(201,162,39,.1)' : 'var(--surface-2)'}; color: var(--text); font-size: 12.5px; font-weight: ${on ? 700 : 500};">
                ${on ? '<i data-lucide="check" class="w-3 h-3 inline" style="margin-right:3px; color: var(--gold-brand)"></i>' : ''}${s.label}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `
        : ''
    }
  `;
}

/* ===== NEW STEP 7: Хөрөнгийн төлөв ===== */
function wizardStepCondition(d) {
  const sel = d.conditions || [];
  const groups = [
    { key: 'usage',   label: 'Ашиглалт',          icon: 'badge-check' },
    { key: 'cert',    label: 'Гэрчилгээ',         icon: 'file-check' },
    { key: 'history', label: 'Түүх',              icon: 'history' },
    { key: 'legal',   label: 'Хууль зүйн төлөв',   icon: 'shield-check' },
    { key: 'occupy',  label: 'Эзлэгдсэн эсэх',    icon: 'door-open' },
    { key: 'reno',    label: 'Засал',             icon: 'paintbrush' },
  ];
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 14px;">Та ямар төлөвт байгаа хөрөнгийг хүсэж байна вэ? Олныг сонгож болно — заавал биш.</p>
    ${groups
      .map((g) => {
        const items = INTEREST_CONDITIONS.filter((c) => c.groupKey === g.key);
        if (!items.length) return '';
        return `
        <div style="margin-bottom: 14px;">
          <div style="display:flex; align-items:center; gap:7px; margin-bottom: 8px;">
            <i data-lucide="${g.icon}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-2); letter-spacing: .04em; text-transform: uppercase;">${g.label}</div>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${items
              .map((c) => {
                const on = sel.includes(c.key);
                return `
                <button onclick="wizardToggleCondition('${c.key}')"
                  style="padding: 8px 13px; border-radius: 999px; border: 1.5px solid ${on ? 'var(--gold-brand)' : 'var(--border)'}; background: ${on ? 'rgba(201,162,39,.1)' : 'var(--surface-2)'}; color: var(--text); font-size: 12.5px; font-weight: ${on ? 700 : 500}; display:inline-flex; align-items:center; gap:6px;">
                  <i data-lucide="${c.icon}" class="w-3.5 h-3.5" style="color: ${on ? 'var(--gold-brand)' : 'var(--text-3)'};"></i>
                  ${c.label}
                </button>
              `;
              })
              .join('')}
          </div>
        </div>
      `;
      })
      .join('')}
  `;
}

/* ===== NEW STEP 9: Мэдэгдлийн суваг ===== */
function wizardStepNotifications(d) {
  const sel = d.notifChannels || [];
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 14px;">Шинэ тохирох зар орох тутамд хэрхэн мэдэгдэх вэ? Олныг сонгож болно.</p>
    <div class="grid grid-cols-1 gap-2">
      ${INTEREST_NOTIF_CHANNELS.map((c) => {
        const active = sel.includes(c.key);
        return `
          <button onclick="wizardToggleNotif('${c.key}')"
            style="padding: 14px 16px; border-radius: 14px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.06)' : 'var(--surface)'}; text-align: left; display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: ${active ? 'var(--gold-brand)' : 'var(--surface-2)'}; color: ${active ? '#07111F' : 'var(--text-2)'}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="${c.icon}" class="w-5 h-5"></i>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 700; color: var(--text); font-size: 14px; margin-bottom: 2px;">${c.label}</div>
              <div style="font-size: 12px; color: var(--text-3);">${c.sub}</div>
            </div>
            <div style="width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border-strong)'}; background: ${active ? 'var(--gold-brand)' : 'transparent'}; display: inline-flex; align-items: center; justify-content: center;">
              ${active ? '<i data-lucide="check" class="w-3 h-3" style="color:#07111F"></i>' : ''}
            </div>
          </button>
        `;
      }).join('')}
    </div>
    <div style="margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: var(--gold-soft); border: 1px solid rgba(201,162,39,.25); display: flex; gap: 10px; align-items: flex-start;">
      <i data-lucide="info" class="w-4 h-4 shrink-0" style="color: var(--gold-brand); margin-top: 2px;"></i>
      <div style="font-size: 11.5px; color: var(--text-2); line-height: 1.4;">SMS болон дуудлагын суваг нь Silver/Gold/Platinum гишүүнчлэлээр идэвхждэг. Та одоохондоо Basic бөгөөд app болон и-мэйлээр мэдэгдэл авах болно.</div>
    </div>
  `;
}

function wizardStepRooms(d) {
  const bedrooms = d.bedrooms || [];
  const bathMin = d.bathroomsMin || 0;
  const office = !!d.office;
  // 1 унтлагатай = 2 өрөө, 2 унтлагатай = 3 өрөө, г.м. 4 = "4+"
  const bedroomOpts = [
    { n: 1, totalLabel: '2 өрөө' },
    { n: 2, totalLabel: '3 өрөө' },
    { n: 3, totalLabel: '4 өрөө' },
    { n: 4, totalLabel: '5+ өрөө' },
  ];
  const bathOpts = [
    { v: 0, label: 'Хамаагүй' },
    { v: 1, label: '1+' },
    { v: 2, label: '2+' },
    { v: 3, label: '3+' },
  ];
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 14px;">Танай өрөөний тохиргоог дэлгэрэнгүй сонгоно уу.</p>

    <!-- Bedrooms -->
    <div style="margin-bottom: 18px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom: 10px;">
        <i data-lucide="bed-double" class="w-4 h-4" style="color: var(--gold-brand);"></i>
        <div style="font-weight: 700; color: var(--text); font-size: 13.5px;">Унтлагын өрөө</div>
        <div style="font-size: 11.5px; color: var(--text-3); margin-left: auto;">олныг сонгож болно</div>
      </div>
      <div class="flex flex-wrap gap-2">
        ${bedroomOpts
          .map((opt) => {
            const active = bedrooms.includes(opt.n);
            return `
            <button onclick="wizardToggleBedroom(${opt.n})"
              style="padding: 10px 14px; border-radius: 12px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.1)' : 'var(--surface)'}; color: var(--text); text-align: left; min-width: 110px;">
              <div style="font-weight: 700; font-size: 14px;">${opt.n}${opt.n === 4 ? '+' : ''} унтлагатай</div>
              <div style="font-size: 11px; color: var(--text-3); margin-top: 2px;">${opt.totalLabel}</div>
            </button>
          `;
          })
          .join('')}
      </div>
    </div>

    <!-- Bathrooms -->
    <div style="margin-bottom: 18px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom: 10px;">
        <i data-lucide="bath" class="w-4 h-4" style="color: var(--gold-brand);"></i>
        <div style="font-weight: 700; color: var(--text); font-size: 13.5px;">Нойлын тоо</div>
        <div style="font-size: 11.5px; color: var(--text-3); margin-left: auto;">хамгийн багадаа</div>
      </div>
      <div class="flex flex-wrap gap-2">
        ${bathOpts
          .map((opt) => {
            const active = bathMin === opt.v;
            return `
            <button onclick="wizardSetBathroomsMin(${opt.v})"
              style="padding: 10px 16px; border-radius: 12px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'var(--gold-brand)' : 'var(--surface)'}; color: ${active ? '#07111F' : 'var(--text)'}; font-weight: 700; font-size: 13px; min-width: 64px;">
              ${opt.label}
            </button>
          `;
          })
          .join('')}
      </div>
    </div>

    <!-- Office -->
    <div>
      <div style="display:flex; align-items:center; gap:8px; margin-bottom: 10px;">
        <i data-lucide="briefcase" class="w-4 h-4" style="color: var(--gold-brand);"></i>
        <div style="font-weight: 700; color: var(--text); font-size: 13.5px;">Ажлын өрөө</div>
      </div>
      <div class="flex gap-2">
        <button onclick="wizardSetOffice(false)"
          style="flex:1; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${!office ? 'var(--gold-brand)' : 'var(--border)'}; background: ${!office ? 'var(--gold-brand)' : 'var(--surface)'}; color: ${!office ? '#07111F' : 'var(--text)'}; font-weight: 700; font-size: 13px;">
          Хамаагүй
        </button>
        <button onclick="wizardSetOffice(true)"
          style="flex:1; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${office ? 'var(--gold-brand)' : 'var(--border)'}; background: ${office ? 'var(--gold-brand)' : 'var(--surface)'}; color: ${office ? '#07111F' : 'var(--text)'}; font-weight: 700; font-size: 13px;">
          Заавал байх
        </button>
      </div>
    </div>
  `;
}

function wizardStepDistricts(d) {
  const sel = d.districts || [];
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 16px;">Хамгийн 3 хүртэл дүүрэг сонгоно.</p>
    <div class="grid grid-cols-2 gap-2">
      ${(typeof DISTRICTS !== 'undefined' ? DISTRICTS : [])
        .map((dist) => {
          const active = sel.includes(dist);
          return `
          <button onclick="wizardToggleDistrict('${dist}')"
            style="padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.08)' : 'var(--surface)'}; text-align: left; display: flex; align-items: center; gap: 10px;">
            <div style="width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border-strong)'}; background: ${active ? 'var(--gold-brand)' : 'transparent'}; display: inline-flex; align-items: center; justify-content: center;">
              ${active ? '<i data-lucide="check" class="w-3 h-3" style="color:#07111F"></i>' : ''}
            </div>
            <span style="font-weight: 600; color: var(--text); font-size: 13.5px;">${dist}</span>
          </button>
        `;
        })
        .join('')}
    </div>
  `;
}

function wizardStepMustHaves(d) {
  const sel = d.mustHaves || [];
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 16px;">Танд хамгийн чухал зүйлсээ сонгоно (заавал биш).</p>
    <div class="flex flex-wrap gap-2">
      ${INTEREST_MUST_HAVES.map((opt) => {
        const active = sel.includes(opt.key);
        return `
          <button onclick="wizardToggleMustHave('${opt.key}')"
            style="padding: 10px 14px; border-radius: 999px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.1)' : 'var(--surface)'}; color: ${active ? 'var(--text)' : 'var(--text-2)'}; font-weight: 600; font-size: 12.5px; display: inline-flex; align-items: center; gap: 7px;">
            <i data-lucide="${opt.icon}" class="w-3.5 h-3.5" style="color: ${active ? 'var(--gold-brand)' : 'var(--text-3)'};"></i>
            ${opt.label}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function wizardStepVibe(d) {
  return `
    <p style="color: var(--text-2); font-size: 13px; margin-bottom: 16px;">Танд хамгийн дотно мэдрэгдэх орчныг сонгоно.</p>
    <div class="grid grid-cols-1 gap-2.5">
      ${INTEREST_VIBES.map((opt) => {
        const active = d.vibe === opt.key;
        return `
          <button onclick="wizardSetVibe('${opt.key}')"
            style="padding: 14px 16px; border-radius: 14px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.06)' : 'var(--surface)'}; text-align: left; display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: ${active ? 'var(--gold-brand)' : 'var(--surface-2)'}; color: ${active ? '#07111F' : 'var(--text-2)'}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="${opt.icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text); font-size: 14px; margin-bottom: 2px;">${opt.label}</div>
              <div style="font-size: 12px; color: var(--text-3);">${opt.sub}</div>
            </div>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

/* ----- Wizard state actions ----- */
function wizardSetLifestyle(key) {
  state.interestsWizardDraft.lifestyle = key;
  // Preset bedrooms / bathrooms / office / must-haves авч идэвхжүүлэх
  const meta = INTEREST_LIFESTYLES.find((x) => x.key === key);
  if (meta) {
    if (!state.interestsWizardDraft.bedrooms || state.interestsWizardDraft.bedrooms.length === 0) {
      state.interestsWizardDraft.bedrooms = [...meta.presetBedrooms];
    }
    if (state.interestsWizardDraft.bathroomsMin == null) {
      state.interestsWizardDraft.bathroomsMin = meta.presetBathroomsMin;
    }
    if (state.interestsWizardDraft.office == null) {
      state.interestsWizardDraft.office = meta.presetOffice;
    }
    if (!state.interestsWizardDraft.mustHaves || state.interestsWizardDraft.mustHaves.length === 0) {
      state.interestsWizardDraft.mustHaves = [...meta.presetMustHaves];
    }
  }
  renderWizardModal();
}
window.wizardSetLifestyle = wizardSetLifestyle;

function wizardSetMode(m) {
  state.interestsWizardDraft.mode = m;
  state.interestsWizardDraft.budgetMin = null;
  state.interestsWizardDraft.budgetMax = null;
  renderWizardModal();
}
window.wizardSetMode = wizardSetMode;

function wizardSetBudget(min, max, isAny) {
  if (isAny) {
    state.interestsWizardDraft.budgetAny = true;
    state.interestsWizardDraft.budgetMin = null;
    state.interestsWizardDraft.budgetMax = null;
  } else {
    state.interestsWizardDraft.budgetAny = false;
    state.interestsWizardDraft.budgetMin = min;
    state.interestsWizardDraft.budgetMax = max;
  }
  renderWizardModal();
}
window.wizardSetBudget = wizardSetBudget;

function wizardSetPurpose(key) {
  const prev = state.interestsWizardDraft.purpose;
  state.interestsWizardDraft.purpose = key;
  // Зориулалт солигдвол өмнөх дэд төрлийг арилгана
  if (prev !== key) state.interestsWizardDraft.subTypes = [];
  renderWizardModal();
}
window.wizardSetPurpose = wizardSetPurpose;

function wizardToggleSubType(key) {
  const arr = state.interestsWizardDraft.subTypes || [];
  const idx = arr.indexOf(key);
  if (idx === -1) arr.push(key);
  else arr.splice(idx, 1);
  state.interestsWizardDraft.subTypes = arr;
  renderWizardModal();
}
window.wizardToggleSubType = wizardToggleSubType;

function wizardToggleCondition(key) {
  const arr = state.interestsWizardDraft.conditions || [];
  const idx = arr.indexOf(key);
  if (idx === -1) arr.push(key);
  else arr.splice(idx, 1);
  state.interestsWizardDraft.conditions = arr;
  renderWizardModal();
}
window.wizardToggleCondition = wizardToggleCondition;

function wizardToggleNotif(key) {
  const arr = state.interestsWizardDraft.notifChannels || [];
  const idx = arr.indexOf(key);
  if (idx === -1) arr.push(key);
  else arr.splice(idx, 1);
  state.interestsWizardDraft.notifChannels = arr;
  renderWizardModal();
}
window.wizardToggleNotif = wizardToggleNotif;

function wizardToggleBedroom(n) {
  const arr = state.interestsWizardDraft.bedrooms || [];
  const idx = arr.indexOf(n);
  if (idx === -1) arr.push(n);
  else arr.splice(idx, 1);
  state.interestsWizardDraft.bedrooms = arr;
  renderWizardModal();
}
window.wizardToggleBedroom = wizardToggleBedroom;

function wizardSetBathroomsMin(v) {
  state.interestsWizardDraft.bathroomsMin = v;
  renderWizardModal();
}
window.wizardSetBathroomsMin = wizardSetBathroomsMin;

function wizardSetOffice(v) {
  state.interestsWizardDraft.office = !!v;
  renderWizardModal();
}
window.wizardSetOffice = wizardSetOffice;

function wizardToggleDistrict(d) {
  const arr = state.interestsWizardDraft.districts || [];
  const idx = arr.indexOf(d);
  if (idx === -1) {
    if (arr.length >= 3) {
      showToast('Хамгийн ихдээ 3 дүүрэг сонгоно', 'info', { duration: 1500 });
      return;
    }
    arr.push(d);
  } else arr.splice(idx, 1);
  state.interestsWizardDraft.districts = arr;
  renderWizardModal();
}
window.wizardToggleDistrict = wizardToggleDistrict;

function wizardToggleMustHave(k) {
  const arr = state.interestsWizardDraft.mustHaves || [];
  const idx = arr.indexOf(k);
  if (idx === -1) arr.push(k);
  else arr.splice(idx, 1);
  state.interestsWizardDraft.mustHaves = arr;
  renderWizardModal();
}
window.wizardToggleMustHave = wizardToggleMustHave;

function wizardSetVibe(v) {
  state.interestsWizardDraft.vibe = v;
  renderWizardModal();
}
window.wizardSetVibe = wizardSetVibe;

function wizardBack() {
  if (state.interestsWizardStep > 1) {
    state.interestsWizardStep--;
    renderWizardModal();
  }
}
window.wizardBack = wizardBack;

function wizardNext(skip = false) {
  if (state.interestsWizardStep < 9) {
    state.interestsWizardStep++;
    renderWizardModal();
  } else {
    finishInterestsWizard();
  }
}
window.wizardNext = wizardNext;

function cancelInterestsWizard() {
  state.interestsWizardDraft = null;
  state.interestsWizardStep = 1;
  closeModal();
}
window.cancelInterestsWizard = cancelInterestsWizard;

function finishInterestsWizard() {
  const d = state.interestsWizardDraft;
  const mode = state.interestsWizardMode || 'edit';
  const profile = {
    lifestyle: d.lifestyle,
    purpose: d.purpose || 'any',
    subTypes: d.subTypes || [],
    mode: d.mode,
    budgetMin: d.budgetMin,
    budgetMax: d.budgetMax,
    budgetAny: !!d.budgetAny,
    bedrooms: d.bedrooms || [],
    bathroomsMin: d.bathroomsMin || 0,
    office: !!d.office,
    districts: d.districts || [],
    mustHaves: d.mustHaves || [],
    conditions: d.conditions || [],
    vibe: d.vibe,
    notifChannels: d.notifChannels || ['app'],
    updatedAt: new Date().toISOString(),
  };
  const list = state.userInterestsList || [];
  const nextId = () => list.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1 || 1;
  if (mode === 'create') {
    profile.id = nextId();
    profile.name = makeInterestsProfileName(profile);
    list.push(profile);
    state.activeInterestsId = profile.id;
  } else {
    const idx = list.findIndex((p) => p.id === state.activeInterestsId);
    if (idx >= 0) {
      profile.id = list[idx].id;
      profile.name = list[idx].name || makeInterestsProfileName(profile);
      list[idx] = profile;
    } else {
      // edit but no existing — first-time setup
      profile.id = nextId();
      profile.name = makeInterestsProfileName(profile);
      list.push(profile);
      state.activeInterestsId = profile.id;
    }
  }
  state.userInterestsList = list;
  syncActiveInterests();
  saveInterests();
  state.interestsWizardDraft = null;
  state.interestsWizardStep = 1;
  state.interestsWizardMode = 'edit';
  closeModal();
  // Confetti-маягийн toast + feed-рүү шилжих
  showToast('✨ Бэлэн! Танд тохирох зарууд олдлоо', 'success', { duration: 2200 });
  spawnConfetti();
  refreshInterestsBadge();
  setTimeout(() => goTo('interests'), 350);
}
window.finishInterestsWizard = finishInterestsWizard;

/* ============== UPGRADE MODAL ============== */
const PRO_PLANS = [
  { key: 'monthly', label: 'Сар бүр', price: 19900, unit: '/сар', sub: 'Хэдийд ч цуцалж болно', savings: null },
  {
    key: 'yearly',
    label: 'Жил тутам',
    price: 199000,
    unit: '/жил',
    sub: '2 сар үнэгүй (16,583₮/сар)',
    savings: '17% хямд',
  },
];

function showInterestsUpgradeModal() {
  if (!state.upgradeDraftPlan) state.upgradeDraftPlan = 'yearly';
  renderUpgradeModal();
}
window.showInterestsUpgradeModal = showInterestsUpgradeModal;

function renderUpgradeModal() {
  const selected = state.upgradeDraftPlan || 'yearly';
  const sel = PRO_PLANS.find((p) => p.key === selected) || PRO_PLANS[0];
  openModal(
    `
    <div style="padding: 0;">
      <div style="padding: 26px 28px 16px 28px; text-align: center; background: linear-gradient(135deg, rgba(201,162,39,.12), rgba(14,93,111,.08)); border-bottom: 1px solid var(--border); position: relative;">
        <button onclick="closeModal()" style="position: absolute; top: 14px; right: 14px; color: var(--text-3); padding: 6px;" title="Хаах"><i data-lucide="x" class="w-5 h-5"></i></button>
        <div style="display:inline-flex; width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, var(--gold-brand), var(--primary)); align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 8px 24px rgba(201,162,39,.25);">
          <i data-lucide="crown" class="w-7 h-7" style="color: #fff;"></i>
        </div>
        <h2 style="font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 4px;">Pro эрх рүү шилжих</h2>
        <p style="font-size: 13px; color: var(--text-2); max-width: 360px; margin: 0 auto;">Хязгааргүй хүсэл хадгалаад өөр өөр зорилгод тохирсон зөвлөмж аваарай.</p>
      </div>

      <div style="padding: 18px 24px 6px 24px;">
        <div style="display: grid; gap: 10px; margin-bottom: 16px;">
          ${[
            { icon: 'sparkles', title: 'Хязгааргүй хүсэл', sub: 'Гэр бүл, хөрөнгө оруулалт, түрээслэгчид тус тусдаа.' },
            { icon: 'target', title: 'Илүү нарийн тааруулга', sub: 'Хүсэл бүр өөрийн дүүрэг, төсөв, шаардлагатай.' },
            { icon: 'bell', title: 'Тусгай мэдэгдэл', sub: 'Хүсэл тус бүрт шинэ зар орох тутамд push.' },
          ]
            .map(
              (b) => `
            <div style="display: flex; gap: 11px; padding: 10px 12px; border-radius: 11px; background: var(--surface-2); border: 1px solid var(--border);">
              <div style="width: 32px; height: 32px; border-radius: 9px; background: rgba(201,162,39,.15); color: var(--gold-brand); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i data-lucide="${b.icon}" class="w-4 h-4"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text); font-size: 13px; margin-bottom: 2px;">${b.title}</div>
                <div style="font-size: 11.5px; color: var(--text-3); line-height: 1.45;">${b.sub}</div>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>

        <div style="font-size: 11.5px; font-weight: 700; color: var(--text-3); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 8px;">Багц сонгох</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px;">
          ${PRO_PLANS.map((p) => {
            const active = p.key === selected;
            return `
              <button onclick="selectProPlan('${p.key}')"
                style="text-align: left; padding: 14px; border-radius: 12px; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.08)' : 'var(--surface)'}; position: relative;">
                ${p.savings ? `<span style="position: absolute; top: -8px; right: 10px; padding: 2px 8px; border-radius: 999px; background: var(--gold-brand); color: #07111F; font-size: 10px; font-weight: 800;">${p.savings}</span>` : ''}
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${active ? 'var(--gold-brand)' : 'var(--border-strong)'}; background: ${active ? 'var(--gold-brand)' : 'transparent'}; display:inline-flex; align-items: center; justify-content: center;">
                    ${active ? '<i data-lucide="check" class="w-2.5 h-2.5" style="color:#07111F"></i>' : ''}
                  </div>
                  <span style="font-weight: 700; color: var(--text); font-size: 13.5px;">${p.label}</span>
                </div>
                <div style="font-weight: 800; color: var(--text); font-size: 17px; letter-spacing: -0.01em;">${p.price.toLocaleString('mn-MN')}₮<span style="font-size: 12px; font-weight: 600; color: var(--text-3);">${p.unit}</span></div>
                <div style="font-size: 11px; color: var(--text-3); margin-top: 4px;">${p.sub}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div style="padding: 14px 24px 18px 24px; display: flex; gap: 10px; align-items: center; border-top: 1px solid var(--border); margin-top: 14px;">
        <div style="font-size: 11px; color: var(--text-3); flex: 1; line-height: 1.35;">
          Pro эрх ${sel.label.toLowerCase()} ${sel.price.toLocaleString('mn-MN')}₮.<br/>
          Хэдийд ч цуцалж болно.
        </div>
        <button onclick="upgradeUserTier()" class="btn btn-primary" style="padding: 12px 18px; white-space: nowrap;">
          <i data-lucide="crown" class="w-4 h-4"></i> ${sel.price.toLocaleString('mn-MN')}₮ төлж Pro болох
        </button>
      </div>
    </div>
  `,
    'wide',
  );
  setTimeout(() => lucide.createIcons(), 0);
}
window.renderUpgradeModal = renderUpgradeModal;

function selectProPlan(key) {
  state.upgradeDraftPlan = key;
  renderUpgradeModal();
}
window.selectProPlan = selectProPlan;

function upgradeUserTier() {
  const planKey = state.upgradeDraftPlan || 'yearly';
  const plan = PRO_PLANS.find((p) => p.key === planKey) || PRO_PLANS[0];
  state.userTier = 'pro';
  state.userTierPlan = plan.key;
  state.userTierActivatedAt = new Date().toISOString();
  saveUserTier();
  state.upgradeDraftPlan = null;
  closeModal();
  showToast(`👑 Pro эрх идэвхжлээ (${plan.label} · ${plan.price.toLocaleString('mn-MN')}₮)`, 'success', {
    duration: 2400,
  });
  refreshInterestsBadge();
  // Хэрэв байнгын interests хуудсан дээр бол refresh
  if (state.currentScreen === 'interests') renderAppScreen('interests');
  // Хэрэглэгч + товчоор оруулсан байж болзошгүй — шинэ хүсэл үүсгэх wizard эхлүүлнэ
  setTimeout(() => startInterestsWizard('create'), 300);
}
window.upgradeUserTier = upgradeUserTier;

/* Энгийн confetti эффект — DOM-д жижиг хэсэг үүсгэнэ, 1.6с дараа арилна */
function spawnConfetti() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden;';
  const colors = ['#c9a227', '#0E5D6F', '#1a4f8a', '#ffd86b', '#d6b132'];
  for (let i = 0; i < 32; i++) {
    const p = document.createElement('div');
    const left = Math.random() * 100;
    const delay = Math.random() * 0.3;
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 6;
    p.style.cssText = `position:absolute;top:-10px;left:${left}%;width:${size}px;height:${size}px;background:${color};border-radius:2px;opacity:.9;animation:confettiFall 1.6s ease-in ${delay}s forwards;transform:rotate(${Math.random() * 360}deg);`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2200);
}
window.spawnConfetti = spawnConfetti;

/* ============== PERSONALIZED FEED ============== */
function renderInterests() {
  const interests = state.userInterests;
  if (!interests) {
    return `
      <section class="max-w-3xl mx-auto px-4 lg:px-8 py-16 text-center">
        <div style="display: inline-flex; width: 80px; height: 80px; border-radius: 24px; background: linear-gradient(135deg, var(--primary), var(--gold-brand)); align-items: center; justify-content: center; margin-bottom: 20px;">
          <i data-lucide="sparkles" class="w-10 h-10" style="color: #fff;"></i>
        </div>
        <h2 style="font-size: 24px; font-weight: 700; color: var(--text); margin-bottom: 8px;">Хүслээ тохируулж эхэл</h2>
        <p style="color: var(--text-2); margin-bottom: 24px; max-width: 420px; margin-left: auto; margin-right: auto;">60 секундийн дотор танд тохирох зарууд олдоно. Бид танай хариултаас суралцаж дараа дараагийн саналаа сайжруулна.</p>
        <button onclick="startInterestsWizard('edit')" class="btn btn-primary" style="padding: 14px 28px; font-size: 15px;">
          <i data-lucide="sparkles" class="w-4 h-4"></i> Эхлэх
        </button>
      </section>
    `;
  }

  const results = matchedListings({ minScore: 40 });
  const lifestyleMeta = INTEREST_LIFESTYLES.find((x) => x.key === interests.lifestyle);
  const vibeMeta = INTEREST_VIBES.find((x) => x.key === interests.vibe);
  const list = state.userInterestsList || [];
  const isPro = state.userTier === 'pro';
  const canAdd = isPro || list.length < 1;

  return `
    <section class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      ${
        list.length > 0
          ? `
        <!-- Profile tabs -->
        <div class="taste-profiles" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom: 14px;">
          ${list
            .map((p) => {
              const active = p.id === state.activeInterestsId;
              return `
              <div style="display:inline-flex; align-items:stretch; border-radius: 10px; overflow: hidden; border: 1.5px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background: ${active ? 'rgba(201,162,39,.1)' : 'var(--surface)'};">
                <button onclick="switchInterestsProfile(${p.id})"
                  style="padding: 8px 12px; font-weight: ${active ? 700 : 600}; color: var(--text); font-size: 13px; display:inline-flex; align-items:center; gap:6px;">
                  ${active ? '<i data-lucide="check" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>' : ''}
                  ${p.name || 'Хүсэл'}
                </button>
                ${
                  list.length > 1
                    ? `
                  <button onclick="removeInterestsProfile(${p.id})" title="Устгах"
                    style="padding: 8px 10px; color: var(--text-3); border-left: 1px solid var(--border);">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                `
                    : ''
                }
              </div>
            `;
            })
            .join('')}
          <button onclick="tryAddInterestsProfile()"
            style="padding: 8px 14px; border-radius: 10px; border: 1.5px dashed ${canAdd ? 'var(--border-strong)' : 'var(--border)'}; background: transparent; color: ${canAdd ? 'var(--text-2)' : 'var(--text-3)'}; font-weight: 600; font-size: 13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="${canAdd ? 'plus' : 'crown'}" class="w-3.5 h-3.5"></i>
            ${canAdd ? 'Шинэ хүсэл' : 'Pro эрхээр илүү нэмэх'}
          </button>
          ${
            !isPro
              ? `
            <button onclick="showInterestsUpgradeModal()"
              style="margin-left: auto; padding: 5px 10px; border-radius: 999px; font-size: 11.5px; color: var(--gold-brand); background: rgba(201,162,39,.08); border: 1px solid rgba(201,162,39,.25); display:inline-flex; align-items:center; gap:5px; font-weight: 600;">
              <i data-lucide="crown" class="w-3 h-3"></i> Pro болох
            </button>
          `
              : `
            <span style="margin-left: auto; font-size: 11.5px; color: var(--gold-brand); display:inline-flex; align-items:center; gap:4px;">
              <i data-lucide="crown" class="w-3 h-3"></i> Pro эрх · ${list.length} профайл
            </span>
          `
          }
        </div>
      `
          : ''
      }

      <!-- Header strip -->
      <div class="taste-header">
        <div class="taste-header-l">
          <div class="taste-header-icon"><i data-lucide="sparkles" class="w-5 h-5"></i></div>
          <div>
            <div class="taste-header-eyebrow">Миний хүсэл</div>
            <h1 class="taste-header-title">${results.length} зар танд тохирно</h1>
            <div class="taste-header-tags">
              ${lifestyleMeta ? `<span class="taste-tag"><i data-lucide="${lifestyleMeta.icon}" class="w-3 h-3"></i>${lifestyleMeta.label}</span>` : ''}
              <span class="taste-tag"><i data-lucide="${interests.mode === 'rent' ? 'key-round' : 'home'}" class="w-3 h-3"></i>${interests.mode === 'rent' ? 'Түрээс' : 'Худалдах'}</span>
              ${
                (interests.bedrooms || []).length > 0
                  ? `<span class="taste-tag"><i data-lucide="bed-double" class="w-3 h-3"></i>${interests.bedrooms
                      .slice()
                      .sort((a, b) => a - b)
                      .map((n) => `${n}${n === 4 ? '+' : ''}`)
                      .join('/')} унтл.</span>`
                  : ''
              }
              ${interests.bathroomsMin ? `<span class="taste-tag"><i data-lucide="bath" class="w-3 h-3"></i>${interests.bathroomsMin}+ нойл</span>` : ''}
              ${interests.office ? `<span class="taste-tag"><i data-lucide="briefcase" class="w-3 h-3"></i>Ажлын өрөө</span>` : ''}
              ${(interests.districts || [])
                .slice(0, 3)
                .map((d) => `<span class="taste-tag"><i data-lucide="map-pin" class="w-3 h-3"></i>${d}</span>`)
                .join('')}
              ${vibeMeta ? `<span class="taste-tag"><i data-lucide="${vibeMeta.icon}" class="w-3 h-3"></i>${vibeMeta.label}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="taste-header-r">
          <button onclick="startInterestsWizard('edit')" class="bm-btn-outline" style="padding: 8px 14px; font-size: 13px;">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i> Шинэчлэх
          </button>
          <button onclick="confirmResetInterests()" class="bm-btn-outline" style="padding: 8px 14px; font-size: 13px; color: var(--text-3);">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      ${
        results.length === 0
          ? `
        <div class="text-center py-20" style="background: var(--surface); border-radius: 14px; border: 1px solid var(--border); margin-top: 18px;">
          <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3" style="color: var(--text-3);"></i>
          <h3 style="font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 6px;">Тохирох зар олдсонгүй</h3>
          <p style="color: var(--text-2); font-size: 14px; margin-bottom: 16px;">Хүслээ өөрчилж үзнэ үү — өргөн хайхад илүү олон зар олдоно.</p>
          <button onclick="startInterestsWizard('edit')" class="btn btn-primary">Шинэчлэх</button>
        </div>
      `
          : `
        <div class="taste-grid">
          ${results
            .slice(0, 18)
            .map(({ listing, score, reasons }) => renderMatchCard(listing, score, reasons))
            .join('')}
        </div>
        ${
          (state.interestsDismissedIds || []).length > 0
            ? `
          <div class="text-center mt-6">
            <button onclick="restoreDismissed()" class="btn btn-ghost" style="font-size: 13px; color: var(--text-3);">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Алгассан ${state.interestsDismissedIds.length} зарыг буцаах
            </button>
          </div>
        `
            : ''
        }
      `
      }
    </section>
  `;
}
window.renderInterests = renderInterests;

function renderMatchCard(l, score, reasons) {
  const tier = score >= 85 ? 'high' : score >= 65 ? 'mid' : 'low';
  const priceStr = l.mode === 'rent' ? `${fmtCompact(l.price)}/сар` : `${fmtCompact(l.price)}`;
  const isSaved = typeof SAVED_IDS !== 'undefined' && SAVED_IDS.has(l.id);
  return `
    <article class="taste-card" data-listing-id="${l.id}">
      <div class="taste-card-img" onclick="state.currentListingId=${l.id}; goTo('property')">
        <div class="taste-card-img-bg" style="background: linear-gradient(135deg, hsl(${(l.id * 37) % 360}, 30%, 35%), hsl(${(l.id * 71) % 360}, 25%, 22%));"></div>
        <span class="taste-score taste-score-${tier}">
          <i data-lucide="sparkles" class="w-3 h-3"></i>${score}%
        </span>
        <button class="taste-dismiss" onclick="event.stopPropagation(); dismissMatch(${l.id})" title="Хүсэлгүй">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
        ${l.status === 'hot' ? '<span class="pill pill-hot taste-card-pill"><i data-lucide="flame" class="w-3 h-3"></i>HOT</span>' : ''}
        ${l.status === 'new' ? '<span class="pill pill-new taste-card-pill"><i data-lucide="sparkle" class="w-3 h-3"></i>Шинэ</span>' : ''}
      </div>
      <div class="taste-card-body">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div style="font-weight: 700; font-size: 15.5px; color: var(--text); letter-spacing: -0.01em;">${priceStr}</div>
          <button onclick="event.stopPropagation(); toggleSaved(${l.id}, this)" class="heart-btn ${isSaved ? 'saved' : ''}" style="padding: 4px;">
            <i data-lucide="heart" class="w-4 h-4"></i>
          </button>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px;">${l.khotkhon}</div>
        <div style="font-size: 12px; color: var(--text-3); margin-bottom: 10px;">${l.district} · ${l.rooms} өрөө · ${l.area}м²</div>
        ${
          reasons.length > 0
            ? `
          <div class="taste-reasons">
            ${reasons
              .slice(0, 3)
              .map(
                (r) => `
              <span class="taste-reason ${r.kind === 'soft' ? 'soft' : ''}">
                <i data-lucide="${r.icon}" class="w-3 h-3"></i>${r.text}
              </span>
            `,
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    </article>
  `;
}
window.renderMatchCard = renderMatchCard;

function dismissMatch(id) {
  if (!state.interestsDismissedIds) state.interestsDismissedIds = [];
  if (!state.interestsDismissedIds.includes(id)) {
    state.interestsDismissedIds.push(id);
    saveInterestsDismissed();
  }
  // Карт-ыг fade-out
  const card = document.querySelector(`.taste-card[data-listing-id="${id}"]`);
  if (card) {
    card.style.transition = 'opacity .25s, transform .25s';
    card.style.opacity = '0';
    card.style.transform = 'scale(.92)';
    setTimeout(() => renderAppScreen('interests'), 280);
  } else {
    renderAppScreen('interests');
  }
  refreshInterestsBadge();
}
window.dismissMatch = dismissMatch;

function restoreDismissed() {
  state.interestsDismissedIds = [];
  saveInterestsDismissed();
  renderAppScreen('interests');
  refreshInterestsBadge();
  showToast('Алгассан зарууд буцаагдлаа', 'info', { duration: 1500 });
}
window.restoreDismissed = restoreDismissed;

function confirmResetInterests() {
  if (!confirm('Хүслээ устгах уу? Дахин эхнээс тохируулна.')) return;
  clearInterests();
  refreshInterestsBadge();
  renderAppScreen('interests');
  showToast('Хүсэл устгагдлаа', 'info', { duration: 1500 });
}
window.confirmResetInterests = confirmResetInterests;
