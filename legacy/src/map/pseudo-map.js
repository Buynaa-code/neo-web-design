/* ============== PSEUDO MAP — draw zones, pan/zoom, pins, full-map overlay ============== */

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

