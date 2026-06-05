/* ============== SCREEN: HOME (incl. OLD_DISABLED, property utils shared by home) ============== */

function selectPropertyType(key, mode) {
  const t = PROPERTY_TYPES.find((p) => p.key === key);
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
function pricePerM2(l) {
  return Math.round(l.price / l.area);
}
function marketAvgPerM2(district, rooms, mode) {
  const peers = activeListings().filter(
    (l) => l.mode === mode && l.district === district && Math.abs(l.rooms - rooms) <= 1,
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
  if (pct >= 8) return { avg, pct, label: `Зах зээлээс ${pct}% үнэтэй`, cls: 'above' };
  return { avg, pct, label: 'Зах зээлийн дунджтай дүйцнэ', cls: 'fair' };
}
function similarListings(l, n = 3) {
  return activeListings()
    .filter((x) => x.id !== l.id && x.mode === l.mode && x.district === l.district && Math.abs(x.rooms - l.rooms) <= 1)
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


function renderHome() {
  // 3-column split view — filter sidebar | card list | leaflet map
  return `
    <section class="home-split">
      <aside class="home-filter-col" id="home-filter-col" aria-label="Шүүлтүүр">
        ${renderHomeFilterCol()}
      </aside>
      <aside class="home-list-col" id="home-list-col" aria-label="Зарын жагсаалт">
        ${renderHomeListCol()}
      </aside>
      <div class="home-map-area home-map-hero">
        ${renderHomeMapArea()}
      </div>
    </section>
  `;
}

/* ===== БҮХ FILTER STATE-ийг тооцох (sidebar + list-д хэрэглэнэ) ===== */
function _homeFilterContext() {
  const base = modeListings();
  const countBy = (pred) => base.filter(pred).length;
  return {
    popularFilters: [
      {
        key: 'verified',
        label: 'Баталгаажсан',
        count: countBy((l) => isListingVerified(l)),
        active: !!state.filterVerified,
        toggle: 'toggleHomeVerified()',
      },
      {
        key: 'ipoteh',
        label: 'Ипотек боломжтой',
        count: countBy((l) => hasIpoteh(l)),
        active: !!state.filterIpoteh,
        toggle: 'toggleHomeIpoteh()',
      },
      {
        key: 'newproj',
        label: 'Шинэ төсөл',
        count: countBy((l) => isNewProject(l)),
        active: !!state.filterNewProject,
        toggle: 'toggleHomeNewProject()',
      },
      {
        key: 'furnished',
        label: 'Тавилгатай',
        count: countBy((l) => (l.features || []).some((f) => /Тавилгатай/.test(f))),
        active: state.filterFeature === 'Тавилгатай',
        toggle: "toggleHomeFeature('Тавилгатай')",
      },
      {
        key: 'garage',
        label: 'Гаражтай',
        count: countBy((l) => (l.features || []).some((f) => /[Гг]араж/.test(f))),
        active: state.filterFeature === 'Гараж',
        toggle: "toggleHomeFeature('Гараж')",
      },
      {
        key: 'balcony',
        label: 'Тагттай',
        count: countBy((l) => (l.features || []).some((f) => /Тагт/.test(f))),
        active: state.filterFeature === 'Тагт',
        toggle: "toggleHomeFeature('Тагт')",
      },
      {
        key: 'pool',
        label: 'Усан сантай',
        count: countBy((l) => (l.features || []).some((f) => /Усан сан/.test(f))),
        active: state.filterFeature === 'Усан сан',
        toggle: "toggleHomeFeature('Усан сан')",
      },
    ].filter((f) => f.count > 0),
    propertyTypes: [
      {
        key: 'r1',
        label: '1 өрөө',
        count: countBy((l) => l.rooms === 1),
        active: state.filterRooms === 1,
        toggle: 'toggleHomeRooms(1)',
      },
      {
        key: 'r2',
        label: '2 өрөө',
        count: countBy((l) => l.rooms === 2),
        active: state.filterRooms === 2,
        toggle: 'toggleHomeRooms(2)',
      },
      {
        key: 'r3',
        label: '3 өрөө',
        count: countBy((l) => l.rooms === 3),
        active: state.filterRooms === 3,
        toggle: 'toggleHomeRooms(3)',
      },
      {
        key: 'r4',
        label: '4+ өрөө',
        count: countBy((l) => l.rooms >= 4),
        active: state.filterRooms === 4,
        toggle: 'toggleHomeRooms(4)',
      },
      {
        key: 'house',
        label: 'Хаус',
        count: countBy((l) => l.floor === 'Хаус'),
        active: state.filterCategory === 'house',
        toggle: "toggleHomeCategory('house')",
      },
      {
        key: 'premium',
        label: 'Premium',
        count: countBy((l) => l.price >= (state.mode === 'rent' ? 3000000 : 800000000)),
        active: state.filterCategory === 'premium',
        toggle: "toggleHomeCategory('premium')",
      },
      {
        key: 'hot',
        label: 'Онцлох',
        count: countBy((l) => l.status === 'hot'),
        active: state.filterCategory === 'hot',
        toggle: "toggleHomeCategory('hot')",
      },
      {
        key: 'new',
        label: 'Шинэ зар',
        count: countBy((l) => l.status === 'new'),
        active: state.filterCategory === 'new',
        toggle: "toggleHomeCategory('new')",
      },
      {
        key: 'drop',
        label: 'Үнэ буурсан',
        count: countBy((l) => l.status === 'drop'),
        active: state.filterCategory === 'drop',
        toggle: "toggleHomeCategory('drop')",
      },
    ].filter((t) => t.count > 0),
    districtFilters: DISTRICTS.map((d) => ({
      label: d,
      count: countBy((l) => l.district === d),
      active: state.filterDistrict === d,
      toggle: `toggleHomeDistrict('${d}')`,
    })).filter((d) => d.count > 0),
  };
}

/* ===== БАГАНА 1: FILTER SIDEBAR ===== */
function renderHomeFilterCol() {
  const ctx = _homeFilterContext();
  const { popularFilters, propertyTypes, districtFilters } = ctx;
  return `
    <div class="home-panel-top">
      <div class="bk-mode-pill" role="tablist" aria-label="Худалдан авалт эсвэл түрээс">
        <button class="${state.mode === 'sale' ? 'active' : ''}" onclick="setMode('sale')" role="tab" aria-selected="${state.mode === 'sale'}">
          <i data-lucide="home" class="w-3.5 h-3.5"></i> Худалдах
        </button>
        <button class="${state.mode === 'rent' ? 'active' : ''}" onclick="setMode('rent')" role="tab" aria-selected="${state.mode === 'rent'}">
          <i data-lucide="key-round" class="w-3.5 h-3.5"></i> Түрээс
        </button>
      </div>
    </div>

    ${renderActiveFilterBanner()}

    <aside class="bk-sidebar" aria-label="Шүүлтүүр">
      <div class="bk-side-title">Шүүх:</div>

      ${renderCollapsibleSection({
        key: 'district',
        label: 'Дүүрэг',
        items: districtFilters,
        activeCount: districtFilters.filter((d) => d.active).length,
        searchKey: 'districtSearch',
      })}

      ${renderCollapsibleSection({
        key: 'popular',
        label: 'Түгээмэл шүүлтүүр',
        items: popularFilters,
        activeCount: popularFilters.filter((f) => f.active).length,
      })}

      ${renderPriceSection()}

      ${renderCollapsibleSection({
        key: 'type',
        label: 'Үл хөдлөхийн төрөл',
        items: propertyTypes,
        activeCount: propertyTypes.filter((t) => t.active).length,
      })}
    </aside>
  `;
}


function renderHomeListCol() {
  const list = filteredListings();
  const totalForMode = modeListings().length;

  const scoreFor = (l) => {
    const s = 7.0 + Math.min(2.5, (l.viewCount || 0) / 80) + (l.status === 'hot' ? 0.4 : 0);
    return Math.round(Math.min(9.7, Math.max(6.8, s)) * 10) / 10;
  };
  const scoreLabel = (s) => (s >= 9.0 ? 'Маш сайн' : s >= 8.0 ? 'Сайн' : s >= 7.0 ? 'Дунд зэрэг' : 'Энгийн');
  const stars = (l) => {
    if (l.status === 'hot') return 5;
    if (l.price >= (state.mode === 'rent' ? 2500000 : 500000000)) return 4;
    if (l.status === 'new') return 3;
    return 2;
  };
  const sortLabel =
    {
      recommended: 'Санал болгох',
      newest: 'Шинэ нэмэгдсэн',
      priceAsc: 'Үнэ: бага → их',
      priceDesc: 'Үнэ: их → бага',
    }[state.sortBy || 'recommended'] || 'Санал болгох';

  return `
    <div class="bk-home">
      <div class="bk-sortrow">
        <div class="bk-sort-count">
          <strong class="num">${list.length}</strong> / ${totalForMode} зар
        </div>
        <button class="bk-sort" onclick="cycleHomeSort()" title="Эрэмбэлэлтийг сольж бичих">
          <i data-lucide="arrow-up-down" class="w-3.5 h-3.5"></i>
          ${sortLabel}
        </button>
      </div>

      ${
        list.length === 0
          ? `
        <div class="bk-empty">
          <h3>Үр дүн олдсонгүй</h3>
          <div>Шүүлтүүрээ багасгаж үзнэ үү.</div>
          <button class="bk-smart-find" onclick="clearAllFilters();" style="margin-top:14px;">Шүүлтүүр цэвэрлэх</button>
        </div>
      `
          : list
              .slice(0, 30)
              .map((l, idx) => {
                const isSaved = typeof SAVED_IDS !== 'undefined' && SAVED_IDS.has(l.id);
                const isFeatured = l.status === 'hot' || l.isUserListing;
                const title = `${l.khotkhon || l.district + ' хороолол'}`;
                const ipoteh = typeof hasIpoteh === 'function' && hasIpoteh(l);
                const floors = l.floor && /\//.test(l.floor) ? l.floor : l.floor + '/—';
                const isRent = l.mode === 'rent';
                return `
          <article class="bk-card ${isFeatured ? 'bk-featured-card' : ''}" ${isFeatured ? `style="--bk-featured-delay:${Math.min(idx, 8) * 70}ms"` : ''} data-listing-id="${l.id}"
            onclick="openProperty(${l.id})"
            onmouseenter="highlightHomePin && highlightHomePin(${l.id})"
            onmouseleave="highlightHomePin && highlightHomePin(null)">
            <div class="bk-card-img" style="background-image:url('${photoUrl(l, 0, '300/300')}')"></div>
            <div class="bk-card-body bm-listing-row-body">
              <div class="bm-listing-row-top">
                <div class="min-w-0">
                  <a class="bm-listing-row-title bk-card-title" onclick="event.stopPropagation(); openProperty(${l.id})">${title}</a>
                  <div class="bm-listing-row-loc">${l.district} дүүрэг, ${l.khoroo}-р хороо</div>
                </div>
                <button class="bm-listing-heart ${isSaved ? 'saved' : ''}"
                  onclick="event.stopPropagation(); toggleSaved(${l.id}, this);" title="Хадгалах">
                  <i data-lucide="heart" class="w-4 h-4"></i>
                </button>
              </div>
              <div class="bm-listing-row-specs">
                <span><i data-lucide="bed-double" class="w-3.5 h-3.5"></i>${l.rooms} өрөө</span>
                <span><i data-lucide="ruler" class="w-3.5 h-3.5"></i><span class="num">${l.area}</span> м²</span>
                <span><i data-lucide="building" class="w-3.5 h-3.5"></i>${floors} давхар</span>
              </div>
              <div>
                <div class="bm-listing-row-price num">${l.price.toLocaleString('en-US')}₮${isRent ? '/сар' : ''}</div>
                ${isRent ? '' : `<div class="bm-listing-row-ppm num">${listingPpm(l).toLocaleString('en-US')}₮/м²</div>`}
              </div>
              <div class="bm-listing-row-bottom">
                ${ipoteh ? '<span class="bm-tag">Ипотектэй</span>' : '<span></span>'}
                <span class="bm-time">${listingMinutesAgo(l)}</span>
              </div>
            </div>
          </article>
        `;
              })
              .join('')
      }

      ${
        list.length > 30
          ? `
        <div style="text-align:center; margin-top:16px;">
          <button class="bk-mapbtn" onclick="goTo('results')" style="margin-left:0;">
            Бүх <span class="num">${list.length}</span> зар →
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;
}

/* ===== БАРУУН ТАЛЫН MAP AREA — leaflet газрын зураг + хяналт ===== */
function renderHomeMapArea() {
  const alwaysShow = LISTINGS.filter((l) => l.status !== 'sold' && (l.status === 'hot' || l.isUserListing));
  const filteredForMap = (typeof filteredListings === 'function' ? filteredListings() : LISTINGS).filter(
    (l) => l.status !== 'sold',
  );
  const seen = new Set(alwaysShow.map((l) => l.id));
  const mergedPins = [...alwaysShow];
  for (const l of filteredForMap) {
    if (mergedPins.length >= 30) break;
    if (!seen.has(l.id)) {
      mergedPins.push(l);
      seen.add(l.id);
    }
  }
  state._homeMapPins = mergedPins;
  const visibleCount = mergedPins.length;

  return `
    <div id="leaflet-home-map" style="position: absolute; inset: 0;"></div>
    <div class="home-map-overlay">
      <div class="home-topbar">
        <div class="home-topbar-right" style="margin-left:auto;">
          <button class="home-filter-btn" onclick="openAdvancedFilters()" title="Дэлгэрэнгүй шүүлтүүр">
            <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
            <span>Дэлгэрэнгүй</span>
          </button>
          <button class="home-icon-btn" onclick="openPlacePicker()" title="Миний газар">
            <i data-lucide="map-pinned" class="w-4 h-4"></i>
            ${(state.myPlaces || []).length ? `<span class="home-icon-badge num">${state.myPlaces.length}</span>` : ''}
          </button>
          <button class="home-icon-btn" onclick="goTo('saved')" title="Хадгалсан">
            <i data-lucide="heart" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
      <div class="home-stats-strip">
        <div class="stat-item">
          <i data-lucide="map-pin" class="w-3.5 h-3.5" style="color: var(--gold-brand)"></i>
          <span><span class="stat-val num">${visibleCount}</span> зар</span>
        </div>
      </div>
    </div>
  `;
}

/* ===== Card ↔ Map pin highlight bridge ===== */
// Card → Pin: card hover үед газрын зургийн pin-г идэвхжүүлэх
window.highlightHomePin = function (id) {
  state._highlightedPinId = id;
  document.querySelectorAll('.leaflet-listing-icon-wrap').forEach((el) => {
    el.classList.toggle('leaflet-pin-active', String(el.dataset.listingId) === String(id));
  });
};

// Pin → Card: газрын зургийн pin-д hover хийх үед жагсаалт дээрх картыг highlight хийх
window.highlightHomeCard = function (id, scroll) {
  document.querySelectorAll('.bk-card').forEach((el) => {
    el.classList.toggle('bk-card-active', String(el.dataset.listingId) === String(id));
  });
  if (scroll && id != null) {
    const card = document.querySelector(`.bk-card[data-listing-id="${id}"]`);
    const container = document.getElementById('home-list-col');
    if (card && container) {
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (cardRect.top < containerRect.top || cardRect.bottom > containerRect.bottom) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
};

function renderHomeMap() {
  const featured = LISTINGS.filter((l) => l.status !== 'sold').slice(0, 5);
  const newListings = LISTINGS.filter((l) => l.status === 'new' || l.listedDays <= 5).slice(0, 4);
  const heroSpotlight = LISTINGS.find((l) => l.status === 'hot') || LISTINGS.find((l) => l.photos);
  // Кластер pin тус бүрд хамгийн өндөр үнэтэй жишиг зар-ыг урьдчилан таалуулна
  const clusterSample = (name) => {
    const arr = LISTINGS.filter((l) => l.district === name && l.mode === 'sale' && l.status !== 'sold');
    return arr.sort((a, b) => b.price - a.price)[0] || LISTINGS.find((l) => l.district === name) || null;
  };
  const clusters = [
    { name: 'Сүхбаатар', count: 120, x: 46, y: 26, sample: clusterSample('Сүхбаатар') },
    { name: 'Чингэлтэй', count: 85, x: 76, y: 30, sample: clusterSample('Чингэлтэй'), flipLeft: true },
    { name: 'Хан-Уул', count: 92, x: 26, y: 56, sample: clusterSample('Хан-Уул') },
    { name: 'Баянзүрх', count: 84, x: 58, y: 48, sample: clusterSample('Баянзүрх'), flipLeft: true },
  ];

  const alwaysShow = LISTINGS.filter(
    (l) => l.status !== 'sold' && l.mode === state.mode && (l.status === 'hot' || l.isUserListing),
  );
  const filteredForHome = (typeof filteredListings === 'function' ? filteredListings() : LISTINGS).filter(
    (l) => l.status !== 'sold',
  );
  const seen = new Set(alwaysShow.map((l) => l.id));
  const mergedPins = [...alwaysShow];
  for (const l of filteredForHome) {
    if (mergedPins.length >= 14) break;
    if (!seen.has(l.id)) {
      mergedPins.push(l);
      seen.add(l.id);
    }
  }
  const homeMapPins = mergedPins;
  state._homeMapPins = homeMapPins;

  const visibleCount = homeMapPins.length;
  const featuredCount = homeMapPins.filter((l) => l.status === 'hot' || l.isUserListing).length;
  const avgPpm = homeMapPins.length
    ? Math.round(homeMapPins.reduce((s, l) => s + l.price / l.area, 0) / homeMapPins.length)
    : 0;

  return `
    <!-- ============== MAP-FIRST HERO ============== -->
    <section class="home-map-hero">
      <div id="leaflet-home-map" style="position: absolute; inset: 0;"></div>

      <div class="home-map-overlay">
        <!-- TOP BAR: AI-search (left/center) vs Filter-search (right) -->
        <div class="home-topbar">
          <div class="home-topbar-left">
            <div class="home-map-mode-toggle">
              <button class="${state.mode === 'sale' ? 'active' : ''}" onclick="setMode('sale')"><i data-lucide="home" class="w-3.5 h-3.5"></i> Худалдах</button>
              <button class="${state.mode === 'rent' ? 'active' : ''}" onclick="setMode('rent')"><i data-lucide="key-round" class="w-3.5 h-3.5"></i> Түрээс</button>
            </div>
            <button class="home-filter-btn" onclick="switchHomeView('list')" title="Жагсаалт харагдац">
              <i data-lucide="list" class="w-4 h-4"></i><span>Жагсаалт</span>
            </button>
          </div>

          <div class="home-topbar-right">
            <!-- Дэлгэрэнгүй шүүлтүүрийг modal-аар нээх -->
            <button class="home-filter-btn ${state.filterDistrict || state.filterRooms || state.filterPriceMax || state.filterPpmMin || state.filterPpmMax || state.filterVerified || state.filterIpoteh ? 'has-active' : ''}" onclick="openAdvancedFilters()" title="Дэлгэрэнгүй шүүлтүүр">
              <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
              <span>Шүүлтүүр</span>
              ${(() => {
                let n = 0;
                if (state.filterDistrict) n++;
                if (state.filterRooms) n++;
                if (state.filterPriceMax || state.filterPriceMin) n++;
                if (state.filterPpmMin || state.filterPpmMax) n++;
                if (state.filterAreaMin || state.filterAreaMax) n++;
                if (state.filterVerified) n++;
                if (state.filterIpoteh) n++;
                if (state.filterNewProject) n++;
                if (state.filterSchool) n++;
                return n > 0 ? `<span class="filter-count num">${n}</span>` : '';
              })()}
            </button>
            <button class="home-icon-btn" onclick="openPlacePicker()" title="Миний газар нэмэх (Гэр / Ажил / Сургууль / Цэцэрлэг). Олныг нэр өгөөд нэмж болно.">
              <i data-lucide="map-pinned" class="w-4 h-4"></i>
              ${(state.myPlaces || []).length ? `<span class="home-icon-badge num">${state.myPlaces.length}</span>` : ''}
            </button>
            <button class="home-icon-btn" onclick="goTo('saved')" title="Хадгалсан">
              <i data-lucide="heart" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Second row: quick-filter bar (Districts · Rooms · Price) -->
        ${(() => {
          const PRICE_BUCKETS =
            state.mode === 'rent'
              ? [
                  { label: '< 1сая', min: null, max: 1 },
                  { label: '1-2сая', min: 1, max: 2 },
                  { label: '2-3сая', min: 2, max: 3 },
                  { label: '3сая+', min: 3, max: null },
                ]
              : [
                  { label: '< 150сая', min: null, max: 150 },
                  { label: '150-300', min: 150, max: 300 },
                  { label: '300-500', min: 300, max: 500 },
                  { label: '500сая+', min: 500, max: null },
                ];
          const ROOMS = [1, 2, 3, 4];
          const hasAnyFilter =
            state.filterDistrict ||
            state.filterRooms ||
            state.filterPriceMin ||
            state.filterPriceMax ||
            state.filterVerified ||
            state.filterIpoteh ||
            state.filterNewProject ||
            state.aiQuery;
          const activeCount = [
            state.filterDistrict,
            state.filterRooms,
            state.filterPriceMin || state.filterPriceMax ? 1 : 0,
            state.filterVerified,
            state.filterIpoteh,
            state.filterNewProject,
            state.aiQuery,
          ].filter(Boolean).length;
          return `
          <div class="qf-bar" role="toolbar" aria-label="Түргэн шүүлтүүр">
            <div class="qf-bar-scroll">
              <!-- District group -->
              <div class="qf-group" role="group" aria-label="Дүүрэг">
                <span class="qf-group-label"><i data-lucide="map-pin" class="w-3 h-3"></i> Дүүрэг</span>
                <div class="qf-chips">
                  ${DISTRICTS.slice(0, 6)
                    .map(
                      (d) => `
                    <button class="qf-chip ${state.filterDistrict === d ? 'active' : ''}"
                      onclick="toggleHomeDistrict('${d}')"
                      aria-pressed="${state.filterDistrict === d}">${d}</button>
                  `,
                    )
                    .join('')}
                </div>
              </div>

              <span class="qf-divider" aria-hidden="true"></span>

              <!-- Rooms group -->
              <div class="qf-group" role="group" aria-label="Өрөөний тоо">
                <span class="qf-group-label"><i data-lucide="layout-grid" class="w-3 h-3"></i> Өрөө</span>
                <div class="qf-chips">
                  ${ROOMS.map(
                    (n) => `
                    <button class="qf-chip qf-chip--num ${state.filterRooms === n ? 'active' : ''}"
                      onclick="toggleHomeRooms(${n})"
                      aria-pressed="${state.filterRooms === n}">${n}${n === 4 ? '+' : ''}</button>
                  `,
                  ).join('')}
                </div>
              </div>

              <span class="qf-divider" aria-hidden="true"></span>

              <!-- Price group -->
              <div class="qf-group" role="group" aria-label="Үнэ">
                <span class="qf-group-label"><i data-lucide="banknote" class="w-3 h-3"></i> Үнэ</span>
                <div class="qf-chips">
                  ${PRICE_BUCKETS.map(
                    (b) => `
                    <button class="qf-chip ${isHomePriceActive(b.min, b.max) ? 'active' : ''}"
                      onclick="toggleHomePrice(${b.min == null ? 'null' : b.min}, ${b.max == null ? 'null' : b.max})"
                      aria-pressed="${isHomePriceActive(b.min, b.max)}">${b.label}</button>
                  `,
                  ).join('')}
                </div>
              </div>

              ${
                hasAnyFilter
                  ? `
                <span class="qf-divider" aria-hidden="true"></span>
                <div class="qf-bar-actions">
                  <button class="qf-clear" onclick="clearAllFilters(); renderAppScreen('home'); setTimeout(()=>lucide.createIcons(),0);" title="Бүх шүүлтүүрийг арилгах">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    <span>Цэвэрлэх</span>
                    ${activeCount > 0 ? `<span class="qf-clear-count num">${activeCount}</span>` : ''}
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          </div>
          `;
        })()}

        <!-- Bottom-center: live stats strip -->
        <div class="home-stats-strip">
          <div class="stat-item">
            <i data-lucide="map-pin" class="w-3.5 h-3.5" style="color: var(--gold-brand)"></i>
            <span><span class="stat-val num">${visibleCount}</span> зар харагдаж байна</span>
          </div>
          ${
            featuredCount > 0
              ? `
            <div class="home-stats-divider"></div>
            <div class="stat-item featured">
              <i data-lucide="star" class="w-3.5 h-3.5"></i>
              <span><span class="stat-val num">${featuredCount}</span> онцлох</span>
            </div>
          `
              : ''
          }
          ${
            avgPpm > 0
              ? `
            <div class="home-stats-divider"></div>
            <div class="stat-item">
              <i data-lucide="trending-up" class="w-3.5 h-3.5" style="color: var(--gold-brand)"></i>
              <span>Дундаж м²: <span class="stat-val num">${fmtCompact(avgPpm)}</span></span>
            </div>
          `
              : ''
          }
          <div class="home-stats-divider"></div>
          <button class="stat-item" onclick="goTo('results')" style="color: var(--gold-brand); font-weight: 600;">
            Жагсаалт <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </section>
  `;
}
/* ============== HOME — OLD CONTENT REMOVED ============== */
function renderHome_OLD_DISABLED() {
  return `<!-- ============== ЗАХ ЗЭЭЛИЙН ТАНИЛЦУУЛГА — 5 STAT METRICS ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-10">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        ${[
          { icon: 'home', val: '45,892', label: 'Нийт зар' },
          { icon: 'tag', val: '12,345', label: 'Худалдах' },
          { icon: 'key-round', val: '8,765', label: 'Түрээс' },
          { icon: 'sparkles', val: '234', label: 'Шинэ зар' },
          { icon: 'users', val: '2,543', label: 'Брокер агент' },
        ]
          .map(
            (s) => `
          <div class="card p-4 flex items-center gap-3" style="background: var(--surface);">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background: var(--primary-soft); color: var(--primary);">
              <i data-lucide="${s.icon}" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="num text-xl font-bold leading-none" style="color: var(--text);">${s.val}</div>
              <div class="text-[11px] mt-1" style="color: var(--text-3);">${s.label}</div>
            </div>
          </div>
        `,
          )
          .join('')}
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
        ${PROPERTY_TYPES.map(
          (t) => `
          <button onclick="selectPropertyType('${t.key}', '${t.mode}')"
            class="card p-4 text-center transition flex flex-col items-center gap-2 hover:border-[var(--primary)]"
            style="background: var(--surface);">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: var(--primary-soft); color: var(--primary);">
              <i data-lucide="${t.icon}" class="w-6 h-6"></i>
            </div>
            <div class="font-semibold text-sm" style="color: var(--text);">${t.label}</div>
            <div class="num text-[11px]" style="color: var(--text-3);">${t.count.toLocaleString()} зар</div>
          </button>
        `,
        ).join('')}
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
              <span class="text-[11px] font-semibold uppercase tracking-wider" style="letter-spacing: .12em;">NEOMAP AI туслах</span>
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
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--primary); color: #FFFFFF;">
                  <i data-lucide="sparkles" class="w-4 h-4"></i>
                </div>
                <div class="rounded-xl px-3.5 py-2.5 text-sm" style="background: var(--surface-2); color: var(--text);">
                  Сайн уу 👋 Та ямар үл хөдлөх хөрөнгө хайж байна вэ? Жишээ нь "Хан-Уулд 3 өрөө, 450 саяс доош, сургууль ойр".
                </div>
              </div>
            </div>

            <!-- suggestion chips -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              ${AI_ASSISTANT_QUESTIONS.map(
                (q) => `
                <button onclick="runAIExample(${JSON.stringify(q.text).replace(/"/g, '&quot;')})"
                  class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full transition"
                  style="background: var(--surface); border: 1px solid var(--border); color: var(--text-2);"
                  onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--text)';"
                  onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-2)';">
                  <i data-lucide="${q.icon}" class="w-3 h-3"></i> ${q.text}
                </button>
              `,
              ).join('')}
            </div>

            <!-- input -->
            <div class="flex items-center gap-2 rounded-lg pl-3.5 pr-1.5 py-1.5" style="background: var(--surface); border: 1px solid var(--border);">
              <i data-lucide="message-square" class="w-4 h-4" style="color: var(--text-3);"></i>
              <input id="bm-ai-assistant-input" type="text" placeholder="Жишээ асуулт бичих..."
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); runAISearch(this.value); }"
                class="flex-1 bg-transparent border-0 outline-none text-sm py-1.5" style="color: var(--text);" />
              <button onclick="runAISearch(document.getElementById('bm-ai-assistant-input').value)"
                class="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style="background: var(--primary); color: #FFFFFF;">
                <i data-lucide="send" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============== FEATURED LISTINGS ============== -->
    <section class="bm-featured-section max-w-7xl mx-auto px-4 lg:px-8 pt-12">
      <div class="bm-featured-glow"></div>
      <div class="flex items-end justify-between mb-6 relative">
        <div class="bm-featured-heading">
          <span class="bm-featured-heading-icon"><i data-lucide="sparkles" class="w-4 h-4"></i></span>
          <div>
            <div class="bm-featured-eyebrow">PREMIUM SELECTION</div>
            <h2 class="text-2xl font-bold tracking-tight">Онцлох үл хөдлөхүүд</h2>
          </div>
        </div>
        <button onclick="goTo('results')" class="text-sm font-medium" style="color: var(--gold-brand);">Бүгдийг харах →</button>
      </div>
      <div class="bm-featured-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
        ${featured.map((l) => bmListingCard(l)).join('')}
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
        ${newListings
          .map(
            (l) => `
          <div onclick="openProperty(${l.id})" class="card overflow-hidden cursor-pointer transition" style="background: var(--surface);"
            onmouseover="this.style.borderColor='var(--primary)';" onmouseout="this.style.borderColor='var(--border)';">
            <div class="relative h-44 bg-cover bg-center" style="background-image:url('${photoUrl(l, 0, '600/400')}');">
              <span class="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold" style="background: var(--primary); color: #FFFFFF;">
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
        `,
          )
          .join('')}
      </div>
    </section>

    <!-- ============== ЯАГААД NEOMAP — 6 REASONS ============== -->
    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-14">
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style="background: var(--primary-soft); color: var(--primary);">
          <i data-lucide="award" class="w-3.5 h-3.5"></i>
          <span class="text-[11px] font-semibold uppercase tracking-wider" style="letter-spacing: .12em;">Яагаад NEOMAP гэж?</span>
        </div>
        <h2 class="text-2xl lg:text-3xl font-bold tracking-tight">Үл хөдлөхөд зориулсан, ухаалаг шийдэл</h2>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${[
          {
            icon: 'sparkles',
            title: 'AI Хайлт',
            desc: 'Таны хэрэгцээ, төсөв, байршлаасаа хамаараан хамгийн тохирох үл хөдлөхийг AI санал болгоно.',
          },
          {
            icon: 'map-pin',
            title: 'Газрын зурган хайлт',
            desc: 'Интерактив газрын зураг дээр байршил, орчны мэдээлэлтэй хамт хайлт хийнэ.',
          },
          {
            icon: 'shield-check',
            title: 'Verified баталгаажуулалт',
            desc: 'Бүх зар мэдээлэл бодит, баримттай. Найдвартай байдлыг бид баталгаажуулна.',
          },
          {
            icon: 'line-chart',
            title: 'Зах зээлийн мэдээ',
            desc: 'Үнийн өөрчлөлт, эрэлт, нийлүүлэлтийн бодит мэдээлэл тогтмол хүргэнэ.',
          },
          {
            icon: 'bus',
            title: 'Тээврээр хайх',
            desc: 'Автобусны буудал, метроос ойр сууцыг шууд олж, тав тухын зайгаар жагсаана.',
          },
          {
            icon: 'message-square',
            title: 'AI туслах чат',
            desc: 'Хүсэлтээ чөлөөтэй бичээд, NEOMAP AI таныг шилдэг зар руу удирдан зөвлөнө.',
          },
        ]
          .map(
            (f) => `
          <div class="card p-5 transition" style="background: var(--surface);"
            onmouseover="this.style.borderColor='var(--primary)';" onmouseout="this.style.borderColor='var(--border)';">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style="background: var(--primary-soft); color: var(--primary);">
              <i data-lucide="${f.icon}" class="w-5 h-5"></i>
            </div>
            <div class="font-semibold text-base mb-1.5" style="color: var(--text);">${f.title}</div>
            <div class="text-sm leading-relaxed" style="color: var(--text-3);">${f.desc}</div>
          </div>
        `,
          )
          .join('')}
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
            {
              icon: 'home',
              label: '1м² дундаж үнэ (орон сууц)',
              val: '3,278,000₮',
              delta: '2.6%',
              dir: 'up',
              sub: 'емнөх сараас',
            },
            { icon: 'building-2', label: 'Идэвхтэй зар', val: '8,642', delta: '8.3%', dir: 'up', sub: 'емнөх сараас' },
            {
              icon: 'pie-chart',
              label: 'Худалдаа дундаж хугацаа',
              val: '48 хоног',
              delta: '-5 хоног',
              dir: 'down',
              sub: 'емнөх сараас',
            },
            {
              icon: 'trending-up',
              label: 'Эрэлттэй дүүрэг',
              val: 'Хан-Уул',
              delta: '34%',
              dir: 'up',
              sub: 'зах зээлийн хувь',
            },
          ]
            .map(
              (s) => `
            <div class="bm-stat-cell">
              <div class="bm-stat-icon"><i data-lucide="${s.icon}" class="w-5 h-5"></i></div>
              <div>
                <div class="bm-stat-label">${s.label}</div>
                <div class="bm-stat-val num">${s.val}</div>
                <div class="bm-stat-delta ${s.dir === 'down' ? 'down' : ''}">
                  <i data-lucide="${s.dir === 'up' ? 'arrow-up-right' : 'arrow-down-right'}" class="w-3 h-3 inline"></i>
                  ${s.delta} <span style="color: var(--text-3);">${s.sub}</span>
                </div>
              </div>
            </div>
          `,
            )
            .join('')}
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
              { letter: 'X', label: 'ХААН БАНК' },
              { letter: 'G', label: 'ГОЛОМТ БАНК' },
              { letter: 'T', label: 'ТӨРИЙН БАНК' },
              { letter: 'M', label: 'MIK' },
              { letter: 'B', label: 'BOGD BANK' },
            ]
              .map(
                (b) => `
              <span class="bm-bank">
                <span class="bm-bank-mark">${b.letter}</span>
                ${b.label}
              </span>
            `,
              )
              .join('')}
          </div>
        </div>
        <div class="bm-testimonial">
          <i data-lucide="quote" class="w-5 h-5 mb-3" style="color: var(--gold-brand);"></i>
          <p class="bm-testimonial-quote">"NEOMAP-аар хайлт хийхэд маш амархан, цаг хугацаа хэмнэж, бодит мэдээлэлтэй үл хөдлөхүүдийг олж чадсан."</p>
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
/* ============== RESULTS (NEOMAP — Image 2) ============== */
