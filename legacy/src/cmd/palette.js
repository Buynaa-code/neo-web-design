/* ============== CMD PALETTE + DEMO PILL + BOOT ============== */

let cmdSelected = 0;
let cmdFlat = [];

const CMD_SCREENS = [
  { type: 'screen', key: 'home', label: 'Эхлэл', icon: 'home' },
  { type: 'screen', key: 'results', label: 'Хайлтын үр дүн', icon: 'list' },
  { type: 'screen', key: 'activity', label: 'Үзэлтүүд', icon: 'calendar-check' },
  { type: 'screen', key: 'saved', label: 'Хадгалсан зарууд', icon: 'heart' },
  { type: 'screen', key: 'alerts', label: 'Мэдэгдэл, хадгалсан хайлт', icon: 'bell' },
  { type: 'screen', key: 'profile', label: 'Профайл', icon: 'user' },
];

const CMD_ACTIONS = [
  { type: 'action', key: 'mode-rent', label: 'Түрээслэх горим руу шилжих', icon: 'home', fn: () => setMode('rent') },
  {
    type: 'action',
    key: 'mode-sale',
    label: 'Худалдан авах горим руу шилжих',
    icon: 'banknote',
    fn: () => setMode('sale'),
  },
  {
    type: 'action',
    key: 'new-search',
    label: 'Шинэ хайлт хадгалах',
    icon: 'bell-plus',
    fn: () => openSavedSearchModal(),
  },
];

function openCmd() {
  document.getElementById('cmd-backdrop').classList.add('open');
  document.getElementById('cmd-input').value = '';
  cmdSelected = 0;
  renderCmdList('');
  setTimeout(() => {
    document.getElementById('cmd-input').focus();
  }, 50);
}

function closeCmd() {
  document.getElementById('cmd-backdrop').classList.remove('open');
}

function renderCmdList(q) {
  const ql = q.toLowerCase().trim();
  const groups = [];

  const matchScreens = CMD_SCREENS.filter((s) => !ql || s.label.toLowerCase().includes(ql));
  if (matchScreens.length) groups.push({ title: 'Скрин', items: matchScreens });

  const matchActions = CMD_ACTIONS.filter((a) => !ql || a.label.toLowerCase().includes(ql));
  if (matchActions.length) groups.push({ title: 'Үйлдэл', items: matchActions });

  const matchListings = LISTINGS.filter(
    (l) => !ql || l.khotkhon.toLowerCase().includes(ql) || l.district.toLowerCase().includes(ql),
  ).slice(0, 6);
  if (matchListings.length)
    groups.push({
      title: 'Зарууд',
      items: matchListings.map((l) => ({
        type: 'listing',
        key: l.id,
        label: `${l.khotkhon} · ${l.rooms}ө ${l.area}м²`,
        sub: `${l.district}, ${l.khoroo}-р хороо · ${listingPriceShort(l)}`,
        icon: 'building-2',
      })),
    });

  const matchDistricts = DISTRICTS.filter((d) => ql && d.toLowerCase().includes(ql));
  if (matchDistricts.length)
    groups.push({
      title: 'Дүүрэг',
      items: matchDistricts.map((d) => ({ type: 'district', key: d, label: d + ' дүүрэг', icon: 'map-pin' })),
    });

  cmdFlat = groups.flatMap((g) => g.items);
  cmdSelected = Math.min(cmdSelected, Math.max(cmdFlat.length - 1, 0));

  const list = document.getElementById('cmd-list');
  if (!cmdFlat.length) {
    list.innerHTML = '<div class="text-center text-sm text-[#8A93A8] py-8">Үр дүн олдсонгүй</div>';
    return;
  }

  let idx = 0;
  list.innerHTML = groups
    .map(
      (g) => `
    <div class="cmd-group-title">${g.title}</div>
    ${g.items
      .map((it) => {
        const i = idx++;
        return `<div class="cmd-item ${i === cmdSelected ? 'selected' : ''}" data-idx="${i}" onclick="runCmd(${i})">
        <i data-lucide="${it.icon}" class="w-4 h-4"></i>
        <div class="flex-1 min-w-0"><div class="truncate">${it.label}</div>${it.sub ? `<div class="text-xs text-[#8A93A8]">${it.sub}</div>` : ''}</div>
      </div>`;
      })
      .join('')}
  `,
    )
    .join('');
  lucide.createIcons();
}

function runCmd(i) {
  const it = cmdFlat[i];
  if (!it) return;
  closeCmd();
  if (it.type === 'screen') goTo(it.key);
  else if (it.type === 'action') it.fn();
  else if (it.type === 'listing') openProperty(it.key);
  else if (it.type === 'district') {
    state.filterDistrict = it.key;
    goTo('results');
  }
}

document.getElementById('cmd-input').addEventListener('input', (e) => {
  cmdSelected = 0;
  renderCmdList(e.target.value);
});

/* ============== KEYBOARD SHORTCUTS ============== */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCmd();
  }
  if (e.key === 'Escape') {
    closeCmd();
    if (document.getElementById('modal-backdrop').classList.contains('open')) closeModal();
    if (state.fullMap) closeFullMap();
    if (state.drawingPolygon) clearDrawZone();
  }
  if (document.getElementById('cmd-backdrop').classList.contains('open')) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdSelected++;
      renderCmdList(document.getElementById('cmd-input').value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdSelected = Math.max(0, cmdSelected - 1);
      renderCmdList(document.getElementById('cmd-input').value);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      runCmd(cmdSelected);
    }
  }
});

/* ============== DEMO PILL ============== */
const DEMO_SCREENS = [
  { key: 'home', icon: 'home', label: 'Эхлэл' },
  { key: 'results', icon: 'list', label: 'Хайлтын үр дүн' },
  { key: 'property', icon: 'building-2', label: 'Зарын дэлгэрэнгүй' },
  { key: 'schedule', icon: 'calendar-plus', label: 'Үзэлт товлох' },
  { key: 'confirmation', icon: 'check-circle', label: 'Баталгаажуулалт' },
  { key: 'activity', icon: 'calendar-check', label: 'Үзэлтүүд' },
  { key: 'saved', icon: 'heart', label: 'Хадгалсан' },
  { key: 'alerts', icon: 'bell', label: 'Мэдэгдэл' },
  { key: 'auth', icon: 'log-in', label: 'Нэвтрэх' },
  { key: 'profile', icon: 'user', label: 'Профайл' },
  { key: 'news', icon: 'newspaper', label: 'Мэдээ' },
  { key: 'rental-mgmt', icon: 'layout-dashboard', label: 'Менежмент' },
  { key: 'list-property', icon: 'megaphone', label: 'Зар оруулах' },
];

function buildDemoPill() {
  const pill = document.getElementById('demo-pill');
  if (!pill) return;
  pill.innerHTML = DEMO_SCREENS.map(
    (s) => `
    <button data-target="${s.key}" onclick="goTo('${s.key}')">
      <i data-lucide="${s.icon}" class="w-4 h-4"></i>
      <span class="tip">${s.label}</span>
    </button>
  `,
  ).join('');
}


/* ============== BOOT — runs after all scripts loaded ============== */
/* ============== BOOT ============== */
buildDemoPill();
renderHeaderAuth();
goTo('home');
// Sync header mode toggle on initial render
document
  .querySelectorAll('#header-mode [data-mode]')
  .forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
lucide.createIcons();
if (typeof refreshInterestsBadge === 'function') refreshInterestsBadge();
// First-time tour
setTimeout(() => {
  if (!window.__tourSeen) startTour();
}, 800);
