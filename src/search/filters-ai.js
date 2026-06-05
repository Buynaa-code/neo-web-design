/* ============== SEARCH — filtering + lifestyle + AI search ============== */

function activeListings() {
  return LISTINGS.filter((l) => l.status !== 'sold');
}

/* ---------- POLYGON DRAW HELPERS ---------- */

function modeListings(mode) {
  const m = mode || state.mode;
  return activeListings().filter((l) => l.mode === m);
}
function filteredListings() {
  let list = modeListings();
  if (state.filterDistrict) list = list.filter((l) => l.district === state.filterDistrict);
  if (state.filterRooms) list = list.filter((l) => l.rooms === state.filterRooms);
  if (state.filterBusStop) {
    const stop = getBusStop(state.filterBusStop);
    if (stop) list = list.filter((l) => distToStop(l, stop) <= BUS_STOP_RADIUS);
  }
  if (state.filterLifestyle && state.filterLifestyle.length) {
    list = list.filter((l) => {
      const tags = getLifestyleTags(l);
      return state.filterLifestyle.every((k) => tags.includes(k));
    });
  }
  if (state.filterVerified) list = list.filter((l) => isListingVerified(l));
  if (state.filterIpoteh) list = list.filter((l) => hasIpoteh(l));
  if (state.filterNewProject) list = list.filter((l) => isNewProject(l));
  if (state.filterSchool) {
    // Сургууль ойр — Сүхбаатар, Чингэлтэй, Хан-Уул дүүрэгт байгаа байр (англо-сургуультай орчин)
    list = list.filter((l) => ['Сүхбаатар', 'Чингэлтэй', 'Хан-Уул'].includes(l.district));
  }
  if (state.filterIncome) {
    // Орлого өгөх — түрээслүүлж болохуйц байрууд (sale mode-д: үнэ цэн өндөртэй)
    list = list.filter((l) => (l.mode === 'sale' ? l.price >= 300000000 : true));
  }
  if (state.filterFeature) {
    list = list.filter((l) =>
      (l.features || []).some((f) => f.toLowerCase().includes(state.filterFeature.toLowerCase())),
    );
  }
  if (state.filterCategory === 'house') list = list.filter((l) => l.floor === 'Хаус');
  else if (state.filterCategory === 'premium') {
    const thresh = state.mode === 'rent' ? 3000000 : 800000000;
    list = list.filter((l) => l.price >= thresh);
  } else if (state.filterCategory === 'hot') list = list.filter((l) => l.status === 'hot');
  else if (state.filterCategory === 'new') list = list.filter((l) => l.status === 'new');
  else if (state.filterCategory === 'drop') list = list.filter((l) => l.status === 'drop');

  if (state.filterPriceMin) list = list.filter((l) => l.price >= state.filterPriceMin);
  if (state.filterPriceMax) list = list.filter((l) => l.price <= state.filterPriceMax);
  if (state.filterPpmMin) list = list.filter((l) => l.price / l.area >= state.filterPpmMin);
  if (state.filterPpmMax) list = list.filter((l) => l.price / l.area <= state.filterPpmMax);
  if (state.filterAreaMin) list = list.filter((l) => l.area >= state.filterAreaMin);
  if (state.filterAreaMax) list = list.filter((l) => l.area <= state.filterAreaMax);
  if (state.drawnPolygon && state.drawnPolygon.length >= 3) {
    list = list.filter((l) => pointInPolygon(l.lat, l.lng, state.drawnPolygon));
  }

  if (state.sortBy === 'newest') list = [...list].sort((a, b) => a.listedDays - b.listedDays);
  else if (state.sortBy === 'priceAsc') list = [...list].sort((a, b) => a.price - b.price);
  else if (state.sortBy === 'priceDesc') list = [...list].sort((a, b) => b.price - a.price);
  else if (state.sortBy === 'recommended') {
    list = [...list].sort((a, b) => {
      const score = (l) =>
        (isListingVerified(l) ? 3 : 0) +
        (l.status === 'hot' ? 2 : 0) +
        (l.status === 'new' ? 1 : 0) +
        Math.min(2, (l.viewCount || 0) / 100) -
        Math.min(2, (l.listedDays || 0) / 30);
      return score(b) - score(a);
    });
  }
  return list;
}

/* Бүх filter-ыг арилгаж эхний хуудас руу буцна */
function clearAllFilters() {
  state.filterDistrict = null;
  state.filterRooms = null;
  state.filterBusStop = null;
  state.filterLifestyle = [];
  state.filterVerified = false;
  state.filterIpoteh = false;
  state.filterNewProject = false;
  state.filterSchool = false;
  state.filterIncome = false;
  state.filterPriceMin = null;
  state.filterPriceMax = null;
  state.filterPpmMin = null;
  state.filterPpmMax = null;
  state.filterAreaMin = null;
  state.filterAreaMax = null;
  state.aiQuery = '';
  state.page = 1;
  if (currentScreen === 'results') {
    renderAppScreen('results');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.clearAllFilters = clearAllFilters;

/* ---------- LIFESTYLE INFERENCE ----------
   Listing-ийн мэдээллээс ажил/сургууль/гэр бүл г.м. тэмдгийг гаргана. */
const LIFESTYLE_DEFS = [
  { key: 'family', label: 'Гэр бүлд тохиромжтой', icon: 'users' },
  { key: 'work-close', label: 'Ажил руу ойр', icon: 'briefcase' },
  { key: 'school-near', label: 'Сургууль ойр', icon: 'graduation-cap' },
  { key: 'investment', label: 'Хөрөнгө оруулалт', icon: 'trending-up' },
  { key: 'pet', label: 'Тэжээвэр амьтантай', icon: 'paw-print' },
  { key: 'furnished', label: 'Тавилгатай', icon: 'sofa' },
  { key: 'mortgage', label: 'Зээлээр авч болно', icon: 'banknote' },
];
const CENTRAL_DISTRICTS = new Set(['Сүхбаатар', 'Чингэлтэй']);
function getLifestyleTags(l) {
  const feats = (l.features || []).join(' ').toLowerCase();
  const tags = [];
  if (l.rooms >= 3 || l.area >= 100 || feats.includes('гэр бүл') || feats.includes('хүүхд')) tags.push('family');
  if (CENTRAL_DISTRICTS.has(l.district) || feats.includes('хотын төв')) tags.push('work-close');
  // Олон хороололын ойролцоо ЕБС/цэцэрлэг гэж үзэе — хотхон-той + дунд оны
  if (l.year >= 2017 && l.rooms >= 2) tags.push('school-near');
  if (l.mode === 'sale' && (l.year >= 2019 || CENTRAL_DISTRICTS.has(l.district))) tags.push('investment');
  if (feats.includes('тэжээвэр')) tags.push('pet');
  if (feats.includes('тавилгатай') || feats.includes('бэлэн орох')) tags.push('furnished');
  if (feats.includes('зээл')) tags.push('mortgage');
  return tags;
}
function toggleLifestyle(key) {
  if (!Array.isArray(state.filterLifestyle)) state.filterLifestyle = [];
  const i = state.filterLifestyle.indexOf(key);
  if (i >= 0) state.filterLifestyle.splice(i, 1);
  else state.filterLifestyle.push(key);
  state.highlightedId = null;
  if (currentScreen === 'home') goTo('results');
  else {
    renderAppScreen('results');
    setTimeout(() => lucide.createIcons(), 0);
  }
}

/* ---------- AI SEARCH (mock NLP) ----------

const AI_EXAMPLES = [
  { icon: 'graduation-cap', text: 'Хан-Уулд 3 өрөө, 450 саяс доош, сургууль ойр' },
  { icon: 'home', text: 'Сүхбаатарт 2 өрөө түрээс, 1.5 саяс доош' },
  { icon: 'briefcase', text: 'Хотын төв ажилд ойр, 1 өрөө түрээс' },
  { icon: 'users', text: 'Гэр бүлд том 4 өрөө, Баянзүрх, 600 сая хүртэл' },
  { icon: 'trending-up', text: 'Хөрөнгө оруулалт, шинэ төсөл, 2020 оноос' },
  { icon: 'landmark', text: '3 өрөө, зээлээр авч болно, бэлэн орох' },
];

/* Гаргаж авсан утгуудыг товч "chip"-үүд болгож, хэрэглэгчид AI-н "ойлгосон" зүйлийг харуулна */
function aiExtractedChips(ex) {
  if (!ex) return '';
  const chips = [];
  if (ex.mode)
    chips.push({ icon: ex.mode === 'rent' ? 'key' : 'tag', label: ex.mode === 'rent' ? 'Түрээс' : 'Худалдах' });
  if (ex.district) chips.push({ icon: 'map-pin', label: ex.district });
  if (ex.rooms) chips.push({ icon: 'bed-double', label: ex.rooms + ' өрөө' });
  if (ex.maxPrice) chips.push({ icon: 'tag', label: '≤ ' + fmtCompact(ex.maxPrice) });
  if (ex.minYear) chips.push({ icon: 'calendar', label: ex.minYear + ' оноос' });
  const lifeMap = {
    'school-near': ['graduation-cap', 'Сургууль ойр'],
    'work-close': ['briefcase', 'Ажил руу ойр'],
    family: ['users', 'Гэр бүлд'],
    investment: ['trending-up', 'Хөрөнгө оруулалт'],
    pet: ['paw-print', 'Тэжээвэртэй'],
    furnished: ['sofa', 'Тавилгатай'],
    mortgage: ['landmark', 'Зээлээр'],
  };
  (ex.lifestyle || []).forEach((k) => {
    if (lifeMap[k]) chips.push({ icon: lifeMap[k][0], label: lifeMap[k][1] });
  });
  if (!chips.length) chips.push({ icon: 'sparkles', label: 'Чөлөөт хайлт' });
  return chips
    .map(
      (c) =>
        `<span class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full" style="background: var(--primary-soft); color: var(--primary); border: 1px solid var(--primary);"><i data-lucide="${c.icon}" class="w-3 h-3"></i> ${c.label}</span>`,
    )
    .join('');
}

function parseAIQuery(text) {
  const t = (text || '').toLowerCase();
  const out = { mode: null, district: null, rooms: null, maxPrice: null, minYear: null, lifestyle: [] };

  // Горим
  if (/(худал[дн]|зар(а|ы)|авах|худалдаж)/.test(t)) out.mode = 'sale';
  else if (/(түрээс|сар(ын)?\s?\d|\bсар\b)/.test(t)) out.mode = 'rent';

  // Дүүрэг
  for (const d of DISTRICTS)
    if (t.includes(d.toLowerCase())) {
      out.district = d;
      break;
    }

  // Өрөө
  const room = t.match(/(\d)\s*өрөө/);
  if (room) out.rooms = Math.min(4, parseInt(room[1], 10));

  // Үнэ — сая / тэрбум / мянган
  const sayaa = t.match(/(\d+(?:[\.,]\d+)?)\s*(тэрбум|саяас|сая|сар(ын)?|мянган)/);
  if (sayaa) {
    const n = parseFloat(sayaa[1].replace(',', '.'));
    if (/тэрбум/.test(sayaa[2])) out.maxPrice = n * 1_000_000_000;
    else if (/сая/.test(sayaa[2])) out.maxPrice = n * 1_000_000;
    else if (/мянган/.test(sayaa[2])) out.maxPrice = n * 1_000;
  }

  // Доош (доош/доош нь/хүртэл)
  if (/(доош|хүртэл|дотор|багатай|хямд)/.test(t) && out.maxPrice == null && sayaa == null) {
    // Тоо + контекст байхгүй бол алгасах
  }

  // Жил
  const yr = t.match(/(20\d{2})\s*(он(оос)?|оноос)/);
  if (yr) out.minYear = parseInt(yr[1], 10);

  // Lifestyle
  if (/(сургууль|цэцэрлэг|еб)/.test(t)) out.lifestyle.push('school-near');
  if (/(ажил|төв|метро|оффис)/.test(t)) out.lifestyle.push('work-close');
  if (/(гэр бүл|хүүхд|том)/.test(t)) out.lifestyle.push('family');
  if (/(хөрөнгө|өгөөж|инвест)/.test(t)) out.lifestyle.push('investment');
  if (/(тэжээвэр|нохой|муур)/.test(t)) out.lifestyle.push('pet');
  if (/(тавилга|бэлэн орох)/.test(t)) out.lifestyle.push('furnished');
  if (/зээл/.test(t)) out.lifestyle.push('mortgage');

  return out;
}
function runAISearch(text) {
  const q = (
    text ||
    document.getElementById('bm-home-search')?.value ||
    document.getElementById('bm-res-search')?.value ||
    document.getElementById('ai-search-input')?.value ||
    ''
  ).trim();
  if (!q) {
    showToast('Юу хайх вэ?', 'info', { duration: 1200 });
    return;
  }
  state.aiQuery = q;
  const ex = parseAIQuery(q);
  state.aiExtracted = ex;

  // Шүүлтүүр шинэчлэх — шинэ BairMap filter state-ийг бөглөнө
  if (ex.mode && ex.mode !== state.mode) state.mode = ex.mode;
  state.filterDistrict = ex.district || null;
  state.filterRooms = ex.rooms || null;
  state.filterLifestyle = ex.lifestyle && ex.lifestyle.length ? ex.lifestyle : [];
  state.filterPriceMax = ex.maxPrice || null;
  state.filterSchool = (ex.lifestyle || []).includes('school-near');
  state.filterIpoteh = (ex.lifestyle || []).includes('mortgage');
  state.filterNewProject = !!ex.minYear && ex.minYear >= 2020;
  state.highlightedId = null;
  state.page = 1;

  showToast('AI хайлт ажиллаж байна...', 'info', { duration: 1000 });
  setTimeout(() => goTo('results'), 200);
}
function clearAISearch() {
  state.aiQuery = '';
  state.aiExtracted = null;
  state.filterDistrict = null;
  state.filterRooms = null;
  state.filterLifestyle = [];
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.runAISearch = runAISearch;
window.clearAISearch = clearAISearch;
window.toggleLifestyle = toggleLifestyle;

/* Жишээ chip дарахад: input-ыг бөглөж, AI хайлтыг ажиллуулна */
function runAIExample(text) {
  const home = document.getElementById('bm-home-search');
  const res = document.getElementById('bm-res-search');
  const ai = document.getElementById('bm-ai-assistant-input');
  if (home) home.value = text;
  if (res) res.value = text;
  if (ai) ai.value = text;
  runAISearch(text);
}
window.runAIExample = runAIExample;

/* Home map дээрх дүүргийн chip дарж тогглох — газрын зургийн зон ч мөн адил дуудна */
window.toggleHomeDistrict = function (name) {
  if (state.filterDistrict === name) {
    state.filterDistrict = null;
  } else {
    state.filterDistrict = name;
  }
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};

/* Өрөөний тоо chip — null утга бол шүүлтүүр идэвхгүй */
window.toggleHomeRooms = function (n) {
  const num = parseInt(n, 10);
  state.filterRooms = state.filterRooms === num ? null : num;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};

/* Үнийн бүсийн chip — [min, max] хосыг state-д шинэчилнэ. Утгууд саяар. */
window.toggleHomePrice = function (minMillions, maxMillions) {
  const min = minMillions ? minMillions * 1_000_000 : null;
  const max = maxMillions ? maxMillions * 1_000_000 : null;
  const same = (state.filterPriceMin || null) === min && (state.filterPriceMax || null) === max;
  if (same) {
    state.filterPriceMin = null;
    state.filterPriceMax = null;
  } else {
    state.filterPriceMin = min;
    state.filterPriceMax = max;
  }
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};

/* Идэвхтэй үнийн бүсийг хэрхэн дүрсэлж буйг шалгах туслах */
