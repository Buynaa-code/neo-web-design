/* ============== COMPARE + TOUR + NOTIF SETTINGS + STATS MODAL ============== */

const COMPARE_SET = new Set();
const MAX_COMPARE = 3;

function toggleCompare(id, btnEl) {
  if (COMPARE_SET.has(id)) {
    COMPARE_SET.delete(id);
    showToast('Харьцуулахаас хаслаа', 'info', { duration: 1200 });
  } else {
    if (COMPARE_SET.size >= MAX_COMPARE) {
      showToast('Хамгийн ихдээ ' + MAX_COMPARE + ' зар харьцуулна', 'warning');
      return;
    }
    COMPARE_SET.add(id);
    showToast(`Харьцуулахад нэмлээ (${COMPARE_SET.size}/${MAX_COMPARE})`, 'success', { duration: 1500 });
  }
  renderCompareBar();
  document.querySelectorAll(`[data-cmp="${id}"]`).forEach((el) => el.classList.toggle('active', COMPARE_SET.has(id)));
}

function renderCompareBar() {
  let bar = document.getElementById('compare-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compare-bar';
    bar.className = 'fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all';
    document.body.appendChild(bar);
  }
  if (COMPARE_SET.size === 0) {
    bar.innerHTML = '';
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';
  const items = Array.from(COMPARE_SET)
    .map((id) => getListing(id))
    .filter(Boolean);
  bar.innerHTML = `
    <div class="card p-2.5 flex items-center gap-2 shadow-2xl" style="background: var(--surface); border-color: var(--border-strong); border-radius: 14px;">
      <div class="flex -space-x-2">
        ${items.map((l) => `<div class="w-8 h-8 rounded-md bg-cover bg-center border-2" style="background-image:url('${photoUrl(l, 0, '80/80')}'); border-color: var(--surface);"></div>`).join('')}
      </div>
      <div class="text-xs">
        <div class="font-semibold">${COMPARE_SET.size}/${MAX_COMPARE} зар сонгосон</div>
        <div class="text-[#8A93A8] text-[10px]">харьцуулахад бэлэн</div>
      </div>
      <button onclick="openCompareView()" ${COMPARE_SET.size < 2 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''} class="btn btn-primary !text-xs !py-2 !px-4"><i data-lucide="git-compare" class="w-3.5 h-3.5"></i> Харьцуулах</button>
      <button onclick="COMPARE_SET.clear(); renderCompareBar(); document.querySelectorAll('[data-cmp]').forEach(el=>el.classList.remove('active'));" class="w-7 h-7 rounded-full hover:bg-[#F0EAD9] flex items-center justify-center text-[#8A93A8]"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
    </div>
  `;
  setTimeout(() => lucide.createIcons(), 0);
}

function openCompareView() {
  const items = Array.from(COMPARE_SET)
    .map((id) => getListing(id))
    .filter(Boolean);
  if (items.length < 2) return;
  const rows = [
    ['Үнэ', (l) => `<span class="num text-[#0A1F44]">${listingPriceShort(l)}</span>`],
    ['Дүүрэг', (l) => l.district],
    ['Хороо', (l) => l.khoroo + '-р хороо'],
    ['Хотхон', (l) => l.khotkhon],
    ['Өрөө', (l) => l.rooms],
    ['Талбай', (l) => l.area + ' м²'],
    ['Давхар', (l) => l.floor],
    ['Ашиглалт', (l) => l.year + ' он'],
    ['М²-ийн үнэ', (l) => (l.mode === 'sale' ? fmtCompact(Math.round(l.price / l.area)) : '—')],
    ['Үзсэн', (l) => `<span class="num">${l.viewCount}</span> хүн`],
    [
      'Бэлэн орох',
      (l) =>
        l.features.includes('Бэлэн орох')
          ? '<span class="text-[#1F6B47]">✓</span>'
          : '<span class="text-[#8A93A8]">—</span>',
    ],
    [
      'Зээлээр',
      (l) =>
        l.features.includes('Зээлээр')
          ? '<span class="text-[#1F6B47]">✓</span>'
          : '<span class="text-[#8A93A8]">—</span>',
    ],
    [
      'Гараж',
      (l) =>
        l.features.includes('Гараж') || l.features.includes('2 машины гараж')
          ? '<span class="text-[#1F6B47]">✓</span>'
          : '<span class="text-[#8A93A8]">—</span>',
    ],
    [
      'Тавилгатай',
      (l) =>
        l.features.includes('Тавилгатай')
          ? '<span class="text-[#1F6B47]">✓</span>'
          : '<span class="text-[#8A93A8]">—</span>',
    ],
    ['Агент', (l) => getAgent(l.agentId).name.split(' ').pop()],
  ];
  const cols = `1fr repeat(${items.length}, 1fr)`;
  openModal(
    `
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Зар харьцуулах</h3><p class="text-xs text-[#8A93A8] mt-0.5">${items.length} зар хажуу хажуугаар</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="overflow-x-auto">
      <div style="display:grid; grid-template-columns:${cols}; min-width: ${300 + items.length * 220}px;">
        <!-- Header row -->
        <div></div>
        ${items
          .map(
            (l) => `
          <div class="p-3 border-b border-[#E8E4DA]">
            <div class="aspect-[4/3] rounded bg-cover bg-center mb-2" style="background-image:url('${photoUrl(l, 0, '300/200')}')"></div>
            <div class="font-semibold text-sm truncate">${l.khotkhon}</div>
            <div class="text-[10px] text-[#8A93A8]">${l.district}</div>
          </div>
        `,
          )
          .join('')}
        <!-- Rows -->
        ${rows
          .map(
            (row, i) => `
          <div class="px-4 py-3 text-xs text-[#4A5874] font-medium ${i % 2 ? 'bg-[#FAFAF6]' : ''}">${row[0]}</div>
          ${items.map((l) => `<div class="px-4 py-3 text-sm ${i % 2 ? 'bg-[#FAFAF6]' : ''}">${row[1](l)}</div>`).join('')}
        `,
          )
          .join('')}
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-between bg-[#FAFAF6]">
      <button onclick="COMPARE_SET.clear(); renderCompareBar(); closeModal(); document.querySelectorAll('[data-cmp]').forEach(el=>el.classList.remove('active'));" class="btn btn-secondary">Цэвэрлэх</button>
      <button onclick="closeModal()" class="btn btn-primary">Дуусгах</button>
    </div>
  `,
    'lg',
  );
  setTimeout(() => lucide.createIcons(), 0);
}

/* ============== 7. NOTIFICATION DND SETTINGS ============== */
const NOTIF_PREFS = {
  dndEnabled: true,
  dndStart: '22:00',
  dndEnd: '08:00',
  delivery: { push: true, email: true, sms: false, messenger: false, web: true },
  channels: { newListing: true, priceChange: true, viewingReminder: true, agentMessage: true, marketing: false },
};

function openNotifSettingsModal() {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Мэдэгдлийн тохиргоо</h3><p class="text-xs text-[#8A93A8] mt-0.5">Хэзээ, ямар мэдэгдэл авахаа сонгоорой</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-5">
      <div class="card p-4 bg-[#F0EAD9] border-[#E8E4DA]">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="font-semibold text-sm flex items-center gap-2"><i data-lucide="moon" class="w-4 h-4"></i> Бүү саатуул горим</div>
            <div class="text-[11px] text-[#4A5874] mt-0.5">Энэ цаг хоорондох push-ийг хадгална уу</div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${NOTIF_PREFS.dndEnabled ? 'checked' : ''} onchange="NOTIF_PREFS.dndEnabled=this.checked" class="sr-only peer">
            <div class="w-10 h-6 bg-[#E4DDC9] peer-checked:bg-[#0A1F44] rounded-full peer relative after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1 block">Эхлэх</label><input type="time" value="${NOTIF_PREFS.dndStart}" class="input" /></div>
          <div><label class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1 block">Дуусах</label><input type="time" value="${NOTIF_PREFS.dndEnd}" class="input" /></div>
        </div>
      </div>

      <div>
        <div class="eyebrow mb-3">Хүлээн авах суваг</div>
        <div class="space-y-2">
          ${[
            ['push', 'App push', 'smartphone', 'Утсан дээрх app-аар тэр дор нь'],
            ['email', 'И-мэйл', 'mail', 'Бүртгэлтэй и-мэйл хаягаар'],
            ['sms', 'SMS', 'message-square', 'Утасны дугаар руу мессеж'],
            ['messenger', 'Messenger', 'send', 'Facebook Messenger-ээр'],
            ['web', 'Веб', 'globe', 'Хөтөч дээрх мэдэгдэл'],
          ]
            .map(
              ([k, label, ic, sub]) => `
            <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-[#F0EAD9] border border-[#E8E4DA] hover:bg-[#E8E4DA]">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white text-[#0A1F44]"><i data-lucide="${ic}" class="w-4 h-4"></i></div>
              <div class="flex-1">
                <div class="text-sm font-medium">${label}</div>
                <div class="text-[11px] text-[#4A5874]">${sub}</div>
              </div>
              <input type="checkbox" ${NOTIF_PREFS.delivery[k] ? 'checked' : ''} onchange="NOTIF_PREFS.delivery.${k}=this.checked" class="accent-[#0A1F44] w-4 h-4" />
            </label>
          `,
            )
            .join('')}
        </div>
      </div>

      <div>
        <div class="eyebrow mb-3">Мэдэгдлийн төрөл</div>
        <div class="space-y-1">
          ${[
            ['newListing', 'Шинэ зар орох', 'Хадгалсан хайлтад тохирох зар орох тутамд'],
            ['priceChange', 'Үнэ өөрчлөгдөх', 'Хадгалсан зарын үнэ буурахад'],
            ['viewingReminder', 'Үзэлтийн сануулга', 'Товлосон үзэлтээс 24 цагийн өмнө'],
            ['agentMessage', 'Агентын мессеж', 'Тэр даруй мэдэгдэнэ'],
            ['marketing', 'Маркетинг', 'Шинэ боломж, амжилтын түүх (заавал биш)'],
          ]
            .map(
              ([k, title, desc]) => `
            <label class="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F0EAD9] cursor-pointer">
              <input type="checkbox" ${NOTIF_PREFS.channels[k] ? 'checked' : ''} onchange="NOTIF_PREFS.channels.${k}=this.checked" class="accent-[#0A1F44] mt-1" />
              <div class="flex-1">
                <div class="font-medium text-sm">${title}</div>
                <div class="text-[11px] text-[#4A5874] mt-0.5">${desc}</div>
              </div>
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('Тохиргоо хадгалагдлаа', 'success');" class="btn btn-primary">Хадгалах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

/* ============== 8. ONBOARDING TOUR ============== */
let tourState = { step: 0, active: false };
const TOUR_STEPS = [
  {
    title: 'NEO-д тавтай морил',
    body: 'УБ-ын үл хөдлөх хөрөнгийн зах зээлээс өөртөө таарах байр олох хамгийн товч зам. 3 минутын тойм харуулъя.',
    icon: 'sparkles',
  },
  {
    title: 'Хайлт хий',
    body: 'Дүүрэг, өрөө, үнээ сонгоод хайх товчийг дар. Эсвэл доорх "Ухаалаг хайлт" хэсэгт юу хайж байгаагаа бичээрэй.',
    icon: 'search',
  },
  {
    title: 'Хадгалсан хайлт',
    body: 'Шинэ зар орох тутамд цаг алдалгүй мэдэгдэл авъя — ⌥ хадгалсан хайлт. Сар бүр 200+ шинэ зар.',
    icon: 'bell',
  },
  {
    title: 'Зүрхэн товч',
    body: 'Сэтгэлд таалагдсан зарыг ❤️-ээр хадгал. Гэр бүлтэйгээ нэг линкээр хуваалцаж болно.',
    icon: 'heart',
  },
  {
    title: 'Үзэлт товлох',
    body: 'Зарын дэлгэрэнгүй дотор "Үзэлт товлох" товчоор агентаа тохирох цагт уулзах боломжтой. Үнэгүй цуцлалт.',
    icon: 'calendar-check',
  },
];

function startTour() {
  try {
    if (localStorage.getItem('neo_tour_seen') === '1') {
      window.__tourSeen = true;
      return;
    }
  } catch (e) {}
  tourState.step = 0;
  tourState.active = true;
  renderTour();
}
function renderTour() {
  let el = document.getElementById('tour-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tour-overlay';
    el.className = 'fixed inset-0 z-[150] flex items-center justify-center p-4';
    el.style.background = 'rgba(0,0,0,.72)';
    el.style.backdropFilter = 'blur(6px)';
    // Click on backdrop (not the card) dismisses tour
    el.addEventListener('click', (ev) => {
      if (ev.target === el) endTour();
    });
    document.body.appendChild(el);
  }
  if (!tourState.active) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'flex';
  const s = TOUR_STEPS[tourState.step];
  const last = tourState.step === TOUR_STEPS.length - 1;
  el.innerHTML = `
    <div class="card max-w-md w-full p-7" style="background: var(--surface); border-radius: 18px;">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2 text-xs text-[#8A93A8]">
          <span class="num">${tourState.step + 1}</span> / ${TOUR_STEPS.length}
          <div class="flex gap-1 ml-2">
            ${TOUR_STEPS.map((_, i) => `<div class="w-6 h-1 rounded-full" style="background:${i <= tourState.step ? 'var(--primary)' : 'var(--border)'}"></div>`).join('')}
          </div>
        </div>
        <button onclick="endTour()" class="text-xs text-[#8A93A8] hover:text-[#1A1A1A] font-medium">Алгасах</button>
      </div>
      <div class="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center" style="background: var(--primary-soft); color: var(--primary);">
        <i data-lucide="${s.icon}" class="w-7 h-7"></i>
      </div>
      <h3 class="text-2xl font-semibold tracking-tight mb-2">${s.title}</h3>
      <p class="text-sm text-[#4A5874] leading-relaxed mb-6">${s.body}</p>
      <div class="flex gap-2 justify-end">
        ${tourState.step > 0 ? `<button onclick="tourState.step--; renderTour();" class="btn btn-secondary">Буцах</button>` : ''}
        ${
          last
            ? `<button onclick="endTour()" class="btn btn-primary"><i data-lucide="check" class="w-4 h-4"></i> Эхэлье</button>`
            : `<button onclick="tourState.step++; renderTour();" class="btn btn-primary">Үргэлжлүүлэх <i data-lucide="arrow-right" class="w-4 h-4"></i></button>`
        }
      </div>
    </div>
  `;
  setTimeout(() => lucide.createIcons(), 0);
}
function endTour() {
  tourState.active = false;
  const el = document.getElementById('tour-overlay');
  if (el) {
    el.style.display = 'none';
    el.remove();
  }
  window.__tourSeen = true;
  try {
    localStorage.setItem('neo_tour_seen', '1');
  } catch (e) {}
}
window.endTour = endTour;

/* ============== 9. DETAILED MARKET STATS ============== */
/* state-д модалын одоогийн дүүрэг сонголтыг хадгална ("all" → бүх дүүрэг) */
const STATS_STATE = { district: 'all' };

function openDetailedStatsModal(district) {
  if (district && DISTRICTS.includes(district)) STATS_STATE.district = district;
  else if (district === 'all' || !district) {
    // Хэрэв одоогийн results дэлгэц дээр шүүсэн дүүрэгтэй бол түүгээр нь нээнэ
    STATS_STATE.district =
      state.filterDistrict && DISTRICTS.includes(state.filterDistrict) ? state.filterDistrict : 'all';
  }
  renderDetailedStatsModal();
}
window.openDetailedStatsModal = openDetailedStatsModal;

function setStatsDistrict(d) {
  STATS_STATE.district = d;
  renderDetailedStatsModal();
}
window.setStatsDistrict = setStatsDistrict;

function renderDetailedStatsModal() {
  const mode = state.mode; // 'sale' | 'rent'
  const all = LISTINGS.filter((l) => l.mode === mode);
  const dSel = STATS_STATE.district;
  const scoped = dSel === 'all' ? all : all.filter((l) => l.district === dSel);
  const titleScope = dSel === 'all' ? 'Бүх дүүрэг' : dSel + ' дүүрэг';
  const modeLabel = mode === 'rent' ? 'Түрээс' : 'Зарах';

  /* --- KPI тооцоо --- */
  const count = scoped.length;
  const avgPrice = count ? Math.round(scoped.reduce((s, l) => s + l.price, 0) / count) : 0;
  const avgPpm = count ? Math.round(scoped.reduce((s, l) => s + l.price / l.area, 0) / count) : 0;
  const avgDays = count ? Math.round(scoped.reduce((s, l) => s + (l.listedDays || 0), 0) / count) : 0;
  const newCount = scoped.filter((l) => l.status === 'new').length;
  const hotCount = scoped.filter((l) => l.status === 'hot').length;
  const dropCount = scoped.filter((l) => l.status === 'drop').length;
  const newProjPct = count ? Math.round((scoped.filter(isNewProject).length / count) * 100) : 0;
  const verifiedPct = count ? Math.round((scoped.filter(isListingVerified).length / count) * 100) : 0;

  /* --- 12 сарын үнийн чиг хандлага (deterministic, дундаж ppm-ийг суурь болгож) --- */
  const baseVal = avgPpm || (mode === 'rent' ? 22000 : 3200000);
  const months = ['6-р', '7-р', '8-р', '9-р', '10-р', '11-р', '12-р', '1-р', '2-р', '3-р', '4-р', '5-р'];
  const swing = mode === 'rent' ? 0.05 : 0.08;
  const trend = months.map((m, i) => {
    // ердийн жижигхэн хэлбэлзэлтэй өсөх чиг
    const wave = Math.sin((i + (dSel.length || 3)) * 0.65) * swing * 0.4;
    const growth = (i / 11) * swing;
    return { m, v: Math.round(baseVal * (1 - swing + growth + wave)) };
  });
  const trendMin = Math.min(...trend.map((t) => t.v));
  const trendMax = Math.max(...trend.map((t) => t.v));
  const trendDelta = trend[11].v - trend[0].v;
  const trendPct = trend[0].v ? Math.round((trendDelta / trend[0].v) * 100 * 10) / 10 : 0;

  /* --- Дүүргүүдийн харьцуулалт (м² үнэ) --- */
  const districtRows = DISTRICTS.map((d) => {
    const arr = all.filter((l) => l.district === d);
    if (!arr.length) return { d, ppm: 0, n: 0 };
    const p = Math.round(arr.reduce((s, l) => s + l.price / l.area, 0) / arr.length);
    return { d, ppm: p, n: arr.length };
  })
    .filter((r) => r.n > 0)
    .sort((a, b) => b.ppm - a.ppm);
  const districtMax = districtRows.length ? districtRows[0].ppm : 1;

  /* --- Өрөөний тархалт --- */
  const roomBuckets = [1, 2, 3, 4].map((n) => ({
    n,
    label: n === 4 ? '4+ өрөө' : n + ' өрөө',
    count: scoped.filter((l) => (n === 4 ? l.rooms >= 4 : l.rooms === n)).length,
  }));
  const roomMax = Math.max(1, ...roomBuckets.map((b) => b.count));

  /* --- Топ хотхонууд --- */
  const khotMap = {};
  scoped.forEach((l) => {
    khotMap[l.khotkhon] = (khotMap[l.khotkhon] || 0) + 1;
  });
  const topKhot = Object.entries(khotMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const khotMaxN = topKhot.length ? topKhot[0][1] : 1;

  /* --- Статусын хуваарилалт (донат-маягт) --- */
  const statusGroups = [
    { key: 'new', label: 'Шинэ', n: newCount, color: '#1F6B47' },
    { key: 'hot', label: 'Эрэлттэй', n: hotCount, color: '#C44545' },
    { key: 'drop', label: 'Үнэ буурсан', n: dropCount, color: '#C9A35F' },
    { key: 'active', label: 'Идэвхтэй', n: Math.max(0, count - newCount - hotCount - dropCount), color: '#4A5874' },
  ];
  const statusTotal = Math.max(
    1,
    statusGroups.reduce((s, g) => s + g.n, 0),
  );

  /* --- Чиг хандлагын баар --- */
  const trendBars = trend
    .map((t, i) => {
      const h = trendMax === trendMin ? 50 : ((t.v - trendMin) / (trendMax - trendMin)) * 88 + 12;
      const isLast = i === 11;
      return `<div class="stats-trend-bar${isLast ? ' current' : ''}" style="height:${h}%" title="${t.m} сар: ${t.v.toLocaleString('en-US')}₮/м²"></div>`;
    })
    .join('');

  openModal(
    `
    <div class="p-5 border-b flex items-center justify-between" style="border-color: var(--border);">
      <div class="min-w-0">
        <h3 class="font-semibold text-lg flex items-center gap-2"><i data-lucide="bar-chart-3" class="w-5 h-5" style="color: var(--gold-brand);"></i> Дэлгэрэнгүй статистик</h3>
        <p class="text-xs mt-0.5" style="color: var(--text-3);">${modeLabel} · ${titleScope} · 2026 оны 5-р сарын байдлаар</p>
      </div>
      <button onclick="closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center" style="color: var(--text-3); background: var(--surface-2);"><i data-lucide="x" class="w-4 h-4"></i></button>
    </div>

    <!-- District filter tabs -->
    <div class="px-5 pt-4 pb-3 flex items-center gap-2 overflow-x-auto" style="border-bottom: 1px solid var(--border);">
      <button class="stats-tab ${dSel === 'all' ? 'active' : ''}" onclick="setStatsDistrict('all')">Бүх дүүрэг</button>
      ${DISTRICTS.map((d) => `<button class="stats-tab ${dSel === d ? 'active' : ''}" onclick="setStatsDistrict('${d}')">${d}</button>`).join('')}
    </div>

    <div class="p-5 space-y-4" style="max-height: 72vh; overflow-y: auto;">

      <!-- KPI ROW -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="stats-kpi">
          <div class="stats-kpi-label">${mode === 'rent' ? 'Дундаж түрээс' : 'Дундаж үнэ'}</div>
          <div class="stats-kpi-val num">${count ? fmtCompact(avgPrice).replace('₮', '') + '₮' : '—'}</div>
          <div class="stats-kpi-delta up"><i data-lucide="arrow-up-right" class="w-3 h-3 inline"></i> ${trendPct >= 0 ? '+' : ''}${trendPct}% (12 сар)</div>
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-label">1м² дундаж үнэ</div>
          <div class="stats-kpi-val num">${count ? avgPpm.toLocaleString('en-US') + '₮' : '—'}</div>
          <div class="stats-kpi-delta ${trendPct >= 0 ? 'up' : 'down'}"><i data-lucide="${trendPct >= 0 ? 'trending-up' : 'trending-down'}" class="w-3 h-3 inline"></i> ${trendPct >= 0 ? '+' : ''}${trendPct}% емнөх жил</div>
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-label">Идэвхтэй зар</div>
          <div class="stats-kpi-val num">${count.toLocaleString('en-US')}</div>
          <div class="stats-kpi-delta up"><i data-lucide="arrow-up-right" class="w-3 h-3 inline"></i> +${Math.max(1, Math.round(count * 0.08))} шинэ (7 хоног)</div>
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-label">Дундаж зарлагдсан хоног</div>
          <div class="stats-kpi-val num">${avgDays} <span class="text-base font-normal" style="color: var(--text-3);">хоног</span></div>
          <div class="stats-kpi-delta down"><i data-lucide="arrow-down-right" class="w-3 h-3 inline"></i> -3 хоног емнөх сараас</div>
        </div>
      </div>

      <!-- TREND + DISTRICT COMPARE -->
      <div class="grid lg:grid-cols-[1.4fr_1fr] gap-3">
        <div class="stats-card">
          <div class="flex items-start justify-between">
            <div>
              <div class="stats-card-title">12 сарын үнийн чиг хандлага</div>
              <div class="stats-card-sub">1м² дундаж үнэ (₮) — ${titleScope}</div>
            </div>
            <div class="text-right">
              <div class="text-xs" style="color: var(--text-3);">Жилийн өсөлт</div>
              <div class="text-sm font-semibold ${trendPct >= 0 ? '' : ''}" style="color: ${trendPct >= 0 ? 'var(--success)' : '#C44545'};">${trendPct >= 0 ? '+' : ''}${trendPct}%</div>
            </div>
          </div>
          <div class="flex items-end gap-1.5 mt-2" style="height: 140px;">
            ${trendBars}
          </div>
          <div class="flex justify-between mt-2 text-[10px]" style="color: var(--text-3);">
            ${trend.map((t) => `<span>${t.m}</span>`).join('')}
          </div>
          <div class="flex items-center gap-4 mt-3 pt-3 text-[11px]" style="border-top: 1px solid var(--border); color: var(--text-3);">
            <span>Хамгийн доод: <span class="num font-semibold" style="color: var(--text);">${trendMin.toLocaleString('en-US')}₮</span></span>
            <span>Хамгийн дээд: <span class="num font-semibold" style="color: var(--text);">${trendMax.toLocaleString('en-US')}₮</span></span>
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-card-title">Дүүргийн харьцуулалт</div>
          <div class="stats-card-sub">1м² дундаж үнэ (₮)</div>
          <div class="space-y-1">
            ${districtRows
              .map(
                (r) => `
              <div class="stats-bar-row">
                <span class="${r.d === dSel ? 'font-semibold' : ''}" style="color: var(--text); cursor: pointer;" onclick="setStatsDistrict('${r.d}')">${r.d}</span>
                <div class="stats-bar-track"><div class="stats-bar-fill" style="--bar-w: ${Math.round((r.ppm / districtMax) * 100)}%"></div></div>
                <span class="num text-right font-semibold" style="color: var(--text);">${(r.ppm / 1000).toFixed(0)}к</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- ROOMS + STATUS + TOP KHOTKHON -->
      <div class="grid lg:grid-cols-3 gap-3">
        <div class="stats-card">
          <div class="stats-card-title">Өрөөний тархалт</div>
          <div class="stats-card-sub">Идэвхтэй зарын тоо</div>
          <div class="space-y-2 mt-2">
            ${roomBuckets
              .map(
                (b) => `
              <div>
                <div class="flex items-center justify-between text-xs mb-1" style="color: var(--text);">
                  <span>${b.label}</span>
                  <span class="num font-semibold">${b.count}</span>
                </div>
                <div class="stats-bar-track"><div class="stats-bar-fill" style="--bar-w: ${Math.round((b.count / roomMax) * 100)}%"></div></div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-card-title">Зарын статус</div>
          <div class="stats-card-sub">${count} нийт зарнаас</div>
          <div class="flex items-center gap-4 mt-2">
            <div class="stats-pie" style="width: 96px; height: 96px; border-radius: 50%; background: conic-gradient(${(() => {
              let acc = 0;
              const parts = [];
              statusGroups.forEach((g) => {
                const start = (acc / statusTotal) * 360;
                acc += g.n;
                const end = (acc / statusTotal) * 360;
                parts.push(`${g.color} ${start}deg ${end}deg`);
              });
              return parts.join(', ');
            })()}); position: relative;">
              <div style="position:absolute; inset: 18px; border-radius: 50%; background: var(--surface-2); display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <div class="num font-bold text-lg" style="color: var(--text); line-height: 1;">${count}</div>
                <div class="text-[9px]" style="color: var(--text-3);">зар</div>
              </div>
            </div>
            <div class="flex-1 space-y-1.5">
              ${statusGroups
                .map(
                  (g) => `
                <div class="flex items-center justify-between">
                  <div class="stats-pie-legend"><span class="stats-pie-dot" style="background: ${g.color};"></span> ${g.label}</div>
                  <span class="num text-xs font-semibold" style="color: var(--text);">${g.n}</span>
                </div>
              `,
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-card-title">Эрэлттэй хотхонууд</div>
          <div class="stats-card-sub">Зарын тоогоор эрэмбэлэв</div>
          <div class="space-y-1 mt-2">
            ${
              topKhot.length
                ? topKhot
                    .map(
                      ([name, n], i) => `
              <div class="stats-bar-row" style="grid-template-columns: 20px 1fr 28px;">
                <span class="text-xs font-semibold" style="color: var(--gold-brand);">${i + 1}</span>
                <div>
                  <div class="text-xs font-medium" style="color: var(--text);">${name}</div>
                  <div class="stats-bar-track mt-1"><div class="stats-bar-fill" style="--bar-w: ${Math.round((n / khotMaxN) * 100)}%"></div></div>
                </div>
                <span class="num text-xs text-right font-semibold" style="color: var(--text);">${n}</span>
              </div>
            `,
                    )
                    .join('')
                : `<div class="text-xs" style="color: var(--text-3);">Энэ дүүрэгт зар алга байна.</div>`
            }
          </div>
        </div>
      </div>

      <!-- EXTRA INSIGHTS -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="stats-card !p-3">
          <div class="text-[10px] uppercase tracking-wider" style="color: var(--text-3);">Шинэ төсөл</div>
          <div class="text-lg font-bold num mt-1" style="color: var(--text);">${newProjPct}%</div>
          <div class="text-[11px]" style="color: var(--text-3);">2022+ онд ашиглалтад</div>
        </div>
        <div class="stats-card !p-3">
          <div class="text-[10px] uppercase tracking-wider" style="color: var(--text-3);">Баталгаажсан агент</div>
          <div class="text-lg font-bold num mt-1" style="color: var(--text);">${verifiedPct}%</div>
          <div class="text-[11px]" style="color: var(--text-3);">зарын эзлэх хувь</div>
        </div>
        <div class="stats-card !p-3">
          <div class="text-[10px] uppercase tracking-wider" style="color: var(--text-3);">Үнэ буурсан</div>
          <div class="text-lg font-bold num mt-1" style="color: var(--text);">${dropCount}</div>
          <div class="text-[11px]" style="color: var(--text-3);">сүүлийн 30 хоногт</div>
        </div>
        <div class="stats-card !p-3">
          <div class="text-[10px] uppercase tracking-wider" style="color: var(--text-3);">Эрэлттэй зар</div>
          <div class="text-lg font-bold num mt-1" style="color: var(--text);">${hotCount}</div>
          <div class="text-[11px]" style="color: var(--text-3);">7+ үзэлт долоо хоногт</div>
        </div>
      </div>

      <!-- AI INSIGHT -->
      <div class="stats-card" style="background: linear-gradient(135deg, rgba(201,163,95,.08), rgba(10,31,68,.04));">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--gold-brand); color: #0A1F44;"><i data-lucide="sparkles" class="w-4 h-4"></i></div>
          <div class="flex-1 text-xs leading-relaxed" style="color: var(--text);">
            <div class="font-semibold mb-1">AI зах зээлийн дүгнэлт</div>
            ${
              count
                ? `
              <span style="color: var(--text-3);">
                ${titleScope}-т ${mode === 'rent' ? 'түрээсийн' : 'зарын'} 1м² үнэ
                сүүлийн жилд <span class="font-semibold" style="color: ${trendPct >= 0 ? 'var(--success)' : '#C44545'};">${trendPct >= 0 ? '+' : ''}${trendPct}%</span>-аар өөрчлөгджээ.
                Хамгийн их эрэлттэй: <span class="font-semibold" style="color: var(--text);">${roomBuckets.sort((a, b) => b.count - a.count)[0].label.toLowerCase()}</span>.
                ${topKhot[0] ? `Манлайлж буй хотхон: <span class="font-semibold" style="color: var(--text);">${topKhot[0][0]}</span>.` : ''}
                Дундажаар зар <span class="font-semibold" style="color: var(--text);">${avgDays} хоног</span> зарлагдаж байна.
              </span>
            `
                : `<span style="color: var(--text-3);">Сонгосон шүүлтэд тохирох зар алга байна.</span>`
            }
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 border-t flex gap-2 justify-between items-center" style="border-color: var(--border); background: var(--surface-2);">
      <div class="text-[11px]" style="color: var(--text-3);">
        <i data-lucide="info" class="w-3 h-3 inline"></i> Эх сурвалж: NEOMAP идэвхтэй зарын дата · ${new Date().toLocaleDateString('mn-MN')}
      </div>
      <div class="flex gap-2">
        <button onclick="showToast('Тайлан PDF татагдсан', 'success')" class="bm-btn-outline !text-xs !py-2"><i data-lucide="download" class="w-3.5 h-3.5"></i> PDF</button>
        <button onclick="closeModal()" class="bm-btn-gold !text-xs !py-2">Хаах</button>
      </div>
    </div>
  `,
    'xl',
  );
  setTimeout(() => lucide.createIcons(), 0);
}
window.renderDetailedStatsModal = renderDetailedStatsModal;

/* ============== MY PLACES — ажил/сургууль/бусад ==============
   Координат нь газрын зургийн нормалчилсан (0..1) систем — UB-ийн зүүн-баруун
   урт ~20 км гэж тооцоолоход 1.0 нэгж ≈ 20 км. Эвклид зайг шууд масштаблана. */
