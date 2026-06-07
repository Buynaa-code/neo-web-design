/* ============== ACTIONS — modals: loan + schedule + saved + auth/OTP ============== */

function setLoanBank(id) {
  state.loanBankId = id;
  const bank = getBank(id);
  if (state.loanDownPct < bank.minDownPct) state.loanDownPct = bank.minDownPct;
  if (state.loanYears > bank.maxYears) state.loanYears = bank.maxYears;
  if (currentScreen === 'property') {
    renderAppScreen('property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.setLoanBank = setLoanBank;

function setLoanDown(v) {
  state.loanDownPct = parseInt(v, 10) || 30;
  if (currentScreen === 'property') {
    renderAppScreen('property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.setLoanDown = setLoanDown;

function setLoanYears(v) {
  state.loanYears = parseInt(v, 10) || 20;
  if (currentScreen === 'property') {
    renderAppScreen('property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.setLoanYears = setLoanYears;

function openLoanCompare() {
  const l = getListing(state.currentListingId);
  if (!l) return;
  const downPct = state.loanDownPct,
    years = state.loanYears;
  const rows = BANKS.map((b) => {
    const dp = Math.max(b.minDownPct, downPct);
    const yr = Math.min(b.maxYears, years);
    const m = mortgageMonthly(l.price, dp, yr, b.rate);
    const tot = m * yr * 12;
    return { b, dp, yr, m, tot };
  }).sort((a, b) => a.m - b.m);
  const best = rows[0];
  openModal(
    `
    <div class="p-5 border-b" style="border-color: var(--border);">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-lg">Банкуудын харьцуулалт</h3>
          <p class="text-xs text-[var(--text-3)] mt-0.5">${l.khotkhon} · ${l.price.toLocaleString('en-US')}₮ · ${downPct}% урьдчилгаа</p>
        </div>
        <button onclick="closeModal()" class="text-[var(--text-3)] hover:text-[var(--text)]"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
    </div>
    <div class="p-5 max-h-[70vh] overflow-y-auto">
      <div class="card p-3 mb-4 flex items-start gap-3" style="border-color: var(--gold-brand); background: var(--gold-soft);">
        <i data-lucide="award" class="w-5 h-5 mt-0.5" style="color: var(--gold-brand);"></i>
        <div>
          <div class="text-sm font-semibold">Хамгийн хямд: ${best.b.name}</div>
          <div class="text-xs mt-0.5" style="color: var(--text-2);">Сарын ${best.m.toLocaleString('en-US')}₮ · ${best.b.rate}% жилийн хүү</div>
        </div>
      </div>
      <div class="space-y-2">
        ${rows
          .map(
            (r, i) => `
          <div class="card p-3 flex items-center gap-3" style="${i === 0 ? 'border-color: var(--gold-brand);' : ''}">
            <div class="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-white" style="background: ${r.b.color}">${r.b.short.slice(0, 2)}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold truncate">${r.b.name}</div>
              <div class="text-[11px] flex gap-2 mt-0.5" style="color: var(--text-3);">
                <span>${r.b.rate}% хүү</span>·<span>${r.yr} жил</span>·<span>${r.dp}% уп</span>
              </div>
            </div>
            <div class="text-right">
              <div class="num text-sm font-semibold">${r.m.toLocaleString('en-US')}₮</div>
              <div class="text-[10px]" style="color: var(--text-3);">сар бүр</div>
            </div>
            <button onclick="setLoanBank('${r.b.id}'); closeModal();" class="btn btn-secondary !text-xs !py-1.5">Сонгох</button>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
    <div class="p-4 flex gap-2 justify-end" style="border-top: 1px solid var(--border); background: var(--surface-2);">
      <button onclick="closeModal()" class="btn btn-secondary">Хаах</button>
    </div>
  `,
    'lg',
  );
  setTimeout(() => lucide.createIcons(), 0);
}
window.openLoanCompare = openLoanCompare;

function openLoanApplyModal(bankId, listingId) {
  const bank = getBank(bankId);
  const l = getListing(listingId);
  openModal(`
    <div class="p-5 border-b" style="border-color: var(--border);">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: ${bank.color}">${bank.short.slice(0, 2)}</div>
          <div>
            <h3 class="font-semibold text-lg">${bank.name}</h3>
            <p class="text-xs text-[var(--text-3)]">Ипотекийн зээлийн урьдчилсан хүсэлт</p>
          </div>
        </div>
        <button onclick="closeModal()" class="text-[var(--text-3)] hover:text-[var(--text)]"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
    </div>
    <div class="p-5 space-y-3">
      <div class="card p-3" style="background: var(--surface-2); border-color: var(--border);">
        <div class="text-xs mb-1" style="color: var(--text-3);">Сонгосон зар</div>
        <div class="text-sm font-semibold">${l.khotkhon} · ${l.rooms}ө ${l.area}м²</div>
        <div class="text-xs mt-0.5" style="color: var(--text-2);">${l.price.toLocaleString('en-US')}₮ · ${l.district}</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="text-xs" style="color: var(--text-3);">Овог</label><input class="input" placeholder="Бат" /></div>
        <div><label class="text-xs" style="color: var(--text-3);">Нэр</label><input class="input" placeholder="Болд" /></div>
      </div>
      <div><label class="text-xs" style="color: var(--text-3);">Утас</label><input class="input" placeholder="+976" value="+976 9911 5544" /></div>
      <div><label class="text-xs" style="color: var(--text-3);">Сарын орлого</label><input class="input num" placeholder="3,500,000" /></div>
      <div class="text-[11px] flex items-start gap-2" style="color: var(--text-3);">
        <i data-lucide="info" class="w-3.5 h-3.5 mt-0.5 shrink-0"></i>
        Хүсэлтийг банкны зээлийн менежертэй дамжуулна. 24 цагт хариу авна.
      </div>
    </div>
    <div class="p-4 flex gap-2 justify-end" style="border-top: 1px solid var(--border); background: var(--surface-2);">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('${bank.short} банк руу хүсэлт явууллаа','success'); goTo('activity');" class="btn btn-cta"><i data-lucide="send" class="w-4 h-4"></i> Илгээх</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}
window.openLoanApplyModal = openLoanApplyModal;

/* ============== NAV DROPDOWN ============== */

function openRescheduleModal(viewingId) {
  const v = VIEWINGS.find((x) => x.id === viewingId);
  if (!v) return;
  const l = getListing(v.listingId);
  const times = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  window.__rescheduleViewingId = viewingId;
  window.__rescheduleTime = v.time;
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Үзэлт өөрчлөх</h3><p class="text-xs text-[#8A93A8] mt-0.5">${l.khotkhon} · одоогийн ${v.date} ${v.time}</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <div class="eyebrow mb-2">Шинэ цаг</div>
      <div id="reschedule-times" class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
        ${times.map((t) => `<button data-time="${t}" onclick="pickRescheduleTime('${t}')" class="src-chip ${t === v.time ? 'selected' : ''}">${t}</button>`).join('')}
      </div>
      <div class="card p-3 bg-[#F0EAD9] border-[#E8E4DA] flex items-start gap-2 text-xs text-[#4A5874]">
        <i data-lucide="info" class="w-3.5 h-3.5 text-[#0A1F44] shrink-0 mt-0.5"></i>
        Агент мэдэгдэл хүлээж авч 2 цагт баталгаажуулна.
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="confirmReschedule()" class="btn btn-primary">Хадгалах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}
function pickRescheduleTime(t) {
  window.__rescheduleTime = t;
  document
    .querySelectorAll('#reschedule-times [data-time]')
    .forEach((b) => b.classList.toggle('selected', b.dataset.time === t));
}
function confirmReschedule() {
  const id = window.__rescheduleViewingId;
  const t = window.__rescheduleTime;
  const v = VIEWINGS.find((x) => x.id === id);
  if (v && t) {
    v.time = t;
    if (v.status === 'confirmed') v.status = 'pending';
  }
  closeModal();
  showToast('Өөрчлөлт илгээгдлээ · агент баталгаажуулна', 'success');
  if (currentScreen === 'activity') renderAppScreen('activity');
}
window.pickRescheduleTime = pickRescheduleTime;
window.confirmReschedule = confirmReschedule;


function openCreateListModal() {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Шинэ жагсаалт үүсгэх</h3><p class="text-xs text-[#8A93A8] mt-0.5">Зарууд хадгалах нэртэй цуглуулга</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Нэр</label>
      <input class="input mb-4" id="new-list-name" placeholder="Жишээ: Зуны түрээс" />
      <div class="eyebrow mb-2">Дүрс</div>
      <div id="new-list-icons" class="grid grid-cols-6 gap-2">
        ${['heart', 'home', 'map-pin', 'star', 'sparkles', 'building-2'].map((ic, i) => `<button data-icon="${ic}" class="src-chip py-3 flex items-center justify-center ${i === 0 ? 'selected' : ''}" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected')); this.classList.add('selected');"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`).join('')}
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="createNewList()" class="btn btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Үүсгэх</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

function createNewList() {
  const name = (document.getElementById('new-list-name')?.value || '').trim() || 'Шинэ жагсаалт';
  const iconBtn = document.querySelector('#new-list-icons .selected');
  const icon = (iconBtn && iconBtn.dataset.icon) || 'heart';
  const id = SAVED_LISTS.reduce((m, l) => Math.max(m, l.id), 0) + 1;
  SAVED_LISTS.push({ id, name, icon, listingIds: [] });
  state.savedListId = id;
  closeModal();
  showToast('"' + name + '" жагсаалт үүслээ', 'success');
  if (currentScreen === 'saved') {
    renderAppScreen('saved');
    setTimeout(() => lucide.createIcons(), 0);
  }
}

function openShareListModal(listId) {
  const list = SAVED_LISTS.find((l) => l.id === listId);
  const link = 'neo.mn/list/' + listId + '/share';
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Жагсаалтаа хуваалцах</h3><p class="text-xs text-[#8A93A8] mt-0.5">${list?.name || 'Жагсаалт'}</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <div class="card p-3 bg-[#F0EAD9] border-[#E8E4DA] mb-4 flex items-center gap-2">
        <code class="text-sm flex-1 truncate">${link}</code>
        <button onclick="navigator.clipboard&&navigator.clipboard.writeText('${link}'); showToast('Линк хуулагдлаа', 'success', { duration: 1500 })" class="btn btn-secondary !text-xs !py-1.5"><i data-lucide="copy" class="w-3 h-3"></i> Хуулах</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button class="btn btn-secondary !text-xs"><i data-lucide="send" class="w-3.5 h-3.5"></i> Telegram</button>
        <button class="btn btn-secondary !text-xs"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Messenger</button>
      </div>
      <p class="text-[11px] text-[#8A93A8] mt-4 text-center">Линк байгаа хүмүүс жагсаалтыг харна, гэхдээ засаж чадахгүй.</p>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

function openEditSearchModal(searchId) {
  const s = SAVED_SEARCHES.find((x) => x.id === searchId);
  if (!s) return;
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Хайлт засах</h3><p class="text-xs text-[#8A93A8] mt-0.5">${s.name}</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-3">
      <div><label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Нэр</label><input class="input" value="${s.name}" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Доод үнэ</label><input class="input num" value="${(s.priceRange[0] / (s.mode === 'rent' ? 1000 : 1000000)).toFixed(0)}${s.mode === 'rent' ? 'K' : 'M'}" /></div>
        <div><label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Дээд үнэ</label><input class="input num" value="${(s.priceRange[1] / (s.mode === 'rent' ? 1000 : 1000000)).toFixed(0)}${s.mode === 'rent' ? 'K' : 'M'}" /></div>
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('Хайлт шинэчлэгдлээ', 'success');" class="btn btn-primary">Хадгалах</button>
    </div>
  `);
}

function buildSavedSearchDraft() {
  const districts = state.filterDistrict
    ? [state.filterDistrict]
    : state.aiExtracted && state.aiExtracted.district
      ? [state.aiExtracted.district]
      : ['Хан-Уул', 'Сүхбаатар'];
  const rooms = state.filterRooms ? [state.filterRooms] : [2, 3];
  const rent = state.mode === 'rent';
  const priceRange = [
    state.filterPriceMin || (rent ? 800000 : 300000000),
    state.filterPriceMax || (rent ? 2000000 : 600000000),
  ];
  return {
    districts,
    rooms,
    priceRange,
    name: `${districts.join(', ')} ${rooms.join('-')} өрөө`,
    priceLabel: rent
      ? `${fmtCompact(priceRange[0])}-${fmtCompact(priceRange[1])}`
      : `${fmtCompact(priceRange[0])}-${fmtCompact(priceRange[1])}`,
  };
}

function openSavedSearchModal() {
  const draft = buildSavedSearchDraft();
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Хайлтаа хадгалах</h3><p class="text-xs text-[#8A93A8] mt-0.5">Шинэ зар орох тутамд мэдэгдэл авна</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <label class="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Нэр</label>
        <input id="ss-name" class="input" placeholder="Жишээ: Эхний орон сууц" value="${draft.name}" />
      </div>
      <div class="card p-4 bg-[#F0EAD9] border-[#E8E4DA]">
        <div class="text-xs font-semibold mb-2">Хайлтын нөхцөл</div>
        <div class="space-y-1 text-sm text-[#5C5C5C]">
          <div class="flex justify-between"><span>Горим</span><span class="font-medium">${state.mode === 'rent' ? 'Түрээс' : 'Зарах'}</span></div>
          <div class="flex justify-between gap-3"><span>Дүүрэг</span><span class="font-medium text-right">${draft.districts.join(', ')}</span></div>
          <div class="flex justify-between"><span>Өрөө</span><span class="font-medium">${draft.rooms.join('-')} өрөө</span></div>
          <div class="flex justify-between"><span>Үнэ</span><span class="font-medium num">${draft.priceLabel}</span></div>
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">Мэдэгдлийн давтамж</div>
        <div class="grid grid-cols-3 gap-2">
          ${[
            ['instant', 'Тэр даруй'],
            ['daily', 'Өдөрт нэг'],
            ['weekly', '7 хоногт нэг'],
          ]
            .map(
              ([k, l], i) => `
            <button data-ss-freq="${k}" onclick="document.querySelectorAll('[data-ss-freq]').forEach(b=>b.classList.remove('selected')); this.classList.add('selected');" class="src-chip ${i === 0 ? 'selected' : ''} !text-xs">${l}</button>
          `,
            )
            .join('')}
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">Хэрхэн авах вэ?</div>
        <div class="grid sm:grid-cols-3 gap-2 text-sm">
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
              <input id="ss-${k}" type="checkbox" ${on ? 'checked' : ''} class="accent-[var(--gold-brand)]" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">Ямар үед мэдэгдэх вэ?</div>
        <div class="space-y-1.5">
          ${[
            ['onNew', 'Шинэ зар нэмэгдэхэд', 'plus-circle', true],
            ['onDrop', 'Үнэ буурахад', 'trending-down', true],
            ['onPriceFit', 'Үнийн хязгаарт ороход', 'target', false],
          ]
            .map(
              ([k, label, ic, on]) => `
            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
              <i data-lucide="${ic}" class="w-4 h-4 shrink-0" style="color: var(--gold-brand);"></i>
              <span class="text-sm flex-1">${label}</span>
              <input id="ss-${k}" type="checkbox" ${on ? 'checked' : ''} class="accent-[var(--gold-brand)]" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="saveNewSavedSearch()" class="btn btn-primary"><i data-lucide="bell-plus" class="w-4 h-4"></i> Хадгалах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

function saveNewSavedSearch() {
  const draft = buildSavedSearchDraft();
  const channels = {
    push: !!document.getElementById('ss-push')?.checked,
    email: !!document.getElementById('ss-email')?.checked,
    sms: !!document.getElementById('ss-sms')?.checked,
  };
  if (!channels.push && !channels.email && !channels.sms) {
    showToast('Мэдэгдэл авах дор хаяж нэг сувгийг сонгоно уу', 'warning', { duration: 2000 });
    return;
  }
  const id = SAVED_SEARCHES.reduce((m, s) => Math.max(m, s.id), 0) + 1;
  const freq = document.querySelector('[data-ss-freq].selected')?.dataset.ssFreq || 'instant';
  const name = (document.getElementById('ss-name')?.value || '').trim() || draft.name;
  SAVED_SEARCHES.push({
    id,
    mode: state.mode,
    name,
    districts: draft.districts,
    rooms: draft.rooms,
    priceRange: draft.priceRange,
    newMatches: 0,
    alertFreq: freq,
    sms: channels.sms,
    email: channels.email,
    push: channels.push,
    onNew: !!document.getElementById('ss-onNew')?.checked,
    onDrop: !!document.getElementById('ss-onDrop')?.checked,
    onPriceFit: !!document.getElementById('ss-onPriceFit')?.checked,
    lastAlert: 'Дөнгөж хадгалсан',
  });
  closeModal();
  showToast('Хайлт хадгалагдлаа · Шинэ зар орвол мэдэгдэнэ', 'success', { duration: 2200 });
  goTo('alerts');
}
window.saveNewSavedSearch = saveNewSavedSearch;

function openCancelViewingConfirm(id) {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <h3 class="font-semibold text-lg">Үзэлт цуцлах уу?</h3>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <div class="card p-4 bg-[#F0EAD9] border-[#E8E4DA] flex items-start gap-3">
        <i data-lucide="info" class="w-5 h-5 text-[#0E5D6F] mt-0.5"></i>
        <div class="text-sm text-[#5C5C5C]">Цуцлалт үнэгүй. Агент мэдэгдэл хүлээж авна.</div>
      </div>
      <label class="text-xs font-medium text-[#5C5C5C] mt-4 mb-1.5 block">Шалтгаан (заавал биш)</label>
      <textarea class="input" rows="2" placeholder="Юу болсон бэ?"></textarea>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Болих</button>
      <button onclick="closeModal(); showToast('Үзэлт цуцлагдлаа', 'warning');" class="btn !bg-[#9B2C2C] !text-white">Тийм, цуцлах</button>
    </div>
  `);
}

function openDeleteSearchConfirm(id) {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <h3 class="font-semibold text-lg">Хайлтыг устгах уу?</h3>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 text-sm text-[#5C5C5C]">Энэ хайлтыг устгасны дараа мэдэгдэл ирэхгүй болно.</div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Болих</button>
      <button onclick="closeModal(); showToast('Хайлт устгагдлаа', 'info');" class="btn !bg-[#9B2C2C] !text-white">Устгах</button>
    </div>
  `);
}

function performSignOut() {
  clearAuth();
  state.authPhoneDraft = '';
  closeModal();
  showToast('Гарлаа', 'info');
  if (typeof renderHeaderAuth === 'function') renderHeaderAuth();
  goTo('home');
}
window.performSignOut = performSignOut;

function openSignOutConfirm() {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <h3 class="font-semibold text-lg">Гарах уу?</h3>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 text-sm text-[#5C5C5C]">Дахин нэвтрэх хүртэл мэдэгдэл ирэхгүй.</div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Болих</button>
      <button onclick="performSignOut()" class="btn !bg-[#9B2C2C] !text-white">Тийм, гарах</button>
    </div>
  `);
}

let _otpResendTimer = null;
function startOtpResendCountdown() {
  if (_otpResendTimer) {
    clearInterval(_otpResendTimer);
    _otpResendTimer = null;
  }
  state.authResendLeft = 30;
  renderOtpResendLabel();
  _otpResendTimer = setInterval(() => {
    state.authResendLeft -= 1;
    if (state.authResendLeft <= 0) {
      state.authResendLeft = 0;
      clearInterval(_otpResendTimer);
      _otpResendTimer = null;
    }
    renderOtpResendLabel();
  }, 1000);
}
function renderOtpResendLabel() {
  const el = document.getElementById('otp-resend-btn');
  if (!el) return;
  if (state.authResendLeft > 0) {
    el.textContent = `Дахин илгээх (${state.authResendLeft}с)`;
    el.disabled = true;
    el.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    el.textContent = 'Дахин илгээх';
    el.disabled = false;
    el.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}
function resendOtp() {
  if (state.authResendLeft > 0) return;
  showToast('Шинэ код илгээлээ', 'info');
  startOtpResendCountdown();
}
window.resendOtp = resendOtp;

function verifyOtp() {
  const inputs = document.querySelectorAll('#otp-boxes .otp-box');
  let code = '';
  inputs.forEach((i) => {
    code += (i.value || '').replace(/[^\d]/g, '');
  });
  const errEl = document.getElementById('otp-err');
  if (code.length !== 6) {
    if (errEl) errEl.textContent = '6 оронтой кодоо бүрэн оруулна уу';
    return;
  }
  // Демо: ямар ч 6 оронтой код хүлээн авна. Бодит backend холбоход энд API дуудна.
  const phone = state.authPhoneDraft || '+976 9911 5544';
  // Утаснаас нэр гаргах боломжгүй тул анхдагч "Зочин" нэр өгье — profile дээр засдаг болгох
  const user = {
    name: 'Энхтуяа',
    phone: phone,
    initials: 'ЭТ',
  };
  state.isLoggedIn = true;
  state.currentUser = user;
  saveAuth();
  if (_otpResendTimer) {
    clearInterval(_otpResendTimer);
    _otpResendTimer = null;
  }
  closeModal();
  showToast(`Тавтай морил, ${user.name}`, 'success');
  // Header-ийн товчийг шинэчилнэ
  if (typeof renderHeaderAuth === 'function') renderHeaderAuth();
  const nextScreen = state.postAuthRedirect || 'home';
  state.postAuthRedirect = null;
  goTo(nextScreen);
}
window.verifyOtp = verifyOtp;

function showOtpStep() {
  const phone = state.authPhoneDraft || '+976 9911 5544';
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">SMS код оруулах</h3><p class="text-xs text-[#8A93A8] mt-0.5">${phone} руу 6 оронтой код илгээсэн</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <div id="otp-boxes" class="flex justify-between gap-2 mb-2">
        ${[0, 1, 2, 3, 4, 5]
          .map(
            (i) => `<input class="otp-box" maxlength="1" inputmode="numeric" data-otp-i="${i}"
          oninput="handleOtpInput(this, ${i})" onkeydown="handleOtpKey(event, ${i})" />`,
          )
          .join('')}
      </div>
      <div id="otp-err" class="text-xs text-[var(--danger,#9B2C2C)] mb-2 min-h-[16px]"></div>
      <button id="otp-resend-btn" onclick="resendOtp()" class="text-xs text-[#0E5D6F] font-medium hover:underline">Дахин илгээх (30с)</button>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Буцах</button>
      <button onclick="verifyOtp()" class="btn btn-primary">Баталгаажуулах</button>
    </div>
  `);
  startOtpResendCountdown();
  setTimeout(() => {
    const first = document.querySelector('#otp-boxes .otp-box[data-otp-i="0"]');
    if (first) first.focus();
  }, 50);
}
window.showOtpStep = showOtpStep;

function handleOtpInput(el, idx) {
  const v = (el.value || '').replace(/[^\d]/g, '');
  el.value = v.slice(-1);
  const errEl = document.getElementById('otp-err');
  if (errEl) errEl.textContent = '';
  if (el.value && idx < 5) {
    const next = document.querySelector(`#otp-boxes .otp-box[data-otp-i="${idx + 1}"]`);
    if (next) next.focus();
  }
}
window.handleOtpInput = handleOtpInput;
function handleOtpKey(e, idx) {
  if (e.key === 'Backspace' && !e.target.value && idx > 0) {
    const prev = document.querySelector(`#otp-boxes .otp-box[data-otp-i="${idx - 1}"]`);
    if (prev) {
      prev.focus();
      prev.value = '';
    }
  } else if (e.key === 'Enter') {
    verifyOtp();
  }
}
window.handleOtpKey = handleOtpKey;

/* ============== SCHEDULE SUBMIT ============== */
function submitSchedule() {
  const l = getListing(state.currentListingId);
  if (!l) return;
  // Build ISO date from "M/D" string and current/next year
  const today = new Date();
  const [mo, da] = String(state.scheduleDate || '')
    .split('/')
    .map((n) => parseInt(n, 10));
  let year = today.getFullYear();
  if (mo && da) {
    const candidate = new Date(year, mo - 1, da);
    if (candidate.getTime() < today.getTime() - 24 * 60 * 60 * 1000) year += 1;
  }
  const isoDate = mo && da ? `${year}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}` : '';
  const daysUntil = (() => {
    if (!mo || !da) return 0;
    const target = new Date(year, mo - 1, da);
    target.setHours(0, 0, 0, 0);
    const t0 = new Date(today);
    t0.setHours(0, 0, 0, 0);
    return Math.round((target - t0) / 86400000);
  })();
  const dayLabel =
    daysUntil === 0 ? 'Өнөөдөр' : daysUntil === 1 ? 'Маргааш' : daysUntil === 2 ? 'Нөгөөдөр' : daysUntil + ' хоног';
  const nextId = VIEWINGS.reduce((m, v) => Math.max(m, v.id), 0) + 1;
  VIEWINGS.push({
    id: nextId,
    listingId: l.id,
    date: isoDate,
    time: state.scheduleTime,
    status: 'pending',
    dayLabel,
    countdown: daysUntil <= 0 ? 'Өнөөдөр' : daysUntil + ' хоног',
  });
  showToast(
    `<strong>${l.khotkhon}</strong>-д ${state.scheduleDate} ${state.scheduleTime}-д үзэлт товлогдлоо`,
    'success',
    { duration: 3500 },
  );
  setTimeout(() => goTo('confirmation'), 400);
  state.scheduleStep = 1;
}
