/* ============== ORLOO SCREENS ============== */

/* ---------- shared helpers ---------- */

function activeListings() {
  return LISTINGS.filter(l => l.status !== 'sold');
}
function modeListings(mode) {
  const m = mode || state.mode;
  return activeListings().filter(l => l.mode === m);
}
function filteredListings() {
  let list = modeListings();
  if (state.filterDistrict)         list = list.filter(l => l.district === state.filterDistrict);
  if (state.filterRooms)            list = list.filter(l => l.rooms === state.filterRooms);
  if (state.filterBusStop) {
    const stop = getBusStop(state.filterBusStop);
    if (stop) list = list.filter(l => distToStop(l, stop) <= BUS_STOP_RADIUS);
  }
  if (state.filterLifestyle && state.filterLifestyle.length) {
    list = list.filter(l => {
      const tags = getLifestyleTags(l);
      return state.filterLifestyle.every(k => tags.includes(k));
    });
  }
  if (state.filterVerified)         list = list.filter(l => isListingVerified(l));
  if (state.filterIpoteh)           list = list.filter(l => hasIpoteh(l));
  if (state.filterNewProject)       list = list.filter(l => isNewProject(l));
  if (state.filterSchool) {
    // Сургууль ойр — Сүхбаатар, Чингэлтэй, Хан-Уул дүүрэгт байгаа байр (англо-сургуультай орчин)
    list = list.filter(l => ['Сүхбаатар','Чингэлтэй','Хан-Уул'].includes(l.district));
  }
  if (state.filterIncome) {
    // Орлого өгөх — түрээслүүлж болохуйц байрууд (sale mode-д: үнэ цэн өндөртэй)
    list = list.filter(l => l.mode === 'sale' ? l.price >= 300000000 : true);
  }
  if (state.filterPriceMin)         list = list.filter(l => l.price >= state.filterPriceMin);
  if (state.filterPriceMax)         list = list.filter(l => l.price <= state.filterPriceMax);
  if (state.filterAreaMin)          list = list.filter(l => l.area >= state.filterAreaMin);
  if (state.filterAreaMax)          list = list.filter(l => l.area <= state.filterAreaMax);

  if (state.sortBy === 'newest')         list = [...list].sort((a,b) => a.listedDays - b.listedDays);
  else if (state.sortBy === 'priceAsc')  list = [...list].sort((a,b) => a.price - b.price);
  else if (state.sortBy === 'priceDesc') list = [...list].sort((a,b) => b.price - a.price);
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
  { key: 'family',      label: 'Гэр бүлд тохиромжтой', icon: 'users' },
  { key: 'work-close',  label: 'Ажил руу ойр',          icon: 'briefcase' },
  { key: 'school-near', label: 'Сургууль ойр',          icon: 'graduation-cap' },
  { key: 'investment',  label: 'Хөрөнгө оруулалт',      icon: 'trending-up' },
  { key: 'pet',         label: 'Тэжээвэр амьтантай',    icon: 'paw-print' },
  { key: 'furnished',   label: 'Тавилгатай',            icon: 'sofa' },
  { key: 'mortgage',    label: 'Зээлээр авч болно',     icon: 'banknote' }
];
const CENTRAL_DISTRICTS = new Set(['Сүхбаатар','Чингэлтэй']);
function getLifestyleTags(l) {
  const feats = (l.features || []).join(' ').toLowerCase();
  const tags = [];
  if (l.rooms >= 3 || l.area >= 100 || feats.includes('гэр бүл') || feats.includes('хүүхд')) tags.push('family');
  if (CENTRAL_DISTRICTS.has(l.district) || feats.includes('хотын төв')) tags.push('work-close');
  // Олон хороололын ойролцоо ЕБС/цэцэрлэг гэж үзэе — хотхон-той + дунд оны
  if (l.year >= 2017 && (l.rooms >= 2)) tags.push('school-near');
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
  else { renderAppScreen('results'); setTimeout(() => lucide.createIcons(), 0); }
}

/* ---------- AI SEARCH (mock NLP) ----------
   Хэрэглэгчийн чөлөөт текстээс шүүлтүүр гаргаж state-д суулгана. */
const AI_EXAMPLES = [
  { icon: 'graduation-cap', text: 'Хан-Уулд 3 өрөө, 450 саяс доош, сургууль ойр'   },
  { icon: 'home',           text: 'Сүхбаатарт 2 өрөө түрээс, 1.5 саяс доош'         },
  { icon: 'briefcase',      text: 'Хотын төв ажилд ойр, 1 өрөө түрээс'              },
  { icon: 'users',          text: 'Гэр бүлд том 4 өрөө, Баянзүрх, 600 сая хүртэл'   },
  { icon: 'trending-up',    text: 'Хөрөнгө оруулалт, шинэ төсөл, 2020 оноос'        },
  { icon: 'landmark',       text: '3 өрөө, зээлээр авч болно, бэлэн орох'           }
];

/* Гаргаж авсан утгуудыг товч "chip"-үүд болгож, хэрэглэгчид AI-н "ойлгосон" зүйлийг харуулна */
function aiExtractedChips(ex) {
  if (!ex) return '';
  const chips = [];
  if (ex.mode) chips.push({ icon: ex.mode==='rent'?'key':'tag', label: ex.mode==='rent'?'Түрээс':'Худалдах' });
  if (ex.district) chips.push({ icon: 'map-pin', label: ex.district });
  if (ex.rooms) chips.push({ icon: 'bed-double', label: ex.rooms + ' өрөө' });
  if (ex.maxPrice) chips.push({ icon: 'tag', label: '≤ ' + fmtCompact(ex.maxPrice) });
  if (ex.minYear) chips.push({ icon: 'calendar', label: ex.minYear + ' оноос' });
  const lifeMap = { 'school-near':['graduation-cap','Сургууль ойр'], 'work-close':['briefcase','Ажил руу ойр'],
                    'family':['users','Гэр бүлд'], 'investment':['trending-up','Хөрөнгө оруулалт'],
                    'pet':['paw-print','Тэжээвэртэй'], 'furnished':['sofa','Тавилгатай'],
                    'mortgage':['landmark','Зээлээр'] };
  (ex.lifestyle||[]).forEach(k => { if (lifeMap[k]) chips.push({ icon: lifeMap[k][0], label: lifeMap[k][1] }); });
  if (!chips.length) chips.push({ icon: 'sparkles', label: 'Чөлөөт хайлт' });
  return chips.map(c => `<span class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full" style="background: var(--primary-soft); color: var(--primary); border: 1px solid var(--primary);"><i data-lucide="${c.icon}" class="w-3 h-3"></i> ${c.label}</span>`).join('');
}

function parseAIQuery(text) {
  const t = (text || '').toLowerCase();
  const out = { mode: null, district: null, rooms: null, maxPrice: null, minYear: null, lifestyle: [] };

  // Горим
  if (/(худал[дн]|зар(а|ы)|авах|худалдаж)/.test(t)) out.mode = 'sale';
  else if (/(түрээс|сар(ын)?\s?\d|\bсар\b)/.test(t)) out.mode = 'rent';

  // Дүүрэг
  for (const d of DISTRICTS) if (t.includes(d.toLowerCase())) { out.district = d; break; }

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
  const q = (text
    || document.getElementById('bm-home-search')?.value
    || document.getElementById('bm-res-search')?.value
    || document.getElementById('ai-search-input')?.value
    || '').trim();
  if (!q) { showToast('Юу хайх вэ?', 'info', { duration: 1200 }); return; }
  state.aiQuery = q;
  const ex = parseAIQuery(q);
  state.aiExtracted = ex;

  // Шүүлтүүр шинэчлэх — шинэ BairMap filter state-ийг бөглөнө
  if (ex.mode && ex.mode !== state.mode) state.mode = ex.mode;
  state.filterDistrict   = ex.district || null;
  state.filterRooms      = ex.rooms || null;
  state.filterLifestyle  = ex.lifestyle && ex.lifestyle.length ? ex.lifestyle : [];
  state.filterPriceMax   = ex.maxPrice || null;
  state.filterSchool     = (ex.lifestyle || []).includes('school-near');
  state.filterIpoteh     = (ex.lifestyle || []).includes('mortgage');
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
  const res  = document.getElementById('bm-res-search');
  const ai   = document.getElementById('bm-ai-assistant-input');
  if (home) home.value = text;
  if (res)  res.value = text;
  if (ai)   ai.value = text;
  runAISearch(text);
}
window.runAIExample = runAIExample;

/* ҮХ-ийн төрлийн tile дарахад горим солих + results хуудас руу шилжих */
function selectPropertyType(key, mode) {
  const t = PROPERTY_TYPES.find(p => p.key === key);
  if (!t) return;
  state.mode = mode || t.mode;
  state.filterDistrict = null;
  state.filterRooms = null;
  state.filterBusStop = null;
  showToast(t.label + ' — ' + t.count.toLocaleString() + ' зар', 'info', { duration: 1400 });
  goTo('results');
}
window.selectPropertyType = selectPropertyType;

/* ---------- PROPERTY INTELLIGENCE ---------- */
function pricePerM2(l) { return Math.round(l.price / l.area); }
function marketAvgPerM2(district, rooms, mode) {
  const peers = activeListings().filter(l =>
    l.mode === mode && l.district === district && Math.abs(l.rooms - rooms) <= 1
  );
  if (!peers.length) return null;
  return Math.round(peers.reduce((s, l) => s + l.price / l.area, 0) / peers.length);
}
function priceVsMarket(l) {
  const avg = marketAvgPerM2(l.district, l.rooms, l.mode);
  if (!avg) return { avg: null, pct: 0, label: 'Мэдээлэл алга', cls: 'fair' };
  const own = pricePerM2(l);
  const pct = Math.round(((own - avg) / avg) * 100);
  if (pct <= -8) return { avg, pct, label: `Зах зээлээс ${Math.abs(pct)}% хямд`, cls: 'below' };
  if (pct >= 8)  return { avg, pct, label: `Зах зээлээс ${pct}% үнэтэй`, cls: 'above' };
  return { avg, pct, label: 'Зах зээлийн дунджтай дүйцнэ', cls: 'fair' };
}
function similarListings(l, n = 3) {
  return activeListings()
    .filter(x => x.id !== l.id && x.mode === l.mode && x.district === l.district && Math.abs(x.rooms - l.rooms) <= 1)
    .slice(0, n);
}
function setMediaTab(tab) {
  state.mediaTab = tab;
  renderAppScreen('property');
  setTimeout(() => lucide.createIcons(), 0);
}
window.setMediaTab = setMediaTab;

function setMobileView(v) {
  state.mobileView = v;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.setMobileView = setMobileView;

/* Сэдэвчилсэн floorplan SVG — өрөөний тоо/талбайгаас үүсгэх */
function renderFloorplan(l) {
  const rooms = l.rooms;
  const area = l.area;
  // Үндсэн хэмжээ: 600x340 SVG; өрөөг сараалжаар байрлуулна
  const layouts = {
    1: [['Studio + Кухнэ', 0, 0, 60, 60], ['Угаалга', 60, 0, 40, 40], ['Тагт', 60, 40, 40, 20]],
    2: [['Зочны өрөө', 0, 0, 50, 60], ['Унтлагын', 50, 0, 50, 35], ['Кухнэ', 50, 35, 30, 25], ['Угаалга', 80, 35, 20, 25]],
    3: [['Зочны өрөө', 0, 0, 45, 55], ['Унтлагын 1', 45, 0, 28, 35], ['Унтлагын 2', 73, 0, 27, 35], ['Кухнэ', 45, 35, 30, 25], ['Угаалга', 75, 35, 25, 25], ['Тагт', 0, 55, 45, 10]],
    4: [['Зочны өрөө', 0, 0, 42, 50], ['Унтлагын 1', 42, 0, 28, 32], ['Унтлагын 2', 70, 0, 30, 32], ['Унтлагын 3', 42, 32, 28, 28], ['Кухнэ', 70, 32, 30, 28], ['Угаалга', 0, 50, 42, 15]]
  };
  const layout = layouts[Math.min(4, rooms)] || layouts[2];
  return `
    <svg class="fp-svg" viewBox="0 0 100 65" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="fp-grid" width="2" height="2" patternUnits="userSpaceOnUse">
          <path d="M 2 0 L 0 0 0 2" fill="none" stroke="rgba(196,242,94,.08)" stroke-width="0.1"/>
        </pattern>
      </defs>
      <rect width="100" height="65" fill="url(#fp-grid)"/>
      <!-- Outer wall -->
      <rect x="0.5" y="0.5" width="99" height="64" fill="none" stroke="var(--primary)" stroke-width="0.6" rx="1"/>
      ${layout.map(([name, x, y, w, h]) => `
        <g>
          <rect x="${x+0.5}" y="${y+0.5}" width="${w-1}" height="${h-1}" fill="rgba(196,242,94,.04)" stroke="rgba(196,242,94,.4)" stroke-width="0.3"/>
          <text x="${x + w/2}" y="${y + h/2}" font-size="2.2" fill="var(--text-2)" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, monospace">${name}</text>
          <text x="${x + w/2}" y="${y + h/2 + 3}" font-size="1.6" fill="var(--text-3)" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, monospace">${Math.round(area * (w*h/6500))}м²</text>
        </g>
      `).join('')}
      <text x="50" y="62.5" font-size="2" fill="var(--text-3)" text-anchor="middle" font-family="ui-monospace, monospace" letter-spacing="0.3">${l.khotkhon.toUpperCase()} · ${rooms} ӨРӨӨ · ${area}М²</text>
    </svg>
  `;
}

function trustBadges(l) {
  const ag = getAgent(l.agentId);
  return [
    { on: ag.verified, icon: 'badge-check', label: 'Баталгаажсан агент' },
    { on: true,                icon: 'image',       label: 'Зураг бодит' },
    { on: l.lat != null,       icon: 'map-pin',     label: 'Координат батлагдсан' },
    { on: (l.priceHistory||[]).length > 0, icon: 'line-chart', label: 'Үнийн түүхтэй' },
    { on: l.year >= 2018,      icon: 'sparkles',    label: 'Шинэ ашиглалт' }
  ];
}

/* ---------- bus stop helpers ---------- */
function getBusStop(id) { return BUS_STOPS.find(s => s.id === id); }
function distToStop(listing, stop) {
  const dx = listing.lat - stop.lat;
  const dy = listing.lng - stop.lng;
  return Math.sqrt(dx*dx + dy*dy);
}
function stopListingCount(stop, mode) {
  return modeListings(mode).filter(l => distToStop(l, stop) <= BUS_STOP_RADIUS).length;
}
function nearestStop(listing) {
  let best = null, bestD = Infinity;
  for (const s of BUS_STOPS) {
    const d = distToStop(listing, s);
    if (d < bestD) { bestD = d; best = s; }
  }
  return { stop: best, dist: bestD };
}
/* Ойролцоо зайг "минут"-аар харуулах (хэвийн нэгж × ~6 мин/100м хөдөлгөөн). */
function stopWalkMinutes(dist) {
  return Math.max(1, Math.round(dist * 60));
}

/* Олон зар нэг хороололд (ижил lat/lng-тэй) байвал спираль маягаар жижиг offset өгч
   pin-нүүд бүгд харагдаж байх. Үндсэн listing-ийг өөрчилөхгүй, шинэ {x, y} тооцоолно. */
function spreadPins(listings) {
  const buckets = new Map();
  return listings.map(l => {
    const key = `${l.lat.toFixed(2)}_${l.lng.toFixed(2)}`;
    const n = buckets.get(key) || 0;
    buckets.set(key, n + 1);
    if (n === 0) return { l, x: l.lat, y: l.lng };
    // Жижиг тойрог: 0, 60°, 120°... радиус 0.022 + n*0.006
    const angle = (n * 60 - 30) * Math.PI / 180;
    const radius = 0.022 + (Math.floor((n - 1) / 6)) * 0.014;
    return {
      l,
      x: Math.max(0.04, Math.min(0.96, l.lat + Math.cos(angle) * radius)),
      y: Math.max(0.04, Math.min(0.96, l.lng + Math.sin(angle) * radius))
    };
  });
}

function mapBackground(listings, opts = {}) {
  const { selectedId = null, style = '', interactiveZones = true, showZoneSummary = true } = opts;
  const selectedDistrict = state.filterDistrict;
  const baseListings = modeListings();
  const selStats = selectedDistrict ? districtStats(selectedDistrict, baseListings) : null;
  const positioned = spreadPins(listings);
  const heatmapOn = state.mapMode === 'heatmap';
  const allAvgs = DISTRICT_ZONES.map(z => {
    const s = districtStats(z.name, baseListings);
    return s.count ? s.ppm : null;
  });

  return `
    <div class="map-shell w-full ${heatmapOn?'heatmap-on':''}" style="height:100%; ${style}">
      <div class="map-bg"></div>
      <svg class="map-zones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${DISTRICT_ZONES.map((z, zi) => {
          const s = districtStats(z.name, baseListings);
          const isSel = selectedDistrict === z.name;
          const dim = selectedDistrict && !isSel ? ' dim' : '';
          const click = interactiveZones ? `onclick="selectDistrictZone('${z.name}', event)"` : '';
          const heatCls = heatmapOn && s.count ? ' heat-' + heatBucket(s.ppm, allAvgs) : '';
          return `<polygon class="map-zone${isSel?' selected':''}${dim}${s.count?'':' empty'}${heatCls}" data-district="${z.name}" data-count="${s.count}" points="${z.points}" ${click}><title>${z.name} · ${s.count} зар${s.count?' · '+fmtCompact(s.min)+(s.min!==s.max?'–'+fmtCompact(s.max):''):''}${heatmapOn && s.count ? ' · м² ₮'+Math.round(s.ppm).toLocaleString('en-US') : ''}</title></polygon>`;
        }).join('')}
      </svg>
      ${DISTRICT_ZONES.map(z => {
        const s = districtStats(z.name, baseListings);
        const isSel = selectedDistrict === z.name;
        const dim = selectedDistrict && !isSel ? ' dim' : '';
        return `<div class="map-zone-label${isSel?' selected':''}${dim}" style="left:${z.label.x}%; top:${z.label.y}%;">
          <div class="map-zone-name">${z.name.toUpperCase()}</div>
          ${s.count ? `<div class="map-zone-meta num">${s.count} зар · ${fmtCompact(s.min)}${s.min!==s.max?'–'+fmtCompact(s.max):''}</div>` : '<div class="map-zone-meta">зар алга</div>'}
        </div>`;
      }).join('')}
      ${(showZoneSummary && selStats && selStats.count) ? `
        <div class="zone-summary">
          <div class="zone-summary-head">
            <div class="zone-summary-title"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${selectedDistrict} дүүрэг</div>
            <button class="zone-summary-close" onclick="clearDistrictZone()" title="Бүсчлэлийг арилгах"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
          </div>
          <div class="zone-summary-grid">
            <div class="zone-summary-stat">
              <div class="zone-summary-stat-label">Нийт зар</div>
              <div class="zone-summary-stat-val num">${selStats.count}</div>
            </div>
            <div class="zone-summary-stat">
              <div class="zone-summary-stat-label">Үнийн муж</div>
              <div class="zone-summary-stat-val num">${fmtCompact(selStats.min)}${selStats.min!==selStats.max?' – '+fmtCompact(selStats.max):''}</div>
            </div>
            <div class="zone-summary-stat">
              <div class="zone-summary-stat-label">Дундаж м²</div>
              <div class="zone-summary-stat-val num">${fmtCompact(Math.round(selStats.ppm))}</div>
            </div>
          </div>
          <div class="zone-summary-list">
            ${selStats.listings.map(l => `
              <div class="zone-summary-row" onclick="openProperty(${l.id})">
                <div class="zone-summary-row-thumb" style="background-image:url('${photoUrl(l, 0, '80/80')}')"></div>
                <div class="zone-summary-row-body">
                  <div class="zone-summary-row-title">${l.khotkhon} · ${l.rooms} өрөө</div>
                  <div class="zone-summary-row-meta">${l.area}м² · ${l.floor} · ${l.khoroo}-р хороо</div>
                </div>
                <div class="zone-summary-row-price num">${l.mode==='rent' ? fmtCompact(l.price)+'/с' : fmtCompact(l.price)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${(opts.showControls !== false) ? `
        <div class="map-mode-toggle">
          <button class="${!heatmapOn?'active':''}" onclick="setMapMode('pins')" title="Pin горим"><i data-lucide="map-pin" class="w-3 h-3"></i> Pin</button>
          <button class="${heatmapOn?'active':''}" onclick="setMapMode('heatmap')" title="Үнийн heatmap"><i data-lucide="flame" class="w-3 h-3"></i> Heatmap</button>
        </div>
        <div class="map-controls">
          <button class="map-ctrl-btn" onclick="toggleFullMap()" title="${state.fullMap?'Жагсаалт нээх':'Газрын зургийг дэлгэх'}">
            <i data-lucide="${state.fullMap?'minimize-2':'maximize-2'}" class="w-4 h-4"></i>
          </button>
          ${state.highlightedId ? `<button class="map-ctrl-btn" onclick="recenterMap()" title="Тэмдэглэгээ арилгах"><i data-lucide="crosshair" class="w-4 h-4"></i></button>` : ''}
          ${(state.filterDistrict || state.filterBusStop || state.filterRooms || (state.filterLifestyle||[]).length) ? `<button class="map-ctrl-btn" onclick="resetAllMapFilters()" title="Шүүлтүүр цэвэрлэх"><i data-lucide="filter-x" class="w-4 h-4"></i></button>` : ''}
        </div>
        ${heatmapOn ? `
          <div class="heatmap-legend">
            <span class="text-[var(--text-3)]">м² үнэ:</span>
            <span class="heatmap-legend-bar"></span>
            <span class="text-[var(--text-3)]">хямд → үнэтэй</span>
          </div>
        ` : ''}
      ` : ''}

      ${(opts.showContext !== false && (state.filterDistrict || state.filterBusStop)) ? `
        <div class="map-context">
          <i data-lucide="${state.filterBusStop?'bus':'map-pin'}" class="w-3.5 h-3.5" style="color: var(--primary);"></i>
          <span>${state.filterBusStop ? (getBusStop(state.filterBusStop)?.name || '') + ' буудал' : state.filterDistrict + ' дүүрэг'}</span>
          <span class="map-context-count num">${listings.length}</span>
          <button class="map-context-clear" onclick="resetAllMapFilters()" title="Цэвэрлэх"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
        </div>
      ` : ''}

      ${listings.length === 0 ? `
        <div class="map-empty">
          <i data-lucide="search-x" class="w-8 h-8"></i>
          <div class="text-sm font-medium">Газрын зураг дээр зар олдсонгүй</div>
          <div class="text-xs">Шүүлтүүрээ өргөтгөж үзнэ үү</div>
        </div>
      ` : ''}

      ${heatmapOn ? '' : positioned.map(({ l, x, y }, idx) => {
        const ag = getAgent(l.agentId);
        const status = STATUS_PILL[l.status] || ['',''];
        const flipCls = (y < 0.28 ? ' tip-below' : '')
                      + (x < 0.18 ? ' tip-right' : '')
                      + (x > 0.82 ? ' tip-left'  : '');
        const idxLabel = idx + 1;
        const viewedCls = isViewed(l.id) ? ' viewed' : '';
        return `
        <div class="map-pin-wrap${flipCls}" data-pin-id="${l.id}" style="left:${x*100}%; top:${y*100}%;">
          <button class="map-pin ${l.id===selectedId?'selected':''} ${l.status==='hot'?'cta':''}${viewedCls}"
            data-pin-id="${l.id}"
            onclick="onPinClick(${l.id})"
            onmouseenter="setHover(${l.id}, true); this.parentElement.classList.add('hover')"
            onmouseleave="setHover(${l.id}, false); this.parentElement.classList.remove('hover')">
            <span class="pin-idx">${idxLabel}</span>${fmtPinPrice(l.price, l.mode)}
          </button>
          <div class="map-pin-tip">
            <div class="map-pin-tip-photo" style="background-image:url('${photoUrl(l, 0, '240/160')}')">
              ${status[1] ? `<span class="pill ${status[0]}" style="position:absolute; top:6px; left:6px;">${status[1]}</span>` : ''}
            </div>
            <div class="map-pin-tip-body">
              <div class="map-pin-tip-price num">${listingPrice(l)}</div>
              <div class="map-pin-tip-title">${l.khotkhon}</div>
              <div class="map-pin-tip-meta">${l.rooms} өрөө · ${l.area}м² · ${l.floor} · ${l.year} он</div>
              <div class="map-pin-tip-sub">${l.district}, ${l.khoroo}-р хороо</div>
              <div class="map-pin-tip-agent">
                <span class="map-pin-tip-avatar">${ag.initials}</span>
                <span class="map-pin-tip-agentname">${ag.name}${ag.verified?' ✓':''}</span>
              </div>
              <button class="map-pin-tip-cta" onclick="event.stopPropagation(); openProperty(${l.id})">Дэлгэрэнгүй →</button>
            </div>
          </div>
        </div>`;
      }).join('')}

      <!-- Mobile bottom sheet (filled by JS when pin is selected on mobile) -->
      <div id="map-sheet-host"></div>
    </div>
  `;
}

/* ---------- MAP ↔ LIST SYNC (no re-render) ---------- */
function setHover(id, on) {
  const cards = document.querySelectorAll(`.prop-card[data-listing-id="${id}"]`);
  const pins = document.querySelectorAll(`.map-pin[data-pin-id="${id}"]`);
  const shells = document.querySelectorAll('.map-shell');
  cards.forEach(c => c.classList.toggle('hovered', on));
  pins.forEach(p => p.classList.toggle('hovered', on));
  shells.forEach(s => s.classList.toggle('has-hover', on));
}
window.setHover = setHover;

function onPinClick(id) {
  // Highlight without full re-render. Scroll matching card into view.
  const prev = state.highlightedId;
  state.highlightedId = id;

  // Toggle DOM classes for pins
  document.querySelectorAll('.map-pin').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll(`.map-pin[data-pin-id="${id}"]`).forEach(p => p.classList.add('selected'));

  // Toggle DOM classes for cards (highlight + flash) + scroll
  document.querySelectorAll('.prop-card').forEach(c => c.classList.remove('highlighted','flash'));
  const card = document.querySelector(`.prop-card[data-listing-id="${id}"]`);
  if (card) {
    card.classList.add('highlighted','flash');
    setTimeout(() => card.classList.remove('flash'), 1100);
    // Scroll into view (only if visible — desktop list view)
    if (state.mobileView !== 'map' || window.innerWidth >= 1024) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Mobile bottom sheet
  if (window.innerWidth < 1024 && state.mobileView === 'map') {
    renderMapSheet(id);
  }

  // Re-show controls (recenter button toggle) without full rerender
  refreshMapControls();
}
window.onPinClick = onPinClick;
// Хуучин нэртэй холбоосыг хадгалъя
window.highlightFromPin = onPinClick;

function recenterMap() {
  state.highlightedId = null;
  document.querySelectorAll('.map-pin').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll('.prop-card').forEach(c => c.classList.remove('highlighted'));
  closeMapSheet();
  refreshMapControls();
}
window.recenterMap = recenterMap;

function toggleFullMap() {
  state.fullMap = !state.fullMap;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.toggleFullMap = toggleFullMap;

function resetAllMapFilters() {
  state.filterDistrict = null;
  state.filterRooms = null;
  state.filterBusStop = null;
  state.filterLifestyle = [];
  state.aiQuery = '';
  state.aiExtracted = null;
  state.highlightedId = null;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.resetAllMapFilters = resetAllMapFilters;

function removeFilter(kind, val) {
  if (kind === 'district') state.filterDistrict = null;
  else if (kind === 'rooms') state.filterRooms = null;
  else if (kind === 'busStop') state.filterBusStop = null;
  else if (kind === 'lifestyle') state.filterLifestyle = (state.filterLifestyle||[]).filter(x => x !== val);
  else if (kind === 'ai') { state.aiQuery = ''; state.aiExtracted = null; }
  state.highlightedId = null;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.removeFilter = removeFilter;

function activeFilterChips() {
  const chips = [];
  if (state.aiQuery) chips.push({ kind: 'ai', label: 'AI: ' + (state.aiQuery.length > 28 ? state.aiQuery.slice(0,28)+'…' : state.aiQuery), icon: 'sparkles' });
  if (state.filterDistrict) chips.push({ kind: 'district', label: state.filterDistrict, icon: 'map-pin' });
  if (state.filterRooms) chips.push({ kind: 'rooms', label: state.filterRooms + ' өрөө', icon: 'bed-double' });
  if (state.filterBusStop) {
    const s = getBusStop(state.filterBusStop);
    if (s) chips.push({ kind: 'busStop', label: s.name, icon: 'bus' });
  }
  (state.filterLifestyle || []).forEach(k => {
    const def = LIFESTYLE_DEFS.find(x => x.key === k);
    if (def) chips.push({ kind: 'lifestyle', val: k, label: def.label, icon: def.icon });
  });
  return chips;
}

/* ---------- HEATMAP / MAP MODE ---------- */
function setMapMode(mode) {
  state.mapMode = mode;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.setMapMode = setMapMode;

function heatBucket(avgPpm, allAvgs) {
  // 1..5 (cheap..expensive), allAvgs нь дүүрэгүүдийн avg ppm массив.
  const valid = allAvgs.filter(v => v != null);
  if (!valid.length || avgPpm == null) return 0;
  const min = Math.min(...valid), max = Math.max(...valid);
  if (max === min) return 3;
  const t = (avgPpm - min) / (max - min);
  return Math.min(5, Math.max(1, Math.ceil(t * 5)));
}

/* ---------- VIEWED ---------- */
function isViewed(id) {
  return Array.isArray(window.VIEWED_IDS) && window.VIEWED_IDS.includes(id);
}

function refreshMapControls() {
  // Re-render just the controls area без рендэр of full map.
  // For simplicity, we re-render the whole results section to keep code small.
  // Хэрэв scroll алдагдвал нэгмөсөн рендэр алдсан гэхдээ зөвхөн highlight солилт үед хэрэглэгдэхгүй.
  // Тиймээс хоосон үлдээе — controls нь дараагийн full render үед шинэчлэгдэнэ.
}

function renderMapSheet(id) {
  const host = document.getElementById('map-sheet-host');
  if (!host) return;
  const l = getListing(id);
  if (!l) return;
  host.innerHTML = `
    <div class="map-sheet" data-sheet-for="${id}">
      <div class="map-sheet-thumb" style="background-image:url('${photoUrl(l, 0, '200/200')}')"></div>
      <div class="map-sheet-body">
        <div class="map-sheet-price num">${listingPrice(l)}</div>
        <div class="map-sheet-title">${l.khotkhon}</div>
        <div class="map-sheet-meta">${l.rooms} өрөө · ${l.area}м² · ${l.district}</div>
      </div>
      <button class="map-sheet-go" onclick="openProperty(${id})">Үзэх →</button>
      <button class="map-sheet-close" onclick="closeMapSheet()"><i data-lucide="x" class="w-3 h-3"></i></button>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}
window.renderMapSheet = renderMapSheet;

function closeMapSheet() {
  const host = document.getElementById('map-sheet-host');
  if (host) host.innerHTML = '';
}
window.closeMapSheet = closeMapSheet;

function renderFilterBlocks() {
  const ist = state.mode === 'rent';
  const list = modeListings();
  const stop = state.filterBusStop ? getBusStop(state.filterBusStop) : null;
  return `
    <div class="space-y-5">
      <div>
        <div class="eyebrow mb-2 flex items-center justify-between">
          <span class="flex items-center gap-1.5"><i data-lucide="bus" class="w-3 h-3"></i> Автобусны буудал</span>
          ${stop ? `<button onclick="state.filterBusStop=null; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="text-[10px] text-[var(--text-3)] hover:text-[var(--text)] normal-case tracking-normal">Арилгах</button>` : ''}
        </div>
        ${stop ? `
          <div class="card p-3 flex items-center gap-2.5" style="border-color: var(--primary); background: var(--primary-soft);">
            <div class="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style="background: var(--primary); color: #0A1F44;">
              <i data-lucide="bus" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium truncate">${stop.name}</div>
              <div class="text-[10px] text-[var(--text-3)]">${stop.district} · ${stop.routes.length} маршрут</div>
            </div>
          </div>
        ` : `
          <button onclick="openBusStopPicker()" class="w-full card p-3 text-left text-sm text-[var(--text-2)] hover:border-[var(--primary)] transition flex items-center justify-between">
            <span>Буудал сонгох</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        `}
      </div>
      <div>
        <div class="eyebrow mb-2">Дүүрэг</div>
        <div class="space-y-0.5">
          ${DISTRICTS.map(d => {
            const c = list.filter(l => l.district === d).length;
            return `<label class="filter-row">
              <input type="checkbox" ${state.filterDistrict===d?'checked':''} onchange="state.filterDistrict = this.checked ? '${d}' : null; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" />
              <span>${d}</span><span class="count num">${c}</span>
            </label>`;
          }).join('')}
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">Өрөөний тоо</div>
        <div class="grid grid-cols-4 gap-2">
          ${[1,2,3,4].map(n => `<button onclick="state.filterRooms = state.filterRooms===${n} ? null : ${n}; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="src-chip py-2 ${state.filterRooms===n?'selected':''}">${n}${n===4?'+':''}</button>`).join('')}
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">${ist?'Сарын түрээс':'Үнэ'}</div>
        <div class="flex items-end gap-[2px] h-12 mb-3">
          ${[3,5,8,12,18,22,26,22,16,11,7,4,2].map(h => `<div class="flex-1 rounded-sm" style="height:${h*3.5}%; background: var(--primary); opacity:${(h/30).toFixed(2)};"></div>`).join('')}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input class="input num" value="${ist?'800,000':'300,000,000'}" />
          <input class="input num" value="${ist?'2,000,000':'600,000,000'}" />
        </div>
      </div>
    </div>
  `;
}

/* ---------- listing card ---------- */
/* ============== BAIRMAP — NEW LISTING CARDS ============== */

/* Vertical card (used on home "Онцлох" rail and 4-col grids) */
function bmListingCard(l) {
  const verified = isListingVerified(l);
  const saved = SAVED_IDS.has(l.id);
  return `
    <div class="bm-listing" onclick="openProperty(${l.id})">
      <div class="bm-listing-photo" style="background-image:url('${photoUrl(l, 0, '600/450')}')">
        ${verified ? `<span class="bm-verified"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
      </div>
      <div class="bm-listing-body">
        <div class="bm-listing-title">${l.khotkhon}</div>
        <div class="bm-listing-loc">${l.district} дүүрэг, ${l.khoroo}-р хороо</div>
        <div class="bm-listing-specs">
          <span><i data-lucide="bed-double" class="w-3.5 h-3.5"></i>${l.rooms} өрөө</span>
          <span><i data-lucide="ruler" class="w-3.5 h-3.5"></i>${l.area} м²</span>
        </div>
        <div class="bm-listing-price-wrap">
          <div>
            <div class="bm-listing-price num">${l.price.toLocaleString('en-US')}₮</div>
            <div class="bm-listing-ppm num">${listingPpm(l).toLocaleString('en-US')}₮/м²</div>
          </div>
          <button class="bm-listing-heart ${saved?'saved':''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
            <i data-lucide="heart" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>`;
}

/* Horizontal row (used on results list) */
function bmListingRow(l) {
  const verified = isListingVerified(l);
  const saved = SAVED_IDS.has(l.id);
  const ipoteh = hasIpoteh(l);
  const floors = (l.floor && /\//.test(l.floor)) ? l.floor : (l.floor + '/—');
  return `
    <div class="bm-listing-row" onclick="openProperty(${l.id})">
      <div class="bm-listing-photo" style="background-image:url('${photoUrl(l, 0, '400/300')}')">
        ${verified ? `<span class="bm-verified"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
      </div>
      <div class="bm-listing-row-body">
        <div class="bm-listing-row-top">
          <div class="min-w-0">
            <div class="bm-listing-row-title">${l.khotkhon}</div>
            <div class="bm-listing-row-loc">${l.district} дүүрэг, ${l.khoroo}-р хороо</div>
          </div>
          <button class="bm-listing-heart ${saved?'saved':''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
            <i data-lucide="heart" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="bm-listing-row-specs">
          <span><i data-lucide="bed-double" class="w-3.5 h-3.5"></i>${l.rooms} өрөө</span>
          <span><i data-lucide="ruler" class="w-3.5 h-3.5"></i>${l.area} м²</span>
          <span><i data-lucide="building" class="w-3.5 h-3.5"></i>${floors} давхар</span>
        </div>
        <div>
          <div class="bm-listing-row-price num">${l.price.toLocaleString('en-US')}₮</div>
          <div class="bm-listing-row-ppm num">${listingPpm(l).toLocaleString('en-US')}₮/м²</div>
        </div>
        <div class="bm-listing-row-bottom">
          ${ipoteh ? '<span class="bm-tag">Ипотектэй</span>' : '<span></span>'}
          <span class="bm-time">${listingMinutesAgo(l)}</span>
        </div>
      </div>
    </div>`;
}

function listingCard(l, opts = {}) {
  const { compact = false, pinIndex = null } = opts;
  const ag = getAgent(l.agentId);
  const isSaved = SAVED_IDS.has(l.id);
  const status = STATUS_PILL[l.status] || ['',''];
  const ns = nearestStop(l);
  const stopMin = ns.stop ? stopWalkMinutes(ns.dist) : null;
  const viewed = isViewed(l.id);
  return `
    <div class="prop-card ${state.highlightedId===l.id?'highlighted':''} ${viewed?'viewed':''}"
      data-listing-id="${l.id}"
      onclick="openProperty(${l.id})"
      onmouseenter="setHover(${l.id}, true)"
      onmouseleave="setHover(${l.id}, false)">
      ${pinIndex != null ? `<span class="card-pin-badge num" title="Газрын зураг дээрх ${pinIndex}-р pin">${pinIndex}</span>` : ''}
      <div class="photo" style="background-image:url('${photoUrl(l, 0, '600/400')}')">
        <div class="absolute top-3 left-3 flex gap-1.5" style="${pinIndex != null ? 'margin-left: 32px;' : ''}">
          ${status[0] ? `<span class="pill ${status[0]}">${status[1]}</span>` : ''}
          ${l.listedDays <= 3 ? `<span class="pill pill-new">${l.listedDays===0?'Өнөөдөр':l.listedDays+' хоног'}</span>` : ''}
          ${viewed ? `<span class="viewed-badge"><i data-lucide="eye" class="w-2.5 h-2.5"></i> Үзсэн</span>` : ''}
        </div>
        <button class="heart-btn absolute top-2.5 right-2.5 ${isSaved?'saved':''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
          <i data-lucide="heart" class="w-4 h-4"></i>
        </button>
        <div class="photo-dots"><span class="active"></span><span></span><span></span><span></span></div>
      </div>
      <div class="p-4">
        <div class="flex items-start justify-between gap-2 mb-1">
          <div class="min-w-0">
            <div class="font-semibold text-[15px] truncate">${l.khotkhon}</div>
            <div class="text-xs text-[var(--text-3)] mt-0.5">${l.district}, ${l.khoroo}-р хороо</div>
          </div>
          <div class="text-right">
            <div class="num text-[15px]" style="color: var(--primary);">${l.mode==='rent' ? fmtCompact(l.price)+'/сар' : fmtCompact(l.price)}</div>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-[var(--text-2)] mt-2">
          <span class="flex items-center gap-1"><i data-lucide="bed-double" class="w-3 h-3"></i> ${l.rooms} өрөө</span>
          <span class="flex items-center gap-1"><i data-lucide="ruler" class="w-3 h-3"></i> ${l.area}м²</span>
          <span class="flex items-center gap-1"><i data-lucide="building" class="w-3 h-3"></i> ${l.floor}</span>
        </div>
        ${ns.stop ? `<div class="flex items-center gap-1.5 text-[11px] mt-2" style="color: var(--text-3);">
          <i data-lucide="bus" class="w-3 h-3" style="color: var(--primary);"></i>
          <span class="truncate">${ns.stop.name}</span>
          <span class="text-[var(--text-3)]">·</span>
          <span class="num">${stopMin} мин</span>
        </div>` : ''}
        ${compact ? '' : `<div class="flex items-center justify-between mt-3 pt-3 border-t" style="border-color: var(--border);">
          <div class="flex items-center gap-2 text-xs text-[var(--text-3)]">
            <div class="w-5 h-5 rounded-full text-white text-[9px] font-semibold flex items-center justify-center" style="background: linear-gradient(135deg, #0A1F44 0%, #051028 100%);">${ag.initials}</div>
            <span>${ag.name.split(' ').slice(-1)[0]}</span>
            ${ag.verified ? '<i data-lucide="badge-check" class="w-3 h-3" style="color: var(--primary);"></i>' : ''}
          </div>
          <span class="text-[11px] text-[var(--text-3)]">${l.viewCount} үзсэн</span>
        </div>`}
      </div>
    </div>
  `;
}

/* ============== NEO LIMIT — SHARED FOOTER ============== */
function bmFooter() {
  return `
    <footer class="bm-footer mt-16 lg:mt-24">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-14">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div class="col-span-2 md:col-span-3 lg:col-span-2">
            <div class="flex items-center gap-2.5 mb-4">
              <svg class="w-10 h-10" style="color: var(--gold-brand);"><use href="#bm-logo"/></svg>
              <span class="flex flex-col leading-none">
                <span class="text-xl font-bold" style="letter-spacing: -0.02em;">NEO LIMIT</span>
                <span class="text-[10px] font-semibold tracking-[.22em] mt-1" style="color: var(--gold-brand);">PROPERTY</span>
              </span>
            </div>
            <p class="text-sm" style="color: var(--text-2); max-width: 360px; line-height: 1.6;">
              NEO LIMIT PROPERTY бол Монголын үл хөдлөхийн хамгийн найдвартай, ухаалаг, хүртээмжтэй зуучлал, зөвлөгөө, үнэлгээний цогц платформ юм.
            </p>
            <div class="flex items-center gap-3 mt-6">
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="facebook" class="w-4 h-4"></i></a>
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="instagram" class="w-4 h-4"></i></a>
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="youtube" class="w-4 h-4"></i></a>
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="linkedin" class="w-4 h-4"></i></a>
            </div>
          </div>

          <div>
            <div class="bm-footer-h">Үндсэн цэс</div>
            <ul class="space-y-2.5">
              <li><a onclick="goTo('home')">Нүүр</a></li>
              <li><a onclick="setMode('sale'); goTo('results')">Худалдах</a></li>
              <li><a onclick="setMode('rent'); goTo('results')">Түрээслэх</a></li>
              <li><a onclick="goTo('results')">Төслүүд</a></li>
              <li><a onclick="goTo('results')">Коммерц</a></li>
            </ul>
          </div>

          <div>
            <div class="bm-footer-h">Туслами</div>
            <ul class="space-y-2.5">
              <li><a>Туслами төв</a></li>
              <li><a>Хэрэглэх зааварчилгаа</a></li>
              <li><a>Нууцлалын бодлого</a></li>
              <li><a>Үйлчилгээний нөхцөл</a></li>
            </ul>
          </div>

          <div>
            <div class="bm-footer-h">Бидний тухай</div>
            <ul class="space-y-2.5">
              <li><a>Бидний тухай</a></li>
              <li><a>Мэдээ, нийтлэл</a></li>
              <li><a>Ажлын байр</a></li>
              <li><a>Хамтран ажиллах</a></li>
            </ul>
          </div>

          <div class="col-span-2 md:col-span-3 lg:col-span-1">
            <div class="bm-footer-h">Холбоо барих</div>
            <ul class="space-y-2.5 text-sm" style="color: var(--text-2);">
              <li class="flex items-start gap-2"><i data-lucide="phone" class="w-4 h-4 mt-0.5" style="color: var(--gold-brand);"></i> 5517-1010</li>
              <li class="flex items-start gap-2"><i data-lucide="mail" class="w-4 h-4 mt-0.5" style="color: var(--gold-brand);"></i> info@neolimit.mn</li>
              <li class="flex items-start gap-2"><i data-lucide="map-pin" class="w-4 h-4 mt-0.5" style="color: var(--gold-brand);"></i> Сүхбаатар дүүрэг, 1-р хороо,<br/>Peace Tower, 11 давхар</li>
            </ul>
          </div>
        </div>

        <div class="mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs" style="border-top: 1px solid var(--border); color: var(--text-3);">
          <div>© ${new Date().getFullYear()} NEO LIMIT PROPERTY LLC. Бүх эрх хуулиар хамгаалагдсан.</div>
          <div>Made with <span style="color: var(--gold-brand);">♥</span> in Mongolia</div>
        </div>
      </div>
    </footer>`;
}

/* ============== HOME (NEO LIMIT — Image 1) ============== */
function renderHome() {
  const featured = LISTINGS.filter(l => l.status !== 'sold').slice(0, 5);
  const newListings = LISTINGS.filter(l => l.status === 'new' || l.listedDays <= 5).slice(0, 4);
  const heroSpotlight = LISTINGS.find(l => l.status === 'hot') || LISTINGS.find(l => l.photos);
  // Кластер pin тус бүрд хамгийн өндөр үнэтэй жишиг зар-ыг урьдчилан таалуулна
  const clusterSample = (name) => {
    const arr = LISTINGS.filter(l => l.district === name && l.mode === 'sale' && l.status !== 'sold');
    return arr.sort((a,b) => b.price - a.price)[0] || LISTINGS.find(l => l.district === name) || null;
  };
  const clusters = [
    { name: 'Сүхбаатар',  count: 120, x: 46, y: 26, sample: clusterSample('Сүхбаатар') },
    { name: 'Чингэлтэй',  count: 85,  x: 76, y: 30, sample: clusterSample('Чингэлтэй'),  flipLeft: true },
    { name: 'Хан-Уул',    count: 92,  x: 26, y: 56, sample: clusterSample('Хан-Уул') },
    { name: 'Баянзүрх',   count: 84,  x: 58, y: 48, sample: clusterSample('Баянзүрх'),   flipLeft: true }
  ];

  return `
    <!-- ============== HERO ============== -->
    <section class="bm-hero">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 pt-10 lg:pt-16 pb-10 relative">
        <div class="grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
          <div>
            <h1 class="bm-hero-title">
              Өөрт тохирох үл хөдлөхөө<br/>
              <span class="gold">ухаалгаар</span> олоорой
            </h1>
            <p class="bm-hero-sub mt-5">
              AI технологитой NEO LIMIT хайлт нь таны хэрэгцээг ойлгон хамгийн тохирох үл хөдлөхийг санал болгоно.
            </p>
          </div>
          <div class="bm-cluster-map">
            <!-- Үндсэн зам, БНХАУ, ringroad схем -->
            <svg class="bm-cluster-svg" viewBox="0 0 400 250" preserveAspectRatio="none">
              <!-- Энх Тайвны өргөн чөлөө (зүүнээс баруун) -->
              <path class="road main" d="M 0,110 C 80,108 160,115 220,112 C 290,109 340,118 400,114" />
              <!-- Эрх чөлөөний өргөн чөлөө (хойноос урагш) -->
              <path class="road main" d="M 200,0 C 198,60 205,110 200,160 C 198,200 202,230 200,250" />
              <!-- Чингисийн өргөн чөлөө (нийслэлийн goal зам) -->
              <path class="road" stroke-width="1.6" d="M 60,40 C 120,80 180,100 240,130 C 290,150 340,180 400,200" />
              <!-- Ринг зам -->
              <path class="road ring" d="M 50,40 C 30,90 30,160 60,200 C 130,235 250,235 330,210 C 380,180 380,80 340,40 C 270,15 130,15 50,40 Z" />
              <!-- Туул гол -->
              <path class="river-soft" d="M -10,200 C 80,195 160,205 240,200 C 310,196 360,205 410,202" />
              <path class="river"      d="M -10,200 C 80,195 160,205 240,200 C 310,196 360,205 410,202" />
              <!-- Малагдсан жижиг зам сүлжээ -->
              <path class="road" stroke-width=".8" d="M 80,60 L 160,80 L 240,72 L 320,90" />
              <path class="road" stroke-width=".8" d="M 90,150 L 180,168 L 270,160 L 350,180" />
              <path class="road" stroke-width=".8" d="M 130,30 L 145,90 L 158,150 L 172,210" />
              <path class="road" stroke-width=".8" d="M 260,30 L 275,90 L 288,150 L 300,210" />
            </svg>

            <!-- Background district / landmark labels -->
            <span class="bm-cluster-rgn" style="left:48%; top:42%;">UB CENTER</span>
            <span class="bm-cluster-rgn" style="left:88%; top:84%;">ЗАЙСАН</span>
            <span class="bm-cluster-rgn" style="left:11%; top:78%; transform: translate(-50%,-50%) rotate(-3deg);">TUUL GOL</span>
            <span class="bm-cluster-rgn" style="left:11%; top:14%;">СОНГИНОХАЙРХАН</span>
            <span class="bm-cluster-rgn" style="left:90%; top:14%;">НАЛАЙХ</span>

            <!-- Top-left legend -->
            <div class="bm-cluster-legend">
              <i data-lucide="layers" class="w-3 h-3"></i>
              УБ хот · 6 дүүрэг
            </div>

            <!-- Cluster pins with hover preview -->
            ${clusters.map(c => `
              <div class="bm-cluster ${c.flipLeft?'flip-left':''}" style="left:${c.x}%; top:${c.y}%;" onclick="clearAllFilters(); state.filterDistrict='${c.name}'; state.mode='sale'; goTo('results')">
                <button class="bm-cluster-pin">${c.count}+</button>
                <span class="bm-cluster-label">${c.name}</span>
                ${c.sample ? `
                  <div class="bm-cluster-preview">
                    <div class="bm-cluster-preview-photo" style="background-image:url('${photoUrl(c.sample, 0, '240/160')}')">
                      <span class="bm-cluster-preview-tag">${c.sample.mode==='rent'?'ТҮРЭЭС':'ЗАРЫГ'}</span>
                    </div>
                    <div class="bm-cluster-preview-title">${c.sample.khotkhon}</div>
                    <div class="bm-cluster-preview-meta">${c.sample.rooms} өрөө · ${c.sample.area}м²</div>
                    <div class="bm-cluster-preview-price">${fmtCompact(c.sample.price)}${c.sample.mode==='rent'?'/сар':''}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}

            <!-- Floating featured card (bottom-right) -->
            ${heroSpotlight ? `
              <div class="bm-cluster-feature" onclick="event.stopPropagation(); openProperty(${heroSpotlight.id})">
                <div class="bm-cluster-feature-photo" style="background-image:url('${photoUrl(heroSpotlight, 0, '240/160')}')">
                  <span class="bm-cluster-feature-tag">ОНЦЛОХ</span>
                </div>
                <div class="bm-cluster-feature-title">${heroSpotlight.khotkhon}</div>
                <div class="bm-cluster-feature-meta">${heroSpotlight.rooms} өрөө · ${heroSpotlight.area}м² · ${heroSpotlight.district}</div>
                <div class="bm-cluster-feature-price num">${listingPriceShort(heroSpotlight)}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- ============== CATEGORY TABS + SEARCH ============== -->
      <div class="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
        <div class="bm-cattabs mb-5">
          ${[
            { k:'sale',    label:'Худалдах',    icon:'home' },
            { k:'rent',    label:'Түрээслэх',   icon:'key-round' },
            { k:'office',  label:'Оффис',       icon:'building-2' },
            { k:'land',    label:'Газар',       icon:'map' },
            { k:'project', label:'Төсөл',       icon:'hammer' }
          ].map(c => `
            <button class="bm-cattab ${(state.mode===c.k || (c.k==='sale' && state.mode==='sale') || (c.k==='rent' && state.mode==='rent'))?'active':''}"
                onclick="${c.k==='sale'||c.k==='rent' ? `setMode('${c.k}')` : `showToast('${c.label} — удахгүй','info')`}">
              <i data-lucide="${c.icon}" class="w-4 h-4"></i> ${c.label}
            </button>
          `).join('')}
        </div>

        <div class="bm-search-mega">
          <i data-lucide="sparkles" class="w-5 h-5 bm-search-icon"></i>
          <input id="bm-home-search" type="text" placeholder="Жишээ: Хан-Уулд 3 өрөө, 350 саяас доош, сургууль ойр байр хай"
            onkeydown="if(event.key==='Enter'){ event.preventDefault(); runAISearch(this.value); }" />
          <button class="bm-search-mega-btn" onclick="runAISearch(document.getElementById('bm-home-search').value)">
            <i data-lucide="search" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- ===== AI EXAMPLE CHIPS — clickable demos ===== -->
        <div class="mt-3 flex items-start gap-2 flex-wrap">
          <span class="text-[11px] font-medium uppercase tracking-wider pt-1.5 flex items-center gap-1" style="color: var(--text-3); letter-spacing: .12em;">
            <i data-lucide="sparkles" class="w-3 h-3" style="color: var(--gold-brand);"></i> Жишээ AI хайлт
          </span>
          ${AI_EXAMPLES.map(ex => `
            <button onclick="runAIExample(${JSON.stringify(ex.text).replace(/"/g, '&quot;')})"
              class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition"
              style="background: var(--surface); border: 1px solid var(--border); color: var(--text-2);"
              onmouseover="this.style.borderColor='var(--gold-brand)'; this.style.color='var(--text)';"
              onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-2)';">
              <i data-lucide="${ex.icon}" class="w-3 h-3"></i> ${ex.text}
            </button>
          `).join('')}
        </div>

        <div class="bm-chip-row mt-5">
          ${[
            { key:'verified', label:'Verified',     icon:'shield-check' },
            { key:'school',   label:'Сургууль ойр', icon:'graduation-cap' },
            { key:'ipoteh',   label:'Ипотектэй',    icon:'landmark' },
            { key:'new',      label:'Шинэ төсөл',   icon:'sparkles' },
            { key:'income',   label:'Орлого өгөх',  icon:'trending-up' }
          ].map(c => `
            <button class="bm-chip" onclick="applyHomeFilterChip('${c.key}')">
              <span class="bm-chip-icon-wrap"><i data-lucide="${c.icon}" class="w-3 h-3"></i></span>
              ${c.label}
            </button>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- ============== ЗАХ ЗЭЭЛИЙН ТАНИЛЦУУЛГА — 5 STAT METRICS ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-10">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        ${[
          { icon:'home',        val:'45,892', label:'Нийт зар' },
          { icon:'tag',         val:'12,345', label:'Худалдах' },
          { icon:'key-round',   val:'8,765',  label:'Түрээс' },
          { icon:'sparkles',    val:'234',    label:'Шинэ зар' },
          { icon:'users',       val:'2,543',  label:'Брокер агент' }
        ].map(s => `
          <div class="card p-4 flex items-center gap-3" style="background: var(--surface);">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background: var(--primary-soft); color: var(--primary);">
              <i data-lucide="${s.icon}" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="num text-xl font-bold leading-none" style="color: var(--text);">${s.val}</div>
              <div class="text-[11px] mt-1" style="color: var(--text-3);">${s.label}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- ============== ҮХ ТӨРӨЛ — PROPERTY TYPE GRID ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-12">
      <div class="flex items-end justify-between mb-5">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Үл хөдлөх хөрөнгийн төрлөөр</h2>
          <p class="text-sm mt-1" style="color: var(--text-3);">Та өөрт хэрэгтэй ангилалаас нь шууд эхэл</p>
        </div>
        <button onclick="goTo('results')" class="text-sm font-medium" style="color: var(--gold-brand);">Бүгдийг үзэх →</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        ${PROPERTY_TYPES.map(t => `
          <button onclick="selectPropertyType('${t.key}', '${t.mode}')"
            class="card p-4 text-center transition flex flex-col items-center gap-2 hover:border-[var(--primary)]"
            style="background: var(--surface);">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: var(--primary-soft); color: var(--primary);">
              <i data-lucide="${t.icon}" class="w-6 h-6"></i>
            </div>
            <div class="font-semibold text-sm" style="color: var(--text);">${t.label}</div>
            <div class="num text-[11px]" style="color: var(--text-3);">${t.count.toLocaleString()} зар</div>
          </button>
        `).join('')}
      </div>
    </section>

    <!-- ============== AI ASSISTANT — CHAT WIDGET ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-12">
      <div class="rounded-2xl p-6 lg:p-8 relative overflow-hidden" style="background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%); border: 1px solid var(--border);">
        <div class="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl" style="background: var(--primary); transform: translate(30%, -30%);"></div>
        <div class="relative grid lg:grid-cols-[1fr_1.4fr] gap-6 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style="background: var(--primary-soft); color: var(--primary);">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
              <span class="text-[11px] font-semibold uppercase tracking-wider" style="letter-spacing: .12em;">NEO LIMIT AI туслах</span>
            </div>
            <h2 class="text-2xl lg:text-3xl font-bold tracking-tight mb-3">Тантай хамт<br/>тохирох үл хөдлөхийг олох</h2>
            <p class="text-sm" style="color: var(--text-3);">
              Юу хайж байгаагаа товч бичиж өг. AI таны хэрэгцээг ойлгож, дүүрэг, үнэ, lifestyle-аар таарсан зар санал болгоно.
            </p>
          </div>

          <div class="rounded-xl p-4" style="background: var(--bg); border: 1px solid var(--border);">
            <!-- chat messages -->
            <div class="space-y-3 mb-3">
              <div class="flex items-start gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--primary); color: #0A1F44;">
                  <i data-lucide="sparkles" class="w-4 h-4"></i>
                </div>
                <div class="rounded-xl px-3.5 py-2.5 text-sm" style="background: var(--surface-2); color: var(--text);">
                  Сайн уу 👋 Та ямар үл хөдлөх хөрөнгө хайж байна вэ? Жишээ нь "Хан-Уулд 3 өрөө, 450 саяс доош, сургууль ойр".
                </div>
              </div>
            </div>

            <!-- suggestion chips -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              ${AI_ASSISTANT_QUESTIONS.map(q => `
                <button onclick="runAIExample(${JSON.stringify(q.text).replace(/"/g, '&quot;')})"
                  class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full transition"
                  style="background: var(--surface); border: 1px solid var(--border); color: var(--text-2);"
                  onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--text)';"
                  onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-2)';">
                  <i data-lucide="${q.icon}" class="w-3 h-3"></i> ${q.text}
                </button>
              `).join('')}
            </div>

            <!-- input -->
            <div class="flex items-center gap-2 rounded-lg pl-3.5 pr-1.5 py-1.5" style="background: var(--surface); border: 1px solid var(--border);">
              <i data-lucide="message-square" class="w-4 h-4" style="color: var(--text-3);"></i>
              <input id="bm-ai-assistant-input" type="text" placeholder="Жишээ асуулт бичих..."
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); runAISearch(this.value); }"
                class="flex-1 bg-transparent border-0 outline-none text-sm py-1.5" style="color: var(--text);" />
              <button onclick="runAISearch(document.getElementById('bm-ai-assistant-input').value)"
                class="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style="background: var(--primary); color: #0A1F44;">
                <i data-lucide="send" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============== FEATURED LISTINGS ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-12">
      <div class="flex items-end justify-between mb-6">
        <h2 class="text-2xl font-bold tracking-tight">Онцлох үл хөдлөхүүд</h2>
        <button onclick="goTo('results')" class="text-sm font-medium" style="color: var(--gold-brand);">Бүгдийг харах →</button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        ${featured.map(l => bmListingCard(l)).join('')}
      </div>
    </section>

    <!-- ============== ШИНЭ, ОНЦЛОХ ЗАРУУД — NEW LISTINGS RAIL ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-14">
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Шинэ, онцлох зарууд</h2>
          <p class="text-sm mt-1" style="color: var(--text-3);">Сүүлийн 5 хоногт орсон шинэхэн зарууд</p>
        </div>
        <button onclick="goTo('results')" class="text-sm font-medium" style="color: var(--gold-brand);">Бүгдийг үзэх →</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${newListings.map(l => `
          <div onclick="openProperty(${l.id})" class="card overflow-hidden cursor-pointer transition" style="background: var(--surface);"
            onmouseover="this.style.borderColor='var(--primary)';" onmouseout="this.style.borderColor='var(--border)';">
            <div class="relative h-44 bg-cover bg-center" style="background-image:url('${photoUrl(l, 0, '600/400')}');">
              <span class="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold" style="background: var(--primary); color: #0A1F44;">
                <i data-lucide="sparkles" class="w-3 h-3"></i> ШИНЭ
              </span>
              <span class="absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium" style="background: rgba(0,0,0,.55); color: #fff; backdrop-filter: blur(4px);">
                ${l.listedDays === 0 ? 'Өнөөдөр' : l.listedDays + ' хоног'}
              </span>
            </div>
            <div class="p-4">
              <div class="flex items-start justify-between gap-2 mb-1">
                <div class="font-semibold text-base truncate" style="color: var(--text);">${l.khotkhon}</div>
              </div>
              <div class="text-xs mb-2" style="color: var(--text-3);">${l.district}, ${l.khoroo}-р хороо</div>
              <div class="flex items-center gap-3 text-xs mb-3" style="color: var(--text-2);">
                <span class="flex items-center gap-1"><i data-lucide="bed-double" class="w-3 h-3"></i> ${l.rooms} өрөө</span>
                <span class="flex items-center gap-1"><i data-lucide="ruler" class="w-3 h-3"></i> ${l.area}м²</span>
                <span class="flex items-center gap-1"><i data-lucide="building" class="w-3 h-3"></i> ${l.floor}</span>
              </div>
              <div class="num text-lg font-bold" style="color: var(--primary);">${listingPriceShort(l)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- ============== ЯАГААД NEO LIMIT — 6 REASONS ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-14">
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style="background: var(--primary-soft); color: var(--primary);">
          <i data-lucide="award" class="w-3.5 h-3.5"></i>
          <span class="text-[11px] font-semibold uppercase tracking-wider" style="letter-spacing: .12em;">Яагаад NEO LIMIT гэж?</span>
        </div>
        <h2 class="text-2xl lg:text-3xl font-bold tracking-tight">Үл хөдлөхөд зориулсан, ухаалаг шийдэл</h2>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${[
          { icon:'sparkles',      title:'AI Хайлт',                desc:'Таны хэрэгцээ, төсөв, байршлаасаа хамаараан хамгийн тохирох үл хөдлөхийг AI санал болгоно.' },
          { icon:'map-pin',       title:'Газрын зурган хайлт',     desc:'Интерактив газрын зураг дээр байршил, орчны мэдээлэлтэй хамт хайлт хийнэ.' },
          { icon:'shield-check',  title:'Verified баталгаажуулалт',desc:'Бүх зар мэдээлэл бодит, баримттай. Найдвартай байдлыг бид баталгаажуулна.' },
          { icon:'line-chart',    title:'Зах зээлийн мэдээ',       desc:'Үнийн өөрчлөлт, эрэлт, нийлүүлэлтийн бодит мэдээлэл тогтмол хүргэнэ.' },
          { icon:'bus',           title:'Тээврээр хайх',           desc:'Автобусны буудал, метроос ойр сууцыг шууд олж, тав тухын зайгаар жагсаана.' },
          { icon:'message-square',title:'AI туслах чат',           desc:'Хүсэлтээ чөлөөтэй бичээд, NEO LIMIT AI таныг шилдэг зар руу удирдан зөвлөнө.' }
        ].map(f => `
          <div class="card p-5 transition" style="background: var(--surface);"
            onmouseover="this.style.borderColor='var(--primary)';" onmouseout="this.style.borderColor='var(--border)';">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style="background: var(--primary-soft); color: var(--primary);">
              <i data-lucide="${f.icon}" class="w-5 h-5"></i>
            </div>
            <div class="font-semibold text-base mb-1.5" style="color: var(--text);">${f.title}</div>
            <div class="text-sm leading-relaxed" style="color: var(--text-3);">${f.desc}</div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- ============== ЗАХ ЗЭЭЛИЙН ТОЙМ ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-14">
      <div class="bm-stats-panel">
        <div class="flex items-end justify-between mb-5">
          <div>
            <h3 class="text-lg font-semibold">Зах зээлийн тойм</h3>
            <p class="text-xs mt-1" style="color: var(--text-3);">2024 оны 5-р сарын байдлаар</p>
          </div>
          <button onclick="openDetailedStatsModal('all')" class="text-sm font-medium hover:underline" style="color: var(--gold-brand);">Дэлгэрэнгүй статистик →</button>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${[
            { icon:'home',         label:'1м² дундаж үнэ (орон сууц)',  val:'3,278,000₮',  delta:'2.6%',  dir:'up',   sub:'емнөх сараас' },
            { icon:'building-2',   label:'Идэвхтэй зар',                val:'8,642',       delta:'8.3%',  dir:'up',   sub:'емнөх сараас' },
            { icon:'pie-chart',    label:'Худалдаа дундаж хугацаа',     val:'48 хоног',    delta:'-5 хоног', dir:'down', sub:'емнөх сараас' },
            { icon:'trending-up',  label:'Эрэлттэй дүүрэг',             val:'Хан-Уул',     delta:'34%',   dir:'up',   sub:'зах зээлийн хувь' }
          ].map(s => `
            <div class="bm-stat-cell">
              <div class="bm-stat-icon"><i data-lucide="${s.icon}" class="w-5 h-5"></i></div>
              <div>
                <div class="bm-stat-label">${s.label}</div>
                <div class="bm-stat-val num">${s.val}</div>
                <div class="bm-stat-delta ${s.dir==='down'?'down':''}">
                  <i data-lucide="${s.dir==='up'?'arrow-up-right':'arrow-down-right'}" class="w-3 h-3 inline"></i>
                  ${s.delta} <span style="color: var(--text-3);">${s.sub}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- ============== TRUST / PARTNERS ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-14 pb-4">
      <div class="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-center">
        <div>
          <h4 class="font-semibold mb-5" style="color: var(--text);">Итгэсэн мянга мянган хэрэглэгч, тэргүүлэх түншүүд</h4>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-3">
            ${[
              { letter:'X', label:'ХААН БАНК' },
              { letter:'G', label:'ГОЛОМТ БАНК' },
              { letter:'T', label:'ТӨРИЙН БАНК' },
              { letter:'M', label:'MIK' },
              { letter:'B', label:'BOGD BANK' }
            ].map(b => `
              <span class="bm-bank">
                <span class="bm-bank-mark">${b.letter}</span>
                ${b.label}
              </span>
            `).join('')}
          </div>
        </div>
        <div class="bm-testimonial">
          <i data-lucide="quote" class="w-5 h-5 mb-3" style="color: var(--gold-brand);"></i>
          <p class="bm-testimonial-quote">"NEO LIMIT-аар хайлт хийхэд маш амархан, цаг хугацаа хэмнэж, бодит мэдээлэлтэй үл хөдлөхүүдийг олж чадсан."</p>
          <div class="flex items-center gap-3 mt-4 pt-4" style="border-top: 1px solid var(--border);">
            <div class="w-10 h-10 rounded-full" style="background: linear-gradient(135deg, #C9A35F, #B08B47); color: #0A1F44; display: inline-flex; align-items:center; justify-content:center; font-weight: 700;">ЭЭ</div>
            <div class="flex-1">
              <div class="text-sm font-semibold">Э. Энжаргал</div>
              <div class="text-xs" style="color: var(--text-3);">Хан-Уул дүүрэг</div>
            </div>
            <div class="text-sm" style="color: var(--gold-brand);">★★★★★</div>
          </div>
        </div>
      </div>
    </section>

    ${bmFooter()}
  `;
}
/* ============== RESULTS (NEO LIMIT — Image 2) ============== */
function renderResults() {
  const list = filteredListings();
  const buying = state.mode === 'sale';
  const compareList = (typeof COMPARE_SET !== 'undefined' && COMPARE_SET.size)
    ? [...COMPARE_SET].map(id => getListing(id)).filter(Boolean).slice(0, 3)
    : list.slice(0, 3);
  const dist = state.filterDistrict;
  const districtStr = dist || 'Бүх дүүрэг';

  // Stats for current filter context
  const baseForStats = dist
    ? modeListings().filter(l => l.district === dist)
    : modeListings();
  const avgPrice = baseForStats.length
    ? Math.round(baseForStats.reduce((s,l)=>s+l.price,0) / baseForStats.length)
    : 0;
  const avgPpm = baseForStats.length
    ? Math.round(baseForStats.reduce((s,l)=>s + l.price/l.area, 0) / baseForStats.length)
    : 0;

  // Map pin positioning — show first 8 listings as gold drop pins
  const mapPins = list.slice(0, 10);

  return `
    <!-- ============== TOP SEARCH BAR ============== -->
    <section class="bm-hero pb-6 pt-6">
      <div class="max-w-7xl mx-auto px-4 lg:px-8">
        <div class="bm-search-mega">
          <i data-lucide="sparkles" class="w-5 h-5 bm-search-icon"></i>
          <input id="bm-res-search" type="text" value="${state.aiQuery || (dist ? dist + ' дүүрэг, ' + (state.filterRooms||3) + ' өрөө, 350 саяас доош' : '')}" placeholder="Хайлтаа боловсруулна уу..."
            onkeydown="if(event.key==='Enter'){ event.preventDefault(); runAISearch(this.value); }" />
          <button onclick="clearAISearch()" class="text-[var(--text-3)] hover:text-[var(--text)] px-3"><i data-lucide="x" class="w-4 h-4"></i></button>
          <button class="bm-search-mega-btn" onclick="runAISearch(document.getElementById('bm-res-search').value)">
            <i data-lucide="search" class="w-5 h-5"></i>
          </button>
        </div>

        ${state.aiQuery && state.aiExtracted ? `
          <div class="mt-3 p-3 rounded-xl flex items-start gap-3" style="background: var(--surface); border: 1px solid var(--primary);">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--primary); color: #0A0C0E;">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-[11px] font-medium uppercase tracking-wider mb-1.5" style="color: var(--primary); letter-spacing: .12em;">
                AI таны хайлтаас дараахыг ойлгов
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">${aiExtractedChips(state.aiExtracted)}</div>
            </div>
            <button onclick="clearAISearch()" class="text-[var(--text-3)] hover:text-[var(--text)] shrink-0" title="Цэвэрлэх">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        ` : ''}

        ${!state.aiQuery ? `
          <div class="mt-3 flex items-start gap-2 flex-wrap">
            <span class="text-[11px] font-medium uppercase tracking-wider pt-1.5 flex items-center gap-1" style="color: var(--text-3); letter-spacing: .12em;">
              <i data-lucide="sparkles" class="w-3 h-3" style="color: var(--gold-brand);"></i> Жишээ AI хайлт
            </span>
            ${AI_EXAMPLES.slice(0,4).map(ex => `
              <button onclick="runAIExample(${JSON.stringify(ex.text).replace(/"/g, '&quot;')})"
                class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition"
                style="background: var(--surface); border: 1px solid var(--border); color: var(--text-2);">
                <i data-lucide="${ex.icon}" class="w-3 h-3"></i> ${ex.text}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-10">
      <!-- Title row -->
      <div class="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Хайлтын үр дүн</h1>
          <p class="text-sm mt-1" style="color: var(--text-3);"><span class="num">${list.length}</span> үл хөдлөх хөрөнгө олдлоо</p>
        </div>
        <button onclick="openSavedSearchModal && openSavedSearchModal()" class="bm-btn-outline !py-2.5">
          <i data-lucide="bookmark-plus" class="w-4 h-4"></i> Хайлтаа хадгалах
        </button>
      </div>

      <!-- Filter recap row -->
      <div class="flex flex-wrap items-center gap-2.5 mb-3">
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Үнэ</span>
          <span class="bm-recap-val">${buying?'350 сая хүртэл':'1.5 саяс хүртэл'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Өрөө</span>
          <span class="bm-recap-val">${state.filterRooms ? state.filterRooms+' өрөө' : '3 өрөө'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Талбай</span>
          <span class="bm-recap-val">60-120 м² <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Байршил</span>
          <span class="bm-recap-val">${dist ? dist+' дүүрэг' : 'Бүх дүүрэг'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <div class="flex flex-wrap items-center gap-2.5 ml-auto">
          <button class="bm-toggle ${state.filterVerified?'on':''}" onclick="toggleResultsFilter('filterVerified')">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Verified <span class="bm-switch"></span>
          </button>
          <button class="bm-toggle ${state.filterIpoteh?'on':''}" onclick="toggleResultsFilter('filterIpoteh')">
            <i data-lucide="landmark" class="w-3.5 h-3.5"></i> Ипотектэй <span class="bm-switch"></span>
          </button>
          <button class="bm-toggle ${state.filterNewProject?'on':''}" onclick="toggleResultsFilter('filterNewProject')">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Шинэ төсөл <span class="bm-switch"></span>
          </button>
          <button class="bm-btn-outline !py-2.5" onclick="openAdvancedFilters()">
            <i data-lucide="sliders" class="w-4 h-4"></i> Дэлгэрэнгүй шүүлтүүр
          </button>
        </div>
      </div>

      ${(state.filterDistrict || state.filterRooms || state.filterVerified || state.filterIpoteh || state.filterNewProject || state.filterSchool || state.filterIncome || state.filterPriceMax || state.aiQuery) ? `
      <div class="flex items-center gap-2 mb-3 text-xs flex-wrap">
        <span style="color: var(--text-3);">Идэвхтэй шүүлтүүр:</span>
        ${state.filterDistrict ? `<span class="bm-tag">${state.filterDistrict} <button onclick="state.filterDistrict=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        ${state.filterRooms ? `<span class="bm-tag">${state.filterRooms} өрөө <button onclick="state.filterRooms=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        ${state.filterVerified ? `<span class="bm-tag">Verified <button onclick="toggleResultsFilter('filterVerified')" class="ml-1">×</button></span>` : ''}
        ${state.filterIpoteh ? `<span class="bm-tag">Ипотектэй <button onclick="toggleResultsFilter('filterIpoteh')" class="ml-1">×</button></span>` : ''}
        ${state.filterNewProject ? `<span class="bm-tag">Шинэ төсөл <button onclick="toggleResultsFilter('filterNewProject')" class="ml-1">×</button></span>` : ''}
        ${state.filterSchool ? `<span class="bm-tag">Сургууль ойр <button onclick="toggleResultsFilter('filterSchool')" class="ml-1">×</button></span>` : ''}
        ${state.filterIncome ? `<span class="bm-tag">Орлого өгөх <button onclick="toggleResultsFilter('filterIncome')" class="ml-1">×</button></span>` : ''}
        ${state.filterPriceMax ? `<span class="bm-tag">${(state.filterPriceMax/1000000).toFixed(0)}сая хүртэл <button onclick="state.filterPriceMax=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        <button class="text-[var(--gold-brand)] hover:underline" onclick="clearAllFilters()">Бүгдийг арилгах</button>
      </div>
      ` : ''}

      <!-- Sort + view toggle -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2 text-sm" style="color: var(--text-3);">
          Эрэмблэх:
          <select onchange="state.sortBy=this.value; renderAppScreen('results')" class="bg-transparent border-0 outline-none font-medium" style="color: var(--text); appearance: none; padding-right: 18px; background-image: linear-gradient(45deg, transparent 50%, var(--gold-brand) 50%), linear-gradient(135deg, var(--gold-brand) 50%, transparent 50%); background-position: calc(100% - 12px) 50%, calc(100% - 7px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;">
            <option value="newest" ${state.sortBy==='newest'?'selected':''}>Шинэ нэмэгдсэн (сүүлийн үеэр)</option>
            <option value="priceAsc" ${state.sortBy==='priceAsc'?'selected':''}>Үнэ өсөх</option>
            <option value="priceDesc" ${state.sortBy==='priceDesc'?'selected':''}>Үнэ буурах</option>
            <option value="recommended" ${state.sortBy==='recommended'?'selected':''}>Зөвлөмжтэй</option>
          </select>
        </div>
        <div class="inline-flex bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5">
          <button class="px-2.5 py-1.5 rounded-md ${state.viewMode!=='grid'?'bg-[var(--surface-2)] text-[var(--gold-brand)]':'text-[var(--text-3)]'}" onclick="state.viewMode='list'; renderAppScreen('results')"><i data-lucide="list" class="w-4 h-4"></i></button>
          <button class="px-2.5 py-1.5 rounded-md ${state.viewMode==='grid'?'bg-[var(--surface-2)] text-[var(--gold-brand)]':'text-[var(--text-3)]'}" onclick="state.viewMode='grid'; renderAppScreen('results')"><i data-lucide="grid-2x2" class="w-4 h-4"></i></button>
        </div>
      </div>

      <!-- 2 columns: list (left) + map+side (right) -->
      <div class="grid lg:grid-cols-[1fr_540px] gap-5">

        <!-- LEFT: LISTINGS -->
        <div class="flex flex-col gap-3">
          ${(() => {
            if (!list.length) return `<div class="card p-12 text-center">
              <i data-lucide="search-x" class="w-10 h-10 mx-auto mb-3" style="color: var(--text-3);"></i>
              <div class="font-semibold mb-1">Тохирох зар олдсонгүй</div>
              <div class="text-sm" style="color: var(--text-3);">Шүүлтүүрээ өөрчилж үзнэ үү</div>
              <button class="bm-btn-outline mt-4" onclick="clearAllFilters()"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Шүүлтүүр арилгах</button>
            </div>`;
            const ps = state.pageSize || 8;
            const page = Math.max(1, state.page || 1);
            const start = (page - 1) * ps;
            return list.slice(start, start + ps).map(l => bmListingRow(l)).join('');
          })()}

          ${(() => {
            const ps = state.pageSize || 8;
            const totalPages = Math.ceil(list.length / ps);
            if (totalPages <= 1) return '';
            const cur = Math.max(1, Math.min(totalPages, state.page || 1));
            const pageBtns = [];
            const push = (p, active) => pageBtns.push(
              `<button class="w-9 h-9 rounded-lg ${active?'bg-[var(--gold-brand)] text-[#0A1F44] font-semibold':'border border-[var(--border)] hover:border-[var(--gold-brand)]'}" style="${active?'':'color: var(--text-2);'}" onclick="gotoPage(${p})">${p}</button>`);
            // Эхний 4 + ellipsis + сүүлийн
            const shown = new Set([1, cur-1, cur, cur+1, totalPages].filter(p => p>=1 && p<=totalPages));
            let prev = 0;
            [...shown].sort((a,b)=>a-b).forEach(p => {
              if (p - prev > 1) pageBtns.push(`<span style="color: var(--text-3);">…</span>`);
              push(p, p === cur);
              prev = p;
            });
            return `
              <div class="flex items-center justify-center gap-1 mt-4">
                <button class="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center ${cur===1?'opacity-40 cursor-not-allowed':''}" style="color: var(--text-3);" onclick="${cur===1?'':`gotoPage(${cur-1})`}"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                ${pageBtns.join('')}
                <button class="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center ${cur===totalPages?'opacity-40 cursor-not-allowed':''}" style="color: var(--text-2);" onclick="${cur===totalPages?'':`gotoPage(${cur+1})`}"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
              </div>
            `;
          })()}
        </div>

        <!-- RIGHT: MAP + SIDE PANELS (sticky) -->
        <aside class="space-y-4">
          <!-- Map -->
          <div class="bm-side-block !p-0 overflow-hidden" style="height: 460px; position: relative;">
            <div class="flex items-center justify-between absolute top-3 left-3 right-3 z-30">
              <button class="bm-toggle on" onclick="openFullMap()" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px);">
                <span class="bm-switch"></span> Газрын зураг дээр хайх
              </button>
              <button class="bm-btn-outline !py-1.5 !text-xs" onclick="openFullMap()" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px);">
                <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Бүрэн дэлгэц
              </button>
            </div>
            <div style="height: 100%;">${mapBackground(mapPins, { selectedId: state.highlightedId, showControls: false, showContext: false, showZoneSummary: false })}</div>
          </div>

          <!-- Зах зээлийн тойм -->
          <div class="bm-side-block">
            <div class="bm-side-title">
              <span>Зах зээлийн тойм <span style="color: var(--text-3); font-weight: 400;">(${districtStr}${dist?' дүүрэг':''})</span></span>
              <button onclick="openDetailedStatsModal('${dist || 'all'}')" class="text-xs hover:underline" style="color: var(--gold-brand);">Дэлгэрэнгүй статистик →</button>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Дундаж үнэ (${state.filterRooms||3} өрөө)</div>
                <div class="num text-lg font-bold">${avgPrice ? Math.round(avgPrice/1000000) + ',' + String(avgPrice%1000000).padStart(6,'0').slice(0,3) + ',000₮' : '—'}</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 4.6% емнөх сараас</div>
              </div>
              <div class="text-center" style="border-left: 1px solid var(--border); border-right: 1px solid var(--border);">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Идэвхтэй зар</div>
                <div class="num text-lg font-bold">${list.length || '186'}</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 12.1% емнөх сараас</div>
              </div>
              <div class="text-center">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Дундаж үнэ / м²</div>
                <div class="num text-lg font-bold">${avgPpm ? avgPpm.toLocaleString('en-US')+'₮' : '—'}</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 3.8% емнөх сараас</div>
              </div>
            </div>
          </div>

          <!-- AI санал болгох -->
          <div class="bm-side-block">
            <div class="bm-ai-pick">
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--gold-brand); color: #0A1F44;"><i data-lucide="sparkles" class="w-4 h-4"></i></div>
                  <div>
                    <div class="text-sm font-semibold">AI санал болгох</div>
                    <div class="text-[11px]" style="color: var(--text-3);">Таны хайлтад илүү сайн тохирох боломжууд.</div>
                  </div>
                </div>
                <div class="bm-ai-pick-check"><i data-lucide="check-circle-2" class="w-4 h-4"></i> 60-120 м² талбайтай 3 өрөө байрнууд хамгийн их эрэлттэй байна.</div>
                <div class="bm-ai-pick-check"><i data-lucide="check-circle-2" class="w-4 h-4"></i> ${districtStr} сүүлийн 30 хоногт үнэ дундажаар 4.6% өссөн.</div>
                <button class="bm-btn-gold !text-xs !py-2 mt-3" onclick="state.filterAreaMin=60; state.filterAreaMax=120; state.filterRooms=3; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);">Бүх зөвлөмжийг харах</button>
              </div>
              <div class="bm-ai-pick-photo" style="background-image:url('${photoUrl(list[0]||LISTINGS[0], 1, '300/300')}'); position: relative;">
                <div style="position:absolute; bottom:6px; left:6px; right:6px; padding:4px 8px; background: rgba(6,17,43,.85); border-radius:8px; font-size:10px; color: var(--gold-brand); font-weight:600; text-align: center;">
                  <i data-lucide="sparkles" class="w-3 h-3 inline"></i> AI Picks
                </div>
              </div>
            </div>
          </div>

          <!-- Харьцуулах жагсаалт -->
          <div class="bm-side-block">
            <div class="bm-side-title">
              <span>Харьцуулах жагсаалт <span style="color: var(--text-3); font-weight: 400;">${compareList.length} үл хөдлөх нэмэгдлээ</span></span>
              <i data-lucide="git-compare" class="w-4 h-4" style="color: var(--gold-brand);"></i>
            </div>
            <div class="grid grid-cols-4 gap-2">
              ${compareList.map(l => `
                <div class="bm-compare-thumb" onclick="openProperty(${l.id})" style="background-image:url('${photoUrl(l, 0, '120/120')}')">
                  <div class="bm-compare-thumb-label">
                    <div style="font-weight:600;">${l.khotkhon.length>14?l.khotkhon.slice(0,12)+'…':l.khotkhon}</div>
                    <div style="color: var(--gold-brand);" class="num">${Math.round(l.price/1000000)} саяс</div>
                  </div>
                </div>
              `).join('')}
              ${compareList.length < 4 ? Array(4-compareList.length).fill(0).map(()=>`
                <button class="bm-compare-add" onclick="${(typeof COMPARE_SET !== 'undefined' && COMPARE_SET.size) ? 'openCompareView()' : `showToast('Зар нэмэхийн тулд листинг дээр сум сонгоно уу', 'info')`}">
                  <i data-lucide="sparkles" class="w-4 h-4 mb-1"></i>
                  Харьцуулах
                </button>
              `).join('') : ''}
            </div>
          </div>

          <!-- Хайлтаа хадгалсан -->
          <div class="bm-side-block">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold mb-1">Хайлтаа хадгалсан</div>
                <div class="text-xs" style="color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${state.aiQuery || (dist + ' ' + (state.filterRooms||3) + ' өрөө, 350 саяас доош, сургууль ойр байр')}</div>
              </div>
              <button class="bm-toggle on !p-1.5" onclick="openSavedSearchModal && openSavedSearchModal()">
                <span class="bm-switch"></span>
              </button>
            </div>
            <p class="text-xs mt-3" style="color: var(--text-3);">Шинэ тохирох зар гармагц танд мэдэгдэх болно.</p>
            <button class="bm-btn-outline !text-xs !py-2 mt-3" onclick="openNotifSettingsModal && openNotifSettingsModal()">Мэдэгдлийн тохиргоо</button>
          </div>

          <div class="text-[11px]" style="color: var(--text-3);">
            * Үнэ нь зарын хугацаа, давхар, төлөв байдлаас хамаарч өөрчлөгдөх боломжтой.
          </div>
        </aside>
      </div>
    </section>

    ${bmFooter()}
  `;
}

/* ============== PROPERTY (NEO LIMIT — Image 3) ============== */
function renderProperty() {
  const l = getListing(state.currentListingId);
  if (!l) return '<div class="p-8">Зар олдсонгүй</div>';
  const ag = getAgent(l.agentId);
  const isSaved = SAVED_IDS.has(l.id);
  const verified = isListingVerified(l);
  const monthly = mortgageMonthly(l.price, 30, 20, 12);
  const down = Math.round(l.price * 0.3);
  const loan = l.price - down;
  const propId = 'RG-' + String(l.id).padStart(4,'0') + '-' + (l.photos * 7 + 13);
  const nextId = l.id < LISTINGS.length ? l.id + 1 : 1;
  const prevId = l.id > 1 ? l.id - 1 : LISTINGS.length;

  const reasons = [
    'Гэр бүлд эзэлтэй орчин',
    'Сургууль ойр',
    'Голын эрэг дагуу',
    'Үнэ цэн тогтворлой өсөх бус'
  ];

  const features = [
    { icon: 'home',         label: 'Голын эрэг дагуу',          desc: 'Цэлгэр цонх, сайхан харагдац' },
    { icon: 'shield',       label: '24/7 Харуул хамгаалалт',    desc: 'камерын хяналт' },
    { icon: 'sun',          label: 'Зочны өрөө гал тогоо',      desc: 'зөв чиглэлд зохион байгуулсан' },
    { icon: 'gamepad-2',    label: 'Детский тоглоомын',         desc: 'талбай' },
    { icon: 'dumbbell',     label: 'Фитнес өрөө,',              desc: 'саун' },
    { icon: 'sofa',         label: 'Бүрэн тавилга,',            desc: 'ахуйн хэрэгсэлтэй' },
    { icon: 'car',          label: 'Дулаан граж,',              desc: '1 нэгдсэн зогсоол' },
    { icon: 'cpu',          label: 'Ухаалаг орч, лифт,',        desc: 'картар нэвтрэх систем' }
  ];

  const pois = [
    { kind: 'Сургууль',          name: 'British School of Ulaanbaatar', dist: '1.1 км (3 мин)',  icon: 'graduation-cap' },
    { kind: 'Худалдаа',          name: 'Хүннү Молл',                    dist: '2.5 км (6 мин)',  icon: 'shopping-bag' },
    { kind: 'Эмнэлэг',           name: 'Интермед эмнэлэг',              dist: '2.3 км (6 мин)',  icon: 'cross' },
    { kind: 'Тээвэр',            name: 'Зайсангийн эцэс автобусны буудал', dist: '500 м (7 мин явган)', icon: 'bus' },
    { kind: 'Цэцэрлэгт хүрэлэн', name: 'Зайсангийн цэцэрлэгт хүрэлэн',  dist: '1.0 км (3 мин)',  icon: 'trees' }
  ];

  return `
    <div class="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <!-- Breadcrumb + prev/next -->
      <div class="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div class="bm-breadcrumb">
          <a onclick="goTo('home')">Нүүр</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="setMode('sale'); goTo('results')">Худалдах</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="goTo('results')">Орон сууц</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="state.filterDistrict='${l.district}'; goTo('results')">${l.district} дүүрэг</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <span style="color: var(--text);">${l.khotkhon} — ${l.rooms} өрөө орон сууц</span>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <button onclick="openProperty(${prevId})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)]" style="color: var(--text-2);"><i data-lucide="chevron-left" class="w-4 h-4"></i> Буцах</button>
          <button onclick="openProperty(${nextId})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)]" style="color: var(--text-2);">Дараагийн зар <i data-lucide="chevron-right" class="w-4 h-4"></i></button>
        </div>
      </div>

      <!-- Hero gallery + main info -->
      <div class="grid lg:grid-cols-[1.35fr_1fr] gap-6 mb-8">
        <!-- LEFT: GALLERY -->
        <div class="bm-gallery">
          <div class="bm-gallery-hero" style="background-image:url('${photoUrl(l, 0, '900/680')}')">
            ${verified ? `<span class="bm-verified"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
            <div class="bm-gallery-overlay-tag" style="left: 14px; bottom: 14px;">
              <i data-lucide="image" class="w-3.5 h-3.5"></i> 24 зураг
            </div>
            <div class="bm-gallery-overlay-tag" style="left: 130px; bottom: 14px;">
              <i data-lucide="play" class="w-3.5 h-3.5"></i> Видео
            </div>
            <div class="bm-gallery-overlay-tag" style="left: 220px; bottom: 14px;">
              <i data-lucide="box" class="w-3.5 h-3.5"></i> 3D тойруу
            </div>
          </div>
          <div class="bm-gallery-side">
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 1, '300/200')}'); position:relative;">
              <div style="position:absolute; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center;">
                <i data-lucide="play-circle" class="w-9 h-9" style="color: white;"></i>
              </div>
            </div>
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 2, '300/200')}')"></div>
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 3, '300/200')}')"></div>
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 4, '300/200')}')"></div>
          </div>
        </div>

        <!-- RIGHT: TITLE + PRICE + SPECS + ACTIONS -->
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <h1 class="bm-prop-title">${l.khotkhon} —<br/>${l.rooms} өрөө орон сууц</h1>
            ${verified ? `<span class="bm-verified shrink-0 mt-2"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
          </div>
          <div class="bm-prop-loc">
            <i data-lucide="map-pin" class="w-4 h-4" style="color: var(--gold-brand);"></i>
            ${l.district} дүүрэг, Зайсан, Голын гудамж 26 <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </div>

          <div class="mt-6 mb-5">
            <div class="bm-prop-price-big num">${l.price.toLocaleString('en-US')}₮</div>
            <div class="bm-prop-ppm-big num">${listingPpm(l).toLocaleString('en-US')}₮ / м²</div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mb-5">
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${l.area} м²</div>
              <div class="bm-prop-spec-lbl">Нийт талбай</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${l.rooms} өрөө</div>
              <div class="bm-prop-spec-lbl">Унтлагын өрөө</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${l.floor || '8 / 16'} давхар</div>
              <div class="bm-prop-spec-lbl">Байрлал</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${l.year} он</div>
              <div class="bm-prop-spec-lbl">Ашиглалтад орсон</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val text-base">${listingOrientation(l)}</div>
              <div class="bm-prop-spec-lbl">Цонхны харьц</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val text-base">${listingHeating(l)}</div>
              <div class="bm-prop-spec-lbl">Дулаан хангамж</div>
            </div>
          </div>

          <div class="flex gap-2.5 mb-4">
            <button class="bm-btn-gold flex-1" onclick="openCallAgent && openCallAgent(${ag.id})">
              <i data-lucide="phone" class="w-4 h-4"></i> Холбоо барих
            </button>
            <button class="bm-btn-navy" onclick="goTo('schedule')">
              <i data-lucide="calendar" class="w-4 h-4"></i> Үзлэг товлох
            </button>
            <button class="bm-btn-outline ${isSaved?'!border-[var(--gold-brand)] !text-[var(--gold-brand)]':''}" onclick="toggleSaved(${l.id}, this)">
              <i data-lucide="heart" class="w-4 h-4" ${isSaved?'fill="currentColor"':''}></i> Хадгалах
            </button>
          </div>

          <div class="flex items-center justify-between text-xs flex-wrap gap-2" style="color: var(--text-3);">
            <span>Зарын дугаар: <span style="color: var(--text-2);" class="num">${propId}</span></span>
            <span>Нийтэлсэн: <span style="color: var(--text-2);" class="num">2024.05.${String(15 + l.id % 14).padStart(2,'0')}</span></span>
            <button class="flex items-center gap-1 hover:text-[var(--gold-brand)]"><i data-lucide="share-2" class="w-3.5 h-3.5"></i> Хуваалцах</button>
          </div>
        </div>
      </div>

      <!-- AI Reason Card -->
      <div class="bm-ai-reason mb-7">
        <div class="flex items-start gap-4">
          <div class="bm-ai-reason-icon"><i data-lucide="sparkles" class="w-5 h-5"></i></div>
          <div>
            <div class="text-sm font-semibold mb-1.5" style="color: var(--gold-brand);">AI Хайлтаас танд тохирох шалтгаан</div>
            <p class="text-sm" style="color: var(--text-2); line-height: 1.6;">
              Энэхүү орон сууц нь таны эрэлхийлж буй зай том, нарны тусгал сайтай ${l.rooms} өрөө байрны шаардлагад бүрэн нийцэж байна. Зайсангийн голын эрэг дагуу, үйлчилгээний төвөөж болон олон улсын сургууль ойрхон тул амьдрах тав тух, хөрөнгө оруулалтын өгөөж өндөр.
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              ${reasons.map(r => `<span class="bm-ai-reason-chip"><i data-lucide="check" class="w-3 h-3"></i>${r}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Main grid: info + sidebar -->
      <div class="grid lg:grid-cols-[1fr_360px] gap-6">
        <div class="space-y-7">

          <!-- Key info + floor plan -->
          <div class="grid md:grid-cols-2 gap-5">
            <div>
              <h3 class="text-base font-semibold mb-3">Түлхүүр мэдээлэл</h3>
              <div class="bm-keytbl">
                ${[
                  ['Байршил',          `${l.district} дүүрэг, Зайсан, Голын гудамж 26`, 'map-pin'],
                  ['Хотхон',           l.khotkhon,                                       'building'],
                  ['Барилгын төрөл',   'Орон сууц',                                       'building-2'],
                  ['Нийт талбай',      l.area + ' м²',                                    'ruler'],
                  ['Өрөөний тоо',      l.rooms + ' өрөө (зочны өрөө + ' + (l.rooms-1) + ' унтлагын өрөө)', 'bed-double'],
                  ['Давхар / Нийт',    (l.floor || '8 / 16'),                             'arrow-up-down'],
                  ['Ашиглалтад орсон', l.year + ' он',                                    'calendar'],
                  ['Зогсоол',          'Гадна зогсоол - 1, Дулаан зогсоол - 1',           'car'],
                  ['Цонхны харьц',     listingOrientation(l) + ', гол руу',               'sun'],
                  ['Засвар',           'Европ стандартын бүрэн тавилга, техник',          'sparkles']
                ].map(([k, v, ic]) => `
                  <div class="bm-keytbl-row">
                    <div class="bm-keytbl-row-k"><i data-lucide="${ic}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>${k}</div>
                    <div class="bm-keytbl-row-v">${v}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div>
              <h3 class="text-base font-semibold mb-3">Давхарын зураглал</h3>
              <div class="bm-floorplan">
                <div class="bm-floorplan-img">
                  <svg viewBox="0 0 200 150" fill="none" stroke="#0A1F44" stroke-width="2">
                    <rect x="10" y="10" width="180" height="130" />
                    <line x1="80" y1="10" x2="80" y2="80" />
                    <line x1="80" y1="80" x2="190" y2="80" />
                    <line x1="130" y1="80" x2="130" y2="140" />
                    <line x1="80" y1="120" x2="130" y2="120" />
                    <rect x="20" y="20" width="50" height="50" stroke-width="1" />
                    <text x="30" y="48" font-size="6" fill="#0A1F44" stroke="none">Зочны</text>
                    <text x="100" y="48" font-size="6" fill="#0A1F44" stroke="none">Гал тогоо</text>
                    <text x="140" y="100" font-size="6" fill="#0A1F44" stroke="none">Унтл-1</text>
                    <text x="90" y="100" font-size="6" fill="#0A1F44" stroke="none">Унтл-2</text>
                    <text x="40" y="100" font-size="6" fill="#0A1F44" stroke="none">Угаалга</text>
                  </svg>
                </div>
                <button class="bm-btn-outline w-full !text-xs !py-2"><i data-lucide="zoom-in" class="w-3.5 h-3.5"></i> Томоор харах</button>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div>
            <h3 class="text-base font-semibold mb-4">Онцлог & Давуу талууд</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-2 card p-5">
              ${features.map(f => `
                <div class="bm-feat-item">
                  <i data-lucide="${f.icon}" class="w-5 h-5"></i>
                  <div>
                    <div style="color: var(--text);">${f.label}</div>
                    <div style="color: var(--text-3); font-size: 11px;">${f.desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Location -->
          <div>
            <h3 class="text-base font-semibold mb-3">Байршил</h3>
            <div class="grid md:grid-cols-[1fr_1.2fr] gap-4">
              <div class="card overflow-hidden" style="height: 240px; position: relative;">
                <div style="height:100%;">${mapBackground([l], { selectedId: l.id, showControls: false, showContext: false, showZoneSummary: false, interactiveZones: false })}</div>
              </div>
              <div class="card p-5">
                <div class="text-sm font-semibold mb-3">${l.district} дүүрэг, Зайсан,<br/>Голын гудамж 26, ${l.khotkhon}</div>
                <ul class="space-y-2 text-sm" style="color: var(--text-2);">
                  <li class="flex items-center gap-2"><span style="width:6px; height:6px; border-radius:50%; background: var(--gold-brand);"></span> Zaisan Hill — 1.2 км (3 мин)</li>
                  <li class="flex items-center gap-2"><span style="width:6px; height:6px; border-radius:50%; background: var(--gold-brand);"></span> Хүннү Молл — 2.5 км (6 мин)</li>
                  <li class="flex items-center gap-2"><span style="width:6px; height:6px; border-radius:50%; background: var(--gold-brand);"></span> British School of Ulaanbaatar — 1.1 км (3 мин)</li>
                  <li class="flex items-center gap-2"><span style="width:6px; height:6px; border-radius:50%; background: var(--gold-brand);"></span> Шүнхлай ХХК шатахуун түгээгч станц — 800 м (2 мин)</li>
                  <li class="flex items-center gap-2"><span style="width:6px; height:6px; border-radius:50%; background: var(--gold-brand);"></span> Тэнгэрийн гүүр — 2.0 км (5 мин)</li>
                </ul>
                <button class="bm-btn-outline w-full mt-4 !text-xs !py-2">Газрын зураг дээр харах <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></button>
              </div>
            </div>
          </div>

          <!-- POI strip: schools, services, transport -->
          <div>
            <h3 class="text-base font-semibold mb-3">Ойролцоох сургууль, үйлчилгээ, тээвэр</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              ${pois.map(p => `
                <div class="bm-poi">
                  <div class="bm-poi-icon"><i data-lucide="${p.icon}" class="w-5 h-5"></i></div>
                  <div class="min-w-0">
                    <div class="bm-poi-kind">${p.kind}</div>
                    <div class="bm-poi-name truncate">${p.name}</div>
                    <div class="bm-poi-dist">${p.dist}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- SIDEBAR -->
        <aside class="space-y-4">
          <!-- Agent card -->
          <div class="bm-agent">
            <div class="text-xs font-semibold mb-3" style="color: var(--text-3);">Зарын эзэн / Зуучлагч</div>
            <div class="flex items-center gap-3 mb-4">
              <div class="bm-agent-avatar">${ag.initials}</div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold flex items-center gap-1">${ag.name} ${ag.verified ? '<i data-lucide="badge-check" class="w-4 h-4" style="color: var(--gold-brand);"></i>' : ''}</div>
                <div class="text-xs" style="color: var(--text-3);">Байр борлуулалтын менежер</div>
                <div class="flex items-center gap-2 mt-1">
                  ${ag.verified ? `<span class="text-[10px] flex items-center gap-1" style="color: var(--success);"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
                  <span class="text-[10px]" style="color: var(--gold-brand);">NEO LIMIT Partner</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 mb-4 text-sm">
              <span style="color: var(--gold-brand);">★★★★★</span>
              <span class="font-semibold">${ag.rating || '5.0'}</span>
              <span class="text-xs" style="color: var(--text-3);">(${ag.reviewCount || 128} үнэлгээ)</span>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4 text-center" style="border-top: 1px solid var(--border); padding-top: 14px;">
              <div>
                <div class="text-xs" style="color: var(--text-3);">Нийт зар</div>
                <div class="num text-base font-bold">${ag.listings || 152}</div>
              </div>
              <div>
                <div class="text-xs" style="color: var(--text-3);">Амжилттай борлуулалт</div>
                <div class="num text-base font-bold">96%</div>
              </div>
            </div>
            <div class="space-y-2">
              <button class="bm-btn-gold w-full" onclick="openCallAgent && openCallAgent(${ag.id})">
                <i data-lucide="phone" class="w-4 h-4"></i> Холбоо барих
              </button>
              <button class="bm-btn-navy w-full" onclick="openAgentMessage && openAgentMessage(${ag.id}, ${l.id})">
                <i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp чат
              </button>
            </div>
          </div>

          <!-- Verification badge -->
          <div class="bm-side-block flex items-start gap-3" style="border-color: rgba(201,163,95,.3);">
            <i data-lucide="shield-check" class="w-5 h-5 mt-0.5" style="color: var(--gold-brand);"></i>
            <p class="text-xs" style="color: var(--text-2); line-height: 1.55;">
              Энэхүү зар нь NEO LIMIT-аар баталгаажсан. Баримт бичиг болон мэдээлэл бодитой.
            </p>
          </div>

          <!-- Mortgage calculator -->
          <div class="bm-side-block">
            <div class="text-sm font-semibold mb-3">Зээлийн тооцоолуур (жишээ)</div>
            <div class="bm-mortgage-row">
              <span class="k">Орон сууцны үнэ</span>
              <span class="v num">${l.price.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Урьдчилгаа (30%)</span>
              <span class="v num">${down.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Зээлийн дүн (70%)</span>
              <span class="v num">${loan.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Хугацаа</span>
              <span class="v num">20 жил</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Жилийн хүү</span>
              <span class="v num">12%</span>
            </div>
            <div class="bm-mortgage-monthly">
              <span class="k">Сарын төлбөр (ойролцоогоор)</span>
              <span class="v num">${monthly.toLocaleString('en-US')} ₮</span>
            </div>
            <p class="text-[11px] mt-3" style="color: var(--text-3); line-height: 1.5;">
              Тооцоолол нь урьдчилсан бөгөөд бодит нөхцөлөөс хамаарч өөрчлөгдөх боломжтой.
            </p>
            <button class="bm-btn-outline w-full mt-3 !text-xs !py-2">Дэлгэрэнгүй тооцоо харах <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>
          </div>
        </aside>
      </div>
    </div>

    ${bmFooter()}
  `;
}

/* ============== SCHEDULE ============== */
function renderSchedule() {
  const l = getListing(state.currentListingId);
  const dates = ['5/20','5/21','5/22','5/23','5/24','5/25'];
  const times = ['10:00','11:00','14:00','15:00','16:00','17:00'];

  return `
    <div class="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <button onclick="goTo('property')" class="text-xs text-[var(--text-3)] hover:text-[var(--text)] flex items-center gap-1 mb-3"><i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Зар руу буцах</button>
      <h1 class="text-2xl font-semibold mb-1">Үзэлт товлох</h1>
      <p class="text-sm text-[var(--text-3)] mb-6">${l?.khotkhon} · ${l?.district}</p>

      <div class="card p-5 mb-4">
        <div class="eyebrow mb-3">Огноо</div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          ${dates.map(d => `<button onclick="state.scheduleDate='${d}'; renderAppScreen('schedule'); setTimeout(()=>lucide.createIcons(),0);" class="src-chip py-3 ${state.scheduleDate===d?'selected':''}">${d}</button>`).join('')}
        </div>
        <div class="eyebrow mb-3">Цаг</div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          ${times.map(t => `<button onclick="state.scheduleTime='${t}'; renderAppScreen('schedule'); setTimeout(()=>lucide.createIcons(),0);" class="src-chip py-3 ${state.scheduleTime===t?'selected':''}">${t}</button>`).join('')}
        </div>
      </div>

      <button onclick="submitSchedule()" class="btn btn-cta w-full">Үзэлт батлах <i data-lucide="check" class="w-4 h-4"></i></button>
    </div>
  `;
}

/* ============== CONFIRMATION ============== */
function renderConfirmation() {
  const l = getListing(state.currentListingId);
  return `
    <div class="max-w-2xl mx-auto px-4 lg:px-6 py-12 text-center">
      <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style="background: var(--primary-soft); color: var(--primary);">
        <i data-lucide="check" class="w-10 h-10"></i>
      </div>
      <h1 class="text-3xl font-semibold mb-2">Үзэлт баталгаажлаа</h1>
      <p class="text-[var(--text-2)] mb-6">${l?.khotkhon} · ${state.scheduleDate} ${state.scheduleTime}</p>
      <div class="flex justify-center gap-2">
        <button onclick="goTo('activity')" class="btn btn-cta">Миний үзэлтүүд</button>
        <button onclick="goTo('home')" class="btn btn-secondary">Эхлэл рүү</button>
      </div>
    </div>
  `;
}

/* ============== ACTIVITY ============== */
function renderActivity() {
  return `
    <div class="max-w-4xl mx-auto px-4 lg:px-6 py-6">
      <h1 class="text-2xl font-semibold mb-1">Үзэлтүүд</h1>
      <p class="text-sm text-[var(--text-3)] mb-5">Товлосон болон өнгөрсөн уулзалтууд</p>
      <div class="space-y-2">
        ${VIEWINGS.map(v => {
          const l = getListing(v.listingId);
          return `<div class="card p-4 flex items-center gap-4">
            <div class="w-14 h-14 rounded-lg bg-cover bg-center shrink-0" style="background-image:url('${photoUrl(l, 0, '200/200')}')"></div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm truncate">${l.khotkhon}</div>
              <div class="text-xs text-[var(--text-3)] mt-0.5">${v.date} · ${v.time} · ${v.dayLabel}</div>
            </div>
            <button onclick="openProperty(${l.id})" class="btn btn-secondary !text-xs !py-2">Үзэх</button>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

/* ============== SAVED ============== */
function renderSaved() {
  const list = LISTINGS.filter(l => SAVED_IDS.has(l.id));
  return `
    <div class="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <h1 class="text-2xl font-semibold mb-1">Хадгалсан зарууд</h1>
      <p class="text-sm text-[var(--text-3)] mb-5">${list.length} зар</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${list.map(l => listingCard(l)).join('')}
      </div>
    </div>
  `;
}

/* ============== ALERTS ============== */
function renderAlerts() {
  return `
    <div class="max-w-4xl mx-auto px-4 lg:px-6 py-6">
      <h1 class="text-2xl font-semibold mb-1">Хадгалсан хайлт</h1>
      <p class="text-sm text-[var(--text-3)] mb-5">Шинэ зар орох тутамд мэдэгдэл хүлээн авах</p>
      <div class="space-y-2">
        ${SAVED_SEARCHES.map(s => `<div class="card p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: var(--primary-soft); color: var(--primary);"><i data-lucide="bell" class="w-4 h-4"></i></div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm">${s.name}</div>
            <div class="text-xs text-[var(--text-3)] mt-0.5">${s.districts.join(', ')} · ${s.rooms.join('-')} өрөө</div>
          </div>
          ${s.newMatches ? `<span class="pill pill-new">${s.newMatches} шинэ</span>` : ''}
        </div>`).join('')}
      </div>
    </div>
  `;
}

/* ============== AUTH ============== */
function renderAuth() {
  return `
    <div class="max-w-md mx-auto px-4 py-12">
      <h1 class="text-2xl font-semibold mb-1 text-center">Нэвтрэх</h1>
      <p class="text-sm text-[var(--text-3)] mb-6 text-center">Утасны дугаараараа</p>
      <div class="card p-6">
        <label class="text-xs font-medium text-[var(--text-2)] mb-1.5 block">Утасны дугаар</label>
        <input class="input mb-4" placeholder="+976 9911 5544" value="+976 9911 5544" />
        <button onclick="showOtpStep()" class="btn btn-cta w-full">SMS код илгээх</button>
      </div>
    </div>
  `;
}

/* ============== PROFILE ============== */
function renderProfile() {
  return `
    <div class="max-w-2xl mx-auto px-4 lg:px-6 py-6">
      <div class="card p-6 flex items-center gap-4 mb-4">
        <div class="w-16 h-16 rounded-full text-white font-semibold flex items-center justify-center text-lg" style="background: linear-gradient(135deg, #0A1F44 0%, #051028 100%);">ЭТ</div>
        <div>
          <div class="font-semibold text-lg">Энхтуяа</div>
          <div class="text-sm text-[var(--text-3)]">+976 9911 5544</div>
        </div>
      </div>
      <div class="card divide-y" style="--tw-divide-opacity:1;">
        ${[
          ['settings','Тохиргоо'],['bell','Мэдэгдлийн тохиргоо'],['shield','Нууцлал'],['help-circle','Тусламж']
        ].map(([i,l]) => `<button class="w-full flex items-center gap-3 p-4 hover:bg-[var(--surface-2)] text-sm"><i data-lucide="${i}" class="w-4 h-4 text-[var(--text-3)]"></i> ${l}<i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-[var(--text-3)]"></i></button>`).join('')}
      </div>
      <button onclick="openSignOutConfirm()" class="btn btn-ghost w-full mt-3 text-[var(--danger)]"><i data-lucide="log-out" class="w-4 h-4"></i> Гарах</button>
    </div>
  `;
}
