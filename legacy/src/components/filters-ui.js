/* ============== COMPONENTS — filter blocks, price slider, active chips ============== */

function isHomePriceActive(minMillions, maxMillions) {
  const min = minMillions ? minMillions * 1_000_000 : null;
  const max = maxMillions ? maxMillions * 1_000_000 : null;
  return (state.filterPriceMin || null) === min && (state.filterPriceMax || null) === max;
}

/* ============== HOME LIST-VIEW ШҮҮЛТҮҮРИЙН ТУСЛАХУУД ============== */
window.toggleHomeVerified = function () {
  state.filterVerified = !state.filterVerified;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.toggleHomeIpoteh = function () {
  state.filterIpoteh = !state.filterIpoteh;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.toggleHomeNewProject = function () {
  state.filterNewProject = !state.filterNewProject;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.toggleHomeFeature = function (feature) {
  state.filterFeature = state.filterFeature === feature ? null : feature;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.toggleHomeCategory = function (cat) {
  state.filterCategory = state.filterCategory === cat ? null : cat;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.cycleHomeSort = function () {
  const order = ['recommended', 'newest', 'priceAsc', 'priceDesc'];
  const i = order.indexOf(state.sortBy || 'recommended');
  state.sortBy = order[(i + 1) % order.length];
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.switchHomeView = function (view) {
  state.homeView = view;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};

/* ===== Side section collapse toggle ===== */
window.toggleSideSection = function (key) {
  if (!state._sideCollapsed) state._sideCollapsed = {};
  state._sideCollapsed[key] = !state._sideCollapsed[key];
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};

/* ===== Price helpers ===== */
let _priceDebounceTimer = null;
function _debouncedRender() {
  clearTimeout(_priceDebounceTimer);
  _priceDebounceTimer = setTimeout(() => {
    renderAppScreen('home');
    setTimeout(() => {
      lucide.createIcons();
      // restore focus to the same price field
      const focused = document.activeElement;
      // intentionally no-op — re-render replaces nodes; user can re-click input
    }, 0);
  }, 320);
}
window.setHomePriceMin = function (value) {
  const v = parseFloat(value);
  state.filterPriceMin = isNaN(v) || v <= 0 ? null : v * 1_000_000;
  _debouncedRender();
};
window.setHomePriceMax = function (value) {
  const v = parseFloat(value);
  state.filterPriceMax = isNaN(v) || v <= 0 ? null : v * 1_000_000;
  _debouncedRender();
};
window.setHomePriceRange = function (min, max) {
  const same = (state.filterPriceMin || null) === (min || null) && (state.filterPriceMax || null) === (max || null);
  state.filterPriceMin = same ? null : min || null;
  state.filterPriceMax = same ? null : max || null;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.clearHomePrice = function () {
  state.filterPriceMin = null;
  state.filterPriceMax = null;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};

/* ===== Чирэх slider — preview ба commit ===== */
function _fmtPriceShort(v) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1) + 'тэрбум';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'сая';
  if (v >= 1_000) return Math.round(v / 1_000) + 'к';
  return String(v);
}

window.previewPriceSlider = function (which) {
  const minEl = document.getElementById('bk-range-min');
  const maxEl = document.getElementById('bk-range-max');
  const slider = document.querySelector('.bk-range-slider');
  if (!minEl || !maxEl || !slider) return;
  const MAX = parseInt(slider.dataset.max, 10) || 10_000_000;
  const STEP = parseInt(slider.dataset.step, 10) || 100_000;
  let min = parseInt(minEl.value, 10);
  let max = parseInt(maxEl.value, 10);
  // Хоёр thumb-ийг хоорондоо давхцуулахгүй (хамгийн багадаа 1 step зайтай)
  if (which === 'min' && min > max - STEP) {
    min = max - STEP;
    minEl.value = min;
  }
  if (which === 'max' && max < min + STEP) {
    max = min + STEP;
    maxEl.value = max;
  }
  const fill = document.getElementById('bk-range-fill');
  if (fill) {
    fill.style.left = (min / MAX) * 100 + '%';
    fill.style.right = 100 - (max / MAX) * 100 + '%';
  }
  const minLabel = document.getElementById('bk-range-min-val');
  const maxLabel = document.getElementById('bk-range-max-val');
  if (minLabel) minLabel.textContent = _fmtPriceShort(min) + ' ₮';
  if (maxLabel) maxLabel.textContent = _fmtPriceShort(max) + ' ₮' + (max >= MAX ? '+' : '');
  // Үнийн доод/дээд input-уудыг live синк хийх
  const inMin = document.querySelector('input.bk-price-input[placeholder="Доод"]');
  const inMax = document.querySelector('input.bk-price-input[placeholder="Дээд"]');
  if (inMin) inMin.value = min > 0 ? Math.round((min / 1_000_000) * 10) / 10 : '';
  if (inMax) inMax.value = max < MAX ? Math.round((max / 1_000_000) * 10) / 10 : '';
};

window.commitPriceSlider = function () {
  const minEl = document.getElementById('bk-range-min');
  const maxEl = document.getElementById('bk-range-max');
  const slider = document.querySelector('.bk-range-slider');
  if (!minEl || !maxEl || !slider) return;
  const MAX = parseInt(slider.dataset.max, 10) || 10_000_000;
  const min = parseInt(minEl.value, 10);
  const max = parseInt(maxEl.value, 10);
  state.filterPriceMin = min > 0 ? min : null;
  state.filterPriceMax = max < MAX ? max : null;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.isHomePriceActive = isHomePriceActive;

window.setPriceFilterMode = function (mode) {
  if (mode !== 'total' && mode !== 'ppm') return;
  if (state.priceFilterMode === mode) return;
  state.priceFilterMode = mode;
  // Бусад горимыг арилгаж зөвхөн идэвхтэй горимын утга үлдээнэ.
  if (mode === 'total') {
    state.filterPpmMin = null;
    state.filterPpmMax = null;
  } else {
    state.filterPriceMin = null;
    state.filterPriceMax = null;
  }
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.setHomePpmMin = function (value) {
  const v = parseFloat(value);
  state.filterPpmMin = isNaN(v) || v <= 0 ? null : v;
  _debouncedRender();
};
window.setHomePpmMax = function (value) {
  const v = parseFloat(value);
  state.filterPpmMax = isNaN(v) || v <= 0 ? null : v;
  _debouncedRender();
};
window.setHomePpmRange = function (min, max) {
  const same = (state.filterPpmMin || null) === (min || null) && (state.filterPpmMax || null) === (max || null);
  state.filterPpmMin = same ? null : min || null;
  state.filterPpmMax = same ? null : max || null;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};
window.clearHomePpm = function () {
  state.filterPpmMin = null;
  state.filterPpmMax = null;
  renderAppScreen('home');
  setTimeout(() => lucide.createIcons(), 0);
};


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
        ${
          stop
            ? `
          <div class="card p-3 flex items-center gap-2.5" style="border-color: var(--primary); background: var(--primary-soft);">
            <div class="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style="background: var(--primary); color: #FFFFFF;">
              <i data-lucide="bus" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium truncate">${stop.name}</div>
              <div class="text-[10px] text-[var(--text-3)]">${stop.district} · ${stop.routes.length} маршрут</div>
            </div>
          </div>
        `
            : `
          <button onclick="openBusStopPicker()" class="w-full card p-3 text-left text-sm text-[var(--text-2)] hover:border-[var(--primary)] transition flex items-center justify-between">
            <span>Буудал сонгох</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        `
        }
      </div>
      <div>
        <div class="eyebrow mb-2">Дүүрэг</div>
        <div class="space-y-0.5">
          ${DISTRICTS.map((d) => {
            const c = list.filter((l) => l.district === d).length;
            return `<label class="filter-row">
              <input type="checkbox" ${state.filterDistrict === d ? 'checked' : ''} onchange="state.filterDistrict = this.checked ? '${d}' : null; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" />
              <span>${d}</span><span class="count num">${c}</span>
            </label>`;
          }).join('')}
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">Өрөөний тоо</div>
        <div class="grid grid-cols-4 gap-2">
          ${[1, 2, 3, 4].map((n) => `<button onclick="state.filterRooms = state.filterRooms===${n} ? null : ${n}; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="src-chip py-2 ${state.filterRooms === n ? 'selected' : ''}">${n}${n === 4 ? '+' : ''}</button>`).join('')}
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">${ist ? 'Сарын түрээс' : 'Үнэ'}</div>
        <div class="flex items-end gap-[2px] h-12 mb-3">
          ${[3, 5, 8, 12, 18, 22, 26, 22, 16, 11, 7, 4, 2].map((h) => `<div class="flex-1 rounded-sm" style="height:${h * 3.5}%; background: var(--primary); opacity:${(h / 30).toFixed(2)};"></div>`).join('')}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input class="input num" value="${ist ? '800,000' : '300,000,000'}" />
          <input class="input num" value="${ist ? '2,000,000' : '600,000,000'}" />
        </div>
      </div>
    </div>
  `;
}

/* ---------- listing card ---------- */
/* ============== BAIRMAP — NEW LISTING CARDS ============== */


function renderActiveFilterBanner() {
  const chips = activeFilterChips();
  if (chips.length === 0) return '';
  return `
    <div class="bk-active-summary">
      <span class="bk-active-summary-text"><strong class="num">${chips.length}</strong> шүүлтүүр идэвхтэй</span>
      <button class="bk-active-clear" onclick="clearAllFilters();" title="Бүгдийг цэвэрлэх">
        <i data-lucide="x" class="w-3 h-3"></i> Цэвэрлэх
      </button>
    </div>
    <div class="bk-active-chips">
      ${chips
        .map(
          (c) => `
        <button class="bk-active-chip" onclick="${c.remove}" title="${c.label} — устгах">
          ${c.label} <i data-lucide="x"></i>
        </button>
      `,
        )
        .join('')}
    </div>
  `;
}

/* ===== Бүх идэвхтэй шүүлтүүрийг chip болгож буцаах ===== */
function activeFilterChips() {
  const chips = [];
  if (state.filterDistrict)
    chips.push({ label: state.filterDistrict, remove: `toggleHomeDistrict('${state.filterDistrict}')` });
  if (state.filterRooms)
    chips.push({
      label: state.filterRooms + (state.filterRooms === 4 ? '+ өрөө' : ' өрөө'),
      remove: `toggleHomeRooms(${state.filterRooms})`,
    });
  if (state.filterVerified) chips.push({ label: 'Баталгаажсан', remove: 'toggleHomeVerified()' });
  if (state.filterIpoteh) chips.push({ label: 'Ипотек', remove: 'toggleHomeIpoteh()' });
  if (state.filterNewProject) chips.push({ label: 'Шинэ төсөл', remove: 'toggleHomeNewProject()' });
  if (state.filterFeature)
    chips.push({ label: state.filterFeature, remove: `toggleHomeFeature('${state.filterFeature}')` });
  if (state.filterCategory) {
    const labels = { house: 'Хаус', premium: 'Premium', hot: 'Онцлох', new: 'Шинэ', drop: 'Үнэ буурсан' };
    chips.push({
      label: labels[state.filterCategory] || state.filterCategory,
      remove: `toggleHomeCategory('${state.filterCategory}')`,
    });
  }
  if (state.filterPriceMin || state.filterPriceMax) {
    const fmt = (v) => (v ? Math.round(v / 1_000_000) + 'сая' : '0');
    const suf = state.mode === 'rent' ? '₮/сар' : '₮';
    chips.push({
      label: `Үнэ: ${fmt(state.filterPriceMin)} – ${fmt(state.filterPriceMax) || '∞'} ${suf}`,
      remove: 'clearHomePrice()',
    });
  }
  if (state.filterPpmMin || state.filterPpmMax) {
    const fmtPpm = (v) => {
      if (!v) return '0';
      if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'сая';
      if (v >= 1_000) return Math.round(v / 1_000) + 'к';
      return v;
    };
    const suf = state.mode === 'rent' ? '₮/м²/сар' : '₮/м²';
    chips.push({
      label: `${fmtPpm(state.filterPpmMin)} – ${fmtPpm(state.filterPpmMax) || '∞'} ${suf}`,
      remove: 'clearHomePpm()',
    });
  }
  return chips;
}

/* ===== Collapsible section helper ===== */
function renderCollapsibleSection({ key, label, items, activeCount, searchKey }) {
  if (!items || !items.length) return '';
  if (!state._sideCollapsed) state._sideCollapsed = {};
  const isCollapsed = !!state._sideCollapsed[key];

  // Search filter
  let visibleItems = items;
  const search = searchKey ? (state[searchKey] || '').trim().toLowerCase() : '';
  if (search) visibleItems = items.filter((i) => i.label.toLowerCase().includes(search));

  // Show-more toggle (cap at 6 by default)
  const showAllKey = `_sideShowAll_${key}`;
  const showAll = !!state[showAllKey];
  const CAP = 6;
  const needsCap = visibleItems.length > CAP;
  const shownItems = needsCap && !showAll ? visibleItems.slice(0, CAP) : visibleItems;

  return `
    <div class="bk-side-section ${isCollapsed ? 'collapsed' : ''}">
      <div class="bk-side-heading" onclick="toggleSideSection('${key}')">
        <span class="bk-side-heading-left">
          ${label}
          ${activeCount > 0 ? `<span class="bk-side-heading-count num">${activeCount}</span>` : ''}
        </span>
        <i data-lucide="chevron-down" class="bk-side-heading-chev w-4 h-4"></i>
      </div>
      <div class="bk-side-section-body">
        ${
          searchKey && items.length > 5
            ? `
          <div class="bk-filter-search">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Хайх..." value="${search}"
              oninput="state.${searchKey} = this.value; renderAppScreen('home'); setTimeout(()=>{const el=document.querySelector('.bk-filter-search input'); if(el){el.focus(); el.setSelectionRange(el.value.length,el.value.length);} lucide.createIcons();},0);" />
          </div>
        `
            : ''
        }
        ${shownItems
          .map(
            (it) => `
          <label class="bk-check" onclick="event.preventDefault(); ${it.toggle};">
            <span class="bk-check-label">
              <input type="checkbox" ${it.active ? 'checked' : ''} tabindex="-1" />
              ${it.label}
            </span>
            <span class="bk-check-count num">${it.count}</span>
          </label>
        `,
          )
          .join('')}
        ${
          needsCap
            ? `
          <button class="bk-show-toggle" onclick="state.${showAllKey} = ${!showAll}; renderAppScreen('home'); setTimeout(()=>lucide.createIcons(),0);">
            ${showAll ? '↑ Цөөн харах' : `↓ Бүгдийг харах (${visibleItems.length - CAP} илүү)`}
          </button>
        `
            : ''
        }
      </div>
    </div>
  `;
}

/* ===== Чирэх төсөв slider — total range ===== */
function renderPriceSlider(kind) {
  const isRent = state.mode === 'rent';
  // Mode-аар хязгаар: rent → 0–10 сая, sale → 0–2 тэрбум
  const MAX = isRent ? 10_000_000 : 2_000_000_000;
  const STEP = isRent ? 100_000 : 10_000_000;
  const minVal = state.filterPriceMin || 0;
  const maxVal = state.filterPriceMax || MAX;
  const clampedMin = Math.max(0, Math.min(minVal, MAX));
  const clampedMax = Math.max(0, Math.min(maxVal, MAX));
  const fillL = (clampedMin / MAX) * 100;
  const fillR = 100 - (clampedMax / MAX) * 100;
  const fmt = (v) => {
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1) + 'тэрбум';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'сая';
    if (v >= 1_000) return Math.round(v / 1_000) + 'к';
    return v + '';
  };
  return `
    <div class="bk-range-vals">
      <span class="bk-range-val num" id="bk-range-min-val">${fmt(clampedMin)} ₮</span>
      <span class="bk-range-val num" id="bk-range-max-val">${fmt(clampedMax)} ₮${clampedMax >= MAX ? '+' : ''}</span>
    </div>
    <div class="bk-range-slider" data-max="${MAX}" data-step="${STEP}">
      <div class="bk-range-track"></div>
      <div class="bk-range-fill" id="bk-range-fill" style="left:${fillL}%; right:${fillR}%;"></div>
      <input type="range" id="bk-range-min" min="0" max="${MAX}" step="${STEP}" value="${clampedMin}"
        oninput="previewPriceSlider('min')"
        onchange="commitPriceSlider()" />
      <input type="range" id="bk-range-max" min="0" max="${MAX}" step="${STEP}" value="${clampedMax}"
        oninput="previewPriceSlider('max')"
        onchange="commitPriceSlider()" />
    </div>
    <div class="bk-range-bounds">
      <span>0 ₮</span>
      <span>${fmt(MAX)} ₮+</span>
    </div>
  `;
}

/* ===== Үнийн range section — 2 горим: нийт ₮ / ₮ нэг м² ===== */
function renderPriceSection() {
  const isRent = state.mode === 'rent';
  const isCollapsed = state._sideCollapsed && state._sideCollapsed.price;
  const mode = state.priceFilterMode || 'total';

  // ── Нийт үнийн presets (₮ сая)
  const totalPresets = isRent
    ? [
        { label: '<1сая', min: null, max: 1_000_000 },
        { label: '1-2сая', min: 1_000_000, max: 2_000_000 },
        { label: '2-3сая', min: 2_000_000, max: 3_000_000 },
        { label: '3сая+', min: 3_000_000, max: null },
      ]
    : [
        { label: '<150сая', min: null, max: 150_000_000 },
        { label: '150-300', min: 150_000_000, max: 300_000_000 },
        { label: '300-500', min: 300_000_000, max: 500_000_000 },
        { label: '500сая+', min: 500_000_000, max: null },
      ];

  // ── ₮ нэг м² presets (rent: ₮/м²/сар, sale: ₮/м²)
  const ppmPresets = isRent
    ? [
        { label: '<20к', min: null, max: 20_000 },
        { label: '20-40к', min: 20_000, max: 40_000 },
        { label: '40-60к', min: 40_000, max: 60_000 },
        { label: '60к+', min: 60_000, max: null },
      ]
    : [
        { label: '<3сая', min: null, max: 3_000_000 },
        { label: '3-5сая', min: 3_000_000, max: 5_000_000 },
        { label: '5-7сая', min: 5_000_000, max: 7_000_000 },
        { label: '7сая+', min: 7_000_000, max: null },
      ];

  const totalActive = !!(state.filterPriceMin || state.filterPriceMax);
  const ppmActive = !!(state.filterPpmMin || state.filterPpmMax);
  const activeCount = totalActive || ppmActive ? 1 : 0;

  const totalMinVal = state.filterPriceMin ? Math.round(state.filterPriceMin / 1_000_000) : '';
  const totalMaxVal = state.filterPriceMax ? Math.round(state.filterPriceMax / 1_000_000) : '';
  const ppmMinVal = state.filterPpmMin || '';
  const ppmMaxVal = state.filterPpmMax || '';

  const totalUnit = isRent ? 'сая ₮/сар' : 'сая ₮';
  const ppmUnit = isRent ? '₮/м²/сар' : '₮/м²';
  const tabTotalLabel = isRent ? 'Нийт /сар' : 'Нийт';
  const tabPpmLabel = '₮/м²';

  const isTotalPresetActive = (p) =>
    (state.filterPriceMin || null) === (p.min || null) && (state.filterPriceMax || null) === (p.max || null);
  const isPpmPresetActive = (p) =>
    (state.filterPpmMin || null) === (p.min || null) && (state.filterPpmMax || null) === (p.max || null);

  const tabBtn = (key, label) => {
    const sel = mode === key;
    return `<button class="bk-price-tab ${sel ? 'active' : ''}" onclick="setPriceFilterMode('${key}')">${label}</button>`;
  };

  const totalBody = `
    ${renderPriceSlider('total')}
    <div class="bk-price-row">
      <input type="number" class="bk-price-input num" placeholder="Доод" value="${totalMinVal}" min="0"
        oninput="setHomePriceMin(this.value)" />
      <span class="bk-price-dash">–</span>
      <input type="number" class="bk-price-input num" placeholder="Дээд" value="${totalMaxVal}" min="0"
        oninput="setHomePriceMax(this.value)" />
    </div>
    <div class="bk-price-unit">${totalUnit}</div>
    <div class="bk-price-presets">
      ${totalPresets
        .map(
          (p) => `
        <button class="bk-price-preset ${isTotalPresetActive(p) ? 'active' : ''}"
          onclick="setHomePriceRange(${p.min == null ? 'null' : p.min}, ${p.max == null ? 'null' : p.max})">
          ${p.label}
        </button>
      `,
        )
        .join('')}
    </div>
  `;

  const ppmBody = `
    <div class="bk-price-row">
      <input type="number" class="bk-price-input num" placeholder="Доод" value="${ppmMinVal}" min="0"
        oninput="setHomePpmMin(this.value)" />
      <span class="bk-price-dash">–</span>
      <input type="number" class="bk-price-input num" placeholder="Дээд" value="${ppmMaxVal}" min="0"
        oninput="setHomePpmMax(this.value)" />
    </div>
    <div class="bk-price-unit">${ppmUnit} <span style="color:var(--text-3);">· оффис, үйлчилгээ зэрэгт тохиромжтой</span></div>
    <div class="bk-price-presets">
      ${ppmPresets
        .map(
          (p) => `
        <button class="bk-price-preset ${isPpmPresetActive(p) ? 'active' : ''}"
          onclick="setHomePpmRange(${p.min == null ? 'null' : p.min}, ${p.max == null ? 'null' : p.max})">
          ${p.label}
        </button>
      `,
        )
        .join('')}
    </div>
  `;

  return `
    <div class="bk-side-section ${isCollapsed ? 'collapsed' : ''}">
      <div class="bk-side-heading" onclick="toggleSideSection('price')">
        <span class="bk-side-heading-left">
          Үнэ
          ${activeCount > 0 ? `<span class="bk-side-heading-count num">${activeCount}</span>` : ''}
        </span>
        <i data-lucide="chevron-down" class="bk-side-heading-chev w-4 h-4"></i>
      </div>
      <div class="bk-side-section-body">
        <div class="bk-price-tabs">
          ${tabBtn('total', tabTotalLabel)}
          ${tabBtn('ppm', tabPpmLabel)}
        </div>
        ${mode === 'ppm' ? ppmBody : totalBody}
      </div>
    </div>
  `;
}

