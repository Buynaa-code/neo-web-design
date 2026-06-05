/* ============== INTERESTS — data + matching + badge ============== */

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
