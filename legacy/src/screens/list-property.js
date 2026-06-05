/* ============== SCREEN: LIST PROPERTY (both legacy + smart wizard) ============== */

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
  return required ? '<span class="lp-required-badge">заавал</span>' : '<span class="lp-optional-badge">дараа нөхөж болно</span>';
}
function lpLabel(label, required) {
  return `<label class="text-xs mb-1.5 block" style="color: var(--text-3);">${label}${lpBadge(required)}</label>`;
}
function lpChip(path, item, active, icon) {
  return `<button type="button" onclick="toggleListPropArray('${path}', '${lpJS(item)}')" class="lp-chip ${active ? 'is-active' : ''}">${icon ? `<i data-lucide="${icon}" class="w-3 h-3"></i>` : ''}${lpEsc(item)}</button>`;
}
function lpBool(path, label, active, icon) {
  return `<button type="button" onclick="toggleListPropBoolean('${path}')" class="lp-chip ${active ? 'is-active' : ''}">${icon ? `<i data-lucide="${icon}" class="w-3 h-3"></i>` : ''}${lpEsc(label)}</button>`;
}
function lpStepHeader(n) {
  const g = SMART_LIST_PROP_GROUPS.find((x) => x.step === n);
  return `<div class="lp-step-head"><div><div class="lp-step-kicker">${g.sub}</div><h2 class="lp-step-title"><i data-lucide="${g.icon}" class="w-5 h-5"></i>${g.title}</h2></div><div class="lp-step-cover-row">${g.covers.map((x) => `<span class="lp-step-cover-pill">${x}</span>`).join('')}</div></div>`;
}
function renderListPropSidebar(d, step, pct) {
  const missing = lpRequired(d).filter((x) => !x.ok);
  return `<aside class="space-y-3 lg:sticky lg:top-24 self-start">
    <div class="card lp-progress-card">
      <div class="lp-progress-top">
        <div class="lp-progress-title">Бүрэн байдал</div>
        <div class="lp-progress-value">${pct}%</div>
      </div>
      <div class="lp-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
        <div class="lp-progress-indicator" style="width:${pct}%;"></div>
      </div>
      <div class="lp-progress-note">${missing.length ? `${missing.length} заавал бөглөх зүйл үлдсэн` : 'Нийтлэх хүсэлт илгээхэд бэлэн'}</div>
    </div>
    <div class="card lp-step-nav">${SMART_LIST_PROP_GROUPS.map((g) => {
      const active = step === g.step;
      const done = lpRequired(d).filter((x) => x.step === g.step).every((x) => x.ok);
      return `<button type="button" onclick="goListPropStep(${g.step})" class="lp-step-nav-item ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}">
        <span class="lp-step-nav-icon"><i data-lucide="${done && !active ? 'check' : g.icon}" class="w-4 h-4"></i></span>
        <span><span class="lp-step-nav-title">${g.title}</span><span class="lp-step-nav-sub">${g.sub}</span></span>
      </button>`;
    }).join('')}</div>
    <div class="card lp-step-index-card"><div class="lp-step-index-title">13 алхмын хамрах хүрээ</div><div class="lp-step-index-grid">${Array.from({ length: 13 }, (_, i) => {
      const n = i + 1;
      const group = n <= 3 ? 1 : n <= 5 ? 2 : n <= 8 ? 3 : n <= 11 ? 4 : 5;
      return `<span class="lp-step-index-cell ${group === step ? 'is-current' : group < step ? 'is-past' : ''}">${String(n).padStart(2, '0')}</span>`;
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
  const vatChecks = `
    <label class="flex items-center gap-2 p-3 cursor-pointer" style="border:1px solid var(--border);">
      <input type="checkbox" ${d.pricing.vatIncluded ? 'checked' : ''} onchange="setListPropField('pricing.vatIncluded', this.checked)" />
      <span class="text-sm">Дээрх үнэд НӨАТ багтсан уу? <strong>${d.pricing.vatIncluded ? 'Багтсан' : 'Багтаагүй'}</strong></span>
    </label>
    <label class="flex items-center gap-2 p-3 cursor-pointer" style="border:1px solid var(--border);">
      <input type="checkbox" ${d.pricing.ebarimt ? 'checked' : ''} onchange="setListPropField('pricing.ebarimt', this.checked)" />
      <span class="text-sm">Гэрээлэгч-ид НӨАТ-тэй ebarimt олгох эсэх? <strong>${d.pricing.ebarimt ? 'Олгоно' : 'Олгохгүй'}</strong></span>
    </label>`;
  const rentRows = [1, 2, 3, 4, 6, 12]
    .map((m) => {
      const disc = parseFloat(d.pricing.rentDiscounts[m]) || 0;
      const monthly = price ? Math.round(price * (1 - disc / 100)) : 0;
      const total = monthly * m;
      const first = total + deposit;
      return `<div class="lp-rent-table-row">
        <div class="lp-rent-table-cell">${m} сар тутам</div>
        <div class="lp-rent-table-cell"><input class="input num !py-1.5" type="number" min="0" max="100" value="${disc}" oninput="setListPropDiscount(${m}, this.value)" /></div>
        <div class="lp-rent-table-cell num">${monthly ? monthly.toLocaleString('en-US') + '₮' : '-'}</div>
        <div class="lp-rent-table-cell num">${total ? total.toLocaleString('en-US') + '₮' : '-'}</div>
        <div class="lp-rent-table-cell num">${first ? first.toLocaleString('en-US') + '₮' : '-'}</div>
      </div>`;
    })
    .join('');
  return `<section class="card p-5">
    <div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="banknote" class="w-4 h-4" style="color: var(--gold-brand);"></i>10. Үнэ, төлбөрийн нөхцөл ${lpBadge(true)}</div>
    <div class="grid md:grid-cols-2 gap-3">
      <div>${lpLabel(sale ? 'Нийт үнэ (₮)' : 'Нийт үнэ/сар (₮)', true)}<input class="input num" type="number" min="0" placeholder="${sale ? '450000000' : '4000000'}" value="${lpEsc(sale ? d.pricing.totalPrice : d.pricing.monthlyPrice)}" oninput="setListPropField('${sale ? 'pricing.totalPrice' : 'pricing.monthlyPrice'}', this.value)" /></div>
      <div>${lpLabel(sale ? 'Нэгжийн үнэ (₮/м²)' : 'Нэгжийн үнэ/сар (₮/м²/сар)', false)}<input class="input num" value="${unit ? unit.toLocaleString('en-US') : ''}" placeholder="Нийт үнийг нийт м²-т хувааж гаргана" disabled /></div>
      ${
        sale
          ? vatChecks
          : `<div>${lpLabel('Давтамж', false)}<select class="input" onchange="setListPropField('pricing.rentFrequency', this.value)">${SMART_LIST_PROP_RENT_FREQUENCIES.map((x) => `<option value="${x}" ${d.pricing.rentFrequency === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
             <div>${lpLabel('Барьцаа (₮)', false)}<input class="input num" type="number" min="0" placeholder="4000000" value="${lpEsc(d.pricing.deposit)}" oninput="setListPropField('pricing.deposit', this.value)" /></div>${vatChecks}`
      }
    </div>
    ${
      sale
        ? `<div class="mt-4">${lpLabel('ТӨЛБӨРИЙН НӨХЦӨЛ', false)}<div class="flex flex-wrap gap-2">${SMART_LIST_PROP_SALE_PAYMENT_FORMS.map((x) => lpChip('pricing.paymentForms', x, (d.pricing.paymentForms || []).includes(x))).join('')}</div></div>`
        : `<div class="lp-rent-table">
          <div class="lp-rent-table-inner">
            <div class="lp-rent-table-head">
              <div class="lp-rent-table-cell">Давтамж</div>
              <div class="lp-rent-table-cell">Хөнгөлөлт %</div>
              <div class="lp-rent-table-cell">Үнийн дүн [төгрөг/сар]</div>
              <div class="lp-rent-table-cell">Үнийн дүн [төгрөг]</div>
              <div class="lp-rent-table-cell">Анхны төлбөр [төгрөг]</div>
            </div>
            ${rentRows}
          </div>
        </div>`
    }
  </section>`;
}
function renderListPropMedia(d) {
  const photos = lpPhotos(d);
  const cats = ['Нүүрний зураг', 'План зураг', 'Дотор зураг', 'Гадна орчны зураг', 'Мастер төлөвлөгөө, хотхоны зураг', 'Дотроос гадагшаа харагдацын зураг', 'Хотхоны бусад үзүүлэлтийн зураг', 'Бичлэг'];
  return `<section class="card p-5">
    <div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="images" class="w-4 h-4" style="color: var(--gold-brand);"></i>11. Зураг, бичлэг ${lpBadge(true)}</div>
    <div class="lp-upload-grid">
      ${cats
        .map(
          (c) => `<button type="button" onclick="addListPropPhoto('${lpJS(c)}')" class="lp-upload-card">
            <i data-lucide="${c === 'Нүүрний зураг' ? 'image-up' : c === 'План зураг' ? 'scan' : c === 'Бичлэг' ? 'video' : 'plus'}" class="w-4 h-4"></i>
            <div class="lp-upload-title">${c}</div>
            <div class="lp-upload-count">${photos.filter((p) => p.category === c).length} файл</div>
          </button>`,
        )
        .join('')}
    </div>
    <div class="lp-photo-grid">
      ${photos
        .map((p, i) => {
          const isCover = Number(d.media.coverIndex) === i;
          return `<div class="lp-photo-tile ${isCover ? 'is-cover' : ''}" style="background-image:url('https://picsum.photos/seed/${lpEsc(p.seed)}/360/360');">
            <button type="button" onclick="setListPropCover(${i})" class="lp-cover-badge" title="Нүүрний зургаа сонгох">${isCover ? 'Нүүр' : 'Сонгох'}</button>
            <button type="button" onclick="removeListPropPhoto(${i})" class="lp-photo-remove" title="Устгах"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
            <div class="lp-photo-category">${lpEsc(p.category || 'Зураг')}</div>
          </div>`;
        })
        .join('')}
      ${photos.length < 15 ? `<button type="button" onclick="addListPropPhoto('Дотор зураг')" class="lp-photo-add"><i data-lucide="plus" class="w-5 h-5"></i></button>` : ''}
    </div>
    <div class="mt-4">${lpLabel('Зураг, бичлэг агуулсан линк', false)}<input class="input" placeholder="https://..." value="${lpEsc(d.media.videoLink)}" oninput="setListPropField('media.videoLink', this.value)" /></div>
  </section>`;
}
function renderListPropStep4(d) {
  const certOptions = ['Бэлэн гэрчилгээтэй', 'Дуусаагүй барилгын гэрчилгээтэй', 'Гэрчилгээгүй - Гэрчилгээ гарахад бэлэн', 'Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй', 'Бусад'];
  const interiorOptions = ['', 'Сүүлийн 1 жилийн хугацаанд засал хийсэн', '1-3 жилийн өмнө засал хийсэн', '3-с дээш жилийн өмнө засал хийсэн / Анхны заслаараа байгаа', 'Засваргүй, Гэрээлэгч өөрөө засал хийнэ', 'Бусад: Дотор засвар хийгдэж байгаа, хийгдэнэ'];
  const collateralOptions = ['Ямар нэг барьцаанд байхгүй', 'Банк, ББСБ, санхүүгийн байгууллагын зээлийн барьцаанд байгаа', 'Гуравдагч этгээдийн барьцаанд байгаа', 'Бусад'];
  return `${lpStepHeader(4)}<div class="space-y-4"><section class="card p-5"><div class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="clipboard-check" class="w-4 h-4" style="color: var(--gold-brand);"></i>09. Үл хөдлөх эд хөрөнгийн төлөв ${lpBadge(false)}</div><div class="grid md:grid-cols-2 gap-3"><div>${lpLabel('Ашиглалтад орсон эсэх', false)}<select class="input" onchange="setListPropField('state.usage', this.value)">${['Ашиглалтад орсон', 'Ашиглалтад ороогүй'].map((x) => `<option value="${lpEsc(x)}" ${d.state.usage === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('Ашиглалтад орсон он', false)}<input class="input num" type="number" min="1950" max="2035" placeholder="2020" value="${lpEsc(d.state.commissionYear)}" oninput="setListPropField('state.commissionYear', this.value)" /></div><div>${lpLabel('Ашиглалтад орох хугацаа', false)}<input class="input" placeholder="2026.IV" value="${lpEsc(d.state.commissionDue || '')}" oninput="setListPropField('state.commissionDue', this.value)" /></div><div>${lpLabel('Улсын бүртгэлийн гэрчилгээтэй эсэх', false)}<select class="input" onchange="setListPropField('state.certStatus', this.value)">${certOptions.map((x) => `<option value="${lpEsc(x)}" ${d.state.certStatus === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('ҮХЭХ улсын бүртгэлийн дугаар', false)}<input class="input mono" placeholder="Ү220#######" value="${lpEsc(d.state.certNumber)}" oninput="setListPropField('state.certNumber', this.value)" /></div><div>${lpLabel('Ашиглагдаж байсан байдал', false)}<select class="input" onchange="setListPropField('state.condition', this.value)">${['Цоо шинэ, ашиглаж байгаагүй', 'Ашиглагдаж байсан'].map((x) => `<option value="${lpEsc(x)}" ${d.state.condition === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('Одоогийн байдал (гэрээ байгуулах үеийн)', false)}<select class="input" onchange="setListPropField('state.current', this.value)">${['Түрээсийн эсхүл хөлслүүлэх гэрээтэй байгаа', 'Амьдарч, ашиглаж байгаа', 'Сул, чөлөөтэй байгаа', 'Бусад'].map((x) => `<option value="${lpEsc(x)}" ${d.state.current === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div>${lpLabel('Дотор засал', false)}<select class="input" onchange="setListPropField('state.interior', this.value)">${interiorOptions.map((x) => `<option value="${lpEsc(x)}" ${d.state.interior === x ? 'selected' : ''}>${x || 'Сонгох'}</option>`).join('')}</select></div><div>${lpLabel('Барьцаанд байгаа эсэх', false)}<select class="input" onchange="setListPropField('state.collateral', this.value)">${collateralOptions.map((x) => `<option value="${lpEsc(x)}" ${d.state.collateral === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="md:col-span-2">${lpLabel('Барьцаа, төлөвийн тайлбар', false)}<textarea class="input" rows="2" placeholder="Хэрэв аливаа хэлбэрийн барьцаанд байгаа бол тайлбар..." oninput="setListPropField('state.collateralNote', this.value)">${lpEsc(d.state.collateralNote || '')}</textarea></div></div><div class="flex flex-wrap gap-2 mt-4">${lpBool('state.certificateAttached', 'Гэрчилгээ хавсаргах', d.state.certificateAttached, 'paperclip')}${lpBool('state.contractAttached', 'Захиалгын гэрээ / улсын комиссын акт хавсаргах', d.state.contractAttached, 'paperclip')}</div></section>${renderListPropPricing(d)}${renderListPropMedia(d)}</div>`;
}
function lpReview(label, value, icon) {
  return `<div class="lp-review-card"><div class="lp-review-label">${icon ? `<i data-lucide="${icon}" class="w-3.5 h-3.5"></i>` : ''}${label}</div><div class="lp-review-value">${lpEsc(value || '-')}</div></div>`;
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
  return `<div class="lp-shadcn lp-page-shell">
    <div class="lp-page-header">
      <div>
        <div class="lp-page-kicker"><i data-lucide="wand-sparkles" class="w-3.5 h-3.5"></i> Зар оруулах wizard</div>
        <h1 class="lp-page-title">Зар оруулах</h1>
        <p class="lp-page-description">13 алхмын мэдээллийг 5 хэсэгт бөглөж нийтлэх хүсэлт илгээнэ.</p>
      </div>
      <div class="lp-summary-badges">
        <span class="lp-summary-badge"><i data-lucide="${goal.icon}" class="w-3.5 h-3.5"></i>${goal.label}</span>
        <span class="lp-summary-badge"><i data-lucide="${type.icon}" class="w-3.5 h-3.5"></i>${type.label}</span>
      </div>
    </div>
    <div class="lp-main-grid">
      ${renderListPropSidebar(d, step, pct)}
      <main class="lp-main-content">
        ${step === 1 ? renderListPropStep1(d) : ''}
        ${step === 2 ? renderListPropStep2(d) : ''}
        ${step === 3 ? renderListPropStep3(d) : ''}
        ${step === 4 ? renderListPropStep4(d) : ''}
        ${step === 5 ? renderListPropStep5(d) : ''}
        <div class="lp-actions-bar">
          <div class="lp-actions-secondary">
            <button type="button" onclick="${step === 1 ? 'cancelListProperty()' : 'prevListPropStep()'}" class="btn btn-secondary"><i data-lucide="${step === 1 ? 'x' : 'arrow-left'}" class="w-4 h-4"></i> ${step === 1 ? 'Цуцлах' : 'Буцах'}</button>
            <button type="button" onclick="saveListPropertyDraft()" class="btn btn-secondary"><i data-lucide="save" class="w-4 h-4"></i> Түр хадгалах</button>
          </div>
          ${step < 5 ? `<button type="button" onclick="nextListPropStep()" class="btn btn-cta">Дараагийнх <i data-lucide="arrow-right" class="w-4 h-4"></i></button>` : `<button type="button" onclick="submitListProperty()" class="btn btn-cta"><i data-lucide="send" class="w-4 h-4"></i> Зар нийтлэх хүсэлт илгээх</button>`}
        </div>
      </main>
    </div>
  </div>`;
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
