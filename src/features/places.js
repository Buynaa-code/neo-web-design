/* ============== MY PLACES + ONBOARDING + PLACE PICKER + COMMUTE ============== */

const PLACE_SCALE_KM = 20; // 1 нэгж ≈ 20 км
const WALK_KMH = 4.5; // явган хурд
const DRIVE_KMH = 25; // хотын дундаж жолоо хурд (түгжрэлтэй)

const PLACE_KINDS = {
  home: { label: 'Гэр', icon: 'home', color: '#4DD09E' },
  work: { label: 'Ажил', icon: 'briefcase', color: '#0A1F44' },
  school: { label: 'Сургууль', icon: 'graduation-cap', color: '#C9A35F' },
  kindergarten: { label: 'Цэцэрлэг', icon: 'baby', color: '#F59E0B' },
  other: { label: 'Бусад', icon: 'map-pin', color: '#5FD4E5' },
};

// Тухайн kind-ын одоо хадгалагдсан тоо.
function placesByKindCount(kind) {
  return (state.myPlaces || []).filter((p) => p.kind === kind).length;
}

function placeKindMeta(kind) {
  return PLACE_KINDS[kind] || PLACE_KINDS.other;
}

function placeDistanceKm(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy) * PLACE_SCALE_KM;
}

function placeTravel(km) {
  return {
    km,
    walkMin: Math.max(1, Math.round((km / WALK_KMH) * 60)),
    driveMin: Math.max(1, Math.round((km / DRIVE_KMH) * 60)),
  };
}

/* ---- CRUD ---- */
function addOrUpdatePlace(p) {
  state.myPlaces = state.myPlaces || [];
  if (p.id) {
    const idx = state.myPlaces.findIndex((x) => x.id === p.id);
    if (idx >= 0) state.myPlaces[idx] = { ...state.myPlaces[idx], ...p };
  } else {
    const id = 'pl-' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
    state.myPlaces.push({ id, kind: p.kind || 'other', label: p.label || 'Газар', lat: p.lat, lng: p.lng });
  }
  saveMyPlaces();
}

function removePlace(id) {
  state.myPlaces = (state.myPlaces || []).filter((p) => p.id !== id);
  saveMyPlaces();
  showToast('Газар устгагдлаа', 'info', { duration: 1500 });
  if (currentScreen === 'property') {
    renderAppScreen('property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.removePlace = removePlace;

/* ============== PLACE PICKER MODAL ============== */
function openPlacePicker(editId) {
  const existing = editId ? (state.myPlaces || []).find((p) => p.id === editId) : null;
  // Шинэ газар нэмэхэд хоосон kind-ийг урьтал болгож тавина — гэр, ажил, сургууль, цэцэрлэг.
  // Бүгд хадгалагдсан байвал 'work' дээр зогсоно (хамгийн их давтагдах хандлагатай).
  const existingKinds = new Set((state.myPlaces || []).map((p) => p.kind));
  const defaultKind = !existingKinds.has('home')
    ? 'home'
    : !existingKinds.has('work')
      ? 'work'
      : !existingKinds.has('school')
        ? 'school'
        : !existingKinds.has('kindergarten')
          ? 'kindergarten'
          : 'work';
  state.placePicker = existing
    ? { editId: existing.id, kind: existing.kind, label: existing.label, lat: existing.lat, lng: existing.lng }
    : { editId: null, kind: defaultKind, label: '', lat: null, lng: null };
  renderPlacePickerModal();
}
window.openPlacePicker = openPlacePicker;

function renderPlacePickerModal() {
  const pp = state.placePicker || { kind: 'home', label: '', lat: null, lng: null };
  const kindBtns = Object.entries(PLACE_KINDS)
    .map(([k, m]) => {
      const sel = pp.kind === k;
      const cnt = placesByKindCount(k) - (pp.editId && pp.kind === k ? 1 : 0);
      const badge =
        cnt > 0
          ? `<span style="position:absolute; top:4px; right:4px; min-width:16px; height:16px; padding:0 4px; border-radius:8px; background:${sel ? 'rgba(255,255,255,.25)' : 'var(--surface-2)'}; color:${sel ? '#fff' : 'var(--text-3)'}; font-size:10px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; line-height:1;">${cnt}</span>`
          : '';
      const baseStyle = sel
        ? `background:${m.color}; color:#fff; border:1px solid ${m.color};`
        : 'background:var(--surface); color:var(--text-2); border:1px solid var(--border);';
      return `<button onclick="setPlacePickerKind('${k}')" class="relative flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition" style="${baseStyle}">
      ${badge}
      <i data-lucide="${m.icon}" class="w-[18px] h-[18px]"></i>
      <span>${m.label}</span>
    </button>`;
    })
    .join('');

  const hasPoint = pp.lat != null && pp.lng != null;
  const existingPlaces = state.myPlaces || [];
  const sameKindCount =
    placesByKindCount(pp.kind) -
    (pp.editId && pp.kind === (existingPlaces.find((p) => p.id === pp.editId) || {}).kind ? 1 : 0);
  const labelRequired = sameKindCount > 0;
  const labelPlaceholder =
    pp.kind === 'home'
      ? sameKindCount > 0
        ? 'ж: Аав ээжийнх'
        : 'ж: Манай гэр'
      : pp.kind === 'work'
        ? sameKindCount > 0
          ? 'ж: Эхнэрийн ажил'
          : 'ж: Миний оффис'
        : pp.kind === 'school'
          ? sameKindCount > 0
            ? 'ж: Дүүгийн сургууль'
            : 'ж: Хүүгийн сургууль'
          : pp.kind === 'kindergarten'
            ? sameKindCount > 0
              ? 'ж: Дунд хүүгийн цэцэрлэг'
              : 'ж: Том хүүгийн цэцэрлэг'
            : 'ж: Эмнэлэг, эцэг эх...';

  openModal(
    `
    <div class="px-5 py-4 border-b flex items-center justify-between" style="border-color: var(--border);">
      <h3 class="font-semibold text-base">${pp.editId ? 'Байршил засах' : 'Байршил нэмэх'}</h3>
      <button onclick="closePlacePicker()" class="hover:opacity-70" style="color: var(--text-3);"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-2);">Төрөл</div>
        <div class="grid grid-cols-5 gap-2">${kindBtns}</div>
      </div>
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-2);">
          Нэр ${
            labelRequired
              ? `<span style="color: var(--danger); font-weight: 600;">*</span>`
              : `<span style="color: var(--text-3); font-weight: 400;">(заавал биш)</span>`
          }
        </div>
        <input id="pp-label" type="text" value="${(pp.label || '').replace(/"/g, '&quot;')}" placeholder="${labelPlaceholder}"
               oninput="state.placePicker.label = this.value; window.__refreshPickerSaveBtn && window.__refreshPickerSaveBtn();"
               class="input" style="${labelRequired && !(pp.label || '').trim() ? 'border-color: var(--danger);' : ''}" />
      </div>
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold" style="color: var(--text-2);">Байршил</div>
          <button onclick="useMyLocationForPicker()" class="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--surface-2)] transition" style="color: var(--primary);">
            <i data-lucide="crosshair" class="w-3.5 h-3.5"></i> Миний байршил
          </button>
        </div>
        <div class="rounded-lg overflow-hidden" style="height: 320px; position: relative; border: 1px solid var(--border);">
          <div id="leaflet-place-picker" style="position:absolute; inset:0; z-index: 1;"></div>
        </div>
        <div id="picker-status" class="text-xs mt-2 flex items-center gap-1.5" style="color: ${hasPoint ? 'var(--success)' : 'var(--text-3)'};">
          <i data-lucide="${hasPoint ? 'check-circle-2' : 'map-pin'}" class="w-3.5 h-3.5"></i>
          <span>${hasPoint ? 'Байршил сонгогдсон' : 'Газрын зураг дээр товшиж байршлаа тогтооно уу'}</span>
        </div>
      </div>
    </div>
    <div class="px-5 py-3 border-t flex gap-2 items-center" style="border-color: var(--border);">
      ${pp.editId ? `<button onclick="confirmRemovePlace('${pp.editId}')" class="text-xs inline-flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-[var(--surface-2)]" style="color: var(--danger);"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Устгах</button>` : ''}
      <div class="flex-1"></div>
      <button onclick="closePlacePicker()" class="btn btn-secondary !py-2 !px-4 !text-sm">Цуцлах</button>
      <button id="picker-save-btn" data-label-required="${labelRequired ? '1' : ''}" onclick="savePlacePicker()" class="btn btn-primary !py-2 !px-4 !text-sm" ${hasPoint && !(labelRequired && !(pp.label || '').trim()) ? '' : 'style="opacity:.5; pointer-events:none;"'}>Хадгалах</button>
    </div>
  `,
    'lg',
  );
  setTimeout(() => lucide.createIcons(), 0);
  setTimeout(() => initPlacePickerLeafletMap(), 30);
}
// Label оруулах үед save товчны идэвхтэй байдлыг шинэчилнэ.
window.__refreshPickerSaveBtn = function () {
  const btn = document.getElementById('picker-save-btn');
  if (!btn) return;
  const pp = state.placePicker || {};
  const labelRequired = btn.dataset.labelRequired === '1';
  const hasPoint = pp.lat != null && pp.lng != null;
  const labelOK = !labelRequired || !!(pp.label || '').trim();
  if (hasPoint && labelOK) {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  } else {
    btn.style.opacity = '.5';
    btn.style.pointerEvents = 'none';
  }
  // input border-ыг улаан/энгийн болгож шинэчлэх
  const input = document.getElementById('pp-label');
  if (input && labelRequired) {
    input.style.borderColor = (pp.label || '').trim() ? 'var(--border)' : 'var(--danger)';
  }
};
window.renderPlacePickerModal = renderPlacePickerModal;

let placePickerMap = null;
let placePickerMarker = null;
let placePickerSetMarker = null;

function placePickerBounds(pad = 0) {
  return [
    [UB_BOUNDS.latMin - pad, UB_BOUNDS.lngMin - pad],
    [UB_BOUNDS.latMax + pad, UB_BOUNDS.lngMax + pad],
  ];
}

function clampRealLatLngToUb(lat, lng) {
  return {
    lat: Math.max(UB_BOUNDS.latMin, Math.min(UB_BOUNDS.latMax, lat)),
    lng: Math.max(UB_BOUNDS.lngMin, Math.min(UB_BOUNDS.lngMax, lng)),
  };
}

function destroyPlacePickerLeafletMap() {
  if (placePickerMap) {
    try {
      placePickerMap.remove();
    } catch (e) {}
  }
  placePickerMap = null;
  placePickerMarker = null;
  placePickerSetMarker = null;
}

function initPlacePickerLeafletMap() {
  if (typeof L === 'undefined') return;
  const el = document.getElementById('leaflet-place-picker');
  if (!el) return;
  destroyPlacePickerLeafletMap();

  const pp = state.placePicker || {};
  placePickerMap = L.map(el, {
    zoomControl: true,
    attributionControl: false,
    minZoom: 11,
    maxZoom: 18,
    maxBounds: placePickerBounds(0.02),
    maxBoundsViscosity: 0.9,
  }).setView(UB_CENTER, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(placePickerMap);

  function setMarkerAt(realLat, realLng) {
    const ppk = state.placePicker;
    if (!ppk) return;
    const clamped = clampRealLatLngToUb(realLat, realLng);
    const norm = realLatLngToNormalized(clamped.lat, clamped.lng);
    ppk.lat = norm.x;
    ppk.lng = norm.y;
    const lbl = document.getElementById('pp-label');
    if (lbl) ppk.label = lbl.value;
    const meta = placeKindMeta(ppk.kind);
    if (placePickerMarker) {
      placePickerMap.removeLayer(placePickerMarker);
    }
    const icon = L.divIcon({
      className: 'leaflet-marker-icon-wrap',
      html: `<div style="background:${meta.color}; color:#fff; padding:8px 14px; border-radius:999px; font-size:12px; font-weight:700; box-shadow:0 6px 18px rgba(0,0,0,.5); display:inline-flex; align-items:center; gap:6px; white-space:nowrap; transform:translate(-50%,-110%); border: 3px solid #fff; animation: pickerPulse 1.4s ease-in-out infinite;">
        <i data-lucide="${meta.icon}" style="width:14px; height:14px;"></i> ${(ppk.label && ppk.label.trim()) || meta.label}
      </div>`,
      iconSize: null,
      iconAnchor: [0, 0],
    });
    placePickerMarker = L.marker([clamped.lat, clamped.lng], { icon }).addTo(placePickerMap);
    // Status шинэчилнэ — байршил тогтоогдсон гэж заана
    const status = document.getElementById('picker-status');
    if (status) {
      status.style.color = 'var(--success)';
      status.innerHTML = `<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Байршил сонгогдсон</span>`;
    }
    setTimeout(() => {
      try {
        if (window.lucide) lucide.createIcons();
      } catch (e) {}
    }, 0);
    if (window.__refreshPickerSaveBtn) window.__refreshPickerSaveBtn();
  }

  placePickerSetMarker = setMarkerAt;

  if (pp.lat != null && pp.lng != null) {
    const [rLat, rLng] = listingToLatLng({ lat: pp.lat, lng: pp.lng });
    setMarkerAt(rLat, rLng);
    placePickerMap.setView([rLat, rLng], 14, { animate: false });
  }
  placePickerMap.on('click', (ev) => {
    setMarkerAt(ev.latlng.lat, ev.latlng.lng);
  });

  setTimeout(() => {
    try {
      if (placePickerMap) placePickerMap.invalidateSize();
    } catch (e) {}
  }, 50);
}
window.initPlacePickerLeafletMap = initPlacePickerLeafletMap;
window.destroyPlacePickerLeafletMap = destroyPlacePickerLeafletMap;

function useMyLocationForPicker() {
  if (!navigator.geolocation) {
    showToast('Энэ хөтөч геолокаци дэмждэггүй', 'warning');
    return;
  }
  showToast('Байршил хайж байна…', 'info', { duration: 1200 });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (
        latitude < UB_BOUNDS.latMin - 0.5 ||
        latitude > UB_BOUNDS.latMax + 0.5 ||
        longitude < UB_BOUNDS.lngMin - 0.5 ||
        longitude > UB_BOUNDS.lngMax + 0.5
      ) {
        showToast('Та одоо УБ-аас гадна байгаа бололтой. Газрын зураг дээр гараар сонгоно уу.', 'warning', {
          duration: 3000,
        });
        return;
      }
      if (placePickerMap && placePickerSetMarker) {
        const clamped = clampRealLatLngToUb(latitude, longitude);
        placePickerMap.setView([clamped.lat, clamped.lng], 15);
        placePickerSetMarker(clamped.lat, clamped.lng);
      }
    },
    (err) => {
      const msg = err.code === 1 ? 'Та байршил хуваалцах зөвшөөрөл өгөөгүй' : 'Байршил тогтоох амжилтгүй';
      showToast(msg, 'error', { duration: 2500 });
    },
    { enableHighAccuracy: true, timeout: 8000 },
  );
}
window.useMyLocationForPicker = useMyLocationForPicker;

/* ============== ONBOARDING — анх орох хэрэглэгчид ============== */
const ONBOARD_DISMISSED_KEY = 'orloo.onboardingDismissed.v1';

const ONBOARD_KINDS = ['work', 'school', 'kindergarten', 'home'];

function onboardRemainingKinds() {
  return ONBOARD_KINDS.filter((k) => placesByKindCount(k) === 0);
}

function shouldShowOnboarding() {
  if (typeof window !== 'undefined' && window.__SKIP_ONBOARD__) return false;
  try {
    const href = typeof location !== 'undefined' ? location.href || '' : '';
    const search = typeof location !== 'undefined' ? location.search || '' : '';
    const hash = typeof location !== 'undefined' ? location.hash || '' : '';
    if (/noOnboard|skipOnboard/i.test(href + search + hash)) return false;
  } catch (e) {}
  try {
    if (localStorage.getItem(ONBOARD_DISMISSED_KEY)) return false;
  } catch (e) {}
  if (onboardRemainingKinds().length === 0) return false;
  return true;
}

function maybeShowOnboarding() {
  if (!shouldShowOnboarding()) return;
  if (document.getElementById('onboard-modal-root')) return;
  setTimeout(() => {
    if (shouldShowOnboarding()) renderOnboardingModal();
  }, 400);
}
window.maybeShowOnboarding = maybeShowOnboarding;

function renderOnboardingModal() {
  const remaining = onboardRemainingKinds();
  if (remaining.length === 0) return;

  const ONBOARD_ROW_META = {
    work: { icon: 'briefcase', title: 'Ажлын байршил', desc: 'Гэрээс ажил хүртэлх зайг тооцоолно' },
    school: { icon: 'graduation-cap', title: 'Хүүхдийн сургууль', desc: 'Олон сургууль нэмэх боломжтой' },
    kindergarten: { icon: 'baby', title: 'Цэцэрлэг', desc: 'Бага насны хүүхдийн цэцэрлэгийн байршил' },
    home: { icon: 'home', title: 'Одоогийн оршин суух газар', desc: 'Шилжих санал өгөхөд хэрэг болно' },
  };

  const rowsHtml = remaining
    .map((k) => {
      const meta = ONBOARD_ROW_META[k];
      return `
        <button class="onboard-kind-row" onclick="onboardStart('${k}')">
          <div class="onboard-kind-icon" style="background:${PLACE_KINDS[k].color};">
            <i data-lucide="${meta.icon}" style="width:20px;height:20px;"></i>
          </div>
          <div class="onboard-kind-text">
            <div class="onboard-kind-title">${meta.title}</div>
            <div class="onboard-kind-desc">${meta.desc}</div>
          </div>
          <i data-lucide="chevron-right" class="onboard-kind-arrow" style="width:16px;height:16px;"></i>
        </button>`;
    })
    .join('');

  const root = document.createElement('div');
  root.id = 'onboard-modal-root';
  root.className = 'onboard-modal';
  root.addEventListener('click', (e) => {
    if (e.target === root) onboardSkip();
  });
  root.innerHTML = `
    <div class="onboard-card" onclick="event.stopPropagation()">
      <div class="onboard-hero">
        <button onclick="onboardSkip()" aria-label="Хаах" class="onboard-close"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
        <div class="onboard-hero-icon">
          <i data-lucide="map-pinned" style="width:22px;height:22px;"></i>
        </div>
        <div class="onboard-title">Тавтай морил</div>
        <div class="onboard-subtitle">Танд тохирох гэрийг олоход туслахын тулд хэдхэн зүйл асууя</div>
      </div>
      <div class="onboard-body">
        <p class="onboard-intro">
          Та <strong>ажил</strong> болон <strong>хүүхдийн сургуулийн</strong> байршлыг оруулбал, бид танд тохирох <strong>гэрийг</strong> ойролцоо талбайгаас санал болгоно.
        </p>
        ${rowsHtml}
      </div>
      <div class="onboard-footer">
        <button class="onboard-skip" onclick="onboardSkip()">Дараа нь</button>
        <span class="onboard-tip"><i data-lucide="clock" style="width:11px;height:11px;"></i> ~30 секунд</span>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  setTimeout(() => {
    try {
      lucide.createIcons();
    } catch (e) {}
  }, 0);
}
window.renderOnboardingModal = renderOnboardingModal;

function onboardStart(kind) {
  closeOnboardingModal();
  state.placePicker = { editId: null, kind, label: '', lat: null, lng: null, source: 'onboarding' };
  renderPlacePickerModal();
}
window.onboardStart = onboardStart;

function onboardSkip() {
  try {
    localStorage.setItem(ONBOARD_DISMISSED_KEY, '1');
  } catch (e) {}
  closeOnboardingModal();
}
window.onboardSkip = onboardSkip;

function closeOnboardingModal() {
  const el = document.getElementById('onboard-modal-root');
  if (el) el.remove();
}
window.closeOnboardingModal = closeOnboardingModal;

function showPlaceSuccessBanner(label, meta, isEdit) {
  const id = 'place-success-banner';
  const old = document.getElementById(id);
  if (old) old.remove();
  const banner = document.createElement('div');
  banner.id = id;
  banner.style.cssText = `
    position: fixed; top: 84px; left: 50%; transform: translateX(-50%) translateY(-20px);
    z-index: 9999; opacity: 0;
    background: linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%);
    color: #fff; padding: 14px 20px; border-radius: 14px;
    box-shadow: 0 12px 40px ${meta.color}88, 0 4px 12px rgba(0,0,0,.3);
    display: flex; align-items: center; gap: 14px;
    min-width: 320px; max-width: 90vw;
    font-size: 14px; font-weight: 600;
    border: 2px solid rgba(255,255,255,.25);
    transition: transform .35s cubic-bezier(.2,.9,.3,1.2), opacity .25s;
  `;
  banner.innerHTML = `
    <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.22); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
      <i data-lucide="check" style="width: 22px; height: 22px;"></i>
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-size: 15px; font-weight: 800; letter-spacing: -0.01em;">${isEdit ? 'Шинэчлэгдлээ!' : 'Амжилттай нэмэгдлээ!'}</div>
      <div style="font-size: 12px; opacity: .9; margin-top: 2px;">
        <i data-lucide="${meta.icon}" style="width:12px; height:12px; display:inline; vertical-align:-2px;"></i>
        ${meta.label} · <strong>${label}</strong>
      </div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.18); border:0; color:#fff; width:28px; height:28px; border-radius:50%; cursor:pointer; flex-shrink:0;">
      <i data-lucide="x" style="width: 14px; height: 14px;"></i>
    </button>
  `;
  document.body.appendChild(banner);
  setTimeout(() => {
    try {
      lucide.createIcons();
    } catch (e) {}
  }, 0);
  requestAnimationFrame(() => {
    banner.style.transform = 'translateX(-50%) translateY(0)';
    banner.style.opacity = '1';
  });
  setTimeout(() => {
    if (!document.getElementById(id)) return;
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => banner.remove(), 350);
  }, 3500);
}
window.showPlaceSuccessBanner = showPlaceSuccessBanner;

function confirmRemovePlace(id) {
  if (confirm('Энэ газрыг устгах уу?')) {
    removePlace(id);
    closePlacePicker();
    if (currentScreen === 'home') {
      renderAppScreen('home');
    }
  }
}
window.confirmRemovePlace = confirmRemovePlace;

function realLatLngToNormalized(lat, lng) {
  // inverse of listingToLatLng — clamp to 0..1
  const y = (UB_BOUNDS.latMax - lat) / (UB_BOUNDS.latMax - UB_BOUNDS.latMin);
  const x = (lng - UB_BOUNDS.lngMin) / (UB_BOUNDS.lngMax - UB_BOUNDS.lngMin);
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}
window.realLatLngToNormalized = realLatLngToNormalized;

function setPlacePickerKind(kind) {
  if (!state.placePicker) return;
  state.placePicker.kind = kind;
  renderPlacePickerModal();
}
window.setPlacePickerKind = setPlacePickerKind;

function onPlacePickerMapClick(ev) {
  ev.stopPropagation();
  const rect = ev.currentTarget.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width; // lat (0..1)
  const y = (ev.clientY - rect.top) / rect.height; // lng (0..1)
  if (!state.placePicker) state.placePicker = { kind: 'work', label: '', lat: null, lng: null };
  state.placePicker.lat = Math.max(0, Math.min(1, x));
  state.placePicker.lng = Math.max(0, Math.min(1, y));
  // input-ийн утгыг хадгал
  const lbl = document.getElementById('pp-label');
  if (lbl) state.placePicker.label = lbl.value;
  renderPlacePickerModal();
}
window.onPlacePickerMapClick = onPlacePickerMapClick;

function savePlacePicker() {
  const pp = state.placePicker;
  if (!pp) return;
  const lbl = document.getElementById('pp-label');
  if (lbl) pp.label = lbl.value;
  if (pp.lat == null || pp.lng == null) {
    showToast('Газрын зураг дээр товшиж байршил сонгоно уу', 'warning');
    return;
  }
  // Ижил kind-аас аль хэдийн нэг буюу хэд хэдийг хадгалсан байвал нэр заавал
  // — нэр өгөхгүй бол "Ажил", "Ажил" хоёр ялгагдахгүй болно.
  const existingPlaces = state.myPlaces || [];
  const sameKindCount = existingPlaces.filter((p) => p.kind === pp.kind && p.id !== pp.editId).length;
  const trimmedLabel = (pp.label || '').trim();
  if (sameKindCount > 0 && !trimmedLabel) {
    showToast(`Энэ "${placeKindMeta(pp.kind).label}" төрлөөс өөр газартай ялгах нэр оруулна уу`, 'warning');
    if (lbl) lbl.focus();
    return;
  }
  if (!trimmedLabel) {
    pp.label = placeKindMeta(pp.kind).label;
  }
  const isEdit = !!pp.editId;
  const meta = placeKindMeta(pp.kind);
  addOrUpdatePlace({ id: pp.editId, kind: pp.kind, label: pp.label.trim(), lat: pp.lat, lng: pp.lng });
  closePlacePicker();
  showPlaceSuccessBanner(pp.label.trim(), meta, isEdit);
  if (currentScreen === 'home') {
    renderAppScreen('home');
    setTimeout(() => lucide.createIcons(), 0);
  } else if (currentScreen === 'property') {
    renderAppScreen('property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.savePlacePicker = savePlacePicker;

function closePlacePicker() {
  const wasFromOnboarding = !!(state.placePicker && state.placePicker.source === 'onboarding');
  state.placePicker = null;
  destroyPlacePickerLeafletMap();
  closeModal({ skipPlacePicker: true });
  if (wasFromOnboarding && shouldShowOnboarding()) {
    setTimeout(() => renderOnboardingModal(), 50);
  }
}
window.closePlacePicker = closePlacePicker;

/* ============== COMMUTE CARD — property page ============== */
function renderMyPlacesCommute(l) {
  const places = state.myPlaces || [];
  const header = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-semibold flex items-center gap-2">
        <i data-lucide="route" class="w-4 h-4" style="color: var(--gold-brand);"></i>
        Миний газруудаас энэ үл хөдлөх хүртэлх зай & хугацаа
      </h3>
      ${places.length ? `<button onclick="openPlacePicker()" class="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-2)]" style="color: var(--gold-brand);" title="Олон ажил/сургууль/цэцэрлэг нэр өгөөд нэмж болно"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Газар нэмэх</button>` : ''}
    </div>`;

  if (!places.length) {
    return `
    <div>
      ${header}
      <div class="card p-6 text-center" style="border: 1px dashed var(--gold-brand); background: linear-gradient(135deg, rgba(201,163,95,.05) 0%, transparent 100%);">
        <div class="mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center" style="background: var(--gold-brand); color: #0A1F44;">
          <i data-lucide="map-pinned" class="w-7 h-7"></i>
        </div>
        <div class="text-sm font-semibold mb-1">Гэр, ажил, сургуулиа нэмбэл хэдэн минут хол байгааг харна</div>
        <p class="text-xs mb-4" style="color: var(--text-3); max-width: 420px; margin-left: auto; margin-right: auto;">
          Та өөрийн гэр, ажил, хүүхдийн сургууль, цэцэрлэгийн байршлуудыг газрын зурагт тэмдэглэвэл — энэ үл хөдлөх хүртэл алхаж хэдэн минут, машинаар хэдэн минут зарцуулахыг тооцон харуулна. Олон ажил/сургууль/цэцэрлэгийг тус бүрд нь нэр өгөөд нэмж болно.
        </p>
        <button onclick="openPlacePicker()" class="bm-btn-gold !text-xs"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Эхний газраа нэмэх</button>
      </div>
    </div>`;
  }

  const rows = places
    .map((p) => {
      const meta = placeKindMeta(p.kind);
      const km = placeDistanceKm(p, l);
      const t = placeTravel(km);
      const kmTxt = km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
      return `
      <div class="card p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background:${meta.color}; color:#fff;">
          <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold truncate">${p.label}</div>
          <div class="text-[11px]" style="color: var(--text-3);">${meta.label} · <span class="num">${kmTxt}</span></div>
        </div>
        <div class="flex items-center gap-3 text-center shrink-0">
          <div class="px-3 py-1.5 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border); min-width: 78px;">
            <div class="flex items-center justify-center gap-1.5 text-[10px] mb-0.5" style="color: var(--text-3);">
              <i data-lucide="footprints" class="w-3 h-3"></i> Алхаж
            </div>
            <div class="num text-sm font-semibold">${t.walkMin} мин</div>
          </div>
          <div class="px-3 py-1.5 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border); min-width: 78px;">
            <div class="flex items-center justify-center gap-1.5 text-[10px] mb-0.5" style="color: var(--text-3);">
              <i data-lucide="car" class="w-3 h-3"></i> Машинаар
            </div>
            <div class="num text-sm font-semibold">${t.driveMin} мин</div>
          </div>
        </div>
        <button onclick="openPlacePicker('${p.id}')" class="p-2 rounded-md hover:bg-[var(--surface-2)] shrink-0" title="Засах" style="color: var(--text-3);">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
      </div>
    `;
    })
    .join('');

  return `
    <div>
      ${header}
      <div class="space-y-2.5">${rows}</div>
      <div class="text-[10px] mt-2" style="color: var(--text-3);">
        <i data-lucide="info" class="w-3 h-3 inline"></i>
        Тооцоолол: алхах ${WALK_KMH} км/ц · машин ${DRIVE_KMH} км/ц (хотын дундаж). Тоо нь ойролцоо утга.
      </div>
    </div>
  `;
}
window.renderMyPlacesCommute = renderMyPlacesCommute;

/* ============== LEAFLET REAL MAP (home-map-hero only) ==============
   Listings нь одоогоор normalized 0–1 lat/lng-тэй (синтетик газрын зураг).
   Эдгээрийг УБ хотын жинхэнэ хязгаар руу map хийж жинхэнэ OSM tile дээр
   pin байрлуулна. Бусад дэлгэц (results, property) синтетик map хэвээр. */

