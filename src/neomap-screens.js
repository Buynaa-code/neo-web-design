/* ============== ORLOO SCREENS ============== */

/* ---------- shared helpers ---------- */

function activeListings() {
  return LISTINGS.filter((l) => l.status !== 'sold');
}

/* ---------- POLYGON DRAW HELPERS ---------- */
function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 0.000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function startDrawZone() {
  state.drawingPolygon = true;
  state.drawnPolygon = [];
  state.filterDistrict = null;
  renderAppScreen(currentScreen);
  setTimeout(() => lucide.createIcons(), 0);
  showToast('Газрын зураг дээр дарж бүсээ зураарай · 3+ цэг', 'info', { duration: 2200 });
}
window.startDrawZone = startDrawZone;

function onMapDrawClick(ev) {
  if (!state.drawingPolygon) return;
  const overlay = ev.currentTarget;
  const rect = overlay.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  const y = (ev.clientY - rect.top) / rect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return;
  state.drawnPolygon = state.drawnPolygon || [];
  state.drawnPolygon.push({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
  renderAppScreen(currentScreen);
  setTimeout(() => lucide.createIcons(), 0);
}
window.onMapDrawClick = onMapDrawClick;

function undoDrawPoint() {
  if (state.drawnPolygon && state.drawnPolygon.length) {
    state.drawnPolygon.pop();
    renderAppScreen(currentScreen);
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.undoDrawPoint = undoDrawPoint;

function finishDrawZone() {
  if (!state.drawnPolygon || state.drawnPolygon.length < 3) {
    showToast('Дор хаяж 3 цэг хэрэгтэй', 'warning', { duration: 1800 });
    return;
  }
  state.drawingPolygon = false;
  state.page = 1;
  renderAppScreen(currentScreen);
  setTimeout(() => lucide.createIcons(), 0);
  const count = filteredListings().length;
  showToast(`Бүсчилсэн талбайд <strong>${count}</strong> зар олдлоо`, 'success', { duration: 2400 });
}
window.finishDrawZone = finishDrawZone;

function clearDrawZone() {
  state.drawingPolygon = false;
  state.drawnPolygon = null;
  renderAppScreen(currentScreen);
  setTimeout(() => lucide.createIcons(), 0);
}

/* ============== MAP ZOOM + PAN ============== */
function applyMapTransform() {
  const zoom = Math.max(1, Math.min(4, state.mapZoom || 1));
  const maxPan = (zoom - 1) * 50;
  const panX = Math.max(-maxPan, Math.min(maxPan, (state.mapPanX || 0) * 50));
  const panY = Math.max(-maxPan, Math.min(maxPan, (state.mapPanY || 0) * 50));
  document.querySelectorAll('.map-transform').forEach((el) => {
    el.style.transform = `scale(${zoom}) translate(${panX}%, ${panY}%)`;
  });
  document.querySelectorAll('.map-zoom-level').forEach((el) => {
    el.textContent = zoom.toFixed(1) + 'x';
  });
}
window.mapZoomIn = function (ev) {
  if (ev) ev.stopPropagation();
  state.mapZoom = Math.min(4, (state.mapZoom || 1) + 0.5);
  applyMapTransform();
};
window.mapZoomOut = function (ev) {
  if (ev) ev.stopPropagation();
  state.mapZoom = Math.max(1, (state.mapZoom || 1) - 0.5);
  if (state.mapZoom <= 1) {
    state.mapPanX = 0;
    state.mapPanY = 0;
  }
  applyMapTransform();
};
window.mapZoomReset = function (ev) {
  if (ev) ev.stopPropagation();
  state.mapZoom = 1;
  state.mapPanX = 0;
  state.mapPanY = 0;
  applyMapTransform();
  renderAppScreen(currentScreen);
  setTimeout(() => lucide.createIcons(), 0);
};
window.onMapWheel = function (ev) {
  if (state.drawingPolygon) return;
  ev.preventDefault();
  const delta = ev.deltaY > 0 ? -0.2 : 0.2;
  state.mapZoom = Math.max(1, Math.min(4, (state.mapZoom || 1) + delta));
  if (state.mapZoom <= 1) {
    state.mapPanX = 0;
    state.mapPanY = 0;
  }
  applyMapTransform();
};
let __pinJumpTimer = null;
window.schedulePinJump = function (id) {
  if (state.drawingPolygon) return;
  if (__pinJumpTimer) clearTimeout(__pinJumpTimer);
  __pinJumpTimer = setTimeout(() => {
    if (typeof openProperty === 'function') openProperty(id);
  }, 650);
};
window.cancelPinJump = function () {
  if (__pinJumpTimer) {
    clearTimeout(__pinJumpTimer);
    __pinJumpTimer = null;
  }
};

window.onMapDragStart = function (ev) {
  if (state.drawingPolygon) return;
  if ((state.mapZoom || 1) <= 1) return;
  if (
    ev.target.closest(
      '.map-pin, .map-ctrl-btn, .map-zoom-ctrls, .map-mode-toggle, .zone-summary, .map-draw-toolbar, .map-zone, .map-context',
    )
  )
    return;
  ev.preventDefault();
  const startX = ev.clientX;
  const startY = ev.clientY;
  const origPanX = state.mapPanX || 0;
  const origPanY = state.mapPanY || 0;
  const shell = ev.currentTarget;
  const rect = shell.getBoundingClientRect();
  shell.style.cursor = 'grabbing';
  const move = (e) => {
    const dx = (e.clientX - startX) / rect.width;
    const dy = (e.clientY - startY) / rect.height;
    state.mapPanX = origPanX + dx / (state.mapZoom || 1);
    state.mapPanY = origPanY + dy / (state.mapZoom || 1);
    applyMapTransform();
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    shell.style.cursor = '';
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
};
window.clearDrawZone = clearDrawZone;

function saveDrawnZone() {
  if (!state.drawnPolygon || state.drawnPolygon.length < 3) return;
  const count = filteredListings().length;
  openModal(`
    <div class="p-5 border-b" style="border-color: var(--border);">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-lg">Бүс/хайлтаа хадгалах</h3>
          <p class="text-xs text-[var(--text-3)] mt-0.5">Зурсан полигоны доторх зар — ${count}</p>
        </div>
        <button onclick="closeModal()" class="text-[var(--text-3)] hover:text-[var(--text)]"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
    </div>
    <div class="p-5 space-y-3">
      <div>
        <label class="text-xs font-medium text-[var(--text-2)] mb-1.5 block">Бүсийн нэр</label>
        <input id="zone-name" class="input" placeholder="Жишээ: Зайсангийн район" value="Миний бүс ${SAVED_SEARCHES.length + 1}" />
      </div>
      <div class="card p-3" style="background: var(--surface-2); border-color: var(--border);">
        <div class="text-[11px]" style="color: var(--text-3);">Бүсчлэлийн дотор багтсан тоо</div>
        <div class="num text-xl font-semibold" style="color: var(--gold-brand)">${count} зар</div>
      </div>
      <div class="text-xs flex items-center gap-2" style="color: var(--text-3);">
        <i data-lucide="bell" class="w-3.5 h-3.5"></i>
        Хадгалсаны дараа Хадгалсан хайлт хэсэгт нэмэгдэж, шинэ зар орох тутамд мэдэгдэл хүлээн авна.
      </div>
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">МЭДЭГДЭЛ АВАХ СУВАГ</div>
        <div class="grid sm:grid-cols-3 gap-2">
          ${[
            ['push', 'App push', 'smartphone', true],
            ['email', 'И-мэйл', 'mail', true],
            ['sms', 'SMS', 'message-square', false],
          ]
            .map(
              ([k, label, ic, on]) => `
            <label class="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer" style="background: var(--surface-2); border: 1px solid var(--border);">
              <i data-lucide="${ic}" class="w-4 h-4" style="color: var(--gold-brand);"></i>
              <span class="text-xs font-medium flex-1">${label}</span>
              <input id="zone-${k}" type="checkbox" ${on ? 'checked' : ''} class="accent-[var(--gold-brand)]" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">ДАВТАМЖ</div>
        <div class="grid grid-cols-3 gap-2">
          ${[
            ['instant', 'Тэр даруй', 'zap'],
            ['daily', 'Өдөрт нэг', 'sun'],
            ['weekly', '7 хоногт', 'calendar'],
          ]
            .map(
              ([k, l, ic]) => `
            <button onclick="document.querySelectorAll('[data-zone-freq]').forEach(b=>b.classList.remove('active')); this.classList.add('active');"
              data-zone-freq="${k}" class="bm-chip ${k === 'instant' ? 'active' : ''}" style="${k === 'instant' ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">
              <i data-lucide="${ic}" class="w-3 h-3 inline"></i> ${l}
            </button>
          `,
            )
            .join('')}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">ЯМАР ҮЕД?</div>
        <div class="space-y-1.5">
          ${[
            ['onNew', 'Шинэ зар нэмэгдэхэд', 'plus-circle', true],
            ['onDrop', 'Үнэ буурахад', 'trending-down', true],
            ['onPriceFit', 'Үнийн хязгаарт ороход', 'target', false],
          ]
            .map(
              ([k, l, ic, on]) => `
            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
              <i data-lucide="${ic}" class="w-4 h-4 shrink-0" style="color: var(--gold-brand);"></i>
              <span class="text-sm flex-1">${l}</span>
              <input id="zone-${k}" type="checkbox" ${on ? 'checked' : ''} class="accent-[var(--gold-brand)]" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="p-4 flex gap-2 justify-end" style="border-top: 1px solid var(--border); background: var(--surface-2);">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="confirmSaveDrawnZone()" class="btn btn-cta"><i data-lucide="bell-plus" class="w-4 h-4"></i> Хадгалах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}
window.saveDrawnZone = saveDrawnZone;

function confirmSaveDrawnZone() {
  const name = (document.getElementById('zone-name')?.value || '').trim() || 'Хадгалсан бүс';
  const channels = {
    push: !!document.getElementById('zone-push')?.checked,
    email: !!document.getElementById('zone-email')?.checked,
    sms: !!document.getElementById('zone-sms')?.checked,
  };
  if (!channels.push && !channels.email && !channels.sms) {
    showToast('Мэдэгдэл авах дор хаяж нэг сувгийг сонгоно уу', 'warning', { duration: 2000 });
    return;
  }
  const freq = document.querySelector('[data-zone-freq].active')?.dataset.zoneFreq || 'instant';
  const id = SAVED_SEARCHES.reduce((m, s) => Math.max(m, s.id), 0) + 1;
  SAVED_SEARCHES.push({
    id,
    mode: state.mode,
    name,
    districts: ['Газрын зураг бүс'],
    rooms: state.filterRooms ? [state.filterRooms] : [1, 2, 3, 4],
    priceRange: [state.filterPriceMin || 0, state.filterPriceMax || (state.mode === 'rent' ? 5000000 : 2000000000)],
    polygon: state.drawnPolygon.map((p) => ({ x: p.x, y: p.y })),
    newMatches: 0,
    alertFreq: freq,
    sms: channels.sms,
    email: channels.email,
    push: channels.push,
    onNew: !!document.getElementById('zone-onNew')?.checked,
    onDrop: !!document.getElementById('zone-onDrop')?.checked,
    onPriceFit: !!document.getElementById('zone-onPriceFit')?.checked,
    lastAlert: 'Дөнгөж хадгалсан',
  });
  closeModal();
  showToast('Бүс хадгалагдлаа · Хадгалсан хайлт хэсэгт нэмэгдсэн', 'success', { duration: 2200 });
}
window.confirmSaveDrawnZone = confirmSaveDrawnZone;
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
   Хэрэглэгчийн чөлөөт текстээс шүүлтүүр гаргаж state-д суулгана. */
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

function renderGlobalAIChat() {
  const aiHistory = state.homeAIChat || [];
  return `
    <div class="home-ai-panel ${state.homeAIChatCollapsed ? 'collapsed' : ''}" id="home-ai-panel">
      <div class="home-ai-header" onclick="toggleHomeAIChat()">
        <div class="home-ai-header-icon"><i data-lucide="sparkles" class="w-4 h-4"></i></div>
        <div class="home-ai-header-text">
          <div class="home-ai-header-title">AI туслах</div>
          <div class="home-ai-header-sub">Юу хайж байна вэ?</div>
        </div>
        <button class="home-ai-header-toggle text-[var(--text-3)] hover:text-[var(--text)]" aria-label="AI чатыг хураах">
          <i data-lucide="chevron-down" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="home-ai-body" id="home-ai-body">
        ${
          aiHistory.length === 0
            ? `
          <div class="home-ai-msg bot">
            Сайн уу 👋 Би таны хайж буй үл хөдлөхийг олоход тусална. Доорх жишээгээр эхэлж эсвэл өөрийн үгээр асууж болно.
          </div>
          <div class="home-ai-suggest">
            ${AI_EXAMPLES.slice(0, 4)
              .map(
                (ex) => `
              <button onclick="sendHomeAIMessage(${JSON.stringify(ex.text).replace(/"/g, '&quot;')})">${ex.text}</button>
            `,
              )
              .join('')}
          </div>
        `
            : aiHistory
                .map(
                  (m) => `
          <div class="home-ai-msg ${m.role}">${m.text}</div>
          ${m.suggestions ? `<div class="home-ai-suggest">${m.suggestions.map((s) => `<button onclick="sendHomeAIMessage(${JSON.stringify(s).replace(/"/g, '&quot;')})">${s}</button>`).join('')}</div>` : ''}
        `,
                )
                .join('')
        }
      </div>
      <div class="home-ai-input">
        <input id="home-ai-input" type="text" placeholder="Асуултаа бичнэ үү..."
          onkeydown="if(event.key==='Enter'){ event.preventDefault(); sendHomeAIMessage(this.value); this.value=''; }" />
        <button onclick="(()=>{const i=document.getElementById('home-ai-input'); sendHomeAIMessage(i.value); i.value='';})()" aria-label="Илгээх">
          <i data-lucide="send" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}
window.renderGlobalAIChat = renderGlobalAIChat;

function refreshGlobalAIChat(options = {}) {
  const slot = document.getElementById('global-ai-slot');
  if (!slot) return;
  slot.innerHTML = renderGlobalAIChat();
  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
    if (options.scroll) {
      const body = document.getElementById('home-ai-body');
      if (body) body.scrollTop = body.scrollHeight;
    }
  }, 0);
}
window.refreshGlobalAIChat = refreshGlobalAIChat;

function refreshAIChatSurface(options = {}) {
  const screen = window.currentScreen || currentScreen;
  if (screen === 'home' || screen === 'results') {
    renderAppScreen(screen);
    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
      if (options.scroll) {
        const body = document.getElementById('home-ai-body');
        if (body) body.scrollTop = body.scrollHeight;
      }
    }, 0);
  } else {
    refreshGlobalAIChat({ scroll: !!options.scroll });
  }
}

/* AI чатын panel-ийг нээх/хаах */
window.toggleHomeAIChat = function () {
  state.homeAIChatCollapsed = !state.homeAIChatCollapsed;
  const el = document.getElementById('home-ai-panel');
  if (el) el.classList.toggle('collapsed', state.homeAIChatCollapsed);
};

/* AI чатад мессеж явуулах — extractFilters-ийг ашиглаж зөвлөмж буцаана */
window.sendHomeAIMessage = function (text) {
  text = (text || '').trim();
  if (!text) return;
  if (text === 'Үр дүнг бүгдийг үзэх') {
    state.page = 1;
    goTo('results');
    return;
  }
  if (text === 'Шүүлтүүр цэвэрлэх') {
    clearAllFilters();
    state.homeAIChat = [];
    refreshAIChatSurface({ scroll: false });
    return;
  }
  if (text === 'Дахин шүүлт хийе') {
    state.homeAIChat = [];
    refreshAIChatSurface({ scroll: false });
    return;
  }
  if (!Array.isArray(state.homeAIChat)) state.homeAIChat = [];
  state.homeAIChat.push({ role: 'user', text });
  const ex = typeof parseAIQuery === 'function' ? parseAIQuery(text) : null;
  const parts = [];
  if (ex) {
    if (ex.mode) {
      state.mode = ex.mode;
      parts.push(ex.mode === 'rent' ? 'түрээс' : 'худалдах');
    }
    if (ex.district) {
      state.filterDistrict = ex.district;
      parts.push(ex.district + ' дүүрэг');
    }
    if (ex.rooms) {
      state.filterRooms = ex.rooms;
      parts.push(ex.rooms + ' өрөө');
    }
    if (ex.maxPrice) {
      state.filterPriceMax = ex.maxPrice;
      parts.push((ex.maxPrice / 1000000).toFixed(0) + 'сая хүртэл');
    }
    if (ex.lifestyle && ex.lifestyle.length) state.filterLifestyle = ex.lifestyle;
    state.aiExtracted = ex;
  }
  const count = (typeof filteredListings === 'function' ? filteredListings() : LISTINGS).length;
  const reply = parts.length
    ? `Ойлгов · ${parts.join(', ')}. ${count} зар олдлоо. Газрын зураг дээр харагдаж байна.`
    : `${count} зар олдлоо. Дүүрэг эсвэл өрөөний тоог нэмбэл нарийсна.`;
  state.homeAIChat.push({
    role: 'bot',
    text: reply,
    suggestions: count > 0 ? ['Үр дүнг бүгдийг үзэх', 'Дахин шүүлт хийе'] : ['Шүүлтүүр цэвэрлэх'],
  });
  state.aiQuery = text;
  refreshAIChatSurface({ scroll: true });
};

/* ҮХ-ийн төрлийн tile дарахад горим солих + results хуудас руу шилжих */
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

/* Сэдэвчилсэн floorplan SVG — өрөөний тоо/талбайгаас үүсгэх */
function renderFloorplan(l) {
  const rooms = l.rooms;
  const area = l.area;
  // Үндсэн хэмжээ: 600x340 SVG; өрөөг сараалжаар байрлуулна
  const layouts = {
    1: [
      ['Studio + Кухнэ', 0, 0, 60, 60],
      ['Угаалга', 60, 0, 40, 40],
      ['Тагт', 60, 40, 40, 20],
    ],
    2: [
      ['Зочны өрөө', 0, 0, 50, 60],
      ['Унтлагын', 50, 0, 50, 35],
      ['Кухнэ', 50, 35, 30, 25],
      ['Угаалга', 80, 35, 20, 25],
    ],
    3: [
      ['Зочны өрөө', 0, 0, 45, 55],
      ['Унтлагын 1', 45, 0, 28, 35],
      ['Унтлагын 2', 73, 0, 27, 35],
      ['Кухнэ', 45, 35, 30, 25],
      ['Угаалга', 75, 35, 25, 25],
      ['Тагт', 0, 55, 45, 10],
    ],
    4: [
      ['Зочны өрөө', 0, 0, 42, 50],
      ['Унтлагын 1', 42, 0, 28, 32],
      ['Унтлагын 2', 70, 0, 30, 32],
      ['Унтлагын 3', 42, 32, 28, 28],
      ['Кухнэ', 70, 32, 30, 28],
      ['Угаалга', 0, 50, 42, 15],
    ],
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
      ${layout
        .map(
          ([name, x, y, w, h]) => `
        <g>
          <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" fill="rgba(196,242,94,.04)" stroke="rgba(196,242,94,.4)" stroke-width="0.3"/>
          <text x="${x + w / 2}" y="${y + h / 2}" font-size="2.2" fill="var(--text-2)" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, monospace">${name}</text>
          <text x="${x + w / 2}" y="${y + h / 2 + 3}" font-size="1.6" fill="var(--text-3)" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, monospace">${Math.round(area * ((w * h) / 6500))}м²</text>
        </g>
      `,
        )
        .join('')}
      <text x="50" y="62.5" font-size="2" fill="var(--text-3)" text-anchor="middle" font-family="ui-monospace, monospace" letter-spacing="0.3">${l.khotkhon.toUpperCase()} · ${rooms} ӨРӨӨ · ${area}М²</text>
    </svg>
  `;
}

function trustBadges(l) {
  const ag = getAgent(l.agentId);
  return [
    { on: ag.verified, icon: 'badge-check', label: 'Баталгаажсан агент' },
    { on: true, icon: 'image', label: 'Зураг бодит' },
    { on: l.lat != null, icon: 'map-pin', label: 'Координат батлагдсан' },
    { on: (l.priceHistory || []).length > 0, icon: 'line-chart', label: 'Үнийн түүхтэй' },
    { on: l.year >= 2018, icon: 'sparkles', label: 'Шинэ ашиглалт' },
  ];
}

/* ---------- bus stop helpers ---------- */
function getBusStop(id) {
  return BUS_STOPS.find((s) => s.id === id);
}
function distToStop(listing, stop) {
  const dx = listing.lat - stop.lat;
  const dy = listing.lng - stop.lng;
  return Math.sqrt(dx * dx + dy * dy);
}
function stopListingCount(stop, mode) {
  return modeListings(mode).filter((l) => distToStop(l, stop) <= BUS_STOP_RADIUS).length;
}
function nearestStop(listing) {
  let best = null,
    bestD = Infinity;
  for (const s of BUS_STOPS) {
    const d = distToStop(listing, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
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
  return listings.map((l) => {
    const key = `${l.lat.toFixed(2)}_${l.lng.toFixed(2)}`;
    const n = buckets.get(key) || 0;
    buckets.set(key, n + 1);
    if (n === 0) return { l, x: l.lat, y: l.lng };
    // Жижиг тойрог: 0, 60°, 120°... радиус 0.022 + n*0.006
    const angle = ((n * 60 - 30) * Math.PI) / 180;
    const radius = 0.022 + Math.floor((n - 1) / 6) * 0.014;
    return {
      l,
      x: Math.max(0.04, Math.min(0.96, l.lat + Math.cos(angle) * radius)),
      y: Math.max(0.04, Math.min(0.96, l.lng + Math.sin(angle) * radius)),
    };
  });
}

function mapBackground(listings, opts = {}) {
  const { selectedId = null, style = '', interactiveZones = true, showZoneSummary = true, showMyPlaces = true } = opts;
  const selectedDistrict = state.filterDistrict;
  const baseListings = modeListings();
  const selStats = selectedDistrict ? districtStats(selectedDistrict, baseListings) : null;
  const positioned = spreadPins(listings);
  const heatmapOn = state.mapMode === 'heatmap';
  const allAvgs = DISTRICT_ZONES.map((z) => {
    const s = districtStats(z.name, baseListings);
    return s.count ? s.ppm : null;
  });

  const drawing = state.drawingPolygon;
  const poly = state.drawnPolygon || [];
  const polyStr = poly.map((p) => `${(p.x * 100).toFixed(2)},${(p.y * 100).toFixed(2)}`).join(' ');
  const zoom = Math.max(1, Math.min(4, state.mapZoom || 1));
  const maxPan = (zoom - 1) * 50;
  const panX = Math.max(-maxPan, Math.min(maxPan, (state.mapPanX || 0) * 50));
  const panY = Math.max(-maxPan, Math.min(maxPan, (state.mapPanY || 0) * 50));
  const transformActive = zoom !== 1 || panX !== 0 || panY !== 0;
  const transformStyle = transformActive
    ? `transform: scale(${zoom}) translate(${panX}%, ${panY}%); transform-origin: center;`
    : '';
  return `
    <div class="map-shell w-full ${heatmapOn ? 'heatmap-on' : ''} ${drawing ? 'drawing' : ''}" style="height:100%; position: relative; ${style}"
         onwheel="onMapWheel(event)"
         onmousedown="onMapDragStart(event)">
      <div class="map-transform" style="${transformStyle}">
        <div class="map-bg"></div>
        <svg class="map-zones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${DISTRICT_ZONES.map((z, zi) => {
            const s = districtStats(z.name, baseListings);
            const isSel = selectedDistrict === z.name;
            const dim = selectedDistrict && !isSel ? ' dim' : '';
            const click = interactiveZones ? `onclick="selectDistrictZone('${z.name}', event)"` : '';
            const heatCls = heatmapOn && s.count ? ' heat-' + heatBucket(s.ppm, allAvgs) : '';
            return `<polygon class="map-zone${isSel ? ' selected' : ''}${dim}${s.count ? '' : ' empty'}${heatCls}" data-district="${z.name}" data-count="${s.count}" points="${z.points}" ${click}><title>${z.name} · ${s.count} зар${s.count ? ' · ' + fmtCompact(s.min) + (s.min !== s.max ? '–' + fmtCompact(s.max) : '') : ''}${heatmapOn && s.count ? ' · м² ₮' + Math.round(s.ppm).toLocaleString('en-US') : ''}</title></polygon>`;
          }).join('')}
        </svg>
        ${DISTRICT_ZONES.map((z) => {
          const s = districtStats(z.name, baseListings);
          const isSel = selectedDistrict === z.name;
          const dim = selectedDistrict && !isSel ? ' dim' : '';
          return `<div class="map-zone-label${isSel ? ' selected' : ''}${dim}" style="left:${z.label.x}%; top:${z.label.y}%;">
            <div class="map-zone-name">${z.name.toUpperCase()}</div>
            ${s.count ? `<div class="map-zone-meta num">${s.count} зар · ${fmtCompact(s.min)}${s.min !== s.max ? '–' + fmtCompact(s.max) : ''}</div>` : '<div class="map-zone-meta">зар алга</div>'}
          </div>`;
        }).join('')}
        ${
          heatmapOn
            ? ''
            : positioned
                .map(({ l, x, y }, idx) => {
                  const ag = getAgent(l.agentId);
                  const status = STATUS_PILL[l.status] || ['', ''];
                  const flipCls =
                    (y < 0.28 ? ' tip-below' : '') + (x < 0.18 ? ' tip-right' : '') + (x > 0.82 ? ' tip-left' : '');
                  const idxLabel = idx + 1;
                  const viewedCls = isViewed(l.id) ? ' viewed' : '';
                  const isHot = l.status === 'hot';
                  const isFeatured = isHot || l.isUserListing;
                  return `
          <div class="map-pin-wrap${flipCls}${isFeatured ? ' featured-pin' : ''}" data-pin-id="${l.id}" style="left:${x * 100}%; top:${y * 100}%;"
               onmouseenter="setHover(${l.id}, true); this.classList.add('hover'); const s=this.closest('.map-shell'); if(s){ s.dataset.prevZ=s.style.zIndex||''; s.style.zIndex='200'; }"
               onmouseleave="setHover(${l.id}, false); this.classList.remove('hover'); const s=this.closest('.map-shell'); if(s){ s.style.zIndex=s.dataset.prevZ||''; }">
            <button class="map-pin ${l.id === selectedId ? 'selected' : ''} ${isHot ? 'cta' : ''}${viewedCls}${isFeatured ? ' pin-featured' : ''}"
              data-pin-id="${l.id}"
              onclick="openProperty(${l.id})">
              <span class="pin-house-mark"><i data-lucide="home" class="pin-house-svg"></i></span>
              <span class="pin-copy">
                <span class="pin-price-line num">${fmtMapPinPrice(l)}</span>
                <span class="pin-area-line">${fmtMapPinMeta(l)}</span>
              </span>
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
                  <span class="map-pin-tip-agentname">${ag.name}${ag.verified ? ' ✓' : ''}</span>
                </div>
                <button class="map-pin-tip-cta" onclick="event.stopPropagation(); openProperty(${l.id})">Дэлгэрэнгүй →</button>
              </div>
            </div>
          </div>`;
                })
                .join('')
        }
        ${
          showMyPlaces && (state.myPlaces || []).length
            ? state.myPlaces
                .map((p) => {
                  const meta =
                    typeof placeKindMeta === 'function'
                      ? placeKindMeta(p.kind)
                      : { icon: 'map-pin', color: '#5FD4E5', label: 'Газар' };
                  return `
            <div class="my-place-pin" style="position:absolute; left:${p.lat * 100}%; top:${p.lng * 100}%; transform:translate(-50%,-100%); z-index: 70; pointer-events: auto;"
                 onclick="event.stopPropagation(); openPlacePicker('${p.id}')" title="${(p.label || '').replace(/"/g, '&quot;')} — засах">
              <div style="background:${meta.color}; color:#fff; padding:4px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; box-shadow: 0 3px 10px rgba(0,0,0,.3); display:flex; align-items:center; gap:4px; white-space:nowrap; cursor:pointer; border: 1.5px solid rgba(255,255,255,.8);">
                <i data-lucide="${meta.icon}" class="w-2.5 h-2.5"></i><span>${(p.label || meta.label).slice(0, 18)}</span>
              </div>
              <div style="width:8px; height:8px; background:${meta.color}; border:2px solid #fff; border-radius:50%; margin: 2px auto 0; box-shadow: 0 2px 4px rgba(0,0,0,.3);"></div>
            </div>`;
                })
                .join('')
            : ''
        }
        ${
          poly.length || drawing
            ? `
          <svg class="map-draw-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${
              poly.length >= 3 && !drawing
                ? `<polygon class="draw-poly" points="${polyStr}"/>`
                : poly.length >= 2
                  ? `<polyline class="draw-line" points="${polyStr}" fill="none"/>${poly.length >= 3 ? `<polygon class="draw-poly" points="${polyStr}"/>` : ''}`
                  : ''
            }
            ${poly.map((p) => `<circle class="draw-dot" cx="${(p.x * 100).toFixed(2)}" cy="${(p.y * 100).toFixed(2)}" r="0.9"/>`).join('')}
          </svg>
        `
            : ''
        }
        ${drawing ? `<div class="map-draw-overlay" onclick="onMapDrawClick(event)"></div>` : ''}
      </div>
      ${
        showZoneSummary && selStats && selStats.count
          ? `
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
              <div class="zone-summary-stat-val num">${fmtCompact(selStats.min)}${selStats.min !== selStats.max ? ' – ' + fmtCompact(selStats.max) : ''}</div>
            </div>
            <div class="zone-summary-stat">
              <div class="zone-summary-stat-label">Дундаж м²</div>
              <div class="zone-summary-stat-val num">${fmtCompact(Math.round(selStats.ppm))}</div>
            </div>
          </div>
          <div class="zone-summary-list">
            ${selStats.listings
              .map(
                (l) => `
              <div class="zone-summary-row" onclick="openProperty(${l.id})">
                <div class="zone-summary-row-thumb" style="background-image:url('${photoUrl(l, 0, '80/80')}')"></div>
                <div class="zone-summary-row-body">
                  <div class="zone-summary-row-title">${l.khotkhon} · ${l.rooms} өрөө</div>
                  <div class="zone-summary-row-meta">${l.area}м² · ${l.floor} · ${l.khoroo}-р хороо</div>
                </div>
                <div class="zone-summary-row-price num">${l.mode === 'rent' ? fmtCompact(l.price) + '/с' : fmtCompact(l.price)}</div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
      ${
        opts.showControls !== false
          ? `
        <div class="map-mode-toggle">
          <button class="${!heatmapOn ? 'active' : ''}" onclick="setMapMode('pins')" title="Pin горим"><i data-lucide="map-pin" class="w-3 h-3"></i> Pin</button>
          <button class="${heatmapOn ? 'active' : ''}" onclick="setMapMode('heatmap')" title="Үнийн heatmap"><i data-lucide="flame" class="w-3 h-3"></i> Heatmap</button>
        </div>
        <div class="map-controls">
          <button class="map-ctrl-btn" onclick="toggleFullMap()" title="${state.fullMap ? 'Жагсаалт нээх' : 'Газрын зургийг дэлгэх'}">
            <i data-lucide="${state.fullMap ? 'minimize-2' : 'maximize-2'}" class="w-4 h-4"></i>
          </button>
          ${!drawing ? `<button class="map-ctrl-btn" onclick="startDrawZone()" title="Бүс зурж хайх"><i data-lucide="pen-line" class="w-4 h-4"></i></button>` : ''}
          ${state.drawnPolygon && !drawing ? `<button class="map-ctrl-btn" onclick="clearDrawZone()" title="Бүс арилгах" style="color: var(--gold-brand);"><i data-lucide="lasso" class="w-4 h-4"></i></button>` : ''}
          ${state.highlightedId ? `<button class="map-ctrl-btn" onclick="recenterMap()" title="Тэмдэглэгээ арилгах"><i data-lucide="crosshair" class="w-4 h-4"></i></button>` : ''}
          ${state.filterDistrict || state.filterBusStop || state.filterRooms || (state.filterLifestyle || []).length ? `<button class="map-ctrl-btn" onclick="resetAllMapFilters()" title="Шүүлтүүр цэвэрлэх"><i data-lucide="filter-x" class="w-4 h-4"></i></button>` : ''}
        </div>
        <div class="map-zoom-ctrls">
          <button class="map-ctrl-btn" onclick="mapZoomIn(event)" title="Томруулах (+)"><i data-lucide="plus" class="w-4 h-4"></i></button>
          <div class="map-zoom-level num">${zoom.toFixed(1)}x</div>
          <button class="map-ctrl-btn" onclick="mapZoomOut(event)" title="Жижигрүүлэх (-)"><i data-lucide="minus" class="w-4 h-4"></i></button>
          ${zoom > 1 || state.mapPanX || state.mapPanY ? `<button class="map-ctrl-btn" onclick="mapZoomReset(event)" title="Анхны байдал"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i></button>` : ''}
        </div>
        ${
          heatmapOn
            ? `
          <div class="heatmap-legend">
            <span class="text-[var(--text-3)]">м² үнэ:</span>
            <span class="heatmap-legend-bar"></span>
            <span class="text-[var(--text-3)]">хямд → үнэтэй</span>
          </div>
        `
            : ''
        }
      `
          : ''
      }

      ${
        opts.showContext !== false && (state.filterDistrict || state.filterBusStop)
          ? `
        <div class="map-context">
          <i data-lucide="${state.filterBusStop ? 'bus' : 'map-pin'}" class="w-3.5 h-3.5" style="color: var(--primary);"></i>
          <span>${state.filterBusStop ? (getBusStop(state.filterBusStop)?.name || '') + ' буудал' : state.filterDistrict + ' дүүрэг'}</span>
          <span class="map-context-count num">${listings.length}</span>
          <button class="map-context-clear" onclick="resetAllMapFilters()" title="Цэвэрлэх"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
        </div>
      `
          : ''
      }

      ${
        listings.length === 0
          ? `
        <div class="map-empty">
          <i data-lucide="search-x" class="w-8 h-8"></i>
          <div class="text-sm font-medium">Газрын зураг дээр зар олдсонгүй</div>
          <div class="text-xs">Шүүлтүүрээ өргөтгөж үзнэ үү</div>
        </div>
      `
          : ''
      }

      <!-- Mobile bottom sheet (filled by JS when pin is selected on mobile) -->
      <div id="map-sheet-host"></div>

      ${
        drawing
          ? `
        <div class="map-draw-toolbar">
          <div class="mdt-hint"><i data-lucide="mouse-pointer" class="w-3.5 h-3.5 inline"></i> ${poly.length} цэг</div>
          <button class="mdt-btn" onclick="undoDrawPoint()" ${poly.length === 0 ? 'disabled' : ''}><i data-lucide="undo-2" class="w-3.5 h-3.5"></i> Буцаах</button>
          <button class="mdt-btn" onclick="clearDrawZone()"><i data-lucide="x" class="w-3.5 h-3.5"></i> Цуцлах</button>
          <button class="mdt-btn primary" onclick="finishDrawZone()" ${poly.length < 3 ? 'disabled' : ''}><i data-lucide="check" class="w-3.5 h-3.5"></i> Дуусгах</button>
        </div>
      `
          : ''
      }

      ${
        state.drawnPolygon && !drawing
          ? `
        <div class="map-draw-toolbar" style="bottom: 16px;">
          <div class="mdt-hint"><i data-lucide="lasso" class="w-3.5 h-3.5 inline" style="color: var(--gold-brand)"></i> Бүсчилсэн талбай · ${filteredListings().length} зар</div>
          <button class="mdt-btn" onclick="saveDrawnZone()"><i data-lucide="bell-plus" class="w-3.5 h-3.5"></i> Хадгалах</button>
          <button class="mdt-btn" onclick="startDrawZone()"><i data-lucide="pen-line" class="w-3.5 h-3.5"></i> Дахин зурах</button>
          <button class="mdt-btn" onclick="clearDrawZone()"><i data-lucide="x" class="w-3.5 h-3.5"></i> Арилгах</button>
        </div>
      `
          : ''
      }
    </div>
  `;
}

/* ---------- MAP ↔ LIST SYNC (no re-render) ---------- */
function setHover(id, on) {
  const cards = document.querySelectorAll(`.prop-card[data-listing-id="${id}"]`);
  const pins = document.querySelectorAll(`.map-pin[data-pin-id="${id}"]`);
  const shells = document.querySelectorAll('.map-shell');
  cards.forEach((c) => c.classList.toggle('hovered', on));
  pins.forEach((p) => p.classList.toggle('hovered', on));
  shells.forEach((s) => s.classList.toggle('has-hover', on));
}
window.setHover = setHover;

function onPinClick(id) {
  // Highlight without full re-render. Scroll matching card into view.
  const prev = state.highlightedId;
  state.highlightedId = id;

  // Toggle DOM classes for pins
  document.querySelectorAll('.map-pin').forEach((p) => p.classList.remove('selected'));
  document.querySelectorAll(`.map-pin[data-pin-id="${id}"]`).forEach((p) => p.classList.add('selected'));

  // Toggle DOM classes for cards (highlight + flash) + scroll
  document.querySelectorAll('.prop-card').forEach((c) => c.classList.remove('highlighted', 'flash'));
  const card = document.querySelector(`.prop-card[data-listing-id="${id}"]`);
  if (card) {
    card.classList.add('highlighted', 'flash');
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
  document.querySelectorAll('.map-pin').forEach((p) => p.classList.remove('selected'));
  document.querySelectorAll('.prop-card').forEach((c) => c.classList.remove('highlighted'));
  closeMapSheet();
  refreshMapControls();
}
window.recenterMap = recenterMap;

function prepareAIForFullMap() {
  const shouldAutoCollapse =
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  state._fullMapAiAutoCollapsed = false;
  if (shouldAutoCollapse && !state.homeAIChatCollapsed) {
    state._homeAIChatCollapsedBeforeFullMap = state.homeAIChatCollapsed;
    state.homeAIChatCollapsed = true;
    state._fullMapAiAutoCollapsed = true;
  }
}
window.prepareAIForFullMap = prepareAIForFullMap;

function restoreAIAfterFullMap() {
  if (state._fullMapAiAutoCollapsed) {
    state.homeAIChatCollapsed = !!state._homeAIChatCollapsedBeforeFullMap;
  }
  state._fullMapAiAutoCollapsed = false;
  state._homeAIChatCollapsedBeforeFullMap = null;
}
window.restoreAIAfterFullMap = restoreAIAfterFullMap;

function toggleFullMap() {
  const opening = !state.fullMap;
  if (opening) prepareAIForFullMap();
  else restoreAIAfterFullMap();
  state.fullMap = opening;
  document.body.classList.toggle('map-fs-open', state.fullMap);
  if (currentScreen !== 'results') {
    goTo('results');
    return;
  }
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.toggleFullMap = toggleFullMap;

function openFullMap() {
  if (!state.fullMap) prepareAIForFullMap();
  state.fullMap = true;
  document.body.classList.add('map-fs-open');
  if (currentScreen !== 'results') {
    goTo('results');
    return;
  }
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.openFullMap = openFullMap;

function closeFullMap() {
  state.fullMap = false;
  restoreAIAfterFullMap();
  document.body.classList.remove('map-fs-open');
  if (currentScreen === 'results') {
    renderAppScreen('results');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.closeFullMap = closeFullMap;

function renderFullMapOverlay() {
  const list = filteredListings();
  const selectedId = state.highlightedId;
  return `
    <div class="map-fs-overlay" id="map-fs-overlay" role="dialog" aria-label="Газрын зураг">
      <div class="map-fs-side">
        <div class="map-fs-side-head">
          <i data-lucide="map" class="w-5 h-5" style="color: var(--gold-brand);"></i>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold">Газрын зураг дээр</div>
            <div class="text-[11px]" style="color: var(--text-3);">${list.length} зар · ${state.mode === 'rent' ? 'Түрээс' : 'Худалдах'} ${state.filterDistrict ? '· ' + state.filterDistrict : ''}</div>
          </div>
          <button onclick="openAdvancedFilters()" class="btn btn-ghost !text-xs !py-1.5" title="Шүүлтүүр"><i data-lucide="sliders" class="w-3.5 h-3.5"></i></button>
        </div>
        <div class="map-fs-side-list">
          ${
            list.length === 0
              ? `
            <div class="text-center py-10 text-sm" style="color: var(--text-3);">
              <i data-lucide="search-x" class="w-7 h-7 mx-auto mb-2"></i>
              <div>Зар олдсонгүй</div>
            </div>
          `
              : list
                  .map(
                    (l) => `
            <div class="map-fs-listcard ${l.id === selectedId ? 'active' : ''}"
              onclick="onPinClick(${l.id})"
              ondblclick="openProperty(${l.id})">
              <div class="map-fs-listcard-photo" style="background-image:url('${photoUrl(l, 0, '200/200')}')"></div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">${l.khotkhon}</div>
                <div class="text-[11px] truncate" style="color: var(--text-3);">${l.district} · ${l.rooms}ө ${l.area}м²</div>
                <div class="num text-sm font-semibold mt-1" style="color: var(--gold-brand)">${listingPriceShort(l)}</div>
                <button onclick="event.stopPropagation(); openProperty(${l.id})" class="text-[11px] mt-1 hover:underline" style="color: var(--text-2)">Дэлгэрэнгүй харах →</button>
              </div>
            </div>
          `,
                  )
                  .join('')
          }
        </div>
      </div>
      <div class="map-fs-stage">
        <button class="map-fs-close" onclick="closeFullMap()" title="Хаах (Esc)"><i data-lucide="x" class="w-5 h-5"></i></button>
        ${mapBackground(list, { selectedId, showControls: true, showContext: true, showZoneSummary: true, style: 'border-radius: 0;' })}
      </div>
    </div>
  `;
}
window.renderFullMapOverlay = renderFullMapOverlay;

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
  else if (kind === 'lifestyle') state.filterLifestyle = (state.filterLifestyle || []).filter((x) => x !== val);
  else if (kind === 'ai') {
    state.aiQuery = '';
    state.aiExtracted = null;
  }
  state.highlightedId = null;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}
window.removeFilter = removeFilter;

function activeFilterChips() {
  const chips = [];
  if (state.aiQuery)
    chips.push({
      kind: 'ai',
      label: 'AI: ' + (state.aiQuery.length > 28 ? state.aiQuery.slice(0, 28) + '…' : state.aiQuery),
      icon: 'sparkles',
    });
  if (state.filterDistrict) chips.push({ kind: 'district', label: state.filterDistrict, icon: 'map-pin' });
  if (state.filterRooms) chips.push({ kind: 'rooms', label: state.filterRooms + ' өрөө', icon: 'bed-double' });
  if (state.filterBusStop) {
    const s = getBusStop(state.filterBusStop);
    if (s) chips.push({ kind: 'busStop', label: s.name, icon: 'bus' });
  }
  (state.filterLifestyle || []).forEach((k) => {
    const def = LIFESTYLE_DEFS.find((x) => x.key === k);
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
  const valid = allAvgs.filter((v) => v != null);
  if (!valid.length || avgPpm == null) return 0;
  const min = Math.min(...valid),
    max = Math.max(...valid);
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
          <button class="bm-listing-heart ${saved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
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
  const floors = l.floor && /\//.test(l.floor) ? l.floor : l.floor + '/—';
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
          <button class="bm-listing-heart ${saved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
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
  const status = STATUS_PILL[l.status] || ['', ''];
  const ns = nearestStop(l);
  const stopMin = ns.stop ? stopWalkMinutes(ns.dist) : null;
  const viewed = isViewed(l.id);
  return `
    <div class="prop-card ${state.highlightedId === l.id ? 'highlighted' : ''} ${viewed ? 'viewed' : ''}"
      data-listing-id="${l.id}"
      onclick="openProperty(${l.id})"
      onmouseenter="setHover(${l.id}, true)"
      onmouseleave="setHover(${l.id}, false)">
      ${pinIndex != null ? `<span class="card-pin-badge num" title="Газрын зураг дээрх ${pinIndex}-р pin">${pinIndex}</span>` : ''}
      <div class="photo" style="background-image:url('${photoUrl(l, 0, '600/400')}')">
        <div class="absolute top-3 left-3 flex gap-1.5" style="${pinIndex != null ? 'margin-left: 32px;' : ''}">
          ${status[0] ? `<span class="pill ${status[0]}">${status[1]}</span>` : ''}
          ${l.listedDays <= 3 ? `<span class="pill pill-new">${l.listedDays === 0 ? 'Өнөөдөр' : l.listedDays + ' хоног'}</span>` : ''}
          ${viewed ? `<span class="viewed-badge"><i data-lucide="eye" class="w-2.5 h-2.5"></i> Үзсэн</span>` : ''}
        </div>
        <button class="heart-btn absolute top-2.5 right-2.5 ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
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
            <div class="num text-[15px]" style="color: var(--primary);">${l.mode === 'rent' ? fmtCompact(l.price) + '/сар' : fmtCompact(l.price)}</div>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-[var(--text-2)] mt-2">
          <span class="flex items-center gap-1"><i data-lucide="bed-double" class="w-3 h-3"></i> ${l.rooms} өрөө</span>
          <span class="flex items-center gap-1"><i data-lucide="ruler" class="w-3 h-3"></i> ${l.area}м²</span>
          <span class="flex items-center gap-1"><i data-lucide="building" class="w-3 h-3"></i> ${l.floor}</span>
        </div>
        ${
          ns.stop
            ? `<div class="flex items-center gap-1.5 text-[11px] mt-2" style="color: var(--text-3);">
          <i data-lucide="bus" class="w-3 h-3" style="color: var(--primary);"></i>
          <span class="truncate">${ns.stop.name}</span>
          <span class="text-[var(--text-3)]">·</span>
          <span class="num">${stopMin} мин</span>
        </div>`
            : ''
        }
        ${
          compact
            ? ''
            : `<div class="flex items-center justify-between mt-3 pt-3 border-t" style="border-color: var(--border);">
          <div class="flex items-center gap-2 text-xs text-[var(--text-3)]">
            <div class="w-5 h-5 rounded-full text-white text-[9px] font-semibold flex items-center justify-center" style="background: linear-gradient(135deg, #0A1F44 0%, #051028 100%);">${ag.initials}</div>
            <span>${ag.name.split(' ').slice(-1)[0]}</span>
            ${ag.verified ? '<i data-lucide="badge-check" class="w-3 h-3" style="color: var(--primary);"></i>' : ''}
          </div>
          <span class="text-[11px] text-[var(--text-3)]">${l.viewCount} үзсэн</span>
        </div>`
        }
      </div>
    </div>
  `;
}

/* ============== NEOMAP — SHARED FOOTER ============== */
function bmFooter() {
  return `
    <footer class="bm-footer mt-16 lg:mt-24">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-14">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div class="col-span-2 md:col-span-3 lg:col-span-2">
            <div class="flex items-center mb-4">
              <img src="public/images/logo-horizontal-light.png" alt="NEOMAP" class="neo-logo neo-logo-light h-10" />
              <img src="public/images/logo-horizontal-dark.png" alt="NEOMAP" class="neo-logo neo-logo-dark h-10" />
            </div>
            <p class="text-sm" style="color: var(--text-2); max-width: 360px; line-height: 1.6;">
              NEOMAP бол Монголын үл хөдлөхийн хамгийн найдвартай, ухаалаг, хүртээмжтэй зуучлал, зөвлөгөө, үнэлгээний цогц платформ юм.
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
          <div>© ${new Date().getFullYear()} NEOMAP LLC. Бүх эрх хуулиар хамгаалагдсан.</div>
          <div>Made with <span style="color: var(--gold-brand);">♥</span> in Mongolia</div>
        </div>
      </div>
    </footer>`;
}

/* ============== HOME (NEOMAP — Image 1) ============== */
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

/* ===== Active filter summary banner — top of sidebar ===== */
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

/* ===== БАГАНА 2: PROPERTY LIST ===== */
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
function renderResults() {
  const list = filteredListings();
  const buying = state.mode === 'sale';
  const compareList =
    typeof COMPARE_SET !== 'undefined' && COMPARE_SET.size
      ? [...COMPARE_SET]
          .map((id) => getListing(id))
          .filter(Boolean)
          .slice(0, 3)
      : list.slice(0, 3);
  const dist = state.filterDistrict;
  const districtStr = dist || 'Бүх дүүрэг';

  // Stats for current filter context
  const baseForStats = dist ? modeListings().filter((l) => l.district === dist) : modeListings();
  const avgPrice = baseForStats.length
    ? Math.round(baseForStats.reduce((s, l) => s + l.price, 0) / baseForStats.length)
    : 0;
  const avgPpm = baseForStats.length
    ? Math.round(baseForStats.reduce((s, l) => s + l.price / l.area, 0) / baseForStats.length)
    : 0;

  // Map pin positioning — show first 8 listings as gold drop pins
  const mapPins = list.slice(0, 10);

  const fullMapHtml = state.fullMap ? renderFullMapOverlay() : '';

  return `
    ${fullMapHtml}
    <!-- ============== TOP SEARCH BAR ============== -->
    <section class="bm-hero pb-6 pt-6">
      <div class="max-w-7xl mx-auto px-4 lg:px-8">
        <div class="bm-search-mega">
          <i data-lucide="sparkles" class="w-5 h-5 bm-search-icon"></i>
          <input id="bm-res-search" type="text" value="${state.aiQuery || (dist ? dist + ' дүүрэг, ' + (state.filterRooms || 3) + ' өрөө, 350 саяас доош' : '')}" placeholder="Хайлтаа боловсруулна уу..."
            onkeydown="if(event.key==='Enter'){ event.preventDefault(); runAISearch(this.value); }" />
          <button onclick="clearAISearch()" class="text-[var(--text-3)] hover:text-[var(--text)] px-3"><i data-lucide="x" class="w-4 h-4"></i></button>
          <button class="bm-search-mega-btn" onclick="runAISearch(document.getElementById('bm-res-search').value)">
            <i data-lucide="search" class="w-5 h-5"></i>
          </button>
        </div>

        ${
          state.aiQuery && state.aiExtracted
            ? `
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
        `
            : ''
        }

        ${
          !state.aiQuery
            ? `
          <div class="mt-3 flex items-start gap-2 flex-wrap">
            <span class="text-[11px] font-medium uppercase tracking-wider pt-1.5 flex items-center gap-1" style="color: var(--text-3); letter-spacing: .12em;">
              <i data-lucide="sparkles" class="w-3 h-3" style="color: var(--gold-brand);"></i> Жишээ AI хайлт
            </span>
            ${AI_EXAMPLES.slice(0, 4)
              .map(
                (ex) => `
              <button onclick="runAIExample(${JSON.stringify(ex.text).replace(/"/g, '&quot;')})"
                class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition"
                style="background: var(--surface); border: 1px solid var(--border); color: var(--text-2);">
                <i data-lucide="${ex.icon}" class="w-3 h-3"></i> ${ex.text}
              </button>
            `,
              )
              .join('')}
          </div>
        `
            : ''
        }
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
          <span class="bm-recap-val">${buying ? '350 сая хүртэл' : '1.5 саяс хүртэл'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Өрөө</span>
          <span class="bm-recap-val">${state.filterRooms ? state.filterRooms + ' өрөө' : '3 өрөө'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Талбай</span>
          <span class="bm-recap-val">60-120 м² <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Байршил</span>
          <span class="bm-recap-val">${dist ? dist + ' дүүрэг' : 'Бүх дүүрэг'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <div class="flex flex-wrap items-center gap-2.5 ml-auto">
          <button class="bm-toggle ${state.filterVerified ? 'on' : ''}" onclick="toggleResultsFilter('filterVerified')">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Verified <span class="bm-switch"></span>
          </button>
          <button class="bm-toggle ${state.filterIpoteh ? 'on' : ''}" onclick="toggleResultsFilter('filterIpoteh')">
            <i data-lucide="landmark" class="w-3.5 h-3.5"></i> Ипотектэй <span class="bm-switch"></span>
          </button>
          <button class="bm-toggle ${state.filterNewProject ? 'on' : ''}" onclick="toggleResultsFilter('filterNewProject')">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Шинэ төсөл <span class="bm-switch"></span>
          </button>
          <button class="bm-btn-outline !py-2.5" onclick="openAdvancedFilters()">
            <i data-lucide="sliders" class="w-4 h-4"></i> Дэлгэрэнгүй шүүлтүүр
          </button>
        </div>
      </div>

      ${
        state.filterDistrict ||
        state.filterRooms ||
        state.filterVerified ||
        state.filterIpoteh ||
        state.filterNewProject ||
        state.filterSchool ||
        state.filterIncome ||
        state.filterPriceMax ||
        state.aiQuery
          ? `
      <div class="flex items-center gap-2 mb-3 text-xs flex-wrap">
        <span style="color: var(--text-3);">Идэвхтэй шүүлтүүр:</span>
        ${state.filterDistrict ? `<span class="bm-tag">${state.filterDistrict} <button onclick="state.filterDistrict=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        ${state.filterRooms ? `<span class="bm-tag">${state.filterRooms} өрөө <button onclick="state.filterRooms=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        ${state.filterVerified ? `<span class="bm-tag">Verified <button onclick="toggleResultsFilter('filterVerified')" class="ml-1">×</button></span>` : ''}
        ${state.filterIpoteh ? `<span class="bm-tag">Ипотектэй <button onclick="toggleResultsFilter('filterIpoteh')" class="ml-1">×</button></span>` : ''}
        ${state.filterNewProject ? `<span class="bm-tag">Шинэ төсөл <button onclick="toggleResultsFilter('filterNewProject')" class="ml-1">×</button></span>` : ''}
        ${state.filterSchool ? `<span class="bm-tag">Сургууль ойр <button onclick="toggleResultsFilter('filterSchool')" class="ml-1">×</button></span>` : ''}
        ${state.filterIncome ? `<span class="bm-tag">Орлого өгөх <button onclick="toggleResultsFilter('filterIncome')" class="ml-1">×</button></span>` : ''}
        ${state.filterPriceMax ? `<span class="bm-tag">${(state.filterPriceMax / 1000000).toFixed(0)}сая хүртэл <button onclick="state.filterPriceMax=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        <button class="text-[var(--gold-brand)] hover:underline" onclick="clearAllFilters()">Бүгдийг арилгах</button>
      </div>
      `
          : ''
      }

      <!-- Sort + view toggle -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2 text-sm" style="color: var(--text-3);">
          Эрэмблэх:
          <select onchange="state.sortBy=this.value; renderAppScreen('results')" class="bg-transparent border-0 outline-none font-medium" style="color: var(--text); appearance: none; padding-right: 18px; background-image: linear-gradient(45deg, transparent 50%, var(--gold-brand) 50%), linear-gradient(135deg, var(--gold-brand) 50%, transparent 50%); background-position: calc(100% - 12px) 50%, calc(100% - 7px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;">
            <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Шинэ нэмэгдсэн (сүүлийн үеэр)</option>
            <option value="priceAsc" ${state.sortBy === 'priceAsc' ? 'selected' : ''}>Үнэ өсөх</option>
            <option value="priceDesc" ${state.sortBy === 'priceDesc' ? 'selected' : ''}>Үнэ буурах</option>
            <option value="recommended" ${state.sortBy === 'recommended' ? 'selected' : ''}>Зөвлөмжтэй</option>
          </select>
        </div>
        <div class="inline-flex bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5">
          <button class="px-2.5 py-1.5 rounded-md ${state.viewMode !== 'grid' ? 'bg-[var(--surface-2)] text-[var(--gold-brand)]' : 'text-[var(--text-3)]'}" onclick="state.viewMode='list'; renderAppScreen('results')"><i data-lucide="list" class="w-4 h-4"></i></button>
          <button class="px-2.5 py-1.5 rounded-md ${state.viewMode === 'grid' ? 'bg-[var(--surface-2)] text-[var(--gold-brand)]' : 'text-[var(--text-3)]'}" onclick="state.viewMode='grid'; renderAppScreen('results')"><i data-lucide="grid-2x2" class="w-4 h-4"></i></button>
        </div>
      </div>

      <!-- 2 columns: list (left) + map+side (right) -->
      <div class="grid lg:grid-cols-[1fr_540px] gap-5">

        <!-- LEFT: LISTINGS -->
        <div class="flex flex-col gap-3">
          ${(() => {
            if (!list.length)
              return `<div class="card p-12 text-center">
              <i data-lucide="search-x" class="w-10 h-10 mx-auto mb-3" style="color: var(--text-3);"></i>
              <div class="font-semibold mb-1">Тохирох зар олдсонгүй</div>
              <div class="text-sm" style="color: var(--text-3);">Шүүлтүүрээ өөрчилж үзнэ үү</div>
              <button class="bm-btn-outline mt-4" onclick="clearAllFilters()"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Шүүлтүүр арилгах</button>
            </div>`;
            const ps = state.pageSize || 8;
            const page = Math.max(1, state.page || 1);
            const start = (page - 1) * ps;
            return list
              .slice(start, start + ps)
              .map((l) => bmListingRow(l))
              .join('');
          })()}

          ${(() => {
            const ps = state.pageSize || 8;
            const totalPages = Math.ceil(list.length / ps);
            if (totalPages <= 1) return '';
            const cur = Math.max(1, Math.min(totalPages, state.page || 1));
            const pageBtns = [];
            const push = (p, active) =>
              pageBtns.push(
                `<button class="w-9 h-9 rounded-lg ${active ? 'bg-[var(--gold-brand)] text-[#0A1F44] font-semibold' : 'border border-[var(--border)] hover:border-[var(--gold-brand)]'}" style="${active ? '' : 'color: var(--text-2);'}" onclick="gotoPage(${p})">${p}</button>`,
              );
            // Эхний 4 + ellipsis + сүүлийн
            const shown = new Set([1, cur - 1, cur, cur + 1, totalPages].filter((p) => p >= 1 && p <= totalPages));
            let prev = 0;
            [...shown]
              .sort((a, b) => a - b)
              .forEach((p) => {
                if (p - prev > 1) pageBtns.push(`<span style="color: var(--text-3);">…</span>`);
                push(p, p === cur);
                prev = p;
              });
            return `
              <div class="flex items-center justify-center gap-1 mt-4">
                <button class="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center ${cur === 1 ? 'opacity-40 cursor-not-allowed' : ''}" style="color: var(--text-3);" onclick="${cur === 1 ? '' : `gotoPage(${cur - 1})`}"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                ${pageBtns.join('')}
                <button class="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center ${cur === totalPages ? 'opacity-40 cursor-not-allowed' : ''}" style="color: var(--text-2);" onclick="${cur === totalPages ? '' : `gotoPage(${cur + 1})`}"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
              </div>
            `;
          })()}
        </div>

        <!-- RIGHT: MAP + SIDE PANELS -->
        <aside class="space-y-4">
          <!-- Map (embed) -->
          <div class="bm-side-block !p-0 overflow-hidden" style="height: 520px; position: relative;">
            <div class="bm-map-embed-head">
              <button class="bm-toggle on" onclick="openFullMap()" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px); color: #fff; border-color: var(--gold-brand);" title="Бүрэн дэлгэц рүү шилжих">
                <span class="bm-switch"></span> Газрын зураг
              </button>
              <div class="flex gap-1.5">
                <button onclick="startDrawZone()" class="bm-btn-outline !py-1.5 !text-xs" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px); color: #fff; border-color: rgba(255,255,255,.18);" title="Бүс зурж хайх">
                  <i data-lucide="pen-line" class="w-3.5 h-3.5"></i>
                </button>
                <button class="bm-btn-outline !py-1.5 !text-xs" onclick="openFullMap()" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px); color: #fff; border-color: rgba(255,255,255,.18);">
                  <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Бүрэн дэлгэц
                </button>
              </div>
            </div>
            <div style="height: 100%;">${mapBackground(mapPins, { selectedId: state.highlightedId, showControls: false, showContext: false, showZoneSummary: false })}</div>
          </div>

          <!-- Зах зээлийн тойм -->
          <div class="bm-side-block">
            <div class="bm-side-title">
              <span>Зах зээлийн тойм <span style="color: var(--text-3); font-weight: 400;">(${districtStr}${dist ? ' дүүрэг' : ''})</span></span>
              <button onclick="openDetailedStatsModal('${dist || 'all'}')" class="text-xs hover:underline" style="color: var(--gold-brand);">Дэлгэрэнгүй статистик →</button>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Дундаж үнэ (${state.filterRooms || 3} өрөө)</div>
                <div class="num text-lg font-bold">${
                  avgPrice
                    ? Math.round(avgPrice / 1000000) +
                      ',' +
                      String(avgPrice % 1000000)
                        .padStart(6, '0')
                        .slice(0, 3) +
                      ',000₮'
                    : '—'
                }</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 4.6% емнөх сараас</div>
              </div>
              <div class="text-center" style="border-left: 1px solid var(--border); border-right: 1px solid var(--border);">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Идэвхтэй зар</div>
                <div class="num text-lg font-bold">${list.length || '186'}</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 12.1% емнөх сараас</div>
              </div>
              <div class="text-center">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Дундаж үнэ / м²</div>
                <div class="num text-lg font-bold">${avgPpm ? avgPpm.toLocaleString('en-US') + '₮' : '—'}</div>
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
              <div class="bm-ai-pick-photo" style="background-image:url('${photoUrl(list[0] || LISTINGS[0], 1, '300/300')}'); position: relative;">
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
              ${compareList
                .map(
                  (l) => `
                <div class="bm-compare-thumb" onclick="openProperty(${l.id})" style="background-image:url('${photoUrl(l, 0, '120/120')}')">
                  <div class="bm-compare-thumb-label">
                    <div style="font-weight:600;">${l.khotkhon.length > 14 ? l.khotkhon.slice(0, 12) + '…' : l.khotkhon}</div>
                    <div style="color: var(--gold-brand);" class="num">${Math.round(l.price / 1000000)} саяс</div>
                  </div>
                </div>
              `,
                )
                .join('')}
              ${
                compareList.length < 4
                  ? Array(4 - compareList.length)
                      .fill(0)
                      .map(
                        () => `
                <button class="bm-compare-add" onclick="${typeof COMPARE_SET !== 'undefined' && COMPARE_SET.size ? 'openCompareView()' : `showToast('Зар нэмэхийн тулд листинг дээр сум сонгоно уу', 'info')`}">
                  <i data-lucide="sparkles" class="w-4 h-4 mb-1"></i>
                  Харьцуулах
                </button>
              `,
                      )
                      .join('')
                  : ''
              }
            </div>
          </div>

          <!-- Хайлтаа хадгалсан -->
          <div class="bm-side-block">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold mb-1">Хайлтаа хадгалсан</div>
                <div class="text-xs" style="color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${state.aiQuery || dist + ' ' + (state.filterRooms || 3) + ' өрөө, 350 саяас доош, сургууль ойр байр'}</div>
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

/* ============== PROPERTY (NEOMAP — Image 3) ============== */
function pdEsc(v) {
  if (typeof lpEsc === 'function') return lpEsc(v);
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
}
function pdItems(v) {
  if (!Array.isArray(v)) {
    if (v && typeof v === 'object') {
      const label = v.item || v.label || v.name || v.title || v.value;
      return pdHasScalar(label) ? [String(label)] : [];
    }
    return pdHasScalar(v) ? [String(v)] : [];
  }
  return v
    .flatMap((item) => {
      if (item == null) return [];
      if (typeof item === 'string' || typeof item === 'number') return String(item).trim() ? [String(item)] : [];
      if (typeof item === 'object') {
        const enabled = item.has !== false && item.checked !== false && item.active !== false;
        const label = item.item || item.label || item.name || item.title || item.value;
        return enabled && pdHasScalar(label) ? [String(label)] : [];
      }
      return [];
    })
    .filter(Boolean);
}
function pdHasScalar(v) {
  return v !== undefined && v !== null && String(v).trim() !== '';
}
function pdFirst() {
  for (const v of arguments) {
    if (Array.isArray(v)) {
      const items = pdItems(v);
      if (items.length) return items.join(' · ');
    } else if (pdHasScalar(v)) {
      return v;
    }
  }
  return '';
}
function pdArea(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n.toLocaleString('en-US')} м²`;
}
function pdTypeLabel(detail) {
  const raw = detail?.type?.primary || '';
  if (raw && typeof lpType === 'function') {
    const found = (typeof SMART_LIST_PROP_TYPES !== 'undefined' ? SMART_LIST_PROP_TYPES : []).find((x) => x.key === raw || x.label === raw);
    return found ? found.label : lpType(raw).label;
  }
  return raw || 'Орон сууц';
}
function pdGoalLabel(detail, l) {
  const raw = detail?.type?.purpose || '';
  if (raw && typeof lpGoal === 'function') return lpGoal(raw).label;
  return (detail?.pricing?.mode || l.mode) === 'rent' ? 'Түрээслэх' : 'Худалдах';
}
function pdSubtypeLabel(detail) {
  return detail?.type?.subtype || '';
}
function pdRoomCount(detail, l) {
  const roomArr = detail?.specs?.rooms;
  const fromDetail = Array.isArray(roomArr) ? roomArr.find((x) => Number(x) > 0) : roomArr;
  return Number(pdFirst(fromDetail, detail?.uxDraft?.specs?.rooms, l.rooms)) || 0;
}
function pdBedroomCount(detail, l) {
  return Number(pdFirst(detail?.specs?.bedrooms, detail?.uxDraft?.specs?.bedrooms, Math.max((l.rooms || 1) - 1, 1))) || 0;
}
function pdFloorText(detail, l) {
  const floor = pdFirst(detail?.address?.floor, detail?.uxDraft?.address?.selectedFloor);
  const total = pdFirst(detail?.specs?.totalFloors, detail?.uxDraft?.address?.floorTotal);
  if (floor && total) return `${floor} / ${total}`;
  return pdFirst(l.floor, floor);
}
function pdWindowText(detail, l) {
  if (typeof lpWindowSummary === 'function') {
    const draftSummary = lpWindowSummary(detail?.uxDraft?.specs?.windows);
    if (draftSummary) return draftSummary;
  }
  const draftWindows = pdItems(detail?.uxDraft?.specs?.windows);
  if (draftWindows.length) return draftWindows.join(' · ');
  const counts = detail?.specs?.windowCounts || {};
  const dirs = Object.keys(counts).filter((k) => k !== 'total' && Number(counts[k]) > 0);
  if (dirs.length) return dirs.map((k) => `${k} ${counts[k]}`).join(' · ');
  return listingOrientation(l);
}
function pdInfraValue(detail, key) {
  const infra = detail?.infra || {};
  const draft = detail?.uxDraft?.infra || {};
  if (key === 'road') {
    const road = infra.road || {};
    const parts = [];
    if (Number(road.asphaltPct) > 0) parts.push(`Асфальт ${road.asphaltPct}%`);
    if (Number(road.dirtKm) > 0) parts.push(`Шороон ${road.dirtKm} км`);
    return parts.join(' · ') || draft.road || '';
  }
  if (key === 'internet') return pdFirst(infra.internet, draft.internet);
  return pdFirst(infra[key]?.primary, draft[key]);
}
function propertyFeatureCards(l, detail) {
  const raw = [
    ...(Array.isArray(l.features) ? l.features : []),
    ...pdItems(detail?.community?.amenities),
    ...pdItems(detail?.community?.security),
    ...pdItems(detail?.included?.furniture),
    ...pdItems(detail?.included?.equipment),
    ...pdItems(detail?.uxDraft?.specs?.officeNeeds),
  ];
  const uniq = [...new Set(raw.filter(Boolean))].slice(0, 8);
  const iconFor = (label) => {
    if (/харуул|CCTV|домофон|нэвтрэлт|хаалттай/i.test(label)) return 'shield';
    if (/зогсоол|гараж|EV/i.test(label)) return 'car';
    if (/фитнес|gym|саун|спа|бассейн/i.test(label)) return 'dumbbell';
    if (/тавилга|шүүгээ|гал тогоо|хөшиг/i.test(label)) return 'sofa';
    if (/лифт|access|disabled|налуу/i.test(label)) return 'accessibility';
    if (/ногоон|алхалт|террас|талбай/i.test(label)) return 'trees';
    return 'sparkles';
  };
  const list = uniq.length ? uniq : ['Тодорхой мэдээлэлтэй зар'];
  return list.map((label) => ({ icon: iconFor(label), label, desc: '' }));
}
function renderProperty() {
  const l = getListing(state.currentListingId);
  if (!l) return '<div class="p-8">Зар олдсонгүй</div>';
  const detail = typeof getListingDetail === 'function' ? getListingDetail(l) : (l.detail || null);
  const propGoalLabel = pdGoalLabel(detail, l);
  const propTypeLabel = pdTypeLabel(detail);
  const propSubtype = pdSubtypeLabel(detail);
  const propRoomCount = pdRoomCount(detail, l) || l.rooms;
  const propBedroomCount = pdBedroomCount(detail, l);
  const propArea = Number(pdFirst(detail?.specs?.areaCert, l.area)) || l.area;
  const propFloor = pdFloorText(detail, l);
  const propAddress = detail?.address || {};
  const propMedia = detail?.uxDraft?.media || {};
  const propPhotoCount = Array.isArray(propMedia.photos) ? propMedia.photos.length : (l.photos || 0);
  const propHasVideo = !!propMedia.videoLink;
  const propTitleTypeLine = propRoomCount && !['Газар', 'Авто дулаан зогсоол'].includes(propTypeLabel) ? `${propRoomCount} өрөө ${propTypeLabel}` : propTypeLabel;
  const propDistrict = pdFirst(propAddress.district, l.district);
  const propKhoroo = pdFirst(propAddress.khoroo, l.khoroo);
  const propProject = pdFirst(propAddress.project, l.khotkhon);
  const propYear = pdFirst(detail?.state?.commissionYear, l.year);
  const ag = getAgent(l.agentId);
  const isSaved = SAVED_IDS.has(l.id);
  const verified = isListingVerified(l);
  const bank = getBank(state.loanBankId);
  const downPct = Math.max(bank.minDownPct, state.loanDownPct);
  const years = Math.min(bank.maxYears, state.loanYears);
  const monthly = mortgageMonthly(l.price, downPct, years, bank.rate);
  const down = Math.round((l.price * downPct) / 100);
  const loan = l.price - down;
  const totalPaid = monthly * years * 12;
  const totalInterest = totalPaid - loan;
  const propId = 'RG-' + String(l.id).padStart(4, '0') + '-' + (l.photos * 7 + 13);
  const _curIdx = LISTINGS.findIndex((x) => x.id === l.id);
  const nextId = LISTINGS[(_curIdx + 1) % LISTINGS.length].id;
  const prevId = LISTINGS[(_curIdx - 1 + LISTINGS.length) % LISTINGS.length].id;

  const reasons = [
    propDistrict && `${propDistrict} дүүргийн байршил`,
    propArea && `${propArea} м² талбай`,
    pdInfraValue(detail, 'heating') && `${pdInfraValue(detail, 'heating')} дулаан`,
    pdItems(detail?.community?.security).slice(0, 1)[0],
    pdItems(detail?.community?.amenities).slice(0, 1)[0],
  ].filter(Boolean).slice(0, 4);

  const features = propertyFeatureCards(l, detail);

  const pois = [
    { kind: 'Сургууль', name: 'British School of Ulaanbaatar', dist: '1.1 км (3 мин)', icon: 'graduation-cap' },
    { kind: 'Худалдаа', name: 'Хүннү Молл', dist: '2.5 км (6 мин)', icon: 'shopping-bag' },
    { kind: 'Эмнэлэг', name: 'Интермед эмнэлэг', dist: '2.3 км (6 мин)', icon: 'cross' },
    { kind: 'Тээвэр', name: 'Зайсангийн эцэс автобусны буудал', dist: '500 м (7 мин явган)', icon: 'bus' },
    { kind: 'Цэцэрлэгт хүрэлэн', name: 'Зайсангийн цэцэрлэгт хүрэлэн', dist: '1.0 км (3 мин)', icon: 'trees' },
  ];

  return `
    <div class="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <!-- Breadcrumb + prev/next -->
      <div class="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div class="bm-breadcrumb">
          <a onclick="goTo('home')">Нүүр</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="setMode('${detail?.pricing?.mode || l.mode}'); goTo('results')">${pdEsc(propGoalLabel)}</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="goTo('results')">${pdEsc(propTypeLabel)}</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="state.filterDistrict='${pdEsc(propDistrict)}'; goTo('results')">${pdEsc(propDistrict)} дүүрэг</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <span style="color: var(--text);">${pdEsc(propProject)} — ${pdEsc(propTitleTypeLine)}</span>
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
              <i data-lucide="image" class="w-3.5 h-3.5"></i> ${propPhotoCount} зураг
            </div>
            ${propHasVideo ? `<div class="bm-gallery-overlay-tag" style="left: 130px; bottom: 14px;"><i data-lucide="play" class="w-3.5 h-3.5"></i> Видео</div>` : ''}
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
            <h1 class="bm-prop-title">${pdEsc(propProject)} —<br/>${pdEsc(propTitleTypeLine)}</h1>
            ${verified ? `<span class="bm-verified shrink-0 mt-2"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
          </div>
          <div class="bm-prop-loc">
            <i data-lucide="map-pin" class="w-4 h-4" style="color: var(--gold-brand);"></i>
            ${pdEsc(propDistrict)} дүүрэг, ${pdEsc(propKhoroo)}-р хороо, ${pdEsc(propProject)} <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </div>

          <div class="mt-6 mb-5">
            <div class="bm-prop-price-big num">${l.price.toLocaleString('en-US')}₮</div>
            <div class="bm-prop-ppm-big num">${listingPpm(l).toLocaleString('en-US')}₮ / м²</div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mb-5">
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${pdArea(propArea)}</div>
              <div class="bm-prop-spec-lbl">Нийт талбай</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${propRoomCount} өрөө</div>
              <div class="bm-prop-spec-lbl">Өрөөний тоо</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${pdEsc(propFloor)} давхар</div>
              <div class="bm-prop-spec-lbl">Байрлал</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${pdEsc(propYear)} он</div>
              <div class="bm-prop-spec-lbl">Ашиглалтад орсон</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val text-base">${pdEsc(pdWindowText(detail, l))}</div>
              <div class="bm-prop-spec-lbl">Цонхны харьц</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val text-base">${pdEsc(pdFirst(pdInfraValue(detail, 'heating'), listingHeating(l)))}</div>
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
            <button class="bm-btn-outline ${isSaved ? '!border-[var(--gold-brand)] !text-[var(--gold-brand)]' : ''}" onclick="toggleSaved(${l.id}, this)">
              <i data-lucide="heart" class="w-4 h-4" ${isSaved ? 'fill="currentColor"' : ''}></i> Хадгалах
            </button>
          </div>

          <div class="flex items-center justify-between text-xs flex-wrap gap-2" style="color: var(--text-3);">
            <span>Зарын дугаар: <span style="color: var(--text-2);" class="num">${propId}</span></span>
            <span>Нийтэлсэн: <span style="color: var(--text-2);" class="num">${(() => {
              const d = new Date();
              d.setDate(d.getDate() - (l.listedDays || 0));
              return (
                d.getFullYear() +
                '.' +
                String(d.getMonth() + 1).padStart(2, '0') +
                '.' +
                String(d.getDate()).padStart(2, '0')
              );
            })()}</span></span>
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
              Энэхүү ${pdEsc(propTypeLabel)} нь ${pdEsc(propDistrict)} дүүрэгт байрлах ${pdEsc(pdArea(propArea))} талбайтай зар. Зорилго, байршил, үзүүлэлт, дэд бүтэц, төлбөрийн нөхцөл нь зар оруулах хэсгийн дататай холбогдож харагдаж байна.
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              ${reasons.map((r) => `<span class="bm-ai-reason-chip"><i data-lucide="check" class="w-3 h-3"></i>${r}</span>`).join('')}
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
                  ['Байршил', `${propDistrict} дүүрэг, ${propKhoroo}-р хороо, ${propProject}`, 'map-pin'],
                  ['Хотхон', propProject, 'building'],
                  ['Барилгын төрөл', [propTypeLabel, propSubtype].filter(Boolean).join(' · '), 'building-2'],
                  ['Нийт талбай', pdArea(propArea), 'ruler'],
                  ['Өрөөний тоо', `${propRoomCount} өрөө${propBedroomCount ? ` (${propBedroomCount} унтлагын өрөө)` : ''}`, 'bed-double'],
                  ['Давхар / Нийт', propFloor, 'arrow-up-down'],
                  ['Ашиглалтад орсон', propYear ? `${propYear} он` : '', 'calendar'],
                  ['Зогсоол', pdFirst(pdItems(detail?.community?.amenities).filter((x) => /зогсоол|гараж/i.test(x)), detail?.specs?.areaGarage ? `Зогсоолын талбай ${pdArea(detail.specs.areaGarage)}` : '', 'Мэдээлэл оруулаагүй'), 'car'],
                  ['Цонхны харьц', pdWindowText(detail, l), 'sun'],
                  ['Засвар', pdFirst(detail?.state?.interior, detail?.state?.current, 'Мэдээлэл оруулаагүй'), 'sparkles'],
                ]
                  .map(
                    ([k, v, ic]) => `
                    <div class="bm-keytbl-row">
                      <div class="bm-keytbl-row-k"><i data-lucide="${ic}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>${k}</div>
                    <div class="bm-keytbl-row-v">${pdEsc(v)}</div>
                  </div>
                `,
                  )
                  .join('')}
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
              ${features
                .map(
                  (f) => `
                <div class="bm-feat-item">
                  <i data-lucide="${f.icon}" class="w-5 h-5"></i>
                  <div>
                    <div style="color: var(--text);">${pdEsc(f.label)}</div>
                    ${f.desc ? `<div style="color: var(--text-3); font-size: 11px;">${pdEsc(f.desc)}</div>` : ''}
                  </div>
                </div>
              `,
                )
                .join('')}
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
                <div class="text-sm font-semibold mb-3">${pdEsc(propDistrict)} дүүрэг, ${pdEsc(propKhoroo)}-р хороо,<br/>${pdEsc(propProject)}</div>
                <ul class="space-y-2 text-sm" style="color: var(--text-2);">
                  ${BUS_STOPS.map((bs) => ({ bs, km: placeDistanceKm(bs, l) }))
                    .sort((a, b) => a.km - b.km)
                    .slice(0, 5)
                    .map(({ bs, km }) => {
                      const t = placeTravel(km);
                      const kmTxt = km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
                      return `<li class="flex items-center gap-2"><span style="width:6px; height:6px; border-radius:50%; background: var(--gold-brand);"></span> ${bs.name} (буудал) — <span class="num">${kmTxt}</span> · 🚶 ${t.walkMin} мин · 🚗 ${t.driveMin} мин</li>`;
                    })
                    .join('')}
                </ul>
                <button class="bm-btn-outline w-full mt-4 !text-xs !py-2">Газрын зураг дээр харах <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></button>
              </div>
            </div>
          </div>

          <!-- My Places — commute times -->
          ${renderMyPlacesCommute(l)}

          <!-- POI strip: schools, services, transport -->
          <div>
            <h3 class="text-base font-semibold mb-3">Ойролцоох сургууль, үйлчилгээ, тээвэр</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              ${pois
                .map(
                  (p) => `
                <div class="bm-poi">
                  <div class="bm-poi-icon"><i data-lucide="${p.icon}" class="w-5 h-5"></i></div>
                  <div class="min-w-0">
                    <div class="bm-poi-kind">${p.kind}</div>
                    <div class="bm-poi-name truncate">${p.name}</div>
                    <div class="bm-poi-dist">${p.dist}</div>
                  </div>
                </div>
              `,
                )
                .join('')}
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
                  <span class="text-[10px]" style="color: var(--gold-brand);">NEOMAP Partner</span>
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
              Энэхүү зар нь NEOMAP-аар баталгаажсан. Баримт бичиг болон мэдээлэл бодитой.
            </p>
          </div>

          <!-- Mortgage calculator — Bank partner aware -->
          <div class="bm-side-block">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="text-sm font-semibold">Зээлийн тооцоолуур</div>
                <div class="text-[11px]" style="color: var(--text-3);">Банк/санхүүгийн байгууллагатай хамтарсан</div>
              </div>
              <span class="pill pill-gold"><i data-lucide="handshake" class="w-3 h-3"></i> Партнёр</span>
            </div>

            <!-- Bank tabs -->
            <div class="flex flex-wrap gap-1 mb-3 p-1 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border);">
              ${BANKS.map((b) => {
                const sel = b.id === bank.id;
                return `<button onclick="setLoanBank('${b.id}')" class="text-[11px] px-2.5 py-1.5 rounded-md font-medium transition" style="${sel ? `background: ${b.color}; color: #fff;` : 'color: var(--text-2);'}">${b.short}</button>`;
              }).join('')}
            </div>

            <!-- Selected bank header -->
            <div class="flex items-start gap-2 mb-3 p-3 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border); border-left: 3px solid ${bank.color};">
              <div class="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-white" style="background: ${bank.color}">${bank.short.slice(0, 2)}</div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold">${bank.name}</div>
                <div class="text-[11px] mt-0.5" style="color: var(--text-3);">${bank.tag}</div>
                <div class="flex gap-1 mt-1">
                  <span class="num text-[10px] px-1.5 py-0.5 rounded" style="background: var(--gold-soft); color: var(--gold-brand);">${bank.rate}% жилийн</span>
                  <span class="num text-[10px] px-1.5 py-0.5 rounded" style="background: var(--surface); color: var(--text-2);">${bank.maxYears} жил хүртэл</span>
                </div>
              </div>
            </div>

            <!-- Adjustable params -->
            <div class="mb-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px]" style="color: var(--text-3);">Урьдчилгаа</span>
                <span class="num text-xs font-semibold">${downPct}% · ${fmtCompact(down)}</span>
              </div>
              <input type="range" min="${bank.minDownPct}" max="60" step="5" value="${downPct}" oninput="setLoanDown(this.value)" class="w-full accent-[var(--gold-brand)]" />
              <div class="text-[10px] mt-0.5" style="color: var(--text-3);">Доод хязгаар: ${bank.minDownPct}% (${bank.short})</div>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px]" style="color: var(--text-3);">Хугацаа</span>
                <span class="num text-xs font-semibold">${years} жил</span>
              </div>
              <input type="range" min="5" max="${bank.maxYears}" step="1" value="${years}" oninput="setLoanYears(this.value)" class="w-full accent-[var(--gold-brand)]" />
            </div>

            <div class="bm-mortgage-row">
              <span class="k">Орон сууцны үнэ</span>
              <span class="v num">${l.price.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Зээлийн дүн (${100 - downPct}%)</span>
              <span class="v num">${loan.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Жилийн хүү</span>
              <span class="v num" style="color: ${bank.color}; font-weight: 600;">${bank.rate}%</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Нийт төлөх</span>
              <span class="v num">${totalPaid.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Нийт хүү</span>
              <span class="v num" style="color: var(--warning);">${totalInterest.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-monthly">
              <span class="k">Сарын төлбөр (ойролцоогоор)</span>
              <span class="v num">${monthly.toLocaleString('en-US')} ₮</span>
            </div>
            <p class="text-[11px] mt-3" style="color: var(--text-3); line-height: 1.5;">
              Тооцоолол нь урьдчилсан, банкны эцсийн зөвшөөрөл/нөхцөлөөс хамаарч өөрчлөгдөнө.
            </p>
            <div class="grid grid-cols-2 gap-2 mt-3">
              <button onclick="openLoanCompare()" class="bm-btn-outline !text-xs !py-2"><i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i> Банк харьцуул</button>
              <button onclick="openLoanApplyModal('${bank.id}', ${l.id})" class="bm-btn-gold !text-xs !py-2"><i data-lucide="send" class="w-3.5 h-3.5"></i> Хүсэлт явуул</button>
            </div>
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
  const dates = (() => {
    const out = [];
    const now = new Date();
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      out.push(d.getMonth() + 1 + '/' + d.getDate());
    }
    return out;
  })();
  const times = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  if (!state.scheduleDate || !dates.includes(state.scheduleDate)) state.scheduleDate = dates[0];

  return `
    <div class="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <button onclick="goTo('property')" class="text-xs text-[var(--text-3)] hover:text-[var(--text)] flex items-center gap-1 mb-3"><i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Зар руу буцах</button>
      <h1 class="text-2xl font-semibold mb-1">Үзэлт товлох</h1>
      <p class="text-sm text-[var(--text-3)] mb-6">${l?.khotkhon} · ${l?.district}</p>

      <div class="card p-5 mb-4">
        <div class="eyebrow mb-3">Огноо</div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          ${dates.map((d) => `<button onclick="state.scheduleDate='${d}'; renderAppScreen('schedule'); setTimeout(()=>lucide.createIcons(),0);" class="src-chip py-3 ${state.scheduleDate === d ? 'selected' : ''}">${d}</button>`).join('')}
        </div>
        <div class="eyebrow mb-3">Цаг</div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          ${times.map((t) => `<button onclick="state.scheduleTime='${t}'; renderAppScreen('schedule'); setTimeout(()=>lucide.createIcons(),0);" class="src-chip py-3 ${state.scheduleTime === t ? 'selected' : ''}">${t}</button>`).join('')}
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
        ${VIEWINGS.map((v) => {
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

/* ============== SAVED HUB (2 tabs: listings + searches) ============== */
/* Per-listing notification config — store ad-hoc in window scope */
window.SAVED_LISTING_NOTIFY = window.SAVED_LISTING_NOTIFY || {};
function getListingNotify(id) {
  if (!window.SAVED_LISTING_NOTIFY[id]) {
    window.SAVED_LISTING_NOTIFY[id] = {
      app: true,
      email: false,
      sms: false,
      onPriceDrop: true,
      onPriceUp: false,
      onStatusChange: true,
      onAgentMsg: true,
    };
  }
  return window.SAVED_LISTING_NOTIFY[id];
}

function renderSavedHub(defaultTab) {
  if (defaultTab && state.savedTab !== defaultTab) state.savedTab = defaultTab;
  const tab = state.savedTab || 'listings';
  const list = LISTINGS.filter((l) => SAVED_IDS.has(l.id));
  const tabs = `
    <div class="flex items-center gap-1 mb-5 p-1 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border); width: fit-content;">
      <button onclick="switchSavedTab('listings')" class="px-4 py-2 rounded-md text-sm font-medium transition" style="${tab === 'listings' ? 'background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm);' : 'color: var(--text-2);'}">
        <i data-lucide="heart" class="w-3.5 h-3.5 inline mr-1"></i>Хадгалсан зарууд
        <span class="num text-[11px] ml-1" style="color: var(--text-3);">${list.length}</span>
      </button>
      <button onclick="switchSavedTab('searches')" class="px-4 py-2 rounded-md text-sm font-medium transition" style="${tab === 'searches' ? 'background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm);' : 'color: var(--text-2);'}">
        <i data-lucide="bell" class="w-3.5 h-3.5 inline mr-1"></i>Хадгалсан хайлт
        <span class="num text-[11px] ml-1" style="color: var(--text-3);">${SAVED_SEARCHES.length}</span>
      </button>
    </div>
  `;

  let body = '';
  if (tab === 'listings') {
    body = `
      <p class="text-sm text-[var(--text-3)] mb-4">${list.length} хадгалсан зар · Үнэ/төлөв өөрчлөгдөхөд мэдэгдэл авах боломжтой</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${list.map((l) => savedListingCard(l)).join('')}
      </div>
    `;
  } else {
    body = `
      <p class="text-sm text-[var(--text-3)] mb-4">${SAVED_SEARCHES.length} хадгалсан хайлт · Шинэ зар орох тутамд мэдэгдэл авна</p>
      <div class="space-y-2">
        ${SAVED_SEARCHES.map(
          (s) => `
          <div class="card p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background: var(--primary-soft); color: var(--primary);"><i data-lucide="bell" class="w-4 h-4"></i></div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${s.name}</div>
              <div class="text-xs text-[var(--text-3)] mt-0.5">${s.districts.join(', ')} · ${s.rooms.join('-')} өрөө · ${s.mode === 'rent' ? 'Түрээс' : 'Худалдах'}</div>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                ${s.sms ? '<span class="pill pill-info"><i data-lucide="message-square" class="w-3 h-3"></i> SMS</span>' : ''}
                ${s.email ? '<span class="pill pill-info"><i data-lucide="mail" class="w-3 h-3"></i> E-mail</span>' : ''}
                ${s.push ? '<span class="pill pill-info"><i data-lucide="smartphone" class="w-3 h-3"></i> App</span>' : ''}
                <span class="pill pill-gold">${s.alertFreq === 'instant' ? 'Тэр даруй' : s.alertFreq === 'daily' ? 'Өдөрт' : '7 хоног'}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              ${s.newMatches ? `<span class="pill pill-new">${s.newMatches} шинэ</span>` : ''}
              <button onclick="openSearchNotifyModal(${s.id})" class="btn btn-secondary !text-xs !py-2" title="Notification тохиргоо"><i data-lucide="settings-2" class="w-3.5 h-3.5"></i></button>
              <button onclick="openEditSearchModal(${s.id})" class="btn btn-ghost !text-xs !py-2" title="Засах"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
              <button onclick="openDeleteSearchConfirm(${s.id})" class="btn btn-ghost !text-xs !py-2" style="color: var(--danger)" title="Устгах"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </div>
        `,
        ).join('')}
        <button onclick="openSavedSearchModal()" class="card p-4 w-full flex items-center justify-center gap-2 text-sm hover:border-[var(--gold-brand)] transition" style="border-style: dashed;"><i data-lucide="plus" class="w-4 h-4"></i> Шинэ хайлт хадгалах</button>
      </div>
    `;
  }

  return `
    <div class="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <h1 class="text-2xl font-semibold mb-2">Хадгалсан</h1>
      ${tabs}
      ${body}
    </div>
  `;
}

function savedListingCard(l) {
  const cfg = getListingNotify(l.id);
  const channels = [cfg.app && 'App', cfg.email && 'E-mail', cfg.sms && 'SMS'].filter(Boolean);
  return `
    <div class="card overflow-hidden">
      <div onclick="openProperty(${l.id})" class="aspect-[16/10] bg-cover bg-center cursor-pointer relative" style="background-image:url('${photoUrl(l, 0, '600/400')}')">
        <button onclick="event.stopPropagation(); openListingNotifyModal(${l.id})" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center" style="background: rgba(15,33,72,.85); color: ${channels.length ? 'var(--gold-brand)' : 'var(--text-3)'};" title="Мэдэгдлийн тохиргоо"><i data-lucide="bell" class="w-3.5 h-3.5"></i></button>
        <button onclick="event.stopPropagation(); toggleSaved(${l.id}, this)" class="heart-btn saved absolute top-2.5 left-2.5"><i data-lucide="heart" class="w-3.5 h-3.5"></i></button>
      </div>
      <div onclick="openProperty(${l.id})" class="p-3 cursor-pointer">
        <div class="font-semibold text-sm truncate">${l.khotkhon}</div>
        <div class="text-xs text-[var(--text-3)] mt-0.5">${l.district} · ${l.rooms}ө · ${l.area}м²</div>
        <div class="num text-sm font-semibold mt-2" style="color: var(--gold-brand)">${listingPriceShort(l)}</div>
        ${channels.length ? `<div class="text-[10px] mt-2 flex items-center gap-1" style="color: var(--text-3)"><i data-lucide="bell" class="w-3 h-3"></i> ${channels.join(' · ')}</div>` : '<div class="text-[10px] mt-2" style="color: var(--text-3)">Мэдэгдэл идэвхгүй</div>'}
      </div>
    </div>
  `;
}

function renderSaved() {
  return renderSavedHub('listings');
}
function renderAlerts() {
  return renderSavedHub('searches');
}

function switchSavedTab(t) {
  state.savedTab = t;
  if (currentScreen === 'saved' || currentScreen === 'alerts') {
    renderAppScreen(currentScreen);
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.switchSavedTab = switchSavedTab;

/* Per-listing notification modal */
function openListingNotifyModal(listingId) {
  const l = getListing(listingId);
  const cfg = getListingNotify(listingId);
  openModal(`
    <div class="p-5 border-b" style="border-color: var(--border);">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-lg">Мэдэгдлийн тохиргоо</h3>
          <p class="text-xs text-[var(--text-3)] mt-0.5">${l.khotkhon} · ${l.rooms}ө ${l.area}м²</p>
        </div>
        <button onclick="closeModal()" class="text-[var(--text-3)] hover:text-[var(--text)]"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
    </div>
    <div class="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">МЭДЭГДЭЛ ХҮЛЭЭН АВАХ СУВАГ</div>
        <div class="space-y-2">
          ${[
            ['app', 'App push', 'smartphone', 'Утсан дээрх app-аар тэр дор нь'],
            ['email', 'И-мэйл', 'mail', 'Бүртгэлтэй и-мэйл хаягаар'],
            ['sms', 'SMS', 'message-square', 'Утсан дугаар руу мессеж'],
          ]
            .map(
              ([k, label, ic, sub]) => `
            <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style="background: var(--surface-2);">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background: var(--surface); color: var(--gold-brand)"><i data-lucide="${ic}" class="w-4 h-4"></i></div>
              <div class="flex-1">
                <div class="text-sm font-medium">${label}</div>
                <div class="text-[11px] text-[var(--text-3)]">${sub}</div>
              </div>
              <input type="checkbox" id="ln-${k}" ${cfg[k] ? 'checked' : ''} class="accent-[var(--gold-brand)] w-4 h-4" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>

      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">ЯМАР ТОХИОЛДОЛД МЭДЭГДЭХ ВЭ?</div>
        <div class="space-y-1.5">
          ${[
            ['onPriceDrop', 'Үнэ буурахад', 'trending-down', 'var(--success)'],
            ['onPriceUp', 'Үнэ нэмэгдэхэд', 'trending-up', 'var(--warning)'],
            ['onStatusChange', 'Төлөв өөрчлөгдөхөд (зарагдсан, захиалагдсан)', 'refresh-cw', 'var(--gold-brand)'],
            ['onAgentMsg', 'Агентаас мессеж/шинэ зураг ирэхэд', 'message-circle', 'var(--primary)'],
          ]
            .map(
              ([k, label, ic, col]) => `
            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
              <i data-lucide="${ic}" class="w-4 h-4 shrink-0" style="color: ${col}"></i>
              <span class="text-sm flex-1">${label}</span>
              <input type="checkbox" id="ln-${k}" ${cfg[k] ? 'checked' : ''} class="accent-[var(--gold-brand)]" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="p-4 flex gap-2 justify-end" style="border-top: 1px solid var(--border); background: var(--surface-2);">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="saveListingNotify(${listingId})" class="btn btn-cta"><i data-lucide="check" class="w-4 h-4"></i> Хадгалах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}
window.openListingNotifyModal = openListingNotifyModal;

function saveListingNotify(id) {
  const cfg = getListingNotify(id);
  ['app', 'email', 'sms', 'onPriceDrop', 'onPriceUp', 'onStatusChange', 'onAgentMsg'].forEach((k) => {
    const el = document.getElementById('ln-' + k);
    if (el) cfg[k] = !!el.checked;
  });
  closeModal();
  showToast('Мэдэгдлийн тохиргоо хадгалагдлаа', 'success', { duration: 1500 });
  if (currentScreen === 'saved' || currentScreen === 'alerts') {
    renderAppScreen(currentScreen);
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.saveListingNotify = saveListingNotify;

/* Per-search notification modal */
function openSearchNotifyModal(searchId) {
  const s = SAVED_SEARCHES.find((x) => x.id === searchId);
  if (!s) return;
  openModal(`
    <div class="p-5 border-b" style="border-color: var(--border);">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-lg">Хайлтын мэдэгдэл</h3>
          <p class="text-xs text-[var(--text-3)] mt-0.5">${s.name}</p>
        </div>
        <button onclick="closeModal()" class="text-[var(--text-3)] hover:text-[var(--text)]"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
    </div>
    <div class="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">МЭДЭГДЭЛ ХҮЛЭЭН АВАХ СУВАГ</div>
        <div class="space-y-2">
          ${[
            ['push', 'App push', 'smartphone'],
            ['email', 'И-мэйл', 'mail'],
            ['sms', 'SMS', 'message-square'],
          ]
            .map(
              ([k, label, ic]) => `
            <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style="background: var(--surface-2);">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background: var(--surface); color: var(--gold-brand)"><i data-lucide="${ic}" class="w-4 h-4"></i></div>
              <span class="text-sm font-medium flex-1">${label}</span>
              <input type="checkbox" id="sn-${k}" ${s[k] ? 'checked' : ''} class="accent-[var(--gold-brand)] w-4 h-4" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">МЭДЭГДЛИЙН ДАВТАМЖ</div>
        <div class="grid grid-cols-3 gap-2">
          ${[
            ['instant', 'Тэр даруй', 'zap'],
            ['daily', 'Өдөрт нэг', 'sun'],
            ['weekly', '7 хоногт', 'calendar'],
          ]
            .map(
              ([k, l, ic]) => `
            <button onclick="document.querySelectorAll('[data-sn-freq]').forEach(b=>b.classList.remove('active')); this.classList.add('active');" data-sn-freq="${k}" class="bm-chip ${s.alertFreq === k ? 'active' : ''}" style="${s.alertFreq === k ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}"><i data-lucide="${ic}" class="w-3 h-3 inline"></i> ${l}</button>
          `,
            )
            .join('')}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">ЯМАР ТОХИОЛДОЛД МЭДЭГДЭХ ВЭ?</div>
        <div class="space-y-1.5">
          ${[
            ['onNew', 'Шинэ зар нэмэгдэхэд', 'plus-circle'],
            ['onDrop', 'Хайлтын доторх зарын үнэ буурахад', 'trending-down'],
            ['onPriceFit', 'Миний үнийн хязгаарт орох зар гарахад', 'target'],
          ]
            .map(
              ([k, l, ic]) => `
            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
              <i data-lucide="${ic}" class="w-4 h-4 shrink-0" style="color: var(--gold-brand)"></i>
              <span class="text-sm flex-1">${l}</span>
              <input type="checkbox" id="sn-${k}" ${(k === 'onNew' ? s[k] !== false : !!s[k]) ? 'checked' : ''} class="accent-[var(--gold-brand)]" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="p-4 flex gap-2 justify-end" style="border-top: 1px solid var(--border); background: var(--surface-2);">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="saveSearchNotify(${searchId})" class="btn btn-cta"><i data-lucide="check" class="w-4 h-4"></i> Хадгалах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}
window.openSearchNotifyModal = openSearchNotifyModal;

function saveSearchNotify(id) {
  const s = SAVED_SEARCHES.find((x) => x.id === id);
  if (!s) return;
  ['push', 'email', 'sms'].forEach((k) => {
    const el = document.getElementById('sn-' + k);
    if (el) s[k] = !!el.checked;
  });
  ['onNew', 'onDrop', 'onPriceFit'].forEach((k) => {
    const el = document.getElementById('sn-' + k);
    if (el) s[k] = !!el.checked;
  });
  const freq = document.querySelector('[data-sn-freq].active');
  if (freq) s.alertFreq = freq.dataset.snFreq;
  closeModal();
  showToast('Хайлтын мэдэгдэл шинэчлэгдлээ', 'success', { duration: 1500 });
  if (currentScreen === 'saved' || currentScreen === 'alerts') {
    renderAppScreen(currentScreen);
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.saveSearchNotify = saveSearchNotify;

/* ============== AUTH ============== */
function renderAuth() {
  const phoneVal = state.authPhoneDraft != null && state.authPhoneDraft !== '' ? state.authPhoneDraft : '';
  return `
    <div class="max-w-md mx-auto px-4 py-12">
      <h1 class="text-2xl font-semibold mb-1 text-center">Нэвтрэх</h1>
      <p class="text-sm text-[var(--text-3)] mb-6 text-center">Утасны дугаараараа</p>
      <div class="card p-6">
        <label class="text-xs font-medium text-[var(--text-2)] mb-1.5 block">Утасны дугаар</label>
        <input id="auth-phone-input" class="input mb-1" placeholder="+976 9911 5544" value="${phoneVal}"
          oninput="state.authPhoneDraft = this.value; document.getElementById('auth-phone-err').textContent='';" />
        <div id="auth-phone-err" class="text-xs text-[var(--danger,#9B2C2C)] mb-3 min-h-[16px]"></div>
        <button onclick="requestOtp()" class="btn btn-cta w-full">SMS код илгээх</button>
        <p class="text-[11px] text-[var(--text-3)] mt-3 text-center">Жишээ: +976 9911 5544</p>
      </div>
    </div>
  `;
}

/* Утасны дугаарыг шалгаж OTP modal нээх */
function requestOtp() {
  const raw = (state.authPhoneDraft || '').trim();
  const errEl = document.getElementById('auth-phone-err');
  // Зөвхөн тоо болон + үлдээгээд шалгая
  const digits = raw.replace(/[^\d]/g, '');
  // +976-тай эсвэл 8 оронтой Монгол утасны дугаар хүлээн авна
  const okMN = /^\+?976\d{8}$/.test(digits) || /^\d{8}$/.test(digits);
  if (!raw) {
    if (errEl) errEl.textContent = 'Утасны дугаараа оруулна уу';
    return;
  }
  if (!okMN) {
    if (errEl) errEl.textContent = 'Зөв формат: +976 XXXX XXXX эсвэл 8 оронтой дугаар';
    return;
  }
  // Хадгалаад OTP modal-ыг гаргая
  const normalized = digits.startsWith('976') ? '+' + digits : '+976' + digits;
  state.authPhoneDraft = normalized;
  showOtpStep();
}
window.requestOtp = requestOtp;

/* ============== NEWS (Мэдээ мэдээлэл) ============== */
const NEWS_ITEMS = [
  {
    id: 1,
    cat: 'Зах зээл',
    title: 'УБ-ын орон сууцны үнэ 2026 оны эхний хагаст 4.2%-аар өслөө',
    summary:
      'Хан-Уул, Сүхбаатар дүүргийн premium хороололууд үнийн өсөлтийг тэргүүлж байна. Мэргэжилтнүүд хэрэглэгчдийн эрэлт тогтворжсон гэж дүгнэв.',
    date: '2026-05-22',
    readMin: 5,
    hot: true,
    img: 'orloo-3-0',
  },
  {
    id: 2,
    cat: 'Ипотек',
    title: 'Хаан банк ипотекийн хүүгээ 11.5%-аар бууруулав',
    summary:
      'Шинэ ипотекийн хөтөлбөрийн хүрээнд эхний удаа орон сууц авч буй харилцагчдад тусгай хүү санал болгож байна.',
    date: '2026-05-20',
    readMin: 3,
    img: 'orloo-5-0',
  },
  {
    id: 3,
    cat: 'Шинэ төсөл',
    title: 'Зайсангийн район дахь "Sky Garden" төсөл худалдаалалт нээгдлээ',
    summary: '24 давхар, 280 айлын байр. Дотоод усан сан, fitness, podzemny зогсоолтой premium хороолол.',
    date: '2026-05-18',
    readMin: 4,
    img: 'orloo-11-0',
  },
  {
    id: 4,
    cat: 'Хууль эрх зүй',
    title: 'Үл хөдлөх хөрөнгийн татварын шинэчилсэн журам',
    summary: '2026 оны 6-р сараас хэрэгжих татварын журам. Эзэмшигч нарт ямар нөлөө үзүүлэх вэ.',
    date: '2026-05-15',
    readMin: 7,
    img: 'orloo-7-0',
  },
  {
    id: 5,
    cat: 'Зөвлөгөө',
    title: 'Анх удаа сууц авч байна уу — 7 алхамт зөвлөмж',
    summary: 'Зээл, гэрээ, шалгах зүйлсээс эхлээд төлбөрийн төлөвлөгөө хүртэл бүх алхамын товч.',
    date: '2026-05-12',
    readMin: 6,
    img: 'orloo-1-0',
  },
];

function renderNews() {
  const featured = NEWS_ITEMS[0];
  const rest = NEWS_ITEMS.slice(1);
  return `
    <div class="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <div class="flex items-end justify-between mb-5">
        <div>
          <h1 class="text-2xl font-semibold mb-1">Мэдээ, мэдээлэл</h1>
          <p class="text-sm text-[var(--text-3)]">Үл хөдлөхийн зах зээл, ипотек, шинэ төслүүд</p>
        </div>
        <div class="hidden sm:flex gap-2">
          ${['Бүгд', 'Зах зээл', 'Ипотек', 'Шинэ төсөл', 'Зөвлөгөө'].map((t, i) => `<button class="bm-chip ${i === 0 ? 'active' : ''}" ${i === 0 ? 'style="border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);"' : ''}>${t}</button>`).join('')}
        </div>
      </div>

      <a class="card overflow-hidden mb-6 cursor-pointer hover:border-[var(--gold-brand)] transition block">
        <div class="grid md:grid-cols-2 gap-0">
          <div class="aspect-[16/10] md:aspect-auto bg-cover bg-center" style="background-image:url('https://picsum.photos/seed/${featured.img}/1200/800')"></div>
          <div class="p-6 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-2">
              <span class="pill pill-hot">${featured.cat}</span>
              ${featured.hot ? '<span class="pill pill-new">Онцлох</span>' : ''}
            </div>
            <h2 class="text-xl lg:text-2xl font-semibold leading-snug mb-2">${featured.title}</h2>
            <p class="text-sm text-[var(--text-2)] mb-4">${featured.summary}</p>
            <div class="text-xs text-[var(--text-3)]">${featured.date} · ${featured.readMin} мин уншина</div>
          </div>
        </div>
      </a>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${rest
          .map(
            (n) => `
          <a class="card overflow-hidden cursor-pointer hover:border-[var(--gold-brand)] transition block">
            <div class="aspect-[16/10] bg-cover bg-center" style="background-image:url('https://picsum.photos/seed/${n.img}/800/500')"></div>
            <div class="p-4">
              <div class="flex items-center gap-2 mb-2"><span class="pill pill-info">${n.cat}</span></div>
              <h3 class="font-semibold text-sm leading-snug mb-1.5">${n.title}</h3>
              <p class="text-xs text-[var(--text-3)] line-clamp-2 mb-2">${n.summary}</p>
              <div class="text-[11px] text-[var(--text-3)]">${n.date} · ${n.readMin} мин</div>
            </div>
          </a>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
}

/* ============== RENTAL MANAGEMENT (Түрээсийн менежмент) ============== */
const RM_TENANTS = [
  {
    id: 1,
    name: 'Бат-Эрдэнэ Б.',
    listingId: 1,
    since: '2025-09-01',
    monthly: 1800000,
    paidUntil: '2026-06-01',
    status: 'good',
    phone: '+976 9911 8800',
  },
  {
    id: 2,
    name: 'Сараа Д.',
    listingId: 2,
    since: '2025-11-15',
    monthly: 1450000,
    paidUntil: '2026-05-15',
    status: 'pending',
    phone: '+976 9911 8801',
  },
  {
    id: 3,
    name: 'Тэмүүлэн О.',
    listingId: 5,
    since: '2026-02-01',
    monthly: 1100000,
    paidUntil: '2026-05-01',
    status: 'late',
    phone: '+976 9911 8802',
  },
];
const RM_CONTRACTS = [
  {
    id: 1,
    listingId: 1,
    tenant: 'Бат-Эрдэнэ Б.',
    from: '2025-09-01',
    to: '2026-09-01',
    monthly: 1800000,
    deposit: 3600000,
    status: 'active',
  },
  {
    id: 2,
    listingId: 2,
    tenant: 'Сараа Д.',
    from: '2025-11-15',
    to: '2026-11-15',
    monthly: 1450000,
    deposit: 2900000,
    status: 'active',
  },
  {
    id: 3,
    listingId: 5,
    tenant: 'Тэмүүлэн О.',
    from: '2026-02-01',
    to: '2026-08-01',
    monthly: 1100000,
    deposit: 2200000,
    status: 'expiring',
  },
];
const RM_INCOME_MONTHS = [
  { month: '12-р сар', amount: 4350000 },
  { month: '1-р сар', amount: 4350000 },
  { month: '2-р сар', amount: 5450000 },
  { month: '3-р сар', amount: 5450000 },
  { month: '4-р сар', amount: 6800000 },
  { month: '5-р сар', amount: 7650000 },
];

function renderRentalMgmt() {
  const tab = state.rentalMgmtTab || 'overview';
  return `
    <div class="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <div class="flex items-start justify-between mb-5">
        <div>
          <h1 class="text-2xl font-semibold mb-1">Түрээсийн менежмент</h1>
          <p class="text-sm text-[var(--text-3)]">Та түрээслүүлж буй үл хөдлөх хөрөнгөө нэг дороос удирдана</p>
        </div>
        <button onclick="goTo('list-property')" class="btn btn-cta"><i data-lucide="plus" class="w-4 h-4"></i> Шинэ зар</button>
      </div>

      <div class="flex items-center gap-1 mb-5 p-1 rounded-lg overflow-x-auto" style="background: var(--surface-2); border: 1px solid var(--border); width: fit-content;">
        ${[
          ['overview', 'Тойм', 'layout-dashboard'],
          ['properties', 'Зарууд', 'building-2'],
          ['tenants', 'Түрээслэгчид', 'users'],
          ['contracts', 'Гэрээ', 'file-text'],
          ['income', 'Орлого', 'banknote'],
        ]
          .map(
            ([k, l, ic]) => `
          <button onclick="setRentalTab('${k}')" class="px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap" style="${tab === k ? 'background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm);' : 'color: var(--text-2);'}">
            <i data-lucide="${ic}" class="w-3.5 h-3.5 inline mr-1"></i>${l}
          </button>
        `,
          )
          .join('')}
      </div>

      ${tab === 'overview' ? renderRMOverview() : ''}
      ${tab === 'properties' ? renderRMProperties() : ''}
      ${tab === 'tenants' ? renderRMTenants() : ''}
      ${tab === 'contracts' ? renderRMContracts() : ''}
      ${tab === 'income' ? renderRMIncome() : ''}
    </div>
  `;
}
window.setRentalTab = function (t) {
  state.rentalMgmtTab = t;
  if (currentScreen === 'rental-mgmt') {
    renderAppScreen('rental-mgmt');
    setTimeout(() => lucide.createIcons(), 0);
  }
};

function renderRMOverview() {
  return `
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      ${[
        ['home', 'Идэвхтэй зар', '3', 'Сүүлийн 30 хоног', 'primary'],
        ['users', 'Түрээслэгч', '3', 'Гэрээтэй', 'success'],
        ['banknote', 'Энэ сарын орлого', '7.65сая ₮', '+12.5%', 'gold'],
        ['alert-circle', 'Анхаарах', '2', 'Хугацаа дуусаж байна', 'warning'],
      ]
        .map(
          ([ic, label, val, sub, col]) => `
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: var(--primary-soft); color: var(--primary);"><i data-lucide="${ic}" class="w-4 h-4"></i></div>
          </div>
          <div class="num text-2xl font-semibold">${val}</div>
          <div class="text-xs text-[var(--text-3)] mt-0.5">${label}</div>
          <div class="text-[11px] mt-1" style="color: var(--${col === 'success' ? 'success' : col === 'warning' ? 'warning' : col === 'gold' ? 'gold' : 'text-3'});">${sub}</div>
        </div>
      `,
        )
        .join('')}
    </div>

    <div class="grid lg:grid-cols-3 gap-4">
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div class="font-semibold">Сүүлийн үйл явдал</div>
          <button onclick="setRentalTab('income')" class="text-xs" style="color: var(--gold-brand);">Орлогын дэлгэрэнгүй</button>
        </div>
        <div class="space-y-3">
          ${[
            ['banknote', 'Бат-Эрдэнэ — 5-р сарын түрээс төлсөн', '+1,800,000₮', 'өнөөдөр', 'success'],
            ['user-plus', 'Сараа — гэрээ шинэчиллээ', '12 сар', 'өчигдөр', 'primary'],
            ['alert-triangle', 'Тэмүүлэн — төлбөр хугацаа хэтэрлээ', '-1,100,000₮', '3 хоног', 'danger'],
            ['eye', 'Encanto 12/16 — 24 шинэ үзэлт', '+24', '7 хоног', 'text-3'],
          ]
            .map(
              ([ic, t, sub, d, col]) => `
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background: var(--surface-2); color: var(--${col === 'text-3' ? 'text-2' : col});"><i data-lucide="${ic}" class="w-4 h-4"></i></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">${t}</div>
                <div class="text-[11px]" style="color: var(--text-3);">${d}</div>
              </div>
              <div class="num text-sm font-semibold whitespace-nowrap" style="color: var(--${col === 'text-3' ? 'text-2' : col});">${sub}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>

      <div class="card p-5">
        <div class="font-semibold mb-3">Төлбөрийн төлөв</div>
        <div class="space-y-3">
          ${RM_TENANTS.map((t) => {
            const l = getListing(t.listingId);
            const col = t.status === 'good' ? 'success' : t.status === 'pending' ? 'warning' : 'danger';
            const label =
              t.status === 'good' ? 'Төлсөн' : t.status === 'pending' ? 'Хүлээгдэж буй' : 'Хугацаа хэтэрсэн';
            return `<div class="flex items-start gap-2 text-sm">
              <span class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background: var(--${col})"></span>
              <div class="flex-1">
                <div class="font-medium text-xs">${l.khotkhon}</div>
                <div class="text-[11px]" style="color: var(--text-3);">${label} · ${t.paidUntil}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card p-5 lg:col-span-3">
        <div class="font-semibold mb-3">Хурдан үйлдэл</div>
        <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
          ${[
            ['file-text', 'Гэрээ үүсгэх', 'contracts'],
            ['receipt', 'Тооцоо/нэхэмжлэх', 'income'],
            ['wrench', 'Засвар үйлчилгээ', null],
            ['message-square', 'Түрээслэгчтэй холбоо', 'tenants'],
          ]
            .map(
              ([ic, l, t]) =>
                `<button onclick="${t ? `setRentalTab('${t}')` : `showToast('Удахгүй','info')`}" class="card p-3 text-left flex items-center gap-2 hover:border-[var(--gold-brand)]"><i data-lucide="${ic}" class="w-4 h-4" style="color: var(--gold-brand)"></i><span class="text-sm">${l}</span></button>`,
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function renderRMProperties() {
  const myListings = LISTINGS.filter((l) => l.mode === 'rent').slice(0, 5);
  return `
    <div class="grid lg:grid-cols-3 gap-4">
      ${myListings
        .map((l) => {
          const tenant = RM_TENANTS.find((t) => t.listingId === l.id);
          return `
          <div class="card overflow-hidden">
            <div class="aspect-[16/10] bg-cover bg-center" style="background-image:url('${photoUrl(l, 0, '600/400')}')"></div>
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="font-semibold text-sm">${l.khotkhon}</div>
                  <div class="text-xs text-[var(--text-3)]">${l.district} · ${l.rooms}ө ${l.area}м²</div>
                </div>
                <span class="pill ${tenant ? 'pill-new' : 'pill-gold'}">${tenant ? 'Түрээслэгчтэй' : 'Сул'}</span>
              </div>
              <div class="num text-sm font-semibold mb-2" style="color: var(--gold-brand)">${listingPriceShort(l)}</div>
              ${tenant ? `<div class="text-[11px]" style="color: var(--text-3)">Түрээслэгч: ${tenant.name}</div>` : ''}
              <div class="flex gap-1.5 mt-3">
                <button onclick="openProperty(${l.id})" class="btn btn-secondary !text-xs !py-1.5 flex-1">Зар харах</button>
                <button class="btn btn-ghost !text-xs !py-1.5"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
                <button class="btn btn-ghost !text-xs !py-1.5"><i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i></button>
              </div>
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
}

function renderRMTenants() {
  return `
    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead style="background: var(--surface-2);">
          <tr>
            <th class="text-left p-3 text-xs font-semibold" style="color: var(--text-3)">Түрээслэгч</th>
            <th class="text-left p-3 text-xs font-semibold" style="color: var(--text-3)">Объект</th>
            <th class="text-left p-3 text-xs font-semibold" style="color: var(--text-3)">Эхэлсэн</th>
            <th class="text-right p-3 text-xs font-semibold" style="color: var(--text-3)">Сарын түрээс</th>
            <th class="text-left p-3 text-xs font-semibold" style="color: var(--text-3)">Төлөв</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody>
          ${RM_TENANTS.map((t) => {
            const l = getListing(t.listingId);
            const col = t.status === 'good' ? 'success' : t.status === 'pending' ? 'warning' : 'danger';
            const label =
              t.status === 'good' ? 'Идэвхтэй' : t.status === 'pending' ? 'Төлбөр хүлээж буй' : 'Хугацаа хэтэрсэн';
            return `<tr style="border-top: 1px solid var(--border);">
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style="background: linear-gradient(135deg, var(--navy), var(--navy-deep));">${t.name.slice(0, 1)}</div>
                  <div>
                    <div class="font-medium text-xs">${t.name}</div>
                    <div class="text-[10px]" style="color: var(--text-3)">${t.phone}</div>
                  </div>
                </div>
              </td>
              <td class="p-3 text-xs">${l.khotkhon}</td>
              <td class="p-3 text-xs">${t.since}</td>
              <td class="p-3 text-right num text-xs font-semibold">${t.monthly.toLocaleString('en-US')}₮</td>
              <td class="p-3"><span class="pill" style="background: var(--${col})20; color: var(--${col})">${label}</span></td>
              <td class="p-3 text-right"><button class="btn btn-ghost !text-xs !py-1.5"><i data-lucide="more-horizontal" class="w-3.5 h-3.5"></i></button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRMContracts() {
  return `
    <div class="space-y-3">
      ${RM_CONTRACTS.map((c) => {
        const l = getListing(c.listingId);
        const expiring = c.status === 'expiring';
        return `
          <div class="card p-4 flex items-center gap-4" style="${expiring ? 'border-color: var(--warning);' : ''}">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style="background: var(--primary-soft); color: var(--primary);"><i data-lucide="file-text" class="w-5 h-5"></i></div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${l.khotkhon} — ${c.tenant}</div>
              <div class="text-xs mt-0.5" style="color: var(--text-3);">${c.from} → ${c.to} · Депозит ${fmtCompact(c.deposit)}</div>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="pill ${expiring ? 'pill-hot' : 'pill-new'}">${expiring ? 'Хугацаа дуусахад ойртсон' : 'Идэвхтэй'}</span>
                <span class="num text-[11px]" style="color: var(--text-2)">${c.monthly.toLocaleString('en-US')}₮/сар</span>
              </div>
            </div>
            <div class="flex gap-1.5">
              <button class="btn btn-secondary !text-xs !py-2"><i data-lucide="download" class="w-3.5 h-3.5"></i> PDF</button>
              <button class="btn btn-ghost !text-xs !py-2"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
            </div>
          </div>
        `;
      }).join('')}
      <button class="card p-4 w-full flex items-center justify-center gap-2 text-sm hover:border-[var(--gold-brand)]" style="border-style: dashed;"><i data-lucide="plus" class="w-4 h-4"></i> Шинэ гэрээ үүсгэх</button>
    </div>
  `;
}

function renderRMIncome() {
  const max = Math.max(...RM_INCOME_MONTHS.map((m) => m.amount));
  const total = RM_INCOME_MONTHS.reduce((s, m) => s + m.amount, 0);
  return `
    <div class="card p-5 mb-4">
      <div class="flex items-end justify-between mb-4">
        <div>
          <div class="text-xs" style="color: var(--text-3)">Сүүлийн 6 сарын нийт орлого</div>
          <div class="num text-3xl font-semibold mt-1">${total.toLocaleString('en-US')}₮</div>
        </div>
        <div class="text-right">
          <div class="text-xs" style="color: var(--text-3)">Энэ сар</div>
          <div class="num text-lg font-semibold" style="color: var(--success)">+12.5%</div>
        </div>
      </div>
      <div class="flex items-end gap-2 h-32">
        ${RM_INCOME_MONTHS.map((m) => {
          const h = (m.amount / max) * 100;
          return `<div class="flex-1 flex flex-col items-center gap-1.5">
            <div class="num text-[10px]" style="color: var(--text-3)">${(m.amount / 1000000).toFixed(1)}M</div>
            <div class="w-full rounded-t" style="height: ${h}%; background: linear-gradient(180deg, var(--gold-brand), var(--primary-dark));"></div>
            <div class="text-[10px]" style="color: var(--text-3)">${m.month}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="card p-5">
      <div class="font-semibold mb-3">Сүүлийн төлбөрүүд</div>
      <div class="space-y-2">
        ${RM_TENANTS.map((t) => {
          const l = getListing(t.listingId);
          const col = t.status === 'good' ? 'success' : t.status === 'pending' ? 'warning' : 'danger';
          return `<div class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)]">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background: var(--${col})20; color: var(--${col})"><i data-lucide="receipt" class="w-4 h-4"></i></div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">${l.khotkhon} — ${t.name}</div>
              <div class="text-[11px]" style="color: var(--text-3)">${t.paidUntil} хүртэл</div>
            </div>
            <div class="num text-sm font-semibold">${t.monthly.toLocaleString('en-US')}₮</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

/* ============== LIST PROPERTY (Зар оруулах) — Multi-step wizard ============== */
function defaultListPropLocation(district) {
  const sameDistrict = LISTINGS.filter((l) => l.district === district);
  if (sameDistrict.length) {
    return {
      lat: sameDistrict.reduce((s, l) => s + l.lat, 0) / sameDistrict.length,
      lng: sameDistrict.reduce((s, l) => s + l.lng, 0) / sameDistrict.length,
    };
  }
  const zone = DISTRICT_ZONES.find((z) => z.name === district);
  if (zone) return { lat: zone.label.x / 100, lng: zone.label.y / 100 };
  return { lat: 0.5, lng: 0.5 };
}

function ensureListPropDraft() {
  if (!state.listPropDraft) {
    const loc = defaultListPropLocation(DISTRICTS[0]);
    state.listPropDraft = {
      propertyType: PROPERTY_TYPES[0].label,
      district: DISTRICTS[0],
      khotkhon: '',
      khoroo: '',
      rooms: null,
      area: '',
      floor: '',
      year: '',
      desc: '',
      photos: [],
      price: '',
      deposit: '',
      contractMonths: '1 жил',
      negotiable: 'Тийм',
      mortgage: 'Тийм — банктай хамтарсан',
      features: [],
      roomDetails: [],
      lat: loc.lat,
      lng: loc.lng,
      locationTouched: false,
    };
  }
  if (!state.listPropDraft.roomDetails) state.listPropDraft.roomDetails = [];
  return state.listPropDraft;
}

/* ============== ӨРӨӨНИЙ ДЭЛГЭРЭНГҮЙ (Sheet "өрөө") ============== */
function makeRoomDraft(typeKey) {
  const rt = (typeof ROOM_TYPES !== 'undefined' ? ROOM_TYPES : []).find((x) => x.key === typeKey) || (ROOM_TYPES || [])[4];
  return {
    id: 'rm-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    typeKey: rt ? rt.key : 'living',
    floor: '',
    area: '',
    desc: '',
    tags: [],
    windows: (typeof WIND_DIRECTIONS !== 'undefined' ? WIND_DIRECTIONS : []).reduce((a, w) => {
      a[w.key] = 0;
      return a;
    }, {}),
  };
}

function getRoomTypeMeta(typeKey) {
  return (typeof ROOM_TYPES !== 'undefined' ? ROOM_TYPES : []).find((x) => x.key === typeKey) || null;
}

function getRoomTags(typeKey) {
  const rt = getRoomTypeMeta(typeKey);
  const group = rt ? rt.tagGroup : 'generic';
  return (typeof ROOM_TAGS_BY_TYPE !== 'undefined' ? ROOM_TAGS_BY_TYPE[group] : null) || ROOM_TAGS_BY_TYPE.generic;
}

function renderListPropRoomsTable(d) {
  // Smart wizard schema: d.propertyType key + d.specs.rooms + lpNeedsRooms
  if (typeof lpNeedsRooms === 'function' && !lpNeedsRooms(d)) return '';
  const roomsCount = (d.specs && parseInt(d.specs.rooms, 10)) || d.rooms || 0;
  if (!roomsCount) return '';
  const rooms = d.roomDetails || [];
  const editingId = state.listPropEditingRoomId || null;

  return `
    <div class="card p-5 mb-4">
      <div class="flex items-center justify-between gap-2 mb-3">
        <div class="font-semibold flex items-center gap-2">
          <i data-lucide="layout-dashboard" class="w-4 h-4" style="color: var(--gold-brand)"></i>
          Өрөөний мэдээлэл
          <span class="text-xs font-normal" style="color: var(--text-3)">(${rooms.length} нэмсэн)</span>
        </div>
        <button type="button" onclick="openAddRoomMenu()" class="btn btn-secondary" style="padding:6px 12px; font-size:12.5px;">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> Өрөө нэмэх
        </button>
      </div>
      ${
        rooms.length === 0
          ? `
        <div class="text-center py-6 px-4 rounded-lg" style="background: var(--surface-2); border: 1px dashed var(--border-strong);">
          <i data-lucide="door-open" class="w-7 h-7 mx-auto mb-2" style="color: var(--text-3)"></i>
          <div class="text-sm font-semibold mb-1">Өрөө бүрийн мэдээлэл нэмэх</div>
          <div class="text-[11.5px]" style="color: var(--text-3)">Доторх давхар, өрөөний нэр, талбай, тайлбар, цонхны байрлал болон tag-уудыг тэмдэглэнэ.</div>
        </div>
      `
          : `
        <div class="grid gap-2">
          ${rooms
            .map((r, idx) => {
              const meta = getRoomTypeMeta(r.typeKey);
              const isEditing = editingId === r.id;
              const winSum = Object.values(r.windows || {}).reduce((a, n) => a + (Number(n) || 0), 0);
              return `
              <div class="rounded-lg" style="border: 1.5px solid ${isEditing ? 'var(--gold-brand)' : 'var(--border)'}; background: ${isEditing ? 'var(--gold-soft)' : 'var(--surface)'};">
                <div class="flex items-center gap-2 p-3">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background: var(--primary-soft); color: var(--primary)">
                    <i data-lucide="square" class="w-4 h-4"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm truncate">${meta ? meta.label : 'Өрөө'}</div>
                    <div class="text-[11.5px] flex flex-wrap gap-x-2 gap-y-0.5" style="color: var(--text-3)">
                      ${r.area ? `<span><i data-lucide="ruler" class="w-3 h-3 inline" style="margin-right:2px"></i>${r.area} м²</span>` : ''}
                      ${r.floor ? `<span><i data-lucide="layers-3" class="w-3 h-3 inline" style="margin-right:2px"></i>${lpEsc(r.floor)}</span>` : ''}
                      ${winSum > 0 ? `<span><i data-lucide="square-asterisk" class="w-3 h-3 inline" style="margin-right:2px"></i>${winSum} цонх</span>` : ''}
                      ${(r.tags || []).length ? `<span><i data-lucide="tag" class="w-3 h-3 inline" style="margin-right:2px"></i>${(r.tags || []).slice(0, 2).join(', ')}${(r.tags || []).length > 2 ? '...' : ''}</span>` : ''}
                    </div>
                  </div>
                  <button type="button" onclick="editRoom('${r.id}')" class="btn btn-ghost" style="padding:6px 10px" title="Засах"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
                  <button type="button" onclick="removeRoom('${r.id}')" class="btn btn-ghost" style="padding:6px 10px; color: var(--danger)" title="Устгах"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
                ${isEditing ? renderRoomEditor(r, idx) : ''}
              </div>
            `;
            })
            .join('')}
        </div>
      `
      }
    </div>
  `;
}

function renderRoomEditor(r) {
  const meta = getRoomTypeMeta(r.typeKey);
  const tags = getRoomTags(r.typeKey);
  const directions = typeof WIND_DIRECTIONS !== 'undefined' ? WIND_DIRECTIONS : [];
  const draft = ensureListPropDraft();
  const basement = parseInt(draft.address.floorBasement, 10) || 0;
  const above = Math.max(1, parseInt(draft.address.floorAbove, 10) || 1);
  const floorChoices = Array.from({ length: basement }, (_, i) => `B${basement - i}`).concat(Array.from({ length: Math.min(above, 60) }, (_, i) => `F${String(i + 1).padStart(2, '0')}`));
  return `
    <div class="p-4 border-t" style="border-color: var(--border);">
      <div class="grid sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label class="text-xs text-[var(--text-3)] mb-1 block">Доторх давхар <span style="color: var(--danger)">*</span></label>
          <select class="input" onchange="updateRoom('${r.id}', 'floor', this.value)">
            <option value="" ${!r.floor ? 'selected' : ''}>Сонгох</option>
            ${floorChoices.map((x) => `<option value="${lpEsc(x)}" ${r.floor === x ? 'selected' : ''}>${lpEsc(x)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-[var(--text-3)] mb-1 block">Өрөөний нэр <span style="color: var(--danger)">*</span></label>
          <select class="input" onchange="updateRoom('${r.id}', 'typeKey', this.value)">
            ${(ROOM_TYPES || []).map((rt) => `<option value="${rt.key}" ${r.typeKey === rt.key ? 'selected' : ''}>${rt.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-[var(--text-3)] mb-1 block">Талбай (м²)</label>
          <input class="input num" type="number" step="0.1" min="0" placeholder="0" value="${r.area || ''}" oninput="updateRoom('${r.id}', 'area', this.value)" />
        </div>
      </div>

      <div class="mb-3">
        <label class="text-xs text-[var(--text-3)] mb-1 block">Tag-ууд</label>
        <div class="flex flex-wrap gap-1.5">
          ${tags.length ? tags
            .map((t) => {
              const on = (r.tags || []).includes(t);
              return `
              <button type="button" onclick="toggleRoomTag('${r.id}', '${t.replace(/'/g, "\\'")}')"
                style="padding:6px 11px; border-radius: 999px; border: 1.5px solid ${on ? 'var(--gold-brand)' : 'var(--border)'}; background: ${on ? 'rgba(201,162,39,.12)' : 'var(--surface-2)'}; color: var(--text); font-size: 12px; font-weight: ${on ? 700 : 500};">
                ${on ? '<i data-lucide="check" class="w-3 h-3 inline" style="margin-right:3px; color: var(--gold-brand)"></i>' : ''}${t}
              </button>
            `;
            })
            .join('') : `<span class="text-[11px]" style="color: var(--text-3);">Энэ өрөөнд тусгай tag заагаагүй.</span>`}
        </div>
      </div>

      <div class="mb-3">
        <label class="text-xs text-[var(--text-3)] mb-1 block">Цонхны байрлал ба тоо</label>
        <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
          ${directions
            .map(
              (w) => `
            <div class="flex flex-col items-center gap-1 p-2 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border);">
              <div class="text-[11px] font-bold" title="${w.label}">${w.short}</div>
              <div class="lp-window-stepper compact">
                <button type="button" class="lp-window-step-btn" onclick="adjustRoomWindow('${lpJS(r.id)}', '${lpJS(w.key)}', -1)" ${(Number(r.windows[w.key]) || 0) <= 0 ? 'disabled' : ''} title="${lpEsc(w.label)} -1" aria-label="${lpEsc(w.label)} цонх хасах"><i data-lucide="minus" class="w-3 h-3"></i></button>
                <input class="lp-window-value num" type="number" inputmode="numeric" min="0" max="99" step="1" value="${r.windows[w.key] || 0}" onfocus="this.select()" onchange="updateRoomWindow('${lpJS(r.id)}', '${lpJS(w.key)}', this.value)" aria-label="${lpEsc(w.label)} харсан цонхны тоо" />
                <button type="button" class="lp-window-step-btn primary" onclick="adjustRoomWindow('${lpJS(r.id)}', '${lpJS(w.key)}', 1)" title="${lpEsc(w.label)} +1" aria-label="${lpEsc(w.label)} цонх нэмэх"><i data-lucide="plus" class="w-3 h-3"></i></button>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
        <div class="text-[11px] mt-1.5" style="color: var(--text-3)">
          <i data-lucide="compass" class="w-3 h-3 inline" style="color: var(--gold-brand)"></i>
          З=Зүүн · ЗУ=Зүүн-урагш · У=Урд · БУ=Баруун-урагш · Б=Баруун · БХ=Баруун-хойш · Х=Хойд · ЗХ=Зүүн-хойш
        </div>
      </div>

      <div class="mb-3">
        <label class="text-xs text-[var(--text-3)] mb-1 block">Тайлбар</label>
        <textarea class="input" rows="2" placeholder="Тагт нь зүүн талд, хана нь өндөр шилтэй... г.м." oninput="updateRoom('${r.id}', 'desc', this.value)">${r.desc || ''}</textarea>
      </div>

      <div class="flex justify-end">
        <button type="button" onclick="closeRoomEditor()" class="btn btn-primary" style="padding:7px 16px; font-size:13px;">
          <i data-lucide="check" class="w-3.5 h-3.5"></i> Дуусгах
        </button>
      </div>
    </div>
  `;
}

window.openAddRoomMenu = function () {
  const d = ensureListPropDraft();
  const rt = ROOM_TYPES;
  const groups = {
    living:   { label: 'Орон сууцны хэсэг', icon: 'sofa' },
    kitchen:  { label: 'Гал тогооны хэсэг', icon: 'utensils-crossed' },
    sleep:    { label: 'Унтлагын хэсэг', icon: 'bed-double' },
    outdoor:  { label: 'Тагт, террас', icon: 'palmtree' },
    utility:  { label: 'Туслах өрөөнүүд', icon: 'wrench' },
    transit:  { label: 'Гарц, шат, коридор', icon: 'milestone' },
    leisure:  { label: 'Чөлөөт цаг', icon: 'wine' },
    service:  { label: 'Үйлчилгээ', icon: 'concierge-bell' },
  };
  const byGroup = {};
  rt.forEach((r) => {
    if (!byGroup[r.group]) byGroup[r.group] = [];
    byGroup[r.group].push(r);
  });
  openModal(
    `
    <div style="padding: 0; width: 100%;">
      <div style="padding: 16px 22px; border-bottom: 1px solid var(--border); display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-size: 11px; color: var(--text-3); font-weight: 600; letter-spacing: .08em; text-transform: uppercase;">Өрөө нэмэх</div>
          <div style="font-size: 16px; font-weight: 700; color: var(--text); margin-top: 2px;">Өрөөнийхөө төрлөөс сонгоно уу</div>
        </div>
        <button onclick="closeModal()" style="color: var(--text-3); padding: 6px;" title="Хаах"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div style="padding: 14px 22px 18px 22px; max-height: 65vh; overflow-y: auto;">
        ${Object.keys(byGroup)
          .map((g) => {
            const meta = groups[g] || { label: g, icon: 'square' };
            return `
            <div style="margin-bottom: 14px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom: 8px;">
                <i data-lucide="${meta.icon}" class="w-4 h-4" style="color: var(--gold-brand)"></i>
                <div style="font-size: 12px; font-weight: 700; color: var(--text-2); letter-spacing: .05em; text-transform: uppercase;">${meta.label}</div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                ${byGroup[g]
                  .map(
                    (r) => `
                  <button onclick="addRoomOfType('${r.key}')" class="text-left" style="padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--surface); font-size: 12.5px; font-weight: 600; color: var(--text); transition: all .15s;" onmouseover="this.style.borderColor='var(--gold-brand)'; this.style.background='var(--gold-soft)'" onmouseout="this.style.borderColor='var(--border)'; this.style.background='var(--surface)'">
                    ${r.label}
                  </button>
                `,
                  )
                  .join('')}
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `,
    'wide',
  );
  setTimeout(() => lucide.createIcons(), 0);
};

function lpRoomsRerender() {
  if (typeof lpPersist === 'function') lpPersist();
  if (typeof rerenderListProp === 'function') {
    rerenderListProp();
  } else {
    renderAppScreen('list-property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}

window.addRoomOfType = function (typeKey) {
  const d = ensureListPropDraft();
  if (!Array.isArray(d.roomDetails)) d.roomDetails = [];
  const room = makeRoomDraft(typeKey);
  d.roomDetails.push(room);
  state.listPropEditingRoomId = room.id;
  closeModal();
  lpRoomsRerender();
};

window.editRoom = function (id) {
  state.listPropEditingRoomId = state.listPropEditingRoomId === id ? null : id;
  lpRoomsRerender();
};

window.closeRoomEditor = function () {
  state.listPropEditingRoomId = null;
  lpRoomsRerender();
};

window.removeRoom = function (id) {
  const d = ensureListPropDraft();
  d.roomDetails = (d.roomDetails || []).filter((r) => r.id !== id);
  if (state.listPropEditingRoomId === id) state.listPropEditingRoomId = null;
  lpRoomsRerender();
};

window.updateRoom = function (id, key, value) {
  const d = ensureListPropDraft();
  const room = (d.roomDetails || []).find((r) => r.id === id);
  if (!room) return;
  if (key === 'typeKey') {
    room.typeKey = value;
    // Tag-уудыг шинэ ангилалд тохируулж шүүх
    const allowed = new Set(getRoomTags(value));
    room.tags = (room.tags || []).filter((t) => allowed.has(t));
    lpRoomsRerender();
  } else {
    room[key] = value;
    if (typeof lpPersist === 'function') lpPersist();
  }
};

window.updateRoomWindow = function (id, dir, value) {
  const d = ensureListPropDraft();
  const room = (d.roomDetails || []).find((r) => r.id === id);
  if (!room) return;
  if (!room.windows) room.windows = {};
  const n = lpClampWindowCount(value);
  room.windows[dir] = n;
  if (typeof lpPersist === 'function') lpPersist();
};

window.adjustRoomWindow = function (id, dir, delta) {
  const d = ensureListPropDraft();
  const room = (d.roomDetails || []).find((r) => r.id === id);
  if (!room) return;
  if (!room.windows) room.windows = {};
  room.windows[dir] = lpClampWindowCount((Number(room.windows[dir]) || 0) + (Number(delta) || 0));
  lpRoomsRerender();
};

window.toggleRoomTag = function (id, tag) {
  const d = ensureListPropDraft();
  const room = (d.roomDetails || []).find((r) => r.id === id);
  if (!room) return;
  const set = new Set(room.tags || []);
  if (set.has(tag)) set.delete(tag);
  else set.add(tag);
  room.tags = [...set];
  lpRoomsRerender();
};

function renderListProperty() {
  const mode = state.listPropMode || 'rent';
  const step = state.listPropStep || 1;
  const isRent = mode === 'rent';
  const d = ensureListPropDraft();
  const photoCount = d.photos.length;
  if (d.lat == null || d.lng == null) {
    const loc = defaultListPropLocation(d.district);
    d.lat = loc.lat;
    d.lng = loc.lng;
  }

  return `
    <div class="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <div class="text-center mb-6">
        <div class="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3" style="background: var(--primary-soft); color: var(--primary);"><i data-lucide="megaphone" class="w-6 h-6"></i></div>
        <h1 class="text-2xl font-semibold mb-1">${isRent ? 'Түрээслүүлье' : 'Худалдуулъя'}</h1>
        <p class="text-sm text-[var(--text-3)]">${isRent ? 'Сар/жилийн түрээсээр гаргахаар бэлдэж байна' : 'Худалдааны зар нийтлэхэд бэлдэж байна'} — ${step}/3 алхам</p>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <button onclick="setListPropMode('sale')" class="card p-4 text-left hover:border-[var(--gold-brand)] transition" style="${!isRent ? 'border-color: var(--gold-brand); background: var(--gold-soft);' : ''}">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style="background: ${!isRent ? 'var(--primary)' : 'var(--primary-soft)'}; color: ${!isRent ? '#0A1F44' : 'var(--primary)'};"><i data-lucide="banknote" class="w-5 h-5"></i></div>
          <div class="font-semibold text-sm mb-0.5">Худалдуулъя</div>
          <div class="text-[11px] text-[var(--text-3)]">Орон сууц, газар, оффис</div>
        </button>
        <button onclick="setListPropMode('rent')" class="card p-4 text-left hover:border-[var(--gold-brand)] transition" style="${isRent ? 'border-color: var(--gold-brand); background: var(--gold-soft);' : ''}">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style="background: ${isRent ? 'var(--primary)' : 'var(--primary-soft)'}; color: ${isRent ? '#0A1F44' : 'var(--primary)'};"><i data-lucide="key" class="w-5 h-5"></i></div>
          <div class="font-semibold text-sm mb-0.5">Түрээслүүлье</div>
          <div class="text-[11px] text-[var(--text-3)]">Сарын болон жилийн</div>
        </button>
      </div>

      <div class="flex items-center gap-2 mb-6">
        ${[1, 2, 3]
          .map(
            (n) => `
          <div class="flex-1 flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style="background: ${n <= step ? 'var(--gold-brand)' : 'var(--surface-2)'}; color: ${n <= step ? '#0A1F44' : 'var(--text-3)'};">${n}</div>
            <div class="text-xs ${n === step ? 'font-semibold' : ''}" style="color: ${n <= step ? 'var(--text)' : 'var(--text-3)'};">${n === 1 ? 'Мэдээлэл' : n === 2 ? 'Зураг' : 'Үнэ ба нөхцөл'}</div>
            ${n < 3 ? `<div class="flex-1 h-px" style="background: ${n < step ? 'var(--gold-brand)' : 'var(--border)'};"></div>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>

      ${
        step === 1
          ? `
        <div class="card p-5 mb-4">
          <div class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="info" class="w-4 h-4" style="color: var(--gold-brand)"></i> Үндсэн мэдээлэл</div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Үл хөдлөх төрөл</label>
              <select class="input" onchange="setListPropField('propertyType', this.value)">${PROPERTY_TYPES.map((p) => `<option ${d.propertyType === p.label ? 'selected' : ''}>${p.label}</option>`).join('')}</select>
            </div>
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Дүүрэг</label>
              <select class="input" onchange="setListPropField('district', this.value)">${DISTRICTS.map((x) => `<option ${d.district === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
            </div>
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Хотхон/хаяг <span style="color: var(--danger)">*</span></label>
              <input class="input" placeholder="Жишээ: Time Tower" value="${d.khotkhon}" oninput="setListPropField('khotkhon', this.value)" />
            </div>
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Хороо</label>
              <input class="input num" placeholder="15" value="${d.khoroo}" oninput="setListPropField('khoroo', this.value)" />
            </div>
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Өрөөний тоо <span style="color: var(--danger)">*</span></label>
              <div class="flex gap-1.5">${[1, 2, 3, 4].map((n) => `<button type="button" onclick="setListPropField('rooms', ${n})" class="bm-chip flex-1" style="${d.rooms === n ? 'background: var(--gold-brand); color: #0A1F44; border-color: var(--gold-brand);' : ''}">${n}${n === 4 ? '+' : ''}</button>`).join('')}</div>
            </div>
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Талбай (м²) <span style="color: var(--danger)">*</span></label>
              <input class="input num" type="number" min="0" placeholder="0" value="${d.area}" oninput="setListPropField('area', this.value)" />
            </div>
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Давхар</label>
              <input class="input" placeholder="8/22" value="${d.floor}" oninput="setListPropField('floor', this.value)" />
            </div>
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">Ашиглалтад орсон он</label>
              <input class="input num" type="number" min="1950" max="2030" placeholder="2020" value="${d.year}" oninput="setListPropField('year', this.value)" />
            </div>
          </div>
          <div class="mt-3">
            <label class="text-xs text-[var(--text-3)] mb-1 block">Тайлбар</label>
            <textarea class="input" rows="3" placeholder="Объектынхоо онцлог давуу талыг товч тайлбарла" oninput="setListPropField('desc', this.value)">${d.desc}</textarea>
          </div>
        </div>
      `
          : ''
      }

      ${
        step === 2
          ? `
        <div class="card p-5 mb-4">
          <div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="image" class="w-4 h-4" style="color: var(--gold-brand)"></i> Зураг (хамгийн багадаа 1) — ${photoCount} нэмсэн</div>
          <button type="button" onclick="addListPropPhoto()" class="w-full border-2 border-dashed rounded-lg p-8 text-center mb-3 hover:border-[var(--gold-brand)] transition" style="border-color: var(--border-strong); color: var(--text-3);">
            <i data-lucide="upload-cloud" class="w-7 h-7 mx-auto mb-2"></i>
            <div class="text-sm">Зураг нэмэх</div>
            <div class="text-[11px] mt-1">Дарж жишээ зураг нэмнэ үү</div>
          </button>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            ${d.photos
              .map(
                (seed, i) => `
              <div class="aspect-square rounded-lg bg-cover bg-center relative" style="background-image:url('https://picsum.photos/seed/${seed}/300/300')">
                ${i === 0 ? '<span class="absolute top-1 left-1 pill pill-gold text-[9px]">Үндсэн</span>' : ''}
                <button type="button" onclick="removeListPropPhoto(${i})" class="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style="background: rgba(15,33,72,.85); color: #fff;"><i data-lucide="x" class="w-3 h-3"></i></button>
              </div>
            `,
              )
              .join('')}
            ${photoCount < 15 ? `<button type="button" onclick="addListPropPhoto()" class="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center" style="border-color: var(--border-strong); color: var(--text-3);"><i data-lucide="plus" class="w-5 h-5"></i></button>` : ''}
          </div>
        </div>
        <div class="card p-5 mb-4">
          <div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4" style="color: var(--gold-brand)"></i> Газрын зурган дээрх байршил</div>
          <div class="rounded-lg overflow-hidden" style="height: 260px; border: 1px solid var(--border); position: relative;">
            ${mapBackground([], { showControls: false, showZoneSummary: false, showContext: false, interactiveZones: false, showMyPlaces: false, style: 'height: 100%; border-radius: 0;' })}
            <div onclick="setListPropLocation(event)" style="position:absolute; inset:0; z-index:80; cursor: crosshair;" title="Газрын зураг дээр дарж тэмдэглэнэ"></div>
            <div style="position:absolute; left:${d.lat * 100}%; top:${d.lng * 100}%; transform: translate(-50%,-100%); z-index:90; pointer-events:none;">
              <div style="background: var(--gold-brand); color:#0A1F44; padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800; box-shadow:0 8px 22px rgba(0,0,0,.35); border:2px solid #fff; display:flex; align-items:center; gap:6px; white-space:nowrap;">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${d.locationTouched ? 'Сонгосон байршил' : d.district}
              </div>
            </div>
            <div style="position:absolute; left:12px; bottom:12px; z-index:91; background:rgba(6,17,43,.88); color:#fff; padding:7px 10px; border-radius:999px; font-size:11px; pointer-events:none;">
              <i data-lucide="hand-pointer" class="w-3 h-3 inline" style="color: var(--gold-brand);"></i> Map дээр дарж pin-ээ шилжүүлнэ
            </div>
          </div>
          <div class="text-[11px] mt-2 flex items-center gap-1.5" style="color: var(--text-3)">
            <i data-lucide="${d.locationTouched ? 'check-circle-2' : 'info'}" class="w-3.5 h-3.5" style="color:${d.locationTouched ? 'var(--success)' : 'var(--text-3)'}"></i>
            ${d.locationTouched ? 'Байршлыг гараар тэмдэглэлээ' : `${d.district} дүүргийн дундаж цэг дээр түр тавьсан. Нарийвчлах бол map дээр дарна уу.`}
          </div>
        </div>
      `
          : ''
      }

      ${
        step === 3
          ? `
        <div class="card p-5 mb-4">
          <div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="banknote" class="w-4 h-4" style="color: var(--gold-brand)"></i> ${isRent ? 'Түрээсийн үнэ' : 'Худалдааны үнэ'}</div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-[var(--text-3)] mb-1 block">${isRent ? 'Сарын түрээс' : 'Үнэ'} (₮) <span style="color: var(--danger)">*</span></label>
              <input class="input num" type="number" min="0" placeholder="${isRent ? '1500000' : '450000000'}" value="${d.price}" oninput="setListPropField('price', this.value)" />
            </div>
            ${
              isRent
                ? `
              <div>
                <label class="text-xs text-[var(--text-3)] mb-1 block">Депозит (₮)</label>
                <input class="input num" type="number" min="0" placeholder="3000000" value="${d.deposit}" oninput="setListPropField('deposit', this.value)" />
              </div>
              <div>
                <label class="text-xs text-[var(--text-3)] mb-1 block">Хамгийн бага гэрээний хугацаа</label>
                <select class="input" onchange="setListPropField('contractMonths', this.value)">${['3 сар', '6 сар', '1 жил', '2 жил'].map((x) => `<option ${d.contractMonths === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
              </div>
            `
                : `
              <div>
                <label class="text-xs text-[var(--text-3)] mb-1 block">Тохиролцох боломжтой эсэх</label>
                <select class="input" onchange="setListPropField('negotiable', this.value)">${['Тийм', 'Үгүй'].map((x) => `<option ${d.negotiable === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
              </div>
              <div>
                <label class="text-xs text-[var(--text-3)] mb-1 block">Ипотек/зээл боломжтой</label>
                <select class="input" onchange="setListPropField('mortgage', this.value)">${['Тийм — банктай хамтарсан', 'Үгүй — зөвхөн бэлэн'].map((x) => `<option ${d.mortgage === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
              </div>
            `
            }
          </div>
        </div>
        <div class="card p-5 mb-4">
          <div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="settings-2" class="w-4 h-4" style="color: var(--gold-brand)"></i> Нэмэлт сонголт</div>
          <div class="grid sm:grid-cols-2 gap-1">
            ${['Тавилгатай', 'Гаражтай', 'Тэжээвэр амьтан', 'Шинээр заслагдсан', 'Бэлэн орох', 'Усан сан', 'Биеийн тамирын танхим', 'Лифттэй'].map((f) => `<label class="flex items-center gap-2 p-2 rounded hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input type="checkbox" class="accent-[var(--gold-brand)]" ${d.features.includes(f) ? 'checked' : ''} onchange="toggleListPropFeature('${f}', this.checked)" /> ${f}</label>`).join('')}
          </div>
        </div>
        <div class="card p-4 mb-4 flex items-start gap-3" style="background: var(--gold-soft); border-color: var(--gold-brand);">
          <i data-lucide="info" class="w-4 h-4 mt-0.5 shrink-0" style="color: var(--gold-brand)"></i>
          <div class="text-xs" style="color: var(--text-2)">Зар нийтлэгдсэний дараа NEOMAP-ийн үнэлгээний баг 24 цагт шалгаж баталгаажуулна. Verified тэмдэг авсан зар 3.4 дахин их үзэлт авдаг.</div>
        </div>
      `
          : ''
      }

      <div class="flex gap-2 justify-between">
        <button onclick="${step === 1 ? 'cancelListProperty()' : 'prevListPropStep()'}" class="btn btn-secondary">
          <i data-lucide="${step === 1 ? 'x' : 'arrow-left'}" class="w-4 h-4"></i> ${step === 1 ? 'Цуцлах' : 'Буцах'}
        </button>
        ${
          step < 3
            ? `
          <button onclick="nextListPropStep()" class="btn btn-cta">Үргэлжлүүлэх <i data-lucide="arrow-right" class="w-4 h-4"></i></button>
        `
            : `
          <button onclick="submitListProperty()" class="btn btn-cta"><i data-lucide="check" class="w-4 h-4"></i> Зар нийтлэх</button>
        `
        }
      </div>
    </div>
  `;
}

window.setListPropMode = function (m) {
  state.listPropMode = m;
  if (currentScreen === 'list-property') {
    renderAppScreen('list-property');
    setTimeout(() => lucide.createIcons(), 0);
  }
};
window.setListPropField = function (key, value) {
  const d = ensureListPropDraft();
  const prevDistrict = d.district;
  d[key] = value;
  if (key === 'district' && value !== prevDistrict) {
    const loc = defaultListPropLocation(value);
    d.lat = loc.lat;
    d.lng = loc.lng;
    d.locationTouched = false;
  }
  if (key === 'rooms' || key === 'district') {
    renderAppScreen('list-property');
    setTimeout(() => lucide.createIcons(), 0);
  }
};
window.setListPropLocation = function (ev) {
  if (ev) ev.stopPropagation();
  const rect = ev.currentTarget.getBoundingClientRect();
  const d = ensureListPropDraft();
  d.lat = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
  d.lng = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
  d.locationTouched = true;
  renderAppScreen('list-property');
  setTimeout(() => lucide.createIcons(), 0);
};
window.toggleListPropFeature = function (f, on) {
  const d = ensureListPropDraft();
  const set = new Set(d.features);
  if (on) set.add(f);
  else set.delete(f);
  d.features = [...set];
};
window.addListPropPhoto = function () {
  const d = ensureListPropDraft();
  if (d.photos.length >= 15) {
    showToast('Хамгийн ихдээ 15 зураг нэмж болно', 'warning', { duration: 1800 });
    return;
  }
  d.photos.push('userlist-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
  renderAppScreen('list-property');
  setTimeout(() => lucide.createIcons(), 0);
};
window.removeListPropPhoto = function (i) {
  const d = ensureListPropDraft();
  d.photos.splice(i, 1);
  renderAppScreen('list-property');
  setTimeout(() => lucide.createIcons(), 0);
};
function validateListPropStep(step) {
  const d = ensureListPropDraft();
  if (step === 1) {
    if (!d.khotkhon || !d.khotkhon.trim()) return 'Хотхон/хаягаа оруулна уу';
    if (!d.rooms) return 'Өрөөний тоог сонгоно уу';
    const area = parseFloat(d.area);
    if (!area || area <= 0) return 'Талбайг оруулна уу';
  }
  if (step === 2) {
    if (d.photos.length < 1) return 'Хамгийн багадаа 1 зураг нэмнэ үү';
  }
  if (step === 3) {
    const price = parseFloat(d.price);
    if (!price || price <= 0) return 'Үнээ оруулна уу';
  }
  return null;
}
window.nextListPropStep = function () {
  const err = validateListPropStep(state.listPropStep || 1);
  if (err) {
    showToast(err, 'warning', { duration: 2200 });
    return;
  }
  state.listPropStep = Math.min(3, (state.listPropStep || 1) + 1);
  renderAppScreen('list-property');
  setTimeout(() => lucide.createIcons(), 0);
  window.scrollTo(0, 0);
};
window.prevListPropStep = function () {
  state.listPropStep = Math.max(1, (state.listPropStep || 1) - 1);
  renderAppScreen('list-property');
  setTimeout(() => lucide.createIcons(), 0);
  window.scrollTo(0, 0);
};
window.cancelListProperty = function () {
  state.listPropDraft = null;
  state.listPropStep = 1;
  state.listPropEditingRoomId = null;
  goTo('home');
};
window.submitListProperty = function () {
  for (let s = 1; s <= 3; s++) {
    const err = validateListPropStep(s);
    if (err) {
      state.listPropStep = s;
      renderAppScreen('list-property');
      setTimeout(() => lucide.createIcons(), 0);
      showToast(err, 'warning', { duration: 2400 });
      return;
    }
  }
  const d = state.listPropDraft;
  const newId = Math.max(...LISTINGS.map((x) => x.id)) + 1;
  const loc = d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : defaultListPropLocation(d.district);
  const listing = {
    id: newId,
    mode: state.listPropMode,
    district: d.district,
    khoroo: d.khoroo || '1',
    khotkhon: d.khotkhon.trim(),
    rooms: d.rooms,
    area: parseFloat(d.area),
    floor: d.floor || '—',
    year: parseInt(d.year, 10) || new Date().getFullYear(),
    price: parseFloat(d.price),
    photos: newId,
    photoSeeds: d.photos.slice(),
    status: 'new',
    listedDays: 0,
    viewCount: 0,
    viewingCount: 0,
    features: d.features.slice(),
    agentId: 1,
    lat: Math.max(0.02, Math.min(0.98, parseFloat(loc.lat))),
    lng: Math.max(0.02, Math.min(0.98, parseFloat(loc.lng))),
    desc: d.desc || '',
    roomDetails: (d.roomDetails || []).slice(),
    isUserListing: true,
  };
  if (state.listPropMode === 'rent' && d.deposit) listing.deposit = parseFloat(d.deposit);
  // Note: the smart wizard's submit at line ~6111 is the active one — this branch is dead.
  LISTINGS.push(listing);
  state.listPropDraft = null;
  state.listPropStep = 1;
  state.currentListingId = newId;
  state.mode = state.listPropMode;
  showToast('Зар амжилттай нийтлэгдлээ · ' + listing.khotkhon, 'success', { duration: 2600 });
  goTo('property');
};

/* ============== LIST PROPERTY — Smart UX override (5 бүлэг / 13 алхмын дата) ============== */
const SMART_LIST_PROP_DRAFT_KEY = 'neomap.smartListPropertyDraft.v1';
const SMART_LIST_PROP_GROUPS = [
  { step: 1, icon: 'target', title: 'Зорилго ба зориулалт', sub: 'АЛХАМ 01-03', covers: ['Зорилго', 'ҮХЭХ зориулалт', 'Дэд зориулалт'] },
  { step: 2, icon: 'map-pin', title: 'Хаяг, байршил ба үзүүлэлт', sub: 'АЛХАМ 04-05', covers: ['Гараар оруулах', 'Газрын зураг', 'Үзүүлэлт'] },
  { step: 3, icon: 'sparkles', title: 'Дэд бүтэц ба дагалдах зүйлс', sub: 'АЛХАМ 06-08', covers: ['Дэд бүтэц', 'Дундын хэрэглээ', 'Үнэд багтсан'] },
  { step: 4, icon: 'badge-dollar-sign', title: 'Төлөв, үнэ ба медиа', sub: 'АЛХАМ 09-11', covers: ['ҮХЭХ төлөв', 'Үнэ', 'Зураг, бичлэг'] },
  { step: 5, icon: 'shield-check', title: 'Шалгах, баталгаажуулах', sub: 'АЛХАМ 12-13', covers: ['Баталгаажуулах', 'Verified', 'Brokerage'] },
];
const SMART_LIST_PROP_GOALS = [
  { key: 'sell', mode: 'sale', icon: 'banknote', label: 'ХУДАЛДУУЛЪЯ', hint: 'Бүх төрлийн үл хөдлөх эд хөрөнгөө худалдах' },
  { key: 'rent', mode: 'rent', icon: 'key-round', label: 'ТҮРЭЭСЛҮҮЛЬЕ / ХӨЛСЛҮҮЛЬЕ', hint: 'Орон сууцны болон арилжааны зориулалттай хөрөнгө түрээслүүлэх, хөлслүүлэх' },
];
const SMART_LIST_PROP_TYPES = [
  { key: 'apartment', label: 'Орон сууц', icon: 'building-2', hint: 'Олон давхар барилгын тусдаа бүртгэлтэй нэгж', residential: true },
  { key: 'house', label: 'Амины орон сууц', icon: 'home', hint: 'Тусдаа орцтой, дээрээ/доороо өөр айлгүй сууц', residential: true },
  { key: 'office', label: 'Оффис', icon: 'briefcase', hint: 'Байгууллага, бизнесийн өдөр тутмын ажлын байр', commercial: true },
  { key: 'retail', label: 'Худалдаа, үйлчилгээ', icon: 'shopping-bag', hint: 'Дэлгүүр, үйлчилгээний төв, салон, ресторан, кафе г.м.', commercial: true },
  { key: 'industrial', label: 'Аж үйлдвэрийн обьект', icon: 'factory', hint: 'Үйлдвэрлэл, боловсруулах, засварлах зориулалттай обьект', commercial: true },
  { key: 'parking', label: 'Авто дулаан зогсоол', icon: 'car', hint: 'Орон сууц, оффис, үйлчилгээний барилгын доторх дулаан зогсоол' },
  { key: 'warehouse', label: 'Агуулах', icon: 'warehouse', hint: 'Орон сууц, гараж, оффисын доторх агуулахын өрөө, талбай', commercial: true },
  { key: 'fence_house', label: 'Хашаа байшин (газартай)', icon: 'fence', hint: 'Газартай, дээр нь нэг айлын зориулалттай байшинтай' },
  { key: 'summer_land', label: 'Зуслангийн байшин (газартай)', icon: 'trees', hint: 'Зуслангийн бүсэд байрлах газартай байшин', residential: true },
  { key: 'summer_no_land', label: 'Зуслангийн байшин (газаргүй)', icon: 'tree-pine', hint: 'Газрын эрх нь тусдаа, зөвхөн байшин нь обьект болох хөрөнгө', residential: true },
  { key: 'land', label: 'Газар', icon: 'map', hint: 'Барилга байгууламжтай эсвэл барилгагүй газар' },
  { key: 'other', label: 'Бусад', icon: 'circle-ellipsis', hint: 'Дээрх ангилалд шууд хамаарахгүй хөрөнгө' },
];
const SMART_LIST_PROP_SUBTYPES = {
  apartment: ['Энгийн', 'Дуплекс', 'Пентхаус', 'Бусад: тайлбар оруулах'],
  house: ['Single house', 'Twin house', 'Town house', 'Multihouse', 'Бусад: тайлбар оруулах'],
  office: ['Давхар дахь тодорхой хэсэг, өрөө(нүүд)', 'Давхар бүхлээрээ', 'Обьект бүхлээрээ', 'Бусад: тайлбар оруулах'],
  retail: ['Давхар дахь тодорхой хэсэг, өрөө(нүүд)', 'Давхар бүхлээрээ', 'Обьект бүхлээрээ', 'Бусад: тайлбар оруулах'],
  industrial: ['Зориулалтын талаар тайлбар оруулах'],
  parking: ['Оффис, Үйлчилгээ, Орон сууцны доорх / доторх', 'Тусдаа авто дулаан зогсоолын блок дахь', 'Бусад: тайлбар оруулах'],
  warehouse: ['Оффис, Үйлчилгээ, Орон сууцны доорх / доторх', 'Бусад: тайлбар оруулах'],
  fence_house: ['Хашаа байшин (газартай)'],
  summer_land: ['Зуслангийн байшин (газартай)'],
  summer_no_land: ['Зуслангийн байшин (газаргүй)'],
  land: ['Газрын зориулалт сонгох'],
  other: ['Тайлбар оруулах'],
};
const SMART_LIST_PROP_WINDOWS = ['Зүүн', 'Зүүн-урагш', 'Урд', 'Баруун-урагш', 'Баруун', 'Баруун-хойш', 'Хойд', 'Зүүн-хойш'];
const SMART_LIST_PROP_WINDOW_DIRECTIONS = [
  { key: 'northwest', label: 'Баруун-хойш', short: 'БХ', detailKey: 'БХ', icon: 'move-up-left', pos: 'left:18px; top:24px;' },
  { key: 'north', label: 'Хойд', short: 'Х', detailKey: 'Х', icon: 'arrow-up', pos: 'top:8px; left:50%; transform:translateX(-50%);' },
  { key: 'northeast', label: 'Зүүн-хойш', short: 'ЗХ', detailKey: 'ЗХ', icon: 'move-up-right', pos: 'right:18px; top:24px;' },
  { key: 'west', label: 'Баруун', short: 'Б', detailKey: 'Б', icon: 'arrow-left', pos: 'left:4px; top:50%; transform:translateY(-50%);' },
  { key: 'east', label: 'Зүүн', short: 'З', detailKey: 'З', icon: 'arrow-right', pos: 'right:4px; top:50%; transform:translateY(-50%);' },
  { key: 'southwest', label: 'Баруун-урагш', short: 'БУ', detailKey: 'БУ', icon: 'move-down-left', pos: 'left:18px; bottom:24px;' },
  { key: 'south', label: 'Урд', short: 'У', detailKey: 'У', icon: 'arrow-down', pos: 'bottom:8px; left:50%; transform:translateX(-50%);' },
  { key: 'southeast', label: 'Зүүн-урагш', short: 'ЗУ', detailKey: 'ЗУ', icon: 'move-down-right', pos: 'right:18px; bottom:24px;' },
];
const SMART_LIST_PROP_OFFICE_NEEDS = ['Ресепшн', 'Хурлын өрөө', 'Удирдлагын өрөө', 'Open office', 'Гал тогооны хэсэг', 'Серверийн өрөө', 'Агуулах өрөө', 'Архив', 'Дуудлагын өрөө', 'Ариун цэврийн өрөө', 'Агааржуулалт', 'Галын дохиолол', 'Access control', '24/7 нэвтрэх', 'Зочны зогсоол', 'Ачааны лифт'];
const SMART_LIST_PROP_INFRA = [
  { key: 'heating', label: 'Дулаан', icon: 'flame', choices: ['Төвийн (улсын)', 'Төвлөрсөн (хотхоны)', 'Бие даасан', 'Уурын зуух (нүүрсэн)', 'Газан зуух', 'Цахилгаан', 'Цахилгаан радиатор', 'Бусад'] },
  { key: 'electric', label: 'Цахилгаан', icon: 'bolt', choices: ['Төвийн 100%', 'Төвийн болон сэргээгдэх хосолмол', 'Сэргээгдэх 100%', 'Ямар нэг нөөцлүүргүй', 'Ямар нэг нөөцлүүртэй', 'Дизель генератортой', 'Бусад'] },
  { key: 'waterCold', label: 'Цэвэр ус', icon: 'droplets', choices: ['Төвийн шугам (улсын)', 'Төвлөрсөн (хотхоны)', 'Бие даасан', 'Гүний худаг', 'Ус зөөдөг', 'Бусад'] },
  { key: 'waterHot', label: 'Хэрэглээний халуун ус', icon: 'thermometer-sun', choices: ['Төвийн шугам (улсын) - ялтсан бойлер', 'Төвлөрсөн (хотхоны)', 'Бие даасан', 'Эзлэхүүний бойлер', 'Түргэн халаагч бойлер', 'Бусад'] },
  { key: 'sewage', label: 'Бохир', icon: 'waves', choices: ['Төвийн шугам (улсын)', 'Төвлөрсөн (хотхоны)', 'Бие даасан', 'Септик', 'Соруулдаг', 'Бусад'] },
  { key: 'road', label: 'Ирж, очих зам', icon: 'route', choices: ['100% асфальт', 'Шороон зам', 'Холимог', 'Бусад'] },
  { key: 'internet', label: 'Интернет, IPTV', icon: 'wifi', choices: ['Univision', 'DDISH, Гэр интернет', 'Mobinet', 'Бусад'] },
];
const SMART_LIST_PROP_INFRA_CHOICES = ['Төвлөрсөн', 'Бие даасан', 'Байхгүй', 'Тодорхойгүй'];
const SMART_LIST_PROP_COMMUNITY = [
  { key: 'services', title: 'Үйлчилгээ', icon: 'store', items: ['Хүнсний дэлгүүр', 'Барааны дэлгүүр', 'Фитнес, иога, веллнесс', 'Спа', 'Бассейн', 'Сауна', 'Угаалга, хими цэвэрлэгээ', 'Дундын өмчлөлийн цэвэрлэгээ', 'Хувийн өмчийн цэвэрлэгээ', 'Клабхаус', 'Ресторан', 'Кофешоп', 'Цахилгаан машины цэнэглэл станц', 'Бусад'] },
  { key: 'security', title: 'Аюулгүй байдал', icon: 'shield-check', items: ['Харуул, хамгаалалт 24/7', 'Домофон, дохиолол', 'Хотхоны нэгдсэн хашаа', 'Явган орц, гарцны аксесстай хаалга', 'Машины автомат хаалт', 'Бусад'] },
  { key: 'amenities', title: 'Тав тух', icon: 'accessibility', items: ['Төлбөртэй ил зогсоол', 'Төлбөргүй ил зогсоол', 'Төлбөртэй дулаан зогсоол', 'Машингүй бүс', 'Хүүхдийн тоглоомын талбай', 'Ногоон байгууламж, нарлах салхилах талбай', 'Лифт - зорчигчийн 24/7', 'Лифт - ачааны 24/7', 'Нэгдсэн дулаан зогсоол', 'Тусгай хэрэгцээт хүнд зориулсан дэд бүтэц (disabled friendly)', 'Хүүхдэд ээлтэй орчин', 'Бусад'] },
];
const SMART_LIST_PROP_INCLUDED = [
  { key: 'furniture', title: 'Тавилга', icon: 'armchair', items: ['Гал тогооны тавилга', 'Үүдний тавилга', 'АЦӨ тавилга, тоноглол', 'Зочны өрөөний ханын тавилга', 'Хувцасны өрөөний тавилга', 'Ажлын өрөөний ханын тавилга', 'Gym-ний ханын тавилга', 'B1 давхрын үүдний өрөөний тавилга'] },
  { key: 'equipment', title: 'Тоног төхөөрөмж, цахилгаан бараа', icon: 'monitor-cog', items: ['Хөргөгч, хөлдөөгч', 'Суурилагддаг зуух, плитка, шарах шүүгээ', 'Ус цэвэршүүлэгч', 'Биде', 'Угаалгын машин', 'Ялаа, шумуулны тор', 'Агааржуулалт, эйр кондишн систем'] },
  { key: 'extra', title: 'Нэмэлт тоноглол', icon: 'sliders-horizontal', items: ['Домофон', 'Автоматжуулалтын систем', 'Гэрлийн бүрхүүл', 'Хөшиг, тюль', 'Бусад'] },
];
const SMART_LIST_PROP_SALE_PAYMENT_FORMS = [
  'Зөвхөн 100% бэлэн мөнгөөр, шууд төлөлтөөр',
  'Зөвхөн 100% бэлэн мөнгөөр, банкны зээл оролцуулж болно',
  'Зөвхөн 100% бэлэн мөнгөөр, хуваарьт төлөлтөөр',
  '100% хүртэл бартераар борлуулах боломжтой',
  'Үнийн дүнгийн тодорхой хувь хүртэл бартераар, бэлэн мөнгийг шууд төлөлтөөр',
  'Үнийн дүнгийн тодорхой хувь хүртэл бартераар, бэлэн мөнгийг хуваарьт төлөлтөөр',
  'Бусад: тайлбар оруулах',
];
const SMART_LIST_PROP_RENT_FREQUENCIES = ['1 сар тутам', '2 сар тутам', '3 сар тутам', '4 сар тутам', '6 сар тутам', '12 сар тутам'];

function lpEsc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
}
function lpJS(v) {
  return String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}
function lpGet(obj, path) {
  return String(path).split('.').reduce((cur, key) => (cur == null ? undefined : cur[key]), obj);
}
function lpSet(obj, path, value) {
  const parts = String(path).split('.');
  let cur = obj;
  parts.slice(0, -1).forEach((key) => {
    if (!cur[key] || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key];
  });
  cur[parts[parts.length - 1]] = value;
}
function lpNormalizeWindows(value) {
  const out = SMART_LIST_PROP_WINDOW_DIRECTIONS.reduce((acc, dir) => {
    acc[dir.key] = 0;
    return acc;
  }, {});
  const assign = (key, count) => {
    if (!key) return;
    const normalizedKey = String(key).toLowerCase();
    const dir = SMART_LIST_PROP_WINDOW_DIRECTIONS.find((x) => x.key === normalizedKey || x.label === key || x.short === key || x.detailKey === key);
    if (dir) out[dir.key] = Math.max(0, parseInt(count, 10) || 0);
  };
  if (Array.isArray(value)) {
    value.forEach((x) => assign(x, (out[SMART_LIST_PROP_WINDOW_DIRECTIONS.find((dir) => dir.label === x || dir.short === x || dir.detailKey === x)?.key] || 0) + 1));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, count]) => assign(key, count));
  }
  return out;
}
function lpWindowTotal(value) {
  const counts = lpNormalizeWindows(value);
  return SMART_LIST_PROP_WINDOW_DIRECTIONS.reduce((sum, dir) => sum + (Number(counts[dir.key]) || 0), 0);
}
function lpWindowSummary(value) {
  const counts = lpNormalizeWindows(value);
  return SMART_LIST_PROP_WINDOW_DIRECTIONS
    .map((dir) => {
      const n = Number(counts[dir.key]) || 0;
      return n > 0 ? `${dir.label} ${n} цонх` : '';
    })
    .filter(Boolean)
    .join(' · ');
}
function lpClampWindowCount(value) {
  const n = parseInt(value, 10);
  return Math.max(0, Math.min(99, Number.isFinite(n) ? n : 0));
}
function lpWindowStepControl(dir, n, compact = false) {
  const key = lpJS(dir.key);
  const label = lpEsc(dir.label);
  return `
    <div class="lp-window-stepper ${compact ? 'compact' : ''}">
      <button type="button" class="lp-window-step-btn" onclick="adjustListPropWindow('${key}', -1)" ${n <= 0 ? 'disabled' : ''} title="${label} -1" aria-label="${label} цонх хасах">
        <i data-lucide="minus" class="w-3.5 h-3.5"></i>
      </button>
      <input class="lp-window-value num" type="number" inputmode="numeric" min="0" max="99" step="1" value="${n}" onfocus="this.select()" onchange="setListPropWindowCount('${key}', this.value)" aria-label="${label} харсан цонхны тоо" />
      <button type="button" class="lp-window-step-btn primary" onclick="adjustListPropWindow('${key}', 1)" title="${label} +1" aria-label="${label} цонх нэмэх">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `;
}
function renderListPropWindowMap(d) {
  const counts = lpNormalizeWindows(d.specs.windows);
  const total = lpWindowTotal(counts);
  const byKey = (key) => SMART_LIST_PROP_WINDOW_DIRECTIONS.find((dir) => dir.key === key);
  const tableRows = [
    ['northwest', 'north', 'northeast'],
    ['west', 'total', 'east'],
    ['southwest', 'south', 'southeast'],
  ];
  const cell = (key) => {
    if (key === 'total') {
      return `<div class="lp-window-total-cell">
        <span class="text-xs font-semibold" style="color: var(--text-3);">Нийт</span>
        <span class="num text-2xl font-bold leading-tight">${total}</span>
        ${total ? `<button type="button" class="lp-window-reset-btn" onclick="clearListPropWindows()" title="Тэглэх" aria-label="Цонхны тоог тэглэх"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i></button>` : ''}
      </div>`;
    }
    const dir = byKey(key);
    const n = Number(counts[dir.key]) || 0;
    return `<div class="lp-window-cell ${n ? 'is-active' : ''}">
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-semibold">${dir.short}</span>
        <i data-lucide="${dir.icon}" class="w-4 h-4" style="color:${n ? 'var(--gold-brand)' : 'var(--text-3)'};"></i>
      </div>
      ${lpWindowStepControl(dir, n)}
    </div>`;
  };
  return `
    <div class="mt-4">
      ${lpLabel('Цонхны тоо, байрлал', false)}
      <div class="grid xl:grid-cols-[300px_1fr] gap-4 items-stretch">
        <div class="rounded-xl p-4 flex items-center justify-center" style="background: var(--surface-2); border:1px solid var(--border); min-height:300px;">
          <div class="relative w-[240px] h-[240px] rounded-full" style="background: radial-gradient(circle at center, var(--surface) 0 34%, transparent 35%), conic-gradient(from 0deg, rgba(201,162,39,.16), transparent 16%, rgba(10,31,68,.08) 25%, transparent 34%, rgba(201,162,39,.16) 50%, transparent 66%, rgba(10,31,68,.08) 75%, transparent 84%, rgba(201,162,39,.16)); border:1px solid var(--border); box-shadow: var(--shadow-sm);">
            <div class="absolute inset-[82px] rounded-full flex flex-col items-center justify-center text-center" style="border:2px solid var(--gold-brand); background: var(--gold-soft); color: var(--text);">
              <i data-lucide="compass" class="w-5 h-5 mb-1" style="color: var(--gold-brand);"></i>
              <span class="num text-xl font-bold leading-tight">${total}</span>
              <span class="text-[10px] font-semibold" style="color: var(--text-3);">нийт цонх</span>
            </div>
            ${SMART_LIST_PROP_WINDOW_DIRECTIONS.map((dir) => {
              const n = Number(counts[dir.key]) || 0;
              return `<button type="button" onclick="adjustListPropWindow('${lpJS(dir.key)}', 1)" class="lp-window-map-chip ${n ? 'is-active' : ''}" style="${dir.pos}" title="${lpEsc(dir.label)} +1" aria-label="${lpEsc(dir.label)} цонх нэмэх">
                <span class="text-[11px] font-semibold leading-none">${dir.short}</span>
                <span class="num text-sm font-bold leading-tight">${n}</span>
                <i data-lucide="plus" class="lp-window-map-plus"></i>
              </button>`;
            }).join('')}
          </div>
        </div>
        <div class="rounded-xl overflow-hidden" style="border:1px solid var(--border); background: var(--surface);">
          <div class="grid grid-cols-3 gap-px" style="background: var(--border);">
            ${tableRows.flatMap((row) => row.map((key) => `<div style="background: var(--surface);">${cell(key)}</div>`)).join('')}
          </div>
        </div>
      </div>
      ${total ? `<div class="mt-2 text-xs" style="color: var(--text-3);">${lpEsc(lpWindowSummary(counts))}</div>` : ''}
    </div>
  `;
}
function lpGoal(goal) {
  return SMART_LIST_PROP_GOALS.find((x) => x.key === goal) || SMART_LIST_PROP_GOALS[1];
}
function lpType(type) {
  return SMART_LIST_PROP_TYPES.find((x) => x.key === type) || SMART_LIST_PROP_TYPES[0];
}
function lpMode(goal) {
  return lpGoal(goal).mode;
}
function lpSubtype(type) {
  return (SMART_LIST_PROP_SUBTYPES[type] || [''])[0];
}
function lpNeedsRooms(d) {
  return !!lpType(d.propertyType).residential;
}
function lpCommercial(d) {
  return !!lpType(d.propertyType).commercial;
}
function lpAreaLabel(d) {
  if (d.propertyType === 'land') return 'Газрын талбай';
  if (d.propertyType === 'parking') return 'Зогсоолын талбай';
  if (d.propertyType === 'warehouse') return 'Агуулахын талбай';
  return 'Нийт талбай (Гэрчилгээгээр)';
}
function lpPhotos(d) {
  return ((d.media && d.media.photos) || []).filter(Boolean);
}
function lpPrice(d) {
  return lpMode(d.goal) === 'sale' ? parseFloat(d.pricing.totalPrice) || 0 : parseFloat(d.pricing.monthlyPrice) || 0;
}
function lpDefaultDraft() {
  const district = DISTRICTS[0];
  const loc = defaultListPropLocation(district);
  const goal = state.listPropMode === 'sale' ? 'sell' : 'rent';
  return {
    goal,
    propertyType: 'apartment',
    subtype: lpSubtype('apartment'),
    desc: '',
    address: { country: 'Монгол', city: 'Улаанбаатар', district, khoroo: '', zip: '', street: '', streetNumber: '', khotkhon: '', buildingNumber: '', buildingName: '', googleMapLink: '', note: '', floorBasement: 0, floorAbove: 0, floorTotal: 0, selectedFloor: 'F01', unit: '' },
    specs: { areaCert: '', areaInterior: '', areaBalcony: '', areaGarage: '', areaStorage: '', rooms: null, bedrooms: null, bathrooms: null, windows: lpNormalizeWindows(), officeNeeds: [] },
    infra: { heating: 'Төвийн (улсын)', electric: 'Төвийн 100%', waterCold: 'Төвийн шугам (улсын)', waterHot: 'Төвийн шугам (улсын) - ялтсан бойлер', sewage: 'Төвийн шугам (улсын)', road: '100% асфальт', internet: 'Univision', note: '' },
    community: { services: [], security: [], amenities: [] },
    included: { furniture: [], equipment: [], extra: [] },
    state: { usage: 'Ашиглалтад орсон', certStatus: 'Бэлэн гэрчилгээтэй', certNumber: '', condition: 'Цоо шинэ, ашиглаж байгаагүй', current: 'Сул, чөлөөтэй байгаа', interior: '', collateral: 'Ямар нэг барьцаанд байхгүй', certificateAttached: false, contractAttached: false, commissionYear: '', commissionDue: '', collateralNote: '' },
    pricing: { totalPrice: '', monthlyPrice: '', vatIncluded: false, ebarimt: false, paymentForms: ['Зөвхөн 100% бэлэн мөнгөөр, шууд төлөлтөөр'], rentFrequency: '1 сар тутам', deposit: '', rentDiscounts: { 1: 0, 2: 0, 3: 0, 4: 0, 6: 5, 12: 10 } },
    media: { photos: [], videoLink: '', coverIndex: 0 },
    declarations: { truth: false, authority: false, terms: false },
    services: { verified: true, brokerage: false, sponsored: false, relation: 'Өмчлөгч' },
    roomDetails: [],
    lat: loc.lat,
    lng: loc.lng,
    locationTouched: false,
  };
}
function lpNormalize(d) {
  if (!d || typeof d !== 'object') return lpDefaultDraft();
  const base = lpDefaultDraft();
  const out = {
    ...base,
    ...d,
    address: { ...base.address, ...(d.address || {}) },
    specs: { ...base.specs, ...(d.specs || {}) },
    infra: { ...base.infra, ...(d.infra || {}) },
    community: { ...base.community, ...(d.community || {}) },
    included: { ...base.included, ...(d.included || {}) },
    state: { ...base.state, ...(d.state || {}) },
    pricing: { ...base.pricing, ...(d.pricing || {}) },
    media: { ...base.media, ...(d.media || {}) },
    declarations: { ...base.declarations, ...(d.declarations || {}) },
    services: { ...base.services, ...(d.services || {}) },
    roomDetails: Array.isArray(d.roomDetails) ? d.roomDetails : (base.roomDetails || []),
  };
  const oldType = SMART_LIST_PROP_TYPES.find((x) => x.label === out.propertyType);
  if (oldType) out.propertyType = oldType.key;
  if (!SMART_LIST_PROP_GOALS.some((x) => x.key === out.goal)) out.goal = 'rent';
  if (!SMART_LIST_PROP_TYPES.some((x) => x.key === out.propertyType)) out.propertyType = 'apartment';
  if (!out.subtype || !(SMART_LIST_PROP_SUBTYPES[out.propertyType] || []).includes(out.subtype)) out.subtype = lpSubtype(out.propertyType);
  if (d.district && !d.address) out.address.district = d.district;
  if (d.khotkhon && !d.address) out.address.khotkhon = d.khotkhon;
  if (d.khoroo && !d.address) out.address.khoroo = d.khoroo;
  if (d.area && !d.specs) out.specs.areaCert = d.area;
  if (d.rooms && !d.specs) out.specs.rooms = d.rooms;
  if (d.price && !d.pricing) out.pricing.monthlyPrice = d.price;
  if (Array.isArray(d.photos) && !out.media.photos.length) out.media.photos = d.photos.map((seed, i) => ({ seed, category: i ? 'Дотор зураг' : 'Нүүрний зураг' }));
  out.specs.windows = lpNormalizeWindows(out.specs.windows);
  const mediaCategoryMap = {
    'Нүүр зураг': 'Нүүрний зураг',
    План: 'План зураг',
    Дотор: 'Дотор зураг',
    Гадна: 'Гадна орчны зураг',
    'Мастер төлөвлөгөө': 'Мастер төлөвлөгөө, хотхоны зураг',
    Харагдац: 'Дотроос гадагшаа харагдацын зураг',
    Хотхон: 'Хотхоны бусад үзүүлэлтийн зураг',
  };
  out.media.photos = (out.media.photos || []).map((p) => ({ ...p, category: mediaCategoryMap[p.category] || p.category || 'Дотор зураг' }));
  const paymentMap = {
    Бэлэн: SMART_LIST_PROP_SALE_PAYMENT_FORMS[0],
    'Банкны зээл': SMART_LIST_PROP_SALE_PAYMENT_FORMS[1],
    Бартер: SMART_LIST_PROP_SALE_PAYMENT_FORMS[3],
    'Хуваарьт төлөлт': SMART_LIST_PROP_SALE_PAYMENT_FORMS[2],
  };
  out.pricing.paymentForms = (out.pricing.paymentForms || []).map((x) => paymentMap[x] || x);
  if (/^\d+\s*сар$/.test(out.pricing.rentFrequency || '')) out.pricing.rentFrequency = out.pricing.rentFrequency + ' тутам';
  if (!SMART_LIST_PROP_RENT_FREQUENCIES.includes(out.pricing.rentFrequency)) out.pricing.rentFrequency = '1 сар тутам';
  if (!out.pricing.rentDiscounts || typeof out.pricing.rentDiscounts !== 'object') out.pricing.rentDiscounts = {};
  [1, 2, 3, 4, 6, 12].forEach((m) => {
    if (out.pricing.rentDiscounts[m] == null) out.pricing.rentDiscounts[m] = 0;
  });
  if (out.state.certStatus === 'Гэрчилгээтэй') out.state.certStatus = 'Бэлэн гэрчилгээтэй';
  if (out.state.collateral === 'Барьцаагүй') out.state.collateral = 'Ямар нэг барьцаанд байхгүй';
  if (['Бэлэн орох', 'Хүнтэй', 'Түрээслэгчтэй', 'Хоосон', 'Засвар хийгдэж буй'].includes(out.state.condition)) {
    out.state.current = out.state.condition === 'Хоосон' || out.state.condition === 'Бэлэн орох' ? 'Сул, чөлөөтэй байгаа' : out.state.condition;
    out.state.condition = 'Ашиглагдаж байсан';
  }
  SMART_LIST_PROP_INFRA.forEach((f) => {
    const choices = f.choices || SMART_LIST_PROP_INFRA_CHOICES;
    if (choices.includes(out.infra[f.key])) return;
    if (out.infra[f.key] === 'Төвлөрсөн') out.infra[f.key] = f.key === 'electric' ? 'Төвийн 100%' : f.key === 'road' ? '100% асфальт' : f.key === 'internet' ? 'Univision' : 'Төвлөрсөн (хотхоны)';
    if (!choices.includes(out.infra[f.key])) out.infra[f.key] = choices[0];
  });
  out.address.floorTotal = (parseInt(out.address.floorBasement, 10) || 0) + (parseInt(out.address.floorAbove, 10) || 0);
  if (out.lat == null || out.lng == null) {
    const loc = defaultListPropLocation(out.address.district);
    out.lat = loc.lat;
    out.lng = loc.lng;
  }
  state.listPropMode = lpMode(out.goal);
  return out;
}
function lpLoadDraft() {
  try {
    const raw = localStorage.getItem(SMART_LIST_PROP_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function lpPersist() {
  try {
    if (state.listPropDraft) localStorage.setItem(SMART_LIST_PROP_DRAFT_KEY, JSON.stringify(state.listPropDraft));
  } catch (e) {}
}
function lpClearPersisted() {
  try {
    localStorage.removeItem(SMART_LIST_PROP_DRAFT_KEY);
  } catch (e) {}
}
function ensureListPropDraft() {
  if (!state.listPropDraft) state.listPropDraft = lpNormalize(lpLoadDraft() || lpDefaultDraft());
  state.listPropDraft = lpNormalize(state.listPropDraft);
  return state.listPropDraft;
}
function lpRequired(d) {
  return [
    { label: 'Зорилго', ok: !!d.goal, step: 1 },
    { label: 'ҮХЭХ зориулалт', ok: !!d.propertyType, step: 1 },
    { label: 'Дэд зориулалт', ok: !!d.subtype, step: 1 },
    { label: 'Дүүрэг/Сум', ok: !!d.address.district, step: 2 },
    { label: 'Хороо/Баг', ok: !!String(d.address.khoroo || '').trim(), step: 2 },
    { label: 'Хотхон, хороолол эсвэл гудамж', ok: !!String(d.address.khotkhon || d.address.street || '').trim(), step: 2 },
    { label: lpAreaLabel(d), ok: (parseFloat(d.specs.areaCert) || 0) > 0, step: 2 },
    { label: 'Нийт өрөөний тоо', ok: !lpNeedsRooms(d) || !!d.specs.rooms, step: 2 },
    { label: lpMode(d.goal) === 'sale' ? 'Нийт үнэ' : 'Нийт үнэ/сар', ok: lpPrice(d) > 0, step: 4 },
    { label: 'Зураг', ok: lpPhotos(d).length > 0, step: 4 },
    { label: 'Холбоо хамаарал', ok: !!d.services.relation, step: 5 },
    { label: 'Дээрх мэдээлэл үнэн зөв', ok: !!d.declarations.truth, step: 5 },
    { label: 'Эрх бүхий этгээд', ok: !!d.declarations.authority, step: 5 },
    { label: 'Үйлчилгээний нөхцөл зөвшөөрөх', ok: !!d.declarations.terms, step: 5 },
  ];
}
function lpOptional(d) {
  return [
    { label: 'Map pin эсвэл Google Maps линк', ok: !!d.locationTouched || !!String(d.address.googleMapLink || '').trim() },
    { label: 'Хотхоны үйлчилгээ', ok: SMART_LIST_PROP_COMMUNITY.some((g) => (d.community[g.key] || []).length) },
    { label: 'Дагалдах зүйлс', ok: SMART_LIST_PROP_INCLUDED.some((g) => (d.included[g.key] || []).length) },
    { label: 'Гэрчилгээний дугаар', ok: !!String(d.state.certNumber || '').trim() },
    { label: 'Баримт хавсаргасан', ok: !!d.state.certificateAttached || !!d.state.contractAttached },
    { label: 'Видео/линк', ok: !!String(d.media.videoLink || '').trim() },
  ];
}
function lpCompletion(d) {
  const req = lpRequired(d);
  const opt = lpOptional(d);
  return Math.round((req.filter((x) => x.ok).length / req.length) * 74 + (opt.filter((x) => x.ok).length / opt.length) * 26);
}
function lpBadge(required) {
  return required ? `<span class="ml-1 text-[10px] font-semibold" style="color: var(--danger);">заавал</span>` : `<span class="ml-1 text-[10px] font-semibold" style="color: var(--text-3);">дараа нөхөж болно</span>`;
}
function lpLabel(label, required) {
  return `<label class="text-xs mb-1.5 block" style="color: var(--text-3);">${label}${lpBadge(required)}</label>`;
}
function lpChip(path, item, active, icon) {
  return `<button type="button" onclick="toggleListPropArray('${path}', '${lpJS(item)}')" class="bm-chip ${active ? 'active' : ''}" style="max-width:100%; white-space:normal; text-align:left; ${active ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">${icon ? `<i data-lucide="${icon}" class="w-3 h-3"></i>` : ''}${lpEsc(item)}</button>`;
}
function lpBool(path, label, active, icon) {
  return `<button type="button" onclick="toggleListPropBoolean('${path}')" class="bm-chip ${active ? 'active' : ''}" style="max-width:100%; white-space:normal; text-align:left; ${active ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">${icon ? `<i data-lucide="${icon}" class="w-3 h-3"></i>` : ''}${lpEsc(label)}</button>`;
}
function lpStepHeader(n) {
  const g = SMART_LIST_PROP_GROUPS.find((x) => x.step === n);
  return `<div class="flex items-start justify-between gap-4 mb-4"><div><div class="text-[11px] font-semibold uppercase tracking-wider mb-1" style="color: var(--gold-brand);">${g.sub}</div><h2 class="text-xl font-semibold tracking-tight flex items-center gap-2"><i data-lucide="${g.icon}" class="w-5 h-5" style="color: var(--gold-brand);"></i>${g.title}</h2></div><div class="hidden sm:flex flex-wrap justify-end gap-1.5 max-w-sm">${g.covers.map((x) => `<span class="px-2 py-1 rounded-full text-[11px] font-medium" style="background: var(--surface-2); color: var(--text-2); border:1px solid var(--border);">${x}</span>`).join('')}</div></div>`;
}
function renderListPropSidebar(d, step, pct) {
  const missing = lpRequired(d).filter((x) => !x.ok);
  return `<aside class="space-y-3 lg:sticky lg:top-24 self-start">
    <div class="card p-4"><div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold">Бүрэн байдал</div><div class="num text-lg font-semibold" style="color: var(--gold-brand);">${pct}%</div></div><div class="h-2 rounded-full overflow-hidden" style="background: var(--surface-2);"><div class="h-full rounded-full" style="width:${pct}%; background: linear-gradient(90deg, var(--primary), var(--gold-brand));"></div></div><div class="text-[11px] mt-2" style="color: var(--text-3);">${missing.length ? `${missing.length} заавал бөглөх зүйл үлдсэн` : 'Нийтлэх хүсэлт илгээхэд бэлэн'}</div></div>
    <div class="card p-2">${SMART_LIST_PROP_GROUPS.map((g) => {
      const active = step === g.step;
      const done = lpRequired(d).filter((x) => x.step === g.step).every((x) => x.ok);
      return `<button type="button" onclick="goListPropStep(${g.step})" class="w-full text-left p-2.5 rounded-lg flex gap-2 items-start hover:bg-[var(--surface-2)]" style="${active ? 'background: var(--gold-soft);' : ''}"><span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background:${active ? 'var(--gold-brand)' : done ? 'var(--success-soft)' : 'var(--surface-2)'}; color:${active ? '#0A1F44' : done ? 'var(--success)' : 'var(--text-3)'};"><i data-lucide="${done && !active ? 'check' : g.icon}" class="w-4 h-4"></i></span><span><span class="block text-sm font-semibold">${g.title}</span><span class="block text-[11px]" style="color: var(--text-3);">${g.sub}</span></span></button>`;
    }).join('')}</div>
    <div class="card p-4"><div class="text-xs font-semibold mb-2" style="color: var(--text-2);">13 алхмын хамрах хүрээ</div><div style="display:grid; grid-template-columns: repeat(13, minmax(0, 1fr)); gap:4px;">${Array.from({ length: 13 }, (_, i) => {
      const n = i + 1;
      const group = n <= 3 ? 1 : n <= 5 ? 2 : n <= 8 ? 3 : n <= 11 ? 4 : 5;
      return `<span class="h-7 rounded-md flex items-center justify-center text-[10px] font-semibold" style="background:${group <= step ? 'var(--gold-soft)' : 'var(--surface-2)'}; color:${group <= step ? 'var(--gold-brand)' : 'var(--text-3)'}; border:1px solid ${group === step ? 'var(--gold-brand)' : 'var(--border)'};">${String(n).padStart(2, '0')}</span>`;
    }).join('')}</div></div>
  </aside>`;
}
function renderListPropStep1(d) {
  return `${lpStepHeader(1)}<div class="space-y-4">
    <section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="target" class="w-4 h-4" style="color: var(--gold-brand);"></i>01. Зар оруулах ${lpBadge(true)}</div><div class="grid sm:grid-cols-2 gap-3">${SMART_LIST_PROP_GOALS.map((g) => {
      const active = d.goal === g.key;
      return `<button type="button" onclick="setListPropGoal('${g.key}')" class="card p-4 text-left hover:border-[var(--gold-brand)]" style="${active ? 'border-color: var(--gold-brand); background: var(--gold-soft);' : ''}"><div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style="background:${active ? 'var(--gold-brand)' : 'var(--primary-soft)'}; color:${active ? '#0A1F44' : 'var(--primary)'};"><i data-lucide="${g.icon}" class="w-5 h-5"></i></div><div class="text-sm font-semibold">${g.label}</div><div class="text-[11px] mt-1 leading-relaxed" style="color: var(--text-3);">${g.hint}</div></button>`;
    }).join('')}</div></section>
    <section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4" style="color: var(--gold-brand);"></i>02. Үл хөдлөх эд хөрөнгийн зориулалт ${lpBadge(true)}</div><div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">${SMART_LIST_PROP_TYPES.map((t) => {
      const active = d.propertyType === t.key;
      return `<button type="button" onclick="setListPropField('propertyType', '${t.key}')" class="p-3 rounded-lg text-left hover:bg-[var(--surface-2)]" style="border:1px solid ${active ? 'var(--gold-brand)' : 'var(--border)'}; background:${active ? 'var(--gold-soft)' : 'var(--surface)'};"><div class="flex items-start gap-2"><span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background:${active ? 'var(--gold-brand)' : 'var(--primary-soft)'}; color:${active ? '#0A1F44' : 'var(--primary)'};"><i data-lucide="${t.icon}" class="w-4 h-4"></i></span><span><span class="block text-sm font-semibold leading-tight">${t.label}</span><span class="block text-[11px] mt-1 leading-snug" style="color: var(--text-3);">${t.hint}</span></span></div></button>`;
    }).join('')}</div></section>
    <section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="git-branch" class="w-4 h-4" style="color: var(--gold-brand);"></i>03. Үл хөдлөх эд хөрөнгийн зориулалт - дэд зориулалт ${lpBadge(true)}</div><div class="flex flex-wrap gap-2">${(SMART_LIST_PROP_SUBTYPES[d.propertyType] || []).map((s) => `<button type="button" onclick="setListPropField('subtype', '${lpJS(s)}')" class="bm-chip ${d.subtype === s ? 'active' : ''}" style="max-width:100%; white-space:normal; text-align:left; ${d.subtype === s ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">${lpEsc(s)}</button>`).join('')}</div></section>
  </div>`;
}
function lpFloorList(d) {
  const basement = Math.max(0, parseInt(d.address.floorBasement, 10) || 0);
  const above = Math.max(1, parseInt(d.address.floorAbove, 10) || 1);
  return Array.from({ length: basement }, (_, i) => `B${basement - i}`).concat(
    Array.from({ length: Math.min(above, 80) }, (_, i) => `F${String(i + 1).padStart(2, '0')}`),
  );
}
function lpNormalizeSelectedFloor(d) {
  const floors = lpFloorList(d);
  if (!floors.includes(d.address.selectedFloor)) d.address.selectedFloor = floors.includes('F01') ? 'F01' : floors[0];
}
function lpFloorOptions(d) {
  lpNormalizeSelectedFloor(d);
  return lpFloorList(d)
    .filter(Boolean)
    .map((x) => `<option value="${lpEsc(x)}" ${d.address.selectedFloor === x ? 'selected' : ''}>${lpEsc(x)}</option>`)
    .join('');
}
function lpClampInt(value, min = 0, max = 99) {
  const n = parseInt(value, 10);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
function lpClampDecimal(value, min = 0, max = 99999, decimals = 0) {
  const n = parseFloat(value);
  const clamped = Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
  if (!decimals) return Math.round(clamped);
  const pow = Math.pow(10, decimals);
  return Number((Math.round(clamped * pow) / pow).toFixed(decimals));
}
function lpNumberStepper(path, value, opts = {}) {
  const min = opts.min == null ? 0 : Number(opts.min);
  const max = opts.max == null ? 99999 : Number(opts.max);
  const step = opts.step == null ? 1 : Number(opts.step);
  const decimals = opts.decimals == null ? 0 : Number(opts.decimals);
  const current = parseFloat(value);
  const hasValue = Number.isFinite(current);
  const safePath = lpJS(path);
  const inputValue = value == null ? '' : String(value);
  const placeholder = opts.placeholder == null ? '' : String(opts.placeholder);
  const quick = Array.isArray(opts.quick)
    ? opts.quick
        .map((n) => {
          const active = hasValue && Math.abs(current - Number(n)) < 0.001;
          const label = opts.quickSuffix ? `${n}${opts.quickSuffix}` : String(n);
          return `<button type="button" class="lp-quick-chip ${active ? 'is-active' : ''}" onclick="setListPropNumber('${safePath}', ${Number(n)}, ${min}, ${max}, ${decimals})">${lpEsc(label)}</button>`;
        })
        .join('')
    : '';
  return `<div class="lp-step-control">
    ${lpLabel(opts.label || '', !!opts.required)}
    <div class="lp-stepper">
      <button type="button" class="lp-step-btn" onclick="adjustListPropNumber('${safePath}', ${-step}, ${min}, ${max}, ${decimals})" ${hasValue && current <= min ? 'disabled' : ''} aria-label="${lpEsc(opts.label || 'Тоо')} хасах" title="-${step}">
        <i data-lucide="minus" class="w-3.5 h-3.5"></i>
      </button>
      <input class="lp-step-value num" type="number" inputmode="${decimals ? 'decimal' : 'numeric'}" min="${min}" max="${max}" step="${step}" placeholder="${lpEsc(placeholder)}" value="${lpEsc(inputValue)}" onfocus="this.select()" oninput="setListPropField('${safePath}', this.value)" onchange="setListPropField('${safePath}', this.value); rerenderListProp()" />
      <button type="button" class="lp-step-btn primary" onclick="adjustListPropNumber('${safePath}', ${step}, ${min}, ${max}, ${decimals})" ${hasValue && current >= max ? 'disabled' : ''} aria-label="${lpEsc(opts.label || 'Тоо')} нэмэх" title="+${step}">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
      </button>
    </div>
    ${quick ? `<div class="lp-quick-row">${quick}</div>` : ''}
    ${opts.hint ? `<div class="lp-step-note">${lpEsc(opts.hint)}</div>` : ''}
  </div>`;
}
function lpAreaQuickValues(d) {
  if (d.propertyType === 'land') return [300, 500, 700, 1000, 1500];
  if (d.propertyType === 'parking') return [12, 15, 18, 24, 30];
  if (d.propertyType === 'warehouse' || d.propertyType === 'industrial') return [50, 100, 200, 500, 1000];
  if (lpCommercial(d)) return [30, 50, 80, 120, 200];
  return [30, 40, 50, 60, 80, 100];
}
function lpFormatFloor(type, num) {
  const n = lpClampInt(num, 1, 99);
  return type === 'B' ? `B${n}` : `F${String(n).padStart(2, '0')}`;
}
function lpFloorParts(d) {
  lpNormalizeSelectedFloor(d);
  const raw = String(d.address.selectedFloor || 'F01');
  const type = raw[0] === 'B' ? 'B' : 'F';
  const num = lpClampInt(raw.replace(/\D/g, ''), 1, type === 'B' ? Math.max(1, parseInt(d.address.floorBasement, 10) || 1) : Math.max(1, parseInt(d.address.floorAbove, 10) || 1));
  return { type, num, value: lpFormatFloor(type, num) };
}
function lpFloorTitle(value) {
  const raw = String(value || 'F01');
  if (raw[0] === 'B') return `${raw} · зоорийн ${parseInt(raw.slice(1), 10) || 1}`;
  return `${raw} · ${parseInt(raw.slice(1), 10) || 1}-р давхар`;
}
function lpFloorCandidates(d) {
  const basement = Math.max(0, parseInt(d.address.floorBasement, 10) || 0);
  const above = Math.max(0, parseInt(d.address.floorAbove, 10) || 0);
  const items = [];
  if (basement > 1) items.push({ type: 'B', num: basement });
  if (basement > 0) items.push({ type: 'B', num: 1 });
  [1, 2, 3, Math.ceil((above || 1) / 2), above || 1]
    .filter((n) => n >= 1 && n <= Math.max(above, 1))
    .forEach((num) => items.push({ type: 'F', num }));
  const seen = new Set();
  return items.filter((item) => {
    const key = lpFormatFloor(item.type, item.num);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function lpFloorNumberStepper(selected, basement, above) {
  const max = selected.type === 'B' ? 20 : 80;
  const label = selected.type === 'B' ? 'Зоорийн давхар сонгох' : 'Үндсэн давхар сонгох';
  const hint = selected.type === 'B' ? `${basement || 1} хүртэл B давхар` : `${above || 1} хүртэл F давхар`;
  return `<div class="lp-step-control">
    ${lpLabel(label, false)}
    <div class="lp-stepper">
      <button type="button" class="lp-step-btn" onclick="adjustListPropSelectedFloor(-1)" ${selected.num <= 1 ? 'disabled' : ''} aria-label="${lpEsc(label)} хасах" title="-1">
        <i data-lucide="minus" class="w-3.5 h-3.5"></i>
      </button>
      <input class="lp-step-value num" type="number" inputmode="numeric" min="1" max="${max}" step="1" value="${selected.num}" onfocus="this.select()" onchange="setListPropFloor('${selected.type}', this.value)" aria-label="${lpEsc(label)}" />
      <button type="button" class="lp-step-btn primary" onclick="adjustListPropSelectedFloor(1)" ${selected.num >= max ? 'disabled' : ''} aria-label="${lpEsc(label)} нэмэх" title="+1">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
      </button>
    </div>
    <div class="lp-step-note">${lpEsc(hint)}</div>
  </div>`;
}
function lpFloorPicker(d) {
  const basement = Math.max(0, parseInt(d.address.floorBasement, 10) || 0);
  const above = Math.max(0, parseInt(d.address.floorAbove, 10) || 0);
  const selected = lpFloorParts(d);
  const quick = lpFloorCandidates(d)
    .map((item) => {
      const value = lpFormatFloor(item.type, item.num);
      const active = selected.value === value;
      return `<button type="button" class="lp-quick-chip ${active ? 'is-active' : ''}" onclick="setListPropFloor('${item.type}', ${item.num})">${lpEsc(value)}</button>`;
    })
    .join('');
  return `<div class="lp-floor-picker">
    <div class="lp-floor-selected">
      <div class="lp-floor-selected-label">Байрлах давхар</div>
      <div class="lp-floor-selected-value">${lpEsc(lpFloorTitle(selected.value))}</div>
      <div class="lp-floor-type-row">
        <button type="button" class="lp-floor-type-btn ${selected.type === 'F' ? 'is-active' : ''}" onclick="setListPropFloorType('F')"><i data-lucide="building-2" class="w-3.5 h-3.5"></i>Үндсэн</button>
        <button type="button" class="lp-floor-type-btn ${selected.type === 'B' ? 'is-active' : ''}" onclick="setListPropFloorType('B')"><i data-lucide="layers-2" class="w-3.5 h-3.5"></i>Зоорь</button>
      </div>
    </div>
    <div>
      ${lpFloorNumberStepper(selected, basement, above)}
      ${quick ? `<div class="lp-quick-row">${quick}</div>` : ''}
    </div>
  </div>`;
}
function lpApplySelectedFloor(d, type, num) {
  const floorType = type === 'B' ? 'B' : 'F';
  const floorNum = lpClampInt(num, 1, floorType === 'B' ? 20 : 80);
  if (floorType === 'B') d.address.floorBasement = Math.max(parseInt(d.address.floorBasement, 10) || 0, floorNum);
  else d.address.floorAbove = Math.max(parseInt(d.address.floorAbove, 10) || 0, floorNum);
  d.address.selectedFloor = lpFormatFloor(floorType, floorNum);
  d.address.floorTotal = (parseInt(d.address.floorBasement, 10) || 0) + (parseInt(d.address.floorAbove, 10) || 0);
}
function lpField(label, required, control, hint = '') {
  return `<div><label class="lp-field-label">${lpEsc(label)}${lpBadge(required)}</label>${control}${hint ? `<div class="lp-field-hint">${hint}</div>` : ''}</div>`;
}
function lpM2(value) {
  const n = parseFloat(value);
  return n > 0 ? `${n.toLocaleString('en-US')} м²` : '-';
}
function lpAreaTile(label, value, strong = false) {
  return `<div class="lp-area-tile ${strong ? 'strong' : ''}"><div class="lp-area-value">${lpEsc(value)}</div><div class="lp-area-label">${lpEsc(label)}</div></div>`;
}
function lpMetaTile(label, value, icon) {
  return `<div class="lp-meta-tile"><div class="lp-meta-label"><i data-lucide="${icon}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>${lpEsc(label)}</div><div class="lp-meta-value">${lpEsc(value || '-')}</div></div>`;
}
function lpAddressLine(d) {
  return [
    d.address.district,
    d.address.khoroo ? `${d.address.khoroo}-р хороо` : '',
    d.address.khotkhon || d.address.street,
    d.address.buildingNumber ? `${d.address.buildingNumber}-р байр` : d.address.buildingName,
  ]
    .filter(Boolean)
    .join(', ');
}
function lpMap(d) {
  const hasLink = !!String(d.address.googleMapLink || '').trim();
  const statusIcon = d.locationTouched ? 'check-circle-2' : hasLink ? 'link' : 'map-pin';
  const status = d.locationTouched ? 'Pin баталгаажсан' : hasLink ? 'Google Maps линк нэмсэн' : 'Дүүргийн дундаж цэг';
  const pinLabel = d.locationTouched ? 'Сонгосон байршил' : d.address.khotkhon || d.address.district || 'Байршил';
  const manualLine = lpAddressLine(d) || `${d.address.country}, ${d.address.city}`;
  return `
    <div class="lp-map-panel">
      <div class="lp-map-frame">
        ${mapBackground([], { showControls: false, showZoneSummary: false, showContext: false, interactiveZones: false, showMyPlaces: false, style: 'height: 100%; border-radius: 0;' })}
        <div onclick="setListPropLocation(event)" class="lp-map-click" title="Газрын зураг дээр дарж тэмдэглэнэ"></div>
        <div class="lp-map-top">
          <span class="lp-map-status"><i data-lucide="${statusIcon}" class="w-3.5 h-3.5" style="color:${d.locationTouched ? 'var(--success)' : 'var(--gold-brand)'};"></i>${status}</span>
          <span class="lp-map-accuracy"><i data-lucide="${d.locationTouched ? 'badge-check' : 'crosshair'}" class="w-3.5 h-3.5"></i>${d.locationTouched ? 'Нарийвчилсан' : 'Нарийвчлах'}</span>
        </div>
        <div class="lp-map-pin" style="left:${d.lat * 100}%; top:${d.lng * 100}%;">
          <div class="lp-map-pin-inner"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i>${lpEsc(pinLabel)}</div>
        </div>
        <div class="lp-map-bottom">
          <span class="flex items-center gap-2 min-w-0"><i data-lucide="mouse-pointer-click" class="w-3.5 h-3.5 shrink-0" style="color: var(--gold-brand);"></i><span class="truncate">Газрын зураг дээрээс барилга / газар сонгох</span></span>
          <span class="text-[11px]" style="color: rgba(255,255,255,.72);">${d.locationTouched ? 'Сонгосон' : 'Сонгоогүй'}</span>
        </div>
      </div>
      <div class="lp-map-meta">
        ${lpMetaTile('Гараар оруулсан хаяг', manualLine, 'map-pinned')}
        ${lpMetaTile('Баталгаажуулалт', d.locationTouched ? 'Map pin сонгосон' : hasLink ? 'Линкээр дэмжсэн' : 'Гараар үргэлжилнэ', 'shield-check')}
      </div>
    </div>`;
}
function renderListPropStep2(d) {
  const areaCert = parseFloat(d.specs.areaCert) || 0;
  const areaInterior = parseFloat(d.specs.areaInterior) || 0;
  const extraArea = ['areaBalcony', 'areaGarage', 'areaStorage'].reduce((sum, key) => sum + (parseFloat(d.specs[key]) || 0), 0);
  const areaWarn = areaCert > 0 && areaInterior > areaCert;
  const roomSummary = lpNeedsRooms(d) ? (d.specs.rooms ? `${d.specs.rooms} өрөө` : 'Сонгоогүй') : lpType(d.propertyType).label;
  const floorBasement = Math.max(0, parseInt(d.address.floorBasement, 10) || 0);
  const floorAbove = Math.max(0, parseInt(d.address.floorAbove, 10) || 0);
  const floorTotal = floorBasement + floorAbove;
  const floorText = floorTotal ? `${floorBasement ? `${floorBasement} зоорь` : 'зоорьгүй'} · ${floorAbove ? `${floorAbove} үндсэн` : 'үндсэн давхаргүй'} · ${lpFloorTitle(d.address.selectedFloor || 'F01')}` : 'Давхрын мэдээлэл хоосон';
  const khotkhonOptions = KHOTKHON.map((x) => `<option value="${lpEsc(x)}"></option>`).join('');
  return `${lpStepHeader(2)}<div class="space-y-4">
    <section class="card p-5">
      <div class="lp-section-head">
        <div>
          <div class="lp-section-title"><i data-lucide="map-pin" class="w-4 h-4" style="color: var(--gold-brand);"></i>04. Хаяг, байршил ${lpBadge(true)}</div>
          <div class="lp-section-sub">Эхлээд дүүрэг, хороо, хотхон/гудамжаа бөглөөд дараа нь барилга, давхар, map pin-ээ нарийвчилна.</div>
        </div>
        <span class="pill pill-info"><i data-lucide="${d.locationTouched ? 'check-circle-2' : 'circle-alert'}" class="w-3.5 h-3.5"></i>${d.locationTouched ? 'Байршил сонгосон' : 'Pin сонгоогүй'}</span>
      </div>
      <div class="lp-address-layout">
        <div class="lp-address-main">
          <div class="lp-lock-row">
            <span class="lp-lock-pill"><i data-lucide="lock" class="w-3.5 h-3.5"></i>${lpEsc(d.address.country)}</span>
            <span class="lp-lock-pill"><i data-lucide="building-2" class="w-3.5 h-3.5"></i>${lpEsc(d.address.city)}</span>
          </div>
          <div class="lp-form-band is-priority">
            <div class="lp-band-title"><i data-lucide="navigation" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>Үндсэн байршил</div>
            <div class="grid sm:grid-cols-2 gap-3">
              ${lpField('Дүүрэг / Сум', true, `<select class="input" onchange="setListPropField('address.district', this.value)">${DISTRICTS.map((x) => `<option value="${lpEsc(x)}" ${d.address.district === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`)}
              ${lpField('Хороо / Баг', true, `<input class="input num" inputmode="numeric" placeholder="15" value="${lpEsc(d.address.khoroo)}" oninput="setListPropField('address.khoroo', this.value)" />`)}
              ${lpField('Хотхон, хороолол', true, `<input class="input" list="khotkhon-options" placeholder="Time Tower" value="${lpEsc(d.address.khotkhon)}" oninput="setListPropField('address.khotkhon', this.value)" /><datalist id="khotkhon-options">${khotkhonOptions}</datalist>`, 'Гудамжтай бол хоосон үлдээж болно.')}
              ${lpField('Гудамж', false, `<input class="input" placeholder="Нарны зам" value="${lpEsc(d.address.street)}" oninput="setListPropField('address.street', this.value)" />`, 'Хотхон байхгүй үед гудамж нь заавалд тооцогдоно.')}
            </div>
          </div>
          <div class="lp-form-band">
            <div class="lp-band-title"><i data-lucide="layers-3" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>Давхар, хаалга</div>
            <div class="lp-floor-grid">
              <div class="lp-floor-total">
                <div class="lp-floor-total-label">Нийт давхар</div>
                <div class="lp-floor-total-value">${floorTotal || '-'}</div>
                <div class="lp-floor-total-note">${floorBasement ? `B${floorBasement} хүртэл` : 'Зоорьгүй'} · ${floorAbove ? `F${String(floorAbove).padStart(2, '0')} хүртэл` : 'Үндсэн давхаргүй'}</div>
              </div>
              ${lpNumberStepper('address.floorBasement', d.address.floorBasement, { label: 'Зоорийн давхрын тоо', min: 0, max: 20, step: 1, hint: 'B1, B2 гэх мэт.' })}
              ${lpNumberStepper('address.floorAbove', d.address.floorAbove, { label: 'Үндсэн давхрын тоо', min: 0, max: 80, step: 1, hint: 'F01, F02 гэх мэт.' })}
            </div>
            ${lpFloorPicker(d)}
            <div class="lp-field-grid-tight mt-3">
              ${lpField('Тоот / хаалга', false, `<input class="input" placeholder="301" value="${lpEsc(d.address.unit)}" oninput="setListPropField('address.unit', this.value)" />`)}
              ${lpField('Google Maps линк', false, `<input class="input" type="url" placeholder="https://maps.google.com/..." value="${lpEsc(d.address.googleMapLink || '')}" oninput="setListPropField('address.googleMapLink', this.value)" />`)}
            </div>
            <div class="lp-inline-alert"><i data-lucide="calculator" class="w-4 h-4 shrink-0" style="color: var(--gold-brand);"></i><span>${lpEsc(floorText)}</span></div>
          </div>
          <div class="lp-form-band">
            <div class="lp-band-title"><i data-lucide="signpost" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>Нарийвчилсан хаяг</div>
            <div class="grid sm:grid-cols-2 gap-3">
              ${lpField('Хаягийн бүс / zipcode', false, `<input class="input num" inputmode="numeric" placeholder="17011" value="${lpEsc(d.address.zip)}" oninput="setListPropField('address.zip', this.value)" />`)}
              ${lpField('Гудамжны дугаар', false, `<input class="input" placeholder="12" value="${lpEsc(d.address.streetNumber || '')}" oninput="setListPropField('address.streetNumber', this.value)" />`)}
              ${lpField('Барилга, байр, блокын дугаар', false, `<input class="input" placeholder="204" value="${lpEsc(d.address.buildingNumber)}" oninput="setListPropField('address.buildingNumber', this.value)" />`)}
              ${lpField('Барилга, байр, блокын нэр', false, `<input class="input" placeholder="A block" value="${lpEsc(d.address.buildingName || '')}" oninput="setListPropField('address.buildingName', this.value)" />`)}
            </div>
          </div>
          <div class="mt-3">
            ${lpField('Хаяг, байршлын тайлбар', false, `<textarea class="input" rows="3" placeholder="Орц, хашаа, орох зам, таних тэмдэг..." oninput="setListPropField('address.note', this.value)">${lpEsc(d.address.note || '')}</textarea>`)}
          </div>
        </div>
        ${lpMap(d)}
      </div>
    </section>
    <section class="card p-5">
      <div class="lp-section-head">
        <div>
          <div class="lp-section-title"><i data-lucide="ruler" class="w-4 h-4" style="color: var(--gold-brand);"></i>05. Үзүүлэлт ${lpBadge(true)}</div>
          <div class="lp-section-sub">Гэрчилгээний талбай нь үнэлгээ, нэгжийн үнэ, хайлтын шүүлтэд ашиглагдана. Нэмэлт талбайг тусад нь салгаж өгнө.</div>
        </div>
      </div>
      <div class="lp-spec-layout">
        <div class="lp-form-band is-priority">
          <div class="lp-band-title"><i data-lucide="maximize-2" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>Талбай</div>
          <div class="lp-field-grid-tight">
            ${lpNumberStepper('specs.areaCert', d.specs.areaCert, { label: `${lpAreaLabel(d)} (м²)`, required: true, min: 0, max: 99999, step: 1, decimals: 1, placeholder: '0', quick: lpAreaQuickValues(d), quickSuffix: ' м²', hint: 'Гэрчилгээний үндсэн талбай.' })}
            ${lpNumberStepper('specs.areaInterior', d.specs.areaInterior, { label: 'Дотор цэвэр талбай (м²)', min: 0, max: 99999, step: 1, decimals: 1, quick: [30, 50, 70, 90], quickSuffix: ' м²' })}
          </div>
          <div class="lp-field-grid-tight mt-3">
            ${lpNumberStepper('specs.areaBalcony', d.specs.areaBalcony, { label: 'Тагт / террас / лодж (м²)', min: 0, max: 99999, step: 0.5, decimals: 1, quick: [2, 4, 6, 8], quickSuffix: ' м²' })}
            ${lpNumberStepper('specs.areaGarage', d.specs.areaGarage, { label: 'Авто дулаан зогсоол (м²)', min: 0, max: 99999, step: 1, decimals: 1, quick: [12, 15, 18, 24], quickSuffix: ' м²' })}
            ${lpNumberStepper('specs.areaStorage', d.specs.areaStorage || '', { label: 'Агуулах, техникийн өрөө (м²)', min: 0, max: 99999, step: 1, decimals: 1, quick: [2, 4, 6, 10], quickSuffix: ' м²' })}
          </div>
          ${areaWarn ? `<div class="lp-inline-alert warn"><i data-lucide="triangle-alert" class="w-4 h-4 shrink-0"></i><span>Дотор цэвэр талбай гэрчилгээний талбайгаас их байна. Тоогоо дахин шалгана уу.</span></div>` : ''}
        </div>
        <div class="lp-area-summary">
          ${lpAreaTile(lpAreaLabel(d), lpM2(areaCert), true)}
          ${lpAreaTile('Дотор цэвэр талбай', lpM2(areaInterior))}
          ${lpAreaTile('Нэмэлт талбай', lpM2(extraArea))}
          ${lpAreaTile('Өрөөний бүтэц', roomSummary)}
        </div>
      </div>
      ${
        lpNeedsRooms(d)
          ? `<div class="lp-form-band">
            <div class="lp-band-title"><i data-lucide="door-open" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>Өрөөний бүтэц</div>
            <div class="grid md:grid-cols-3 gap-3">
              ${lpNumberStepper('specs.rooms', d.specs.rooms || '', { label: 'Нийт өрөөний тоо', required: true, min: 1, max: 20, step: 1, quick: [1, 2, 3, 4, 5] })}
              ${lpNumberStepper('specs.bedrooms', d.specs.bedrooms || '', { label: 'Унтлагын өрөөний нийт тоо', min: 0, max: 20, step: 1, quick: [0, 1, 2, 3, 4] })}
              ${lpNumberStepper('specs.bathrooms', d.specs.bathrooms || '', { label: 'Ариун цэврийн өрөөний нийт тоо', min: 0, max: 20, step: 1, quick: [0, 1, 2, 3, 4] })}
            </div>
            ${renderListPropWindowMap(d)}
          </div>`
          : ''
      }
      ${lpCommercial(d) ? `<div class="lp-form-band"><div class="lp-band-title"><i data-lucide="briefcase-business" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>Тохиромжтой чиглэл</div><div class="flex flex-wrap gap-2">${SMART_LIST_PROP_OFFICE_NEEDS.map((x) => lpChip('specs.officeNeeds', x, (d.specs.officeNeeds || []).includes(x))).join('')}</div></div>` : ''}
      <div class="mt-4">${lpField('Өрөөнүүдийн талаар нэмэлт мэдээлэл, тайлбар', false, `<textarea class="input" rows="3" placeholder="Обьектын онцлог, давуу тал, тохиромжтой хэрэглээг товч бичнэ үү" oninput="setListPropField('desc', this.value)">${lpEsc(d.desc)}</textarea>`)}</div>
    </section>
    ${renderListPropRoomsTable(d)}
  </div>`;
}
function renderListPropStep3(d) {
  const popular = lpCommercial(d) ? ['Харуул, хамгаалалт 24/7', 'Домофон, дохиолол', 'Лифт - зорчигчийн 24/7', 'Төлбөртэй дулаан зогсоол', 'Фитнес, иога, веллнесс', 'Ресторан', 'Цахилгаан машины цэнэглэл станц', 'Лифт - ачааны 24/7'] : ['Хүнсний дэлгүүр', 'Фитнес, иога, веллнесс', 'Хүүхдийн тоглоомын талбай', 'Лифт - зорчигчийн 24/7', 'Төлбөргүй ил зогсоол', 'Харуул, хамгаалалт 24/7', 'Домофон, дохиолол', 'Ногоон байгууламж, нарлах салхилах талбай'];
  return `${lpStepHeader(3)}<div class="space-y-4">
    <section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="plug-zap" class="w-4 h-4" style="color: var(--gold-brand);"></i>06. Үзүүлэлт - Дэд бүтэц ${lpBadge(false)}</div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${SMART_LIST_PROP_INFRA.map((f) => `<div>${lpLabel(f.label, ['heating', 'electric', 'waterCold', 'sewage', 'road'].includes(f.key))}<div class="relative"><i data-lucide="${f.icon}" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style="color: var(--gold-brand);"></i><select class="input pl-9" onchange="setListPropField('infra.${f.key}', this.value)">${(f.choices || SMART_LIST_PROP_INFRA_CHOICES).map((x) => `<option value="${lpEsc(x)}" ${d.infra[f.key] === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>`).join('')}</div><div class="mt-4">${lpLabel('Дэд бүтцийн бусад тайлбар', false)}<textarea class="input" rows="2" placeholder="Бусад эх үүсвэр, нөөцлүүр, хүчин чадал..." oninput="setListPropField('infra.note', this.value)">${lpEsc(d.infra.note || '')}</textarea></div></section>
    <section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="badge-check" class="w-4 h-4" style="color: var(--gold-brand);"></i>07. Хотхон, төслийн дундын хэрэглээ, үйлчилгээ, аюулгүй байдал, тав тух ${lpBadge(false)}</div><div class="flex flex-wrap gap-2 mb-4">${popular.map((x) => { const g = SMART_LIST_PROP_COMMUNITY.find((c) => c.items.includes(x)); return lpChip(`community.${g ? g.key : 'amenities'}`, x, (d.community[g ? g.key : 'amenities'] || []).includes(x)); }).join('')}</div><details class="rounded-lg" style="border:1px solid var(--border); background: var(--surface-2);"><summary class="cursor-pointer px-3 py-2 text-sm font-semibold">Бүх үйлчилгээ, аюулгүй байдал, тав тухыг харах</summary><div class="p-3 space-y-4">${SMART_LIST_PROP_COMMUNITY.map((g) => `<div><div class="text-xs font-semibold mb-2 flex items-center gap-1.5" style="color: var(--text-2);"><i data-lucide="${g.icon}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>${g.title}</div><div class="flex flex-wrap gap-2">${g.items.map((x) => lpChip(`community.${g.key}`, x, (d.community[g.key] || []).includes(x))).join('')}</div></div>`).join('')}</div></details></section>
    <section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="package-check" class="w-4 h-4" style="color: var(--gold-brand);"></i>08. Үнэд багтсан дагалдах зүйлс ${lpBadge(false)}</div><div class="space-y-4">${SMART_LIST_PROP_INCLUDED.map((g) => `<div><div class="text-xs font-semibold mb-2 flex items-center gap-1.5" style="color: var(--text-2);"><i data-lucide="${g.icon}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>${g.title}</div><div class="flex flex-wrap gap-2">${g.items.map((x) => lpChip(`included.${g.key}`, x, (d.included[g.key] || []).includes(x))).join('')}</div></div>`).join('')}</div></section>
  </div>`;
}
function renderListPropPricing(d) {
  const sale = lpMode(d.goal) === 'sale';
  const area = parseFloat(d.specs.areaCert) || 0;
  const price = lpPrice(d);
  const unit = area && price ? Math.round(price / area) : 0;
  const deposit = parseFloat(d.pricing.deposit) || 0;
  return `<section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="banknote" class="w-4 h-4" style="color: var(--gold-brand);"></i>10. Үнэ, төлбөрийн нөхцөл ${lpBadge(true)}</div><div class="grid md:grid-cols-2 gap-3"><div>${lpLabel(sale ? 'Нийт үнэ (₮)' : 'Нийт үнэ/сар (₮)', true)}<input class="input num" type="number" min="0" placeholder="${sale ? '450000000' : '4000000'}" value="${lpEsc(sale ? d.pricing.totalPrice : d.pricing.monthlyPrice)}" oninput="setListPropField('${sale ? 'pricing.totalPrice' : 'pricing.monthlyPrice'}', this.value)" /></div><div>${lpLabel(sale ? 'Нэгжийн үнэ (₮/м²)' : 'Нэгжийн үнэ/сар (₮/м²/сар)', false)}<input class="input num" value="${unit ? unit.toLocaleString('en-US') : ''}" placeholder="Нийт үнийг нийт м²-т хувааж гаргана" disabled /></div>${sale ? `<label class="flex items-center gap-2 p-3 rounded-lg cursor-pointer" style="border:1px solid var(--border);"><input type="checkbox" class="accent-[var(--gold-brand)]" ${d.pricing.vatIncluded ? 'checked' : ''} onchange="setListPropField('pricing.vatIncluded', this.checked)" /><span class="text-sm">Дээрх үнэд НӨАТ багтсан уу? <strong>${d.pricing.vatIncluded ? 'Багтсан' : 'Багтаагүй'}</strong></span></label><label class="flex items-center gap-2 p-3 rounded-lg cursor-pointer" style="border:1px solid var(--border);"><input type="checkbox" class="accent-[var(--gold-brand)]" ${d.pricing.ebarimt ? 'checked' : ''} onchange="setListPropField('pricing.ebarimt', this.checked)" /><span class="text-sm">Гэрээлэгч-ид НӨАТ-тэй ebarimt олгох эсэх? <strong>${d.pricing.ebarimt ? 'Олгоно' : 'Олгохгүй'}</strong></span></label>` : `<div>${lpLabel('Давтамж', false)}<select class="input" onchange="setListPropField('pricing.rentFrequency', this.value)">${SMART_LIST_PROP_RENT_FREQUENCIES.map((x) => `<option value="${x}" ${d.pricing.rentFrequency === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('Барьцаа (₮)', false)}<input class="input num" type="number" min="0" placeholder="4000000" value="${lpEsc(d.pricing.deposit)}" oninput="setListPropField('pricing.deposit', this.value)" /></div><label class="flex items-center gap-2 p-3 rounded-lg cursor-pointer" style="border:1px solid var(--border);"><input type="checkbox" class="accent-[var(--gold-brand)]" ${d.pricing.vatIncluded ? 'checked' : ''} onchange="setListPropField('pricing.vatIncluded', this.checked)" /><span class="text-sm">Дээрх үнэд НӨАТ багтсан уу? <strong>${d.pricing.vatIncluded ? 'Багтсан' : 'Багтаагүй'}</strong></span></label><label class="flex items-center gap-2 p-3 rounded-lg cursor-pointer" style="border:1px solid var(--border);"><input type="checkbox" class="accent-[var(--gold-brand)]" ${d.pricing.ebarimt ? 'checked' : ''} onchange="setListPropField('pricing.ebarimt', this.checked)" /><span class="text-sm">Гэрээлэгч-ид НӨАТ-тэй ebarimt олгох эсэх? <strong>${d.pricing.ebarimt ? 'Олгоно' : 'Олгохгүй'}</strong></span></label>`}</div>${sale ? `<div class="mt-4">${lpLabel('ТӨЛБӨРИЙН НӨХЦӨЛ', false)}<div class="flex flex-wrap gap-2">${SMART_LIST_PROP_SALE_PAYMENT_FORMS.map((x) => lpChip('pricing.paymentForms', x, (d.pricing.paymentForms || []).includes(x))).join('')}</div></div>` : `<div class="mt-4 overflow-x-auto rounded-lg" style="border:1px solid var(--border);"><div style="min-width:760px;"><div class="grid grid-cols-5 text-[11px] font-semibold" style="background: var(--surface-2); color: var(--text-3);"><div class="p-2">Давтамж</div><div class="p-2">Хөнгөлөлт %</div><div class="p-2">Үнийн дүн [төгрөг/сар]</div><div class="p-2">Үнийн дүн [төгрөг]</div><div class="p-2">Анхны төлбөр [төгрөг]</div></div>${[1, 2, 3, 4, 6, 12].map((m) => { const disc = parseFloat(d.pricing.rentDiscounts[m]) || 0; const monthly = price ? Math.round(price * (1 - disc / 100)) : 0; const total = monthly * m; const first = total + deposit; return `<div class="grid grid-cols-5 items-center border-t" style="border-color: var(--border);"><div class="p-2 text-sm">${m} сар тутам</div><div class="p-2"><input class="input num !py-1.5" type="number" min="0" max="100" value="${disc}" oninput="setListPropDiscount(${m}, this.value)" /></div><div class="p-2 text-sm num">${monthly ? monthly.toLocaleString('en-US') + '₮' : '-'}</div><div class="p-2 text-sm num">${total ? total.toLocaleString('en-US') + '₮' : '-'}</div><div class="p-2 text-sm num">${first ? first.toLocaleString('en-US') + '₮' : '-'}</div></div>`; }).join('')}</div></div>`}</section>`;
}
function renderListPropMedia(d) {
  const photos = lpPhotos(d);
  const cats = ['Нүүрний зураг', 'План зураг', 'Дотор зураг', 'Гадна орчны зураг', 'Мастер төлөвлөгөө, хотхоны зураг', 'Дотроос гадагшаа харагдацын зураг', 'Хотхоны бусад үзүүлэлтийн зураг', 'Бичлэг'];
  return `<section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="images" class="w-4 h-4" style="color: var(--gold-brand);"></i>11. Зураг, бичлэг ${lpBadge(true)}</div><div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">${cats.map((c) => `<button type="button" onclick="addListPropPhoto('${lpJS(c)}')" class="p-3 rounded-lg text-left hover:bg-[var(--surface-2)]" style="border:1px dashed var(--border-strong);"><i data-lucide="${c === 'Нүүрний зураг' ? 'image-up' : c === 'План зураг' ? 'scan' : c === 'Бичлэг' ? 'video' : 'plus'}" class="w-4 h-4 mb-2" style="color: var(--gold-brand);"></i><div class="text-xs font-semibold">${c}</div><div class="text-[10px] mt-0.5" style="color: var(--text-3);">${photos.filter((p) => p.category === c).length} файл</div></button>`).join('')}</div><div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">${photos.map((p, i) => `<div class="aspect-square rounded-lg bg-cover bg-center relative overflow-hidden" style="background-image:url('https://picsum.photos/seed/${lpEsc(p.seed)}/360/360'); border:2px solid ${Number(d.media.coverIndex) === i ? 'var(--gold-brand)' : 'var(--border)'};"><button type="button" onclick="setListPropCover(${i})" class="absolute left-1 top-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" style="background:${Number(d.media.coverIndex) === i ? 'var(--gold-brand)' : 'rgba(7,17,31,.75)'}; color:${Number(d.media.coverIndex) === i ? '#0A1F44' : '#fff'};" title="Нүүрний зургаа сонгох">${Number(d.media.coverIndex) === i ? 'Нүүр' : 'Сонгох'}</button><button type="button" onclick="removeListPropPhoto(${i})" class="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center" style="background: rgba(7,17,31,.82); color: #fff;"><i data-lucide="x" class="w-3.5 h-3.5"></i></button><div class="absolute inset-x-0 bottom-0 px-1.5 py-1 text-[9px] font-semibold truncate" style="background: rgba(7,17,31,.72); color:#fff;">${lpEsc(p.category || 'Зураг')}</div></div>`).join('')}${photos.length < 15 ? `<button type="button" onclick="addListPropPhoto('Дотор зураг')" class="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center" style="border-color: var(--border-strong); color: var(--text-3);"><i data-lucide="plus" class="w-5 h-5"></i></button>` : ''}</div><div class="mt-4">${lpLabel('Зураг, бичлэг агуулсан линк', false)}<input class="input" placeholder="https://..." value="${lpEsc(d.media.videoLink)}" oninput="setListPropField('media.videoLink', this.value)" /></div></section>`;
}
function renderListPropStep4(d) {
  const certOptions = ['Бэлэн гэрчилгээтэй', 'Дуусаагүй барилгын гэрчилгээтэй', 'Гэрчилгээгүй - Гэрчилгээ гарахад бэлэн', 'Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй', 'Бусад'];
  const interiorOptions = ['', 'Сүүлийн 1 жилийн хугацаанд засал хийсэн', '1-3 жилийн өмнө засал хийсэн', '3-с дээш жилийн өмнө засал хийсэн / Анхны заслаараа байгаа', 'Засваргүй, Гэрээлэгч өөрөө засал хийнэ', 'Бусад: Дотор засвар хийгдэж байгаа, хийгдэнэ'];
  const collateralOptions = ['Ямар нэг барьцаанд байхгүй', 'Банк, ББСБ, санхүүгийн байгууллагын зээлийн барьцаанд байгаа', 'Гуравдагч этгээдийн барьцаанд байгаа', 'Бусад'];
  return `${lpStepHeader(4)}<div class="space-y-4"><section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="clipboard-check" class="w-4 h-4" style="color: var(--gold-brand);"></i>09. Үл хөдлөх эд хөрөнгийн төлөв ${lpBadge(false)}</div><div class="grid md:grid-cols-2 gap-3"><div>${lpLabel('Ашиглалтад орсон эсэх', false)}<select class="input" onchange="setListPropField('state.usage', this.value)">${['Ашиглалтад орсон', 'Ашиглалтад ороогүй'].map((x) => `<option value="${lpEsc(x)}" ${d.state.usage === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('Ашиглалтад орсон он', false)}<input class="input num" type="number" min="1950" max="2035" placeholder="2020" value="${lpEsc(d.state.commissionYear)}" oninput="setListPropField('state.commissionYear', this.value)" /></div><div>${lpLabel('Ашиглалтад орох хугацаа', false)}<input class="input" placeholder="2026.IV" value="${lpEsc(d.state.commissionDue || '')}" oninput="setListPropField('state.commissionDue', this.value)" /></div><div>${lpLabel('Улсын бүртгэлийн гэрчилгээтэй эсэх', false)}<select class="input" onchange="setListPropField('state.certStatus', this.value)">${certOptions.map((x) => `<option value="${lpEsc(x)}" ${d.state.certStatus === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('ҮХЭХ улсын бүртгэлийн дугаар', false)}<input class="input mono" placeholder="Ү220#######" value="${lpEsc(d.state.certNumber)}" oninput="setListPropField('state.certNumber', this.value)" /></div><div>${lpLabel('Ашиглагдаж байсан байдал', false)}<select class="input" onchange="setListPropField('state.condition', this.value)">${['Цоо шинэ, ашиглаж байгаагүй', 'Ашиглагдаж байсан'].map((x) => `<option value="${lpEsc(x)}" ${d.state.condition === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('Одоогийн байдал (гэрээ байгуулах үеийн)', false)}<select class="input" onchange="setListPropField('state.current', this.value)">${['Түрээсийн эсхүл хөлслүүлэх гэрээтэй байгаа', 'Амьдарч, ашиглаж байгаа', 'Сул, чөлөөтэй байгаа', 'Бусад'].map((x) => `<option value="${lpEsc(x)}" ${d.state.current === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('Дотор засал', false)}<select class="input" onchange="setListPropField('state.interior', this.value)">${interiorOptions.map((x) => `<option value="${lpEsc(x)}" ${d.state.interior === x ? 'selected' : ''}>${x || 'Сонгох'}</option>`).join('')}</select></div><div>${lpLabel('Барьцаанд байгаа эсэх', false)}<select class="input" onchange="setListPropField('state.collateral', this.value)">${collateralOptions.map((x) => `<option value="${lpEsc(x)}" ${d.state.collateral === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="md:col-span-2">${lpLabel('Барьцаа, төлөвийн тайлбар', false)}<textarea class="input" rows="2" placeholder="Хэрэв аливаа хэлбэрийн барьцаанд байгаа бол тайлбар..." oninput="setListPropField('state.collateralNote', this.value)">${lpEsc(d.state.collateralNote || '')}</textarea></div></div><div class="flex flex-wrap gap-2 mt-4">${lpBool('state.certificateAttached', 'Гэрчилгээ хавсаргах', d.state.certificateAttached, 'paperclip')}${lpBool('state.contractAttached', 'Захиалгын гэрээ / улсын комиссын акт хавсаргах', d.state.contractAttached, 'paperclip')}</div></section>${renderListPropPricing(d)}${renderListPropMedia(d)}</div>`;
}
function lpReview(label, value, icon) {
  return `<div class="p-3 rounded-lg" style="border:1px solid var(--border); background: var(--surface);"><div class="text-[11px] mb-1 flex items-center gap-1.5" style="color: var(--text-3);">${icon ? `<i data-lucide="${icon}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>` : ''}${label}</div><div class="text-sm font-semibold truncate">${lpEsc(value || '-')}</div></div>`;
}
function renderListPropStep5(d) {
  const price = lpPrice(d);
  const missing = lpRequired(d).filter((x) => !x.ok);
  const suggested = lpOptional(d).filter((x) => !x.ok).slice(0, 4);
  const relations = ['Өмчлөгч', 'Эрх эзэмшигч', 'Гэрээний эрх эзэмшигч', 'Өмчлөгч, эрх эзэмшигч хуулийн этгээдийн ажилтан', 'Хууль ёсны итгэмжлэгдсэн төлөөлөгч', 'Өмчлөгч, эрх эзэмшигчийн ойр дотнын хүн', 'Зуучлагч', 'Бусад'];
  return `${lpStepHeader(5)}<div class="space-y-4"><section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="search-check" class="w-4 h-4" style="color: var(--gold-brand);"></i>12. Шалгах, баталгаажуулах ${lpBadge(true)}</div><div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">${lpReview('Зорилго', lpGoal(d.goal).label, 'target')}${lpReview('Төрөл', `${lpType(d.propertyType).label} · ${d.subtype}`, 'building-2')}${lpReview('Байршил', `${d.address.district}, ${d.address.khoroo || '-'}-р хороо`, 'map-pin')}${lpReview('Үнэ', price ? price.toLocaleString('en-US') + '₮' + (lpMode(d.goal) === 'rent' ? '/сар' : '') : '', 'banknote')}</div>${missing.length ? `<div class="rounded-lg p-3 mb-4" style="border:1px solid rgba(180,35,24,.24); background: rgba(180,35,24,.06);"><div class="text-sm font-semibold mb-2" style="color: var(--danger);">Заавал бөглөх ${missing.length} зүйл байна</div><div class="flex flex-wrap gap-2">${missing.map((m) => `<button type="button" onclick="goListPropStep(${m.step})" class="bm-chip" style="border-color: rgba(180,35,24,.32); color: var(--danger);">${m.label}</button>`).join('')}</div></div>` : ''}${suggested.length ? `<div class="rounded-lg p-3 mb-4" style="border:1px solid var(--border); background: var(--surface-2);"><div class="text-sm font-semibold mb-2">Нийтлэсний дараа нөхөж болох зүйлс</div><div class="flex flex-wrap gap-2">${suggested.map((m) => `<span class="px-2 py-1 rounded-full text-[11px]" style="background: var(--surface); border:1px solid var(--border); color: var(--text-3);">${m.label}</span>`).join('')}</div></div>` : ''}<div class="space-y-2">${[['truth', 'Дээрх мэдээлэл үнэн зөв', 'Дээрх мэдээлэл нь үнэн зөв, бүрэн, бодитой гэдгийг би баталж байна.'], ['authority', 'Эрх бүхий этгээд мөн', 'Би энэхүү зарыг оруулж, олон нийтэд мэдээлэх эрх бүхий этгээд мөн гэдгийг баталж байна.'], ['terms', 'Үйлчилгээний нөхцөл зөвшөөрөх', 'www.neomap.mn веб сайтын ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ-ийг бүрэн уншиж танилцсан бөгөөд бүрэн хүлээн зөвшөөрч байна.']].map(([k, title, sub]) => `<label class="flex items-start gap-3 p-3 rounded-lg cursor-pointer" style="border:1px solid var(--border);"><input type="checkbox" class="accent-[var(--gold-brand)] mt-0.5" ${d.declarations[k] ? 'checked' : ''} onchange="setListPropField('declarations.${k}', this.checked)" /><span><span class="block text-sm font-semibold">${title}</span><span class="block text-xs mt-0.5" style="color: var(--text-3);">${sub}</span></span></label>`).join('')}</div></section><section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="rocket" class="w-4 h-4" style="color: var(--gold-brand);"></i>13. Verified and Brokerage service ${lpBadge(false)}</div><div class="flex flex-wrap gap-2 mb-4">${lpBool('services.verified', 'Та өөрийн зарыг VERIFIED болгохыг хүсэж байна уу? ТЭГЬЕ.', d.services.verified, 'badge-check')}${lpBool('services.brokerage', 'Та энэ үл хөдлөх эд хөрөнгөө манай мэргэжлийн зуучлагчаар зуучлуулах уу? ТЭГЬЕ.', d.services.brokerage, 'users')}${lpBool('services.sponsored', 'Та энэхүү зарыг SPONSORED болгохыг хүсэж байна уу? ТЭГЬЕ.', d.services.sponsored, 'megaphone')}</div><div>${lpLabel('Та энэ үл хөдлөх эд хөрөнгөтэй ямар холбоотой вэ?', true)}<div class="flex flex-wrap gap-2">${relations.map((x) => `<button type="button" onclick="setListPropField('services.relation', '${lpJS(x)}')" class="bm-chip ${d.services.relation === x ? 'active' : ''}" style="max-width:100%; white-space:normal; text-align:left; ${d.services.relation === x ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">${x}</button>`).join('')}</div></div></section></div>`;
}
function renderListProperty() {
  const d = ensureListPropDraft();
  const step = Math.max(1, Math.min(5, state.listPropStep || 1));
  state.listPropStep = step;
  const pct = lpCompletion(d);
  const goal = lpGoal(d.goal);
  const type = lpType(d.propertyType);
  return `<div class="max-w-6xl mx-auto px-4 lg:px-6 py-5"><div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5"><div><div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2" style="background: var(--gold-soft); color: var(--gold-brand); border:1px solid rgba(201,162,39,.28);"><i data-lucide="wand-sparkles" class="w-3.5 h-3.5"></i> Зар оруулах wizard</div><h1 class="text-2xl md:text-3xl font-semibold tracking-tight">Зар оруулах</h1><p class="text-sm mt-1" style="color: var(--text-3);">13 алхмын мэдээллийг 5 хэсэгт бөглөж нийтлэх хүсэлт илгээнэ.</p></div><div class="flex flex-wrap gap-2"><span class="px-3 py-2 rounded-full text-xs font-semibold" style="background: var(--surface); border:1px solid var(--border); color: var(--text-2);"><i data-lucide="${goal.icon}" class="w-3.5 h-3.5 inline mr-1" style="color: var(--gold-brand);"></i>${goal.label}</span><span class="px-3 py-2 rounded-full text-xs font-semibold" style="background: var(--surface); border:1px solid var(--border); color: var(--text-2);"><i data-lucide="${type.icon}" class="w-3.5 h-3.5 inline mr-1" style="color: var(--gold-brand);"></i>${type.label}</span></div></div><div class="grid lg:grid-cols-[300px_1fr] gap-5">${renderListPropSidebar(d, step, pct)}<main>${step === 1 ? renderListPropStep1(d) : ''}${step === 2 ? renderListPropStep2(d) : ''}${step === 3 ? renderListPropStep3(d) : ''}${step === 4 ? renderListPropStep4(d) : ''}${step === 5 ? renderListPropStep5(d) : ''}<div class="flex flex-wrap gap-2 justify-between mt-5"><button type="button" onclick="${step === 1 ? 'cancelListProperty()' : 'prevListPropStep()'}" class="btn btn-secondary"><i data-lucide="${step === 1 ? 'x' : 'arrow-left'}" class="w-4 h-4"></i> ${step === 1 ? 'Цуцлах' : '<< буцах'}</button><button type="button" onclick="saveListPropertyDraft()" class="btn btn-secondary"><i data-lucide="save" class="w-4 h-4"></i> Түр хадгалах</button>${step < 5 ? `<button type="button" onclick="nextListPropStep()" class="btn btn-cta">Дараагийнх <i data-lucide="arrow-right" class="w-4 h-4"></i></button>` : `<button type="button" onclick="submitListProperty()" class="btn btn-cta"><i data-lucide="send" class="w-4 h-4"></i> ЗАР НИЙТЛЭХ ХҮСЭЛТ ИЛГЭЭХ</button>`}</div></main></div></div>`;
}
function rerenderListProp() {
  if (currentScreen === 'list-property') {
    renderAppScreen('list-property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.setListPropGoal = function (goal) {
  const d = ensureListPropDraft();
  d.goal = goal;
  state.listPropMode = lpMode(goal);
  lpPersist();
  rerenderListProp();
};
window.setListPropMode = function (m) {
  window.setListPropGoal(m === 'sale' ? 'sell' : 'rent');
};
window.setListPropField = function (path, value) {
  const d = ensureListPropDraft();
  const prevDistrict = d.address.district;
  const prevType = d.propertyType;
  if (['address.floorBasement', 'address.floorAbove'].includes(path)) {
    value = Math.max(0, parseInt(value, 10) || 0);
  }
  lpSet(d, path, value);
  if (path === 'propertyType' && value !== prevType) d.subtype = lpSubtype(value);
  if (path === 'address.district' && value !== prevDistrict) {
    const loc = defaultListPropLocation(value);
    d.lat = loc.lat;
    d.lng = loc.lng;
    d.locationTouched = false;
  }
  if (path === 'address.floorBasement' || path === 'address.floorAbove') {
    d.address.floorTotal = (parseInt(d.address.floorBasement, 10) || 0) + (parseInt(d.address.floorAbove, 10) || 0);
    lpNormalizeSelectedFloor(d);
  }
  if (path === 'specs.rooms') {
    const rooms = parseInt(d.specs.rooms, 10) || 0;
    if (rooms && (parseInt(d.specs.bedrooms, 10) || 0) > rooms) d.specs.bedrooms = rooms;
  }
  if (path === 'specs.bedrooms') {
    const bedrooms = parseInt(d.specs.bedrooms, 10) || 0;
    const rooms = parseInt(d.specs.rooms, 10) || 0;
    if (bedrooms && rooms && bedrooms > rooms) d.specs.rooms = bedrooms;
  }
  state.listPropMode = lpMode(d.goal);
  lpPersist();
  if (path.startsWith('specs.windows.') || ['propertyType', 'subtype', 'address.district', 'address.floorBasement', 'address.floorAbove', 'address.selectedFloor', 'specs.rooms', 'specs.bedrooms', 'specs.bathrooms', 'pricing.vatIncluded', 'pricing.ebarimt', 'declarations.truth', 'declarations.authority', 'declarations.terms', 'services.relation'].includes(path)) rerenderListProp();
};
window.setListPropNumber = function (path, value, min = 0, max = 99999, decimals = 0) {
  if (path === '__selectedFloor') return;
  const next = lpClampDecimal(value, Number(min) || 0, Number(max) || 99999, Number(decimals) || 0);
  window.setListPropField(path, next);
  rerenderListProp();
};
window.adjustListPropNumber = function (path, delta, min = 0, max = 99999, decimals = 0) {
  if (path === '__selectedFloor') return;
  const d = ensureListPropDraft();
  const current = parseFloat(lpGet(d, path));
  const base = Number.isFinite(current) ? current : Number(min) || 0;
  window.setListPropNumber(path, base + (Number(delta) || 0), min, max, decimals);
};
window.setListPropFloor = function (type, num) {
  const d = ensureListPropDraft();
  lpApplySelectedFloor(d, type, num);
  lpPersist();
  rerenderListProp();
};
window.setListPropFloorType = function (type) {
  const d = ensureListPropDraft();
  const selected = lpFloorParts(d);
  const nextType = type === 'B' ? 'B' : 'F';
  const count = nextType === 'B' ? parseInt(d.address.floorBasement, 10) || 0 : parseInt(d.address.floorAbove, 10) || 0;
  lpApplySelectedFloor(d, nextType, Math.min(selected.num, Math.max(1, count || 1)));
  lpPersist();
  rerenderListProp();
};
window.adjustListPropSelectedFloor = function (delta) {
  const d = ensureListPropDraft();
  const selected = lpFloorParts(d);
  lpApplySelectedFloor(d, selected.type, selected.num + (Number(delta) || 0));
  lpPersist();
  rerenderListProp();
};
window.setListPropWindowCount = function (dirKey, value) {
  const d = ensureListPropDraft();
  d.specs.windows = lpNormalizeWindows(d.specs.windows);
  d.specs.windows[dirKey] = lpClampWindowCount(value);
  lpPersist();
  rerenderListProp();
};
window.adjustListPropWindow = function (dirKey, delta) {
  const d = ensureListPropDraft();
  d.specs.windows = lpNormalizeWindows(d.specs.windows);
  d.specs.windows[dirKey] = lpClampWindowCount((Number(d.specs.windows[dirKey]) || 0) + (Number(delta) || 0));
  lpPersist();
  rerenderListProp();
};
window.clearListPropWindows = function () {
  const d = ensureListPropDraft();
  d.specs.windows = lpNormalizeWindows();
  lpPersist();
  rerenderListProp();
};
window.toggleListPropArray = function (path, item) {
  const d = ensureListPropDraft();
  const set = new Set(lpGet(d, path) || []);
  if (set.has(item)) set.delete(item);
  else set.add(item);
  lpSet(d, path, [...set]);
  lpPersist();
  rerenderListProp();
};
window.toggleListPropBoolean = function (path) {
  const d = ensureListPropDraft();
  lpSet(d, path, !lpGet(d, path));
  lpPersist();
  rerenderListProp();
};
window.setListPropDiscount = function (months, value) {
  const d = ensureListPropDraft();
  d.pricing.rentDiscounts[months] = Math.max(0, Math.min(100, parseFloat(value) || 0));
  lpPersist();
  rerenderListProp();
};
window.setListPropLocation = function (ev) {
  if (ev) ev.stopPropagation();
  const rect = ev.currentTarget.getBoundingClientRect();
  const d = ensureListPropDraft();
  d.lat = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
  d.lng = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
  d.locationTouched = true;
  lpPersist();
  rerenderListProp();
};
window.addListPropPhoto = function (category) {
  const d = ensureListPropDraft();
  d.media.photos = lpPhotos(d);
  if (d.media.photos.length >= 15) {
    showToast('Хамгийн ихдээ 15 зураг нэмж болно', 'warning', { duration: 1800 });
    return;
  }
  d.media.photos.push({ seed: 'userlist-' + Date.now() + '-' + Math.floor(Math.random() * 1000), category: category || (d.media.photos.length ? 'Дотор зураг' : 'Нүүрний зураг') });
  if (d.media.photos.length === 1) d.media.coverIndex = 0;
  lpPersist();
  rerenderListProp();
};
window.removeListPropPhoto = function (i) {
  const d = ensureListPropDraft();
  d.media.photos = lpPhotos(d);
  d.media.photos.splice(i, 1);
  d.media.coverIndex = Math.max(0, Math.min(d.media.coverIndex || 0, d.media.photos.length - 1));
  lpPersist();
  rerenderListProp();
};
window.setListPropCover = function (i) {
  const d = ensureListPropDraft();
  d.media.coverIndex = i;
  lpPersist();
  rerenderListProp();
};
function validateListPropStep(step) {
  const d = ensureListPropDraft();
  if (step === 1) {
    if (!d.goal) return 'Зорилгоо сонгоно уу';
    if (!d.propertyType) return 'Үл хөдлөх эд хөрөнгийн зориулалтаа сонгоно уу';
    if (!d.subtype) return 'Дэд зориулалтаа сонгоно уу';
  }
  if (step === 2) {
    if (!d.address.district) return 'Дүүрэг/Сум сонгоно уу';
    if (!String(d.address.khoroo || '').trim()) return 'Хороо/Баг оруулна уу';
    if (!String(d.address.khotkhon || d.address.street || '').trim()) return 'Хотхон, хороолол эсвэл гудамж оруулна уу';
    if (!(parseFloat(d.specs.areaCert) > 0)) return lpAreaLabel(d) + ' оруулна уу';
    if (lpNeedsRooms(d) && !d.specs.rooms) return 'Нийт өрөөний тоог сонгоно уу';
  }
  if (step === 4) {
    if (!(lpPrice(d) > 0)) return lpMode(d.goal) === 'sale' ? 'Нийт үнээ оруулна уу' : 'Нийт үнэ/сар оруулна уу';
    if (lpPhotos(d).length < 1) return 'Хамгийн багадаа 1 зураг нэмнэ үү';
  }
  if (step === 5) {
    if (!d.services.relation) return 'Үл хөдлөх эд хөрөнгөтэй ямар холбоотойгоо сонгоно уу';
    if (!d.declarations.truth || !d.declarations.authority || !d.declarations.terms) return '3 баталгаажуулах checkbox-ийг зөвшөөрнө үү';
  }
  return null;
}
window.goListPropStep = function (targetStep) {
  const current = state.listPropStep || 1;
  if (targetStep > current) {
    for (let s = current; s < targetStep; s++) {
      const err = validateListPropStep(s);
      if (err) {
        showToast(err, 'warning', { duration: 2200 });
        state.listPropStep = s;
        rerenderListProp();
        return;
      }
    }
  }
  state.listPropStep = Math.max(1, Math.min(5, targetStep));
  lpPersist();
  rerenderListProp();
  window.scrollTo(0, 0);
};
window.nextListPropStep = function () {
  const step = state.listPropStep || 1;
  const err = validateListPropStep(step);
  if (err) {
    showToast(err, 'warning', { duration: 2200 });
    return;
  }
  state.listPropStep = Math.min(5, step + 1);
  lpPersist();
  rerenderListProp();
  window.scrollTo(0, 0);
};
window.prevListPropStep = function () {
  state.listPropStep = Math.max(1, (state.listPropStep || 1) - 1);
  lpPersist();
  rerenderListProp();
  window.scrollTo(0, 0);
};
window.saveListPropertyDraft = function () {
  ensureListPropDraft();
  lpPersist();
  showToast('Түр хадгаллаа', 'success', { duration: 1800 });
};
window.cancelListProperty = function () {
  state.listPropDraft = null;
  state.listPropStep = 1;
  state.listPropEditingRoomId = null;
  lpClearPersisted();
  goTo('home');
};
function lpListingFeatures(d) {
  return [...new Set([].concat(d.included.furniture || [], d.included.equipment || [], d.community.amenities || [], d.community.security || [], d.specs.officeNeeds || [], [lpType(d.propertyType).label, d.subtype, d.state.condition, d.state.current].filter(Boolean)))].slice(0, 8);
}
function lpDetail(d) {
  const detail = typeof emptyListingDetail === 'function' ? emptyListingDetail() : {};
  if (!detail.type) return { uxDraft: JSON.parse(JSON.stringify(d)) };
  detail.type.primary = d.propertyType;
  detail.type.subtype = d.subtype;
  detail.type.purpose = d.goal;
  Object.assign(detail.address, { country: d.address.country, city: d.address.city, district: d.address.district, khoroo: d.address.khoroo, zip: d.address.zip, street: d.address.street, streetNumber: d.address.streetNumber || '', project: d.address.khotkhon, buildingNumber: d.address.buildingNumber, buildingName: d.address.buildingName || '', floor: d.address.selectedFloor, unit: d.address.unit, note: d.address.note || '', googleMapLink: d.address.googleMapLink || '', lat: d.lat, lng: d.lng });
  Object.assign(detail.specs, { basementFloors: parseInt(d.address.floorBasement, 10) || 0, aboveFloors: parseInt(d.address.floorAbove, 10) || 0, totalFloors: parseInt(d.address.floorTotal, 10) || 0, areaCert: parseFloat(d.specs.areaCert) || 0, areaInterior: parseFloat(d.specs.areaInterior) || 0, areaBalcony: parseFloat(d.specs.areaBalcony) || 0, areaGarage: parseFloat(d.specs.areaGarage) || 0, areaStorage: parseFloat(d.specs.areaStorage) || 0, bedrooms: parseInt(d.specs.bedrooms, 10) || 0, bathrooms: parseInt(d.specs.bathrooms, 10) || 0, rooms: [parseInt(d.specs.rooms, 10) || 0].filter(Boolean) });
  const windowCounts = lpNormalizeWindows(d.specs.windows);
  SMART_LIST_PROP_WINDOW_DIRECTIONS.forEach((dir) => { detail.specs.windowCounts[dir.detailKey] = Number(windowCounts[dir.key]) || 0; });
  detail.specs.windowCounts.total = lpWindowTotal(windowCounts);
  SMART_LIST_PROP_INFRA.forEach((f) => {
    if (f.key === 'internet') detail.infra.internet = d.infra.internet ? [d.infra.internet] : [];
    else if (detail.infra[f.key] && typeof detail.infra[f.key] === 'object') detail.infra[f.key].primary = d.infra[f.key] || '';
  });
  detail.infra.note = d.infra.note || '';
  detail.community.services = d.community.services || [];
  detail.community.security = d.community.security || [];
  detail.community.amenities = d.community.amenities || [];
  detail.included.furniture = typeof fillCheckList === 'function' ? fillCheckList(SMART_LIST_PROP_INCLUDED[0].items, d.included.furniture) : d.included.furniture || [];
  detail.included.equipment = typeof fillCheckList === 'function' ? fillCheckList(SMART_LIST_PROP_INCLUDED[1].items, d.included.equipment) : d.included.equipment || [];
  detail.included.extra = typeof fillCheckList === 'function' ? fillCheckList(SMART_LIST_PROP_INCLUDED[2].items, d.included.extra) : d.included.extra || [];
  Object.assign(detail.state, { usage: d.state.usage, certStatus: d.state.certStatus, certNumber: d.state.certNumber, current: d.state.current || d.state.condition, interior: d.state.interior, collateral: d.state.collateral, collateralNote: d.state.collateralNote || '', commissionYear: parseInt(d.state.commissionYear, 10) || null, commissionDue: d.state.commissionDue || '' });
  detail.pricing.mode = lpMode(d.goal);
  detail.pricing.primary.area = parseFloat(d.specs.areaCert) || 0;
  detail.pricing.primary.totalPrice = lpPrice(d);
  detail.pricing.primary.unitPrice = detail.pricing.primary.area ? Math.round(detail.pricing.primary.totalPrice / detail.pricing.primary.area) : 0;
  detail.pricing.vatIncluded = !!d.pricing.vatIncluded;
  detail.pricing.ebarimtVat = !!d.pricing.ebarimt;
  detail.payment.forms = d.pricing.paymentForms || [];
  detail.payment.rentDeposit = parseFloat(d.pricing.deposit) || 0;
  detail.payment.rentSchedule = [1, 2, 3, 4, 6, 12].map((m) => {
    const discount = parseFloat(d.pricing.rentDiscounts[m]) || 0;
    const monthly = detail.pricing.primary.totalPrice ? Math.round(detail.pricing.primary.totalPrice * (1 - discount / 100)) : 0;
    const total = monthly * m;
    return { months: m, discount, monthly, total, firstPay: total + detail.payment.rentDeposit };
  });
  detail.uxDraft = JSON.parse(JSON.stringify(d));
  detail.completionScore = lpCompletion(d);
  return detail;
}
window.submitListProperty = function () {
  for (let s = 1; s <= 5; s++) {
    const err = validateListPropStep(s);
    if (err) {
      state.listPropStep = s;
      rerenderListProp();
      showToast(err, 'warning', { duration: 2400 });
      return;
    }
  }
  const d = ensureListPropDraft();
  const newId = Math.max(...LISTINGS.map((x) => x.id)) + 1;
  const loc = d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : defaultListPropLocation(d.address.district);
  const area = parseFloat(d.specs.areaCert) || parseFloat(d.specs.areaInterior) || 0;
  const mode = lpMode(d.goal);
  const photos = lpPhotos(d);
  const listing = {
    id: newId,
    mode,
    district: d.address.district,
    khoroo: d.address.khoroo || '1',
    khotkhon: String(d.address.khotkhon || d.address.street || lpType(d.propertyType).label).trim(),
    rooms: parseInt(d.specs.rooms, 10) || parseInt(d.specs.bedrooms, 10) || 1,
    area,
    floor: d.address.selectedFloor ? `${d.address.selectedFloor}/${d.address.floorTotal || '-'}` : '—',
    year: parseInt(d.state.commissionYear, 10) || new Date().getFullYear(),
    price: lpPrice(d),
    photos: newId,
    photoSeeds: photos.map((p) => p.seed),
    status: 'new',
    listedDays: 0,
    viewCount: 0,
    viewingCount: 0,
    features: lpListingFeatures(d),
    agentId: 1,
    lat: Math.max(0.02, Math.min(0.98, parseFloat(loc.lat))),
    lng: Math.max(0.02, Math.min(0.98, parseFloat(loc.lng))),
    desc: d.desc || `${lpType(d.propertyType).label} · ${d.subtype} · ${d.address.district}`,
    detail: lpDetail(d),
    roomDetails: Array.isArray(d.roomDetails) ? d.roomDetails.slice() : [],
    isUserListing: true,
  };
  if (mode === 'rent' && d.pricing.deposit) listing.deposit = parseFloat(d.pricing.deposit);
  LISTINGS.push(listing);
  state.listPropDraft = null;
  state.listPropStep = 1;
  lpClearPersisted();
  state.currentListingId = newId;
  state.mode = mode;
  showToast('Зар нийтлэх хүсэлт илгээгдлээ · ' + listing.khotkhon, 'success', { duration: 2800 });
  goTo('property');
};

/* ============== PROFILE ============== */
function renderProfile() {
  const u = state.currentUser || { name: 'Зочин', phone: '', initials: '?', email: '' };
  const savedCount = typeof SAVED_IDS !== 'undefined' ? SAVED_IDS.size : 0;
  const viewingsCount = typeof VIEWINGS !== 'undefined' ? VIEWINGS.length : 0;

  const menu = [
    { key: 'profile', icon: 'user', label: 'Хувийн мэдээлэл', active: true },
    { key: 'activity', icon: 'calendar-check', label: 'Үзэлтүүд' },
    { key: 'saved', icon: 'heart', label: 'Хадгалсан зарууд' },
    { key: 'alerts', icon: 'bell', label: 'Мэдэгдэл' },
    { key: 'list-property', icon: 'megaphone', label: 'Миний зар' },
    { key: 'rental-mgmt', icon: 'layout-dashboard', label: 'Менежмент' },
    { key: 'news', icon: 'newspaper', label: 'Мэдээ, зөвлөгөө' },
    { key: 'help', icon: 'help-circle', label: 'Тусламж', toast: 'Тусламжийн төв удахгүй' },
  ];

  const cards = [
    { icon: 'user', title: 'Хувийн мэдээлэл', sub: 'Мэдээлэл засах', action: 'openProfileEdit()' },
    { icon: 'lock', title: 'Нууц үг', sub: 'Шинэчлэх', action: 'openProfileToast("Нууц үг шинэчлэх удахгүй")' },
    {
      icon: 'phone',
      title: 'Гар утас',
      sub: u.phone || 'Баталгаажуулаагүй',
      action: 'openProfileToast("Утас баталгаажуулах удахгүй")',
    },
    {
      icon: 'mail',
      title: 'Цахим хаяг',
      sub: u.email || 'Баталгаажуулаагүй',
      action: 'openProfileToast("И-мэйл баталгаажуулах удахгүй")',
    },
    { icon: 'heart', title: 'Хадгалсан', sub: savedCount + ' зар', action: "goTo('saved')" },
    { icon: 'calendar-check', title: 'Үзэлтүүд', sub: viewingsCount + ' уулзалт', action: "goTo('activity')" },
  ];

  const sidebarBtn = (m) => {
    const cls = m.active
      ? 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold'
      : 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition';
    const style = m.active ? 'background: var(--primary-soft); color: var(--primary);' : '';
    const handler = m.toast ? `showToast('${m.toast}','info')` : `goTo('${m.key}')`;
    return `<button onclick="${handler}" class="${cls}" style="${style}">
      <i data-lucide="${m.icon}" class="w-[18px] h-[18px]"></i>
      <span class="truncate">${m.label}</span>
    </button>`;
  };

  const card = (c) => `
    <button onclick="${c.action}" class="card p-5 text-left hover:border-[var(--primary)] hover:shadow-md transition group">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style="background: var(--primary-soft); color: var(--primary);">
        <i data-lucide="${c.icon}" class="w-5 h-5"></i>
      </div>
      <div class="font-semibold text-sm text-[var(--text)]">${c.title}</div>
      <div class="text-xs text-[var(--text-3)] mt-0.5 truncate">${c.sub}</div>
    </button>
  `;

  return `
    <div class="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">

        <aside class="card p-3 lg:row-span-2 flex flex-col">
          <div class="flex flex-col gap-1">
            ${menu.map(sidebarBtn).join('')}
          </div>
          <div class="mt-auto pt-3 border-t border-[var(--border)]">
            <button onclick="openSignOutConfirm()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--danger)] hover:bg-[var(--surface-2)] transition">
              <i data-lucide="log-out" class="w-[18px] h-[18px]"></i>
              <span>Системээс гарах</span>
            </button>
          </div>
        </aside>

        <div class="card p-6 flex flex-col items-center justify-center text-center">
          <div class="relative mb-4">
            <div class="w-24 h-24 rounded-full text-white font-semibold flex items-center justify-center text-2xl" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); box-shadow: 0 8px 24px rgba(18,60,105,.18);">
              ${u.initials || '?'}
            </div>
            <button onclick="openProfileEdit()" class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--surface); border: 1px solid var(--border-strong); color: var(--text-2);" title="Засах">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
          </div>
          <div class="font-semibold text-base text-[var(--text)] truncate max-w-full">${u.name || 'Зочин'}</div>
          <div class="text-xs text-[var(--text-3)] mt-1 truncate max-w-full">${u.email || u.phone || 'Холбоо барих мэдээлэл алга'}</div>
        </div>

        <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${cards.map(card).join('')}
        </div>

      </div>
    </div>
  `;
}

function openProfileToast(msg) {
  if (typeof showToast === 'function') showToast(msg, 'info');
}
window.openProfileToast = openProfileToast;

function openProfileEdit() {
  const u = state.currentUser || { name: '', phone: '', email: '' };
  openModal(`
    <div class="p-5 border-b border-[var(--border)] flex items-center justify-between">
      <h3 class="font-semibold text-lg">Хувийн мэдээлэл засах</h3>
      <button onclick="closeModal()" class="text-[var(--text-3)] hover:text-[var(--text)]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-3">
      <label class="block">
        <div class="text-xs font-semibold text-[var(--text-2)] mb-1">Нэр</div>
        <input id="pf-name" class="input" value="${(u.name || '').replace(/"/g, '&quot;')}" placeholder="Таны нэр">
      </label>
      <label class="block">
        <div class="text-xs font-semibold text-[var(--text-2)] mb-1">Цахим хаяг</div>
        <input id="pf-email" class="input" value="${(u.email || '').replace(/"/g, '&quot;')}" placeholder="name@example.com">
      </label>
      <label class="block">
        <div class="text-xs font-semibold text-[var(--text-2)] mb-1">Гар утас</div>
        <input id="pf-phone" class="input" value="${(u.phone || '').replace(/"/g, '&quot;')}" placeholder="+976 ...">
      </label>
    </div>
    <div class="p-4 border-t border-[var(--border)] flex gap-2 justify-end">
      <button onclick="closeModal()" class="btn btn-secondary">Болих</button>
      <button onclick="saveProfileEdit()" class="btn btn-primary">Хадгалах</button>
    </div>
  `);
}
window.openProfileEdit = openProfileEdit;

function saveProfileEdit() {
  const name = (document.getElementById('pf-name')?.value || '').trim();
  const email = (document.getElementById('pf-email')?.value || '').trim();
  const phone = (document.getElementById('pf-phone')?.value || '').trim();
  const u = state.currentUser || {};
  u.name = name || u.name || 'Зочин';
  u.email = email;
  u.phone = phone || u.phone || '';
  u.initials =
    (u.name || '?')
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  state.currentUser = u;
  if (typeof saveAuth === 'function') saveAuth();
  closeModal();
  if (typeof showToast === 'function') showToast('Мэдээлэл хадгалагдлаа', 'success');
  if (typeof renderHeaderAuth === 'function') renderHeaderAuth();
  if (window.currentScreen === 'profile') renderAppScreen('profile');
  setTimeout(() => lucide.createIcons(), 0);
}
window.saveProfileEdit = saveProfileEdit;
