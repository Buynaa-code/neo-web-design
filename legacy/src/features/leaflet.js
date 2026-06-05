/* ============== LEAFLET HOME MAP ============== */

const UB_BOUNDS = { latMin: 47.875, latMax: 47.965, lngMin: 106.82, lngMax: 107.04 };
const UB_CENTER = [47.918, 106.917];

function listingToLatLng(l) {
  /* Хуучин l.lat (0–1) → зүүн/баруун (lng), l.lng (0–1) → дээш/доош (lat).
     y=0 нь дээд тал, харин жинхэнэ газарт хойшоо lat-аар их утга. */
  const lat = UB_BOUNDS.latMax - l.lng * (UB_BOUNDS.latMax - UB_BOUNDS.latMin);
  const lng = UB_BOUNDS.lngMin + l.lat * (UB_BOUNDS.lngMax - UB_BOUNDS.lngMin);
  return [lat, lng];
}
window.listingToLatLng = listingToLatLng;

let homeLeafletMap = null;
let homeLeafletMarkers = [];
let homeLeafletListingMarkers = [];
let homeLeafletMapEl = null;
let homeLeafletReclusterTimer = null;

function rectsIntersect(a, b, gap = 0) {
  return !(a.right + gap <= b.left || a.left - gap >= b.right || a.bottom + gap <= b.top || a.top - gap >= b.bottom);
}

function declutterHomeLeafletMarkers(items, el) {
  if (!homeLeafletMap || !items.length) return;
  // Маркер бүрийг эхлээд жинхэнэ lat/lng дээр нь буцаана — өмнөх declutter-аас үлдсэн
  // шилжүүлэлт zoom/pan-ы дараа маркеруудыг газартаа хазайлгадаг.
  items.forEach((item) => {
    if (item.base) item.marker.setLatLng(item.base);
  });
  const mapRect = el.getBoundingClientRect();
  const markerW = 126;
  const markerH = 44;
  const pad = 8;
  const blockers = [
    ...document.querySelectorAll('.home-ai-panel:not(.collapsed), .home-stats-strip, .home-topbar, .qf-bar'),
  ]
    .filter((node) => getComputedStyle(node).display !== 'none')
    .map((node) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
  const offsets = [[0, 0]];
  for (let ring = 1; ring <= 6; ring++) {
    const radius = ring * 54;
    const steps = ring === 1 ? 8 : 12;
    for (let i = 0; i < steps; i++) {
      const angle = (Math.PI * 2 * i) / steps;
      offsets.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
  }
  const placed = [];
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  sorted.forEach((item) => {
    const base = homeLeafletMap.latLngToContainerPoint(item.base);
    let chosen = null;
    for (const [dx, dy] of offsets) {
      const x = base.x + dx;
      const y = base.y + dy;
      const rect = {
        left: mapRect.left + x - markerW / 2,
        right: mapRect.left + x + markerW / 2,
        top: mapRect.top + y - markerH / 2,
        bottom: mapRect.top + y + markerH / 2,
      };
      const inMap =
        rect.left >= mapRect.left + pad &&
        rect.right <= mapRect.right - pad &&
        rect.top >= mapRect.top + pad &&
        rect.bottom <= mapRect.bottom - pad;
      if (!inMap) continue;
      const hitsUi = blockers.some((b) => rectsIntersect(rect, b, 6));
      const hitsPin = placed.some((p) => rectsIntersect(rect, p, 6));
      if (!hitsUi && !hitsPin) {
        chosen = { x, y, rect };
        break;
      }
    }
    if (chosen) {
      item.marker.setLatLng(homeLeafletMap.containerPointToLatLng(L.point(chosen.x, chosen.y)));
      placed.push(chosen.rect);
    }
  });
}

function destroyHomeLeafletMap() {
  if (homeLeafletReclusterTimer) {
    clearTimeout(homeLeafletReclusterTimer);
    homeLeafletReclusterTimer = null;
  }
  if (homeLeafletMap) {
    try {
      homeLeafletMap.remove();
    } catch (e) {}
    homeLeafletMap = null;
    homeLeafletMarkers = [];
    homeLeafletListingMarkers = [];
    homeLeafletMapEl = null;
  }
}
window.destroyHomeLeafletMap = destroyHomeLeafletMap;

function initHomeLeafletMap(listings) {
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded');
    return;
  }
  const el = document.getElementById('leaflet-home-map');
  if (!el) return;
  destroyHomeLeafletMap();
  homeLeafletMapEl = el;

  homeLeafletMap = L.map(el, {
    zoomControl: false,
    attributionControl: false,
    minZoom: 11,
    maxZoom: 18,
    maxBounds: [
      [UB_BOUNDS.latMin - 0.1, UB_BOUNDS.lngMin - 0.1],
      [UB_BOUNDS.latMax + 0.1, UB_BOUNDS.lngMax + 0.1],
    ],
    maxBoundsViscosity: 0.7,
  }).setView(UB_CENTER, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(homeLeafletMap);

  const listingBounds = [];
  const listingMarkers = [];
  homeLeafletListingMarkers = listingMarkers;

  // Zoom/move үед маркеруудыг base lat/lng руу нь буцаагаад дахин declutter хийнэ.
  // Үгүй бол өмнөх declutter-аас үлдсэн шилжүүлэлт zoom-ын дараа маркеруудыг
  // мапны байршилтай харьцангуй хазайлгадаг.
  const scheduleRecluster = () => {
    if (homeLeafletReclusterTimer) clearTimeout(homeLeafletReclusterTimer);
    homeLeafletReclusterTimer = setTimeout(() => {
      homeLeafletReclusterTimer = null;
      if (homeLeafletMap && homeLeafletMapEl && homeLeafletListingMarkers.length) {
        declutterHomeLeafletMarkers(homeLeafletListingMarkers, homeLeafletMapEl);
      }
    }, 80);
  };
  homeLeafletMap.on('zoomend moveend', scheduleRecluster);

  (listings || []).forEach((l) => {
    const [lat, lng] = listingToLatLng(l);
    const isHot = l.status === 'hot';
    const isFeatured = isHot || l.isUserListing;
    const priceText = typeof fmtMapPinPrice === 'function' ? fmtMapPinPrice(l) : l.price + '';
    const metaText = typeof fmtMapPinMeta === 'function' ? fmtMapPinMeta(l) : l.area ? `${l.area}м²` : '';
    const html = `<div class="leaflet-price-pin ${isFeatured ? 'hot' : ''}" onclick="openProperty(${l.id})">
      <span class="pin-house-mark"><i data-lucide="home" class="pin-house-svg"></i></span>
      <span class="pin-copy">
        <span class="pin-price-line num">${priceText}</span>
        ${metaText ? `<span class="pin-area-line">${metaText}</span>` : ''}
      </span>
    </div>`;
    const icon = L.divIcon({
      className: `leaflet-marker-icon-wrap leaflet-listing-icon-wrap`,
      html,
      iconSize: [160, 52],
      iconAnchor: [80, 26],
      tooltipAnchor: [0, -24],
    });
    const marker = L.marker([lat, lng], { icon, zIndexOffset: isFeatured ? 500 : 0 }).addTo(homeLeafletMap);
    // Tag the DOM with listing id so highlight-by-card can find it
    setTimeout(() => {
      const el = marker.getElement();
      if (el) {
        el.dataset.listingId = String(l.id);
      }
    }, 0);
    listingBounds.push([lat, lng]);
    listingMarkers.push({ marker, base: L.latLng(lat, lng), priority: isFeatured ? 2 : 1 });
    const ag = typeof getAgent === 'function' ? getAgent(l.agentId) : { name: '', initials: '' };
    const priceLabel = typeof listingPrice === 'function' ? listingPrice(l) : l.price;
    const photoSrc = typeof photoUrl === 'function' ? photoUrl(l, 0, '320/200') : '';
    const tipHtml = `
      <div class="hover-tip-card" onclick="openProperty(${l.id})">
        <div class="hover-tip-photo" style="background-image:url('${photoSrc}')">
          ${isFeatured ? '<div class="hover-tip-badge">★ Онцлох</div>' : ''}
        </div>
        <div class="hover-tip-body">
          <div class="hover-tip-price num">${priceLabel}</div>
          <div class="hover-tip-title">${l.khotkhon}</div>
          <div class="hover-tip-meta">${l.rooms} өрөө · ${l.area}м² · ${l.floor} давхар · ${l.year} он</div>
          <div class="hover-tip-sub"><i data-lucide="map-pin" style="width:11px;height:11px;display:inline;vertical-align:-1px;"></i> ${l.district}, ${l.khoroo}-р хороо</div>
          ${ag.name ? `<div class="hover-tip-agent"><span class="hover-tip-avatar">${ag.initials || ''}</span> ${ag.name}${ag.verified ? ' <i data-lucide="badge-check" style="width:11px;height:11px;display:inline;color:var(--gold-brand);"></i>' : ''}</div>` : ''}
          <div class="hover-tip-cta">Дэлгэрэнгүй →</div>
        </div>
      </div>
    `;
    marker.bindTooltip(tipHtml, {
      direction: 'top',
      offset: [0, -6],
      opacity: 1,
      sticky: true,
      className: 'hover-tip-wrap',
      permanent: false,
    });
    marker.on('tooltipopen', () => {
      setTimeout(() => {
        try {
          lucide.createIcons();
        } catch (e) {}
      }, 0);
    });
    marker.on('click', () => openProperty(l.id));
    marker.on('mouseover', () => {
      if (window.highlightHomeCard) window.highlightHomeCard(l.id, true);
    });
    marker.on('mouseout', () => {
      if (window.highlightHomeCard) window.highlightHomeCard(null, false);
    });
    homeLeafletMarkers.push(marker);
  });

  if (listingBounds.length === 1) {
    homeLeafletMap.setView(listingBounds[0], 13, { animate: false });
  } else if (listingBounds.length > 1) {
    const aiPanel = document.querySelector('.home-ai-panel:not(.collapsed)');
    const aiWidth = aiPanel ? aiPanel.getBoundingClientRect().width : 0;
    const rightPadding = aiWidth ? Math.min(Math.round(aiWidth + 260), Math.round(el.clientWidth * 0.58)) : 130;
    homeLeafletMap.fitBounds(L.latLngBounds(listingBounds), {
      paddingTopLeft: [130, 150],
      paddingBottomRight: [rightPadding, 150],
      maxZoom: 12,
      animate: false,
    });
  }
  declutterHomeLeafletMarkers(listingMarkers, el);

  // My Places — гэр, ажил, сургуулийн pin-ийг харуулна
  (state.myPlaces || []).forEach((p) => {
    const meta = placeKindMeta(p.kind);
    const [lat, lng] = listingToLatLng({ lat: p.lat, lng: p.lng });
    const html = `<div onclick="openPlacePicker('${p.id}')" style="background:${meta.color}; color:#fff; padding:5px 10px; border-radius:999px; font-size:11px; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,.4); display:inline-flex; align-items:center; gap:6px; white-space:nowrap; cursor:pointer; transform:translate(-50%,-110%); border:2px solid #fff;" title="${(p.label || meta.label).replace(/"/g, '&quot;')} — засах">
      ★ ${(p.label || meta.label).slice(0, 18)}
    </div>`;
    const icon = L.divIcon({ className: 'leaflet-marker-icon-wrap', html, iconSize: null, iconAnchor: [0, 0] });
    const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(homeLeafletMap);
    homeLeafletMarkers.push(marker);
  });

  setTimeout(() => {
    try {
      homeLeafletMap.invalidateSize();
      declutterHomeLeafletMarkers(listingMarkers, el);
      if (window.lucide) lucide.createIcons();
    } catch (e) {}
  }, 50);
}
window.initHomeLeafletMap = initHomeLeafletMap;
