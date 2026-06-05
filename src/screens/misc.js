/* ============== SCREENS: schedule/activity/saved/alerts/auth/news/rental-mgmt/profile ============== */

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
