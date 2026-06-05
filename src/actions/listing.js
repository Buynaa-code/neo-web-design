/* ============== ACTIONS — listing + agent + directions ============== */

function markViewed(id) {
  const i = VIEWED_IDS.indexOf(id);
  if (i >= 0) VIEWED_IDS.splice(i, 1);
  VIEWED_IDS.unshift(id);
  if (VIEWED_IDS.length > 30) VIEWED_IDS.length = 30;
  // Wishlist pipeline-д "saved"-аас өндөр статусгүй бол "viewed" болгож тэмдэглэе
  if (typeof LISTING_STATUS !== 'undefined') {
    const cur = LISTING_STATUS[id];
    if (!cur || cur === 'saved') LISTING_STATUS[id] = 'viewed';
  }
}
window.markViewed = markViewed;

function openProperty(id) {
  markViewed(id);
  state.currentListingId = id;
  state.scheduleStep = 1;
  if (state.fullMap) closeFullMap();
  goTo('property');
}
window.openProperty = openProperty;

function highlightFromPin(id) {
  state.highlightedId = id;
  renderAppScreen('results');
}

/* Click on a district zone polygon — toggle filter and jump to results.
   Empty districts (no listings in current mode) are ignored. */

function openHeroPicker(field) {
  const ist = state.mode === 'rent';
  let body = '',
    title = '';
  if (field === 'district') {
    title = 'Дүүрэг сонгох';
    body = `
      <p class="text-xs text-[#4A5874] mb-3">Олон сонголт хийж болно</p>
      <div class="space-y-1.5">
        ${DISTRICTS.map((d) => {
          const count = activeListings().filter((l) => l.district === d).length;
          const checked = ['Хан-Уул', 'Сүхбаатар'].includes(d);
          return `<label class="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0EAD9] cursor-pointer">
            <input type="checkbox" ${checked ? 'checked' : ''} class="accent-[#0A1F44]" />
            <span class="text-sm flex-1">${d}</span>
            <span class="text-xs text-[#8A93A8] num">${count}</span>
          </label>`;
        }).join('')}
      </div>
    `;
  } else if (field === 'rooms') {
    title = 'Өрөөний тоо';
    body = `
      <p class="text-xs text-[#4A5874] mb-3">Хайх боломжтой бүх хүрээ</p>
      <div class="grid grid-cols-4 gap-2">
        ${[1, 2, 3, 4].map((n) => `<button onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected')); this.classList.add('selected');" class="src-chip py-3 ${n === 2 || n === 3 ? 'selected' : ''}">${n}${n === 4 ? '+' : ''} өрөө</button>`).join('')}
      </div>
    `;
  } else if (field === 'price') {
    title = 'Үнийн хүрээ';
    body = `
      <p class="text-xs text-[#4A5874] mb-3">${ist ? 'Сарын түрээс' : 'Зарын үнэ'}</p>
      <div class="flex items-end gap-[2px] h-14 mb-3">
        ${[2, 4, 6, 9, 12, 18, 22, 28, 24, 18, 14, 10, 7, 5, 4, 3, 2, 1].map((h) => `<div class="flex-1 bg-[#0A1F44] rounded-sm opacity-${h > 15 ? '80' : h > 10 ? '60' : h > 5 ? '40' : '25'}" style="height:${h * 3.5}%"></div>`).join('')}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1 block">Доод</label><input class="input" value="${ist ? '800,000' : '300,000,000'}" /></div>
        <div><label class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1 block">Дээд</label><input class="input" value="${ist ? '2,000,000' : '600,000,000'}" /></div>
      </div>
    `;
  }
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <h3 class="font-semibold text-lg">${title}</h3>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">${body}</div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('Сонголт хадгалагдлаа', 'success', { duration: 1200 });" class="btn btn-primary">Хэрэглэх</button>
    </div>
  `);
}

function openCallAgent(agentId) {
  const agent = getAgent(agentId);
  openModal(`
    <div class="p-6 text-center">
      <div class="w-16 h-16 rounded-full text-white text-xl font-semibold flex items-center justify-center mx-auto mb-3" style="background: linear-gradient(135deg, #0A1F44 0%, #051028 100%);">${agent.initials}</div>
      <h3 class="font-semibold text-lg mb-1">${agent.name}</h3>
      <p class="text-sm text-[#4A5874] mb-1">${agent.agency}</p>
      ${agent.verified ? '<span class="pill pill-verified mt-2"><i data-lucide="badge-check" class="w-3 h-3"></i> Баталгаажсан агент</span>' : ''}
      <div class="num text-2xl text-[#0A1F44] my-5">${agent.phone}</div>
      <div class="text-[11px] text-[#8A93A8] mb-5"><span class="w-1.5 h-1.5 rounded-full bg-[#1F6B47] inline-block mr-1"></span>${agent.activity}</div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 bg-[#FAFAF6]">
      <button onclick="navigator.clipboard&&navigator.clipboard.writeText('${agent.phone}'); showToast('Дугаар хуулагдлаа', 'success', { duration: 1500 });" class="btn btn-secondary flex-1"><i data-lucide="copy" class="w-4 h-4"></i> Хуулах</button>
      <a href="tel:${agent.phone.replace(/[^0-9+]/g, '')}" class="btn btn-cta flex-1"><i data-lucide="phone" class="w-4 h-4"></i> Залгах</a>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

function buildLeadSummary(l) {
  // AI хайлт идэвхтэй бол хэрэглэгчийн нөхцөл шаардлагыг товч 4-5 мөрд багтаасан summary
  const ex = state.aiExtracted;
  const parts = [];
  if (state.aiQuery) parts.push(`Хайлт: "${state.aiQuery}"`);
  if (ex) {
    if (ex.district) parts.push(`Дүүрэг: ${ex.district}`);
    if (ex.rooms) parts.push(`Өрөө: ${ex.rooms}`);
    if (ex.maxPrice) parts.push(`Үнийн дээд хязгаар: ${fmtCompact(ex.maxPrice)}`);
    if (ex.minYear) parts.push(`${ex.minYear} оноос хойш`);
    if (ex.lifestyle && ex.lifestyle.length) {
      const labels = ex.lifestyle.map((k) => (LIFESTYLE_DEFS.find((x) => x.key === k) || {}).label).filter(Boolean);
      if (labels.length) parts.push(`Шаардлага: ${labels.join(', ')}`);
    }
  }
  if (state.filterLifestyle && state.filterLifestyle.length && !ex) {
    const labels = state.filterLifestyle
      .map((k) => (LIFESTYLE_DEFS.find((x) => x.key === k) || {}).label)
      .filter(Boolean);
    if (labels.length) parts.push(`Шаардлага: ${labels.join(', ')}`);
  }
  return parts;
}

function openAgentMessage(agentId, listingId) {
  const agent = getAgent(agentId);
  const l = listingId ? getListing(listingId) : null;
  const lead = buildLeadSummary(l);
  const hasLead = lead.length > 0;
  const greeting = `Сайн байна уу, ${l ? l.khotkhon + '-ийн зарын талаар ' : ''}нэмэлт зургийг үзэх боломжтой юу?`;
  const aiBody = hasLead
    ? `Сайн байна уу. Би доорх нөхцлүүдээр хайж байгаа:\n\n${lead.map((p) => '• ' + p).join('\n')}\n\n${l ? l.khotkhon + '-ийн зар тохирч байх шиг байна. Үзэлт товлох боломжтой юу?' : 'Тохирох зар санал болгоход баярлалаа.'}`
    : greeting;
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full text-white text-xs font-semibold flex items-center justify-center" style="background: linear-gradient(135deg, #0A1F44 0%, #051028 100%);">${agent.initials}</div>
        <div>
          <div class="font-semibold text-sm">${agent.name}</div>
          <div class="text-xs text-[#8A93A8]">${agent.activity}</div>
        </div>
      </div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      ${l ? `<div class="card p-3 mb-4 bg-[#F0EAD9] border-[#E8E4DA] flex items-center gap-3"><div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" style="background-image:url('${photoUrl(l, 0, '200/200')}')"></div><div class="flex-1 min-w-0"><div class="font-medium text-sm truncate">${l.khotkhon} · ${l.rooms}ө ${l.area}м²</div><div class="text-xs text-[#4A5874]">${listingPriceShort(l)}</div></div></div>` : ''}
      <label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Мессеж</label>
      <textarea class="input" rows="${hasLead ? 7 : 4}" placeholder="Сайн байна уу, энэ зарын талаар асуумаар байна...">${aiBody}</textarea>
      ${hasLead ? `<div class="ai-lead-banner"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i><div><strong>AI lead summary</strong> автоматаар оруулсан — таны хайлтын нөхцлүүд агентад хүрнэ. Агент танд тохирох сонголтуудыг бэлдэж ирнэ.</div></div>` : ''}
      <div class="flex items-center gap-3 mt-3 text-[11px] text-[#8A93A8]">
        <span class="flex items-center gap-1"><i data-lucide="info" class="w-3 h-3"></i> Хариу дунджаар 12 мин дотор</span>
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('${hasLead ? 'Lead summary-тай мессеж илгээгдлээ' : 'Мессеж илгээгдлээ'}', 'success'); setTimeout(()=>goTo('activity'), 500);" class="btn btn-primary"><i data-lucide="send" class="w-4 h-4"></i> Илгээх</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

function openSmartSearch(query) {
  closeModal();
  showToast('"' + (query || 'Бэлэн орох') + '" хайж байна...', 'info', { duration: 1500 });
  setTimeout(() => goTo('results'), 600);
}

function openDirectionsModal(listingId) {
  const l = getListing(listingId);
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Хүрэх зам</h3><p class="text-xs text-[#8A93A8] mt-0.5">${l.district}, ${l.khotkhon}</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-2">
      <div class="rounded-lg overflow-hidden" style="height: 220px;">${mapBackground([l], { selectedId: l.id, style: 'height: 100%' })}</div>
    </div>
    <div class="p-5 pt-3">
      <div class="grid grid-cols-2 gap-2 mb-3">
        <button class="btn btn-secondary !text-xs"><i data-lucide="navigation" class="w-3.5 h-3.5"></i> Google Maps</button>
        <button class="btn btn-secondary !text-xs"><i data-lucide="map" class="w-3.5 h-3.5"></i> Apple Maps</button>
      </div>
      <button onclick="closeModal(); showToast('Линк хуулагдлаа', 'success', { duration: 1500 })" class="btn btn-primary w-full"><i data-lucide="link" class="w-4 h-4"></i> Линк хуулах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

/* ============== BUS STOP PICKER ============== */
function openBusStopPicker() {
  const groups = {};
  for (const s of BUS_STOPS) {
    (groups[s.district] = groups[s.district] || []).push(s);
  }
  const districtOrder = DISTRICTS.filter((d) => groups[d]);
  const body = districtOrder
    .map(
      (d) => `
    <div class="mb-4">
      <div class="eyebrow mb-2 flex items-center gap-1.5"><i data-lucide="map-pin" class="w-3 h-3"></i> ${d}</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${groups[d]
          .map((s) => {
            const cnt = stopListingCount(s);
            const sel = state.filterBusStop === s.id;
            return `<button onclick="pickBusStop('${s.id}')"
            class="card p-3 text-left transition flex items-start gap-3"
            style="${sel ? 'border-color: var(--primary); background: var(--primary-soft);' : ''}">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style="background: ${sel ? 'var(--primary)' : 'var(--surface-2)'}; color: ${sel ? '#0A1F44' : 'var(--primary)'};">
              <i data-lucide="bus" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium text-sm truncate">${s.name}</div>
              <div class="flex items-center gap-1 mt-1 flex-wrap">
                ${s.routes.map((r) => `<span class="num text-[10px] px-1.5 py-0.5 rounded" style="background: var(--surface-2); color: var(--text-2);">${r}</span>`).join('')}
              </div>
            </div>
            <span class="num text-xs text-[var(--text-3)] shrink-0">${cnt}</span>
          </button>`;
          })
          .join('')}
      </div>
    </div>
  `,
    )
    .join('');

  openModal(
    `
    <div class="p-5 border-b" style="border-color: var(--border);">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-lg flex items-center gap-2"><i data-lucide="bus" class="w-5 h-5" style="color: var(--primary);"></i> Автобусны буудлаар хайх</h3>
          <p class="text-xs text-[var(--text-3)] mt-0.5">Буудал сонгоход 600-800м-ийн доторх зар харагдана</p>
        </div>
        <button onclick="closeModal()" class="text-[var(--text-3)] hover:text-[var(--text)]"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
    </div>
    <div class="p-5 max-h-[60vh] overflow-y-auto">${body}</div>
    <div class="p-4 border-t flex gap-2 justify-between" style="border-color: var(--border); background: var(--surface-2);">
      <button onclick="clearBusStop()" class="btn btn-ghost !text-xs"><i data-lucide="x" class="w-3.5 h-3.5"></i> Буудлын шүүлт цуцлах</button>
      <button onclick="closeModal()" class="btn btn-secondary">Хаах</button>
    </div>
  `,
    'lg',
  );
  setTimeout(() => lucide.createIcons(), 0);
}

function pickBusStop(id) {
  state.filterBusStop = id;
  closeModal();
  const s = getBusStop(id);
  if (s) showToast('"' + s.name + '" буудлын ойролцоо', 'info', { duration: 1500 });
  goTo('results');
}

function clearBusStop() {
  state.filterBusStop = null;
  closeModal();
  if (currentScreen === 'results') renderAppScreen('results');
  showToast('Буудлын шүүлт цуцлагдлаа', 'info', { duration: 1200 });
}

function toggleSaved(id, btnEl) {
  const wasSaved = SAVED_IDS.has(id);
  if (wasSaved) {
    SAVED_IDS.delete(id);
    // Remove from all lists too
    SAVED_LISTS.forEach((l) => {
      l.listingIds = l.listingIds.filter((x) => x !== id);
    });
    showToast('Хадгалснаас хаслаа', 'info', { duration: 1500 });
  } else {
    SAVED_IDS.add(id);
    // Default to first list
    if (!SAVED_LISTS[0].listingIds.includes(id)) SAVED_LISTS[0].listingIds.push(id);
    showToast('Хадгалагдлаа · <strong>' + SAVED_LISTS[0].name + '</strong>', 'success', { duration: 2000 });
  }
  // Update all instances of this heart button
  document.querySelectorAll(`[data-listing-id="${id}"] .heart-btn`).forEach((el) => {
    el.classList.toggle('saved', !wasSaved);
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 350);
  });
  if (btnEl) {
    btnEl.classList.toggle('saved', !wasSaved);
    btnEl.classList.add('pop');
    setTimeout(() => btnEl.classList.remove('pop'), 350);
  }
  if (typeof refreshInterestsBadge === 'function') refreshInterestsBadge();
}

