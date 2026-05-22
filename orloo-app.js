/* ============== BAIRMAP APP LOGIC ============== */

const state = {
  mode: 'sale',            // 'sale' | 'rent'
  modeWasChanged: false,
  currentListingId: 1,
  highlightedId: null,
  scheduleStep: 1,
  scheduleDate: '5/20',
  scheduleTime: '16:00',
  activityTab: 'viewings',
  savedListId: 1,
  authTab: 'signin',
  filterDistrict: null,
  filterRooms: null,
  filterBusStop: null,     // BUS_STOPS[].id — сонгосон автобусны буудал
  filterLifestyle: [],     // ['family','work-close','school-near','investment','pet','furnished','mortgage']
  filterVerified: false,   // зөвхөн баталгаажсан агенттай
  filterIpoteh: false,     // зөвхөн ипотекийн боломжтой
  filterNewProject: false, // зөвхөн шинэ төсөл
  filterSchool: false,     // сургууль ойр
  filterIncome: false,     // орлого өгөх
  filterPriceMax: null,    // дээд хязгаар (₮)
  filterPriceMin: null,    // доод хязгаар (₮)
  filterAreaMin: null,
  filterAreaMax: null,
  aiQuery: '',             // Сүүлд гүйцэтгэсэн AI хайлтын текст
  aiExtracted: null,       // AI-аас гарсан шүүлтүүрийн товч жагсаалт
  sortBy: 'newest',
  page: 1,
  pageSize: 8,
  viewMode: 'list',
  fullMap: false,
  mobileView: 'list',      // 'list' | 'map' — гар утсан дээрх толгоргооцоо
  mediaTab: 'photos',      // property page-ийн hero gallery: 'photos' | 'floorplan' | 'tour' | 'video'
  mapMode: 'pins'          // 'pins' | 'heatmap' — газрын зургийн дүрс
};
window.state = state;

let currentScreen = 'home';
window.currentScreen = currentScreen;

/* ============== ROUTER ============== */
const APP_SCREENS = ['home','results','property','schedule','confirmation','activity','saved','alerts','auth','profile'];

function goTo(name) {
  if (!APP_SCREENS.includes(name)) return;
  currentScreen = name;
  window.currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.querySelector(`[data-screen="${name}"]`);
  if (!target) return;
  target.classList.add('active');
  renderAppScreen(name);
  // Sync nav
  document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === name));
  document.querySelectorAll('[data-nav-mode]').forEach(el =>
    el.classList.toggle('active', name === 'results' && el.dataset.navMode === state.mode));
  document.querySelectorAll('[data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === name));
  document.querySelectorAll('#demo-pill button').forEach(b => b.classList.toggle('active', b.dataset.target === name));
  window.scrollTo(0, 0);
  setTimeout(() => lucide.createIcons(), 0);
}

function renderAppScreen(name) {
  const target = document.querySelector(`[data-screen="${name}"] main`);
  if (!target) return;
  if (name === 'home') target.innerHTML = renderHome();
  else if (name === 'results') target.innerHTML = renderResults();
  else if (name === 'property') target.innerHTML = renderProperty();
  else if (name === 'schedule') target.innerHTML = renderSchedule();
  else if (name === 'confirmation') target.innerHTML = renderConfirmation();
  else if (name === 'activity') target.innerHTML = renderActivity();
  else if (name === 'saved') target.innerHTML = renderSaved();
  else if (name === 'alerts') target.innerHTML = renderAlerts();
  else if (name === 'auth') target.innerHTML = renderAuth();
  else if (name === 'profile') target.innerHTML = renderProfile();
  setTimeout(() => lucide.createIcons(), 0);
}

/* Сүүлд үзсэн зарын ID-ууд — recency-ийн дарааллаар */
window.VIEWED_IDS = window.VIEWED_IDS || [];
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
  goTo('property');
}

function highlightFromPin(id) {
  state.highlightedId = id;
  renderAppScreen('results');
}

/* Click on a district zone polygon — toggle filter and jump to results.
   Empty districts (no listings in current mode) are ignored. */
function selectDistrictZone(name, ev) {
  if (ev) ev.stopPropagation();
  const hasListings = modeListings().some(l => l.district === name);
  if (!hasListings) {
    showToast(name + ' дүүрэгт зар алга байна', 'info', { duration: 1500 });
    return;
  }
  state.filterDistrict = state.filterDistrict === name ? null : name;
  state.highlightedId = null;
  if (currentScreen !== 'results') goTo('results');
  else { renderAppScreen('results'); setTimeout(() => lucide.createIcons(), 0); }
}

function clearDistrictZone() {
  state.filterDistrict = null;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}

/* Open AI search panel — focuses the main search input on home/results */
function openAIPanel() {
  if (currentScreen !== 'home') goTo('home');
  setTimeout(() => {
    const el = document.getElementById('bm-home-search') || document.getElementById('bm-res-search');
    if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, 50);
}

/* Home filter chip → filter setter + navigate */
function applyHomeFilterChip(key) {
  state.filterVerified = (key === 'verified');
  state.filterSchool   = (key === 'school');
  state.filterIpoteh   = (key === 'ipoteh');
  state.filterNewProject = (key === 'new');
  state.filterIncome   = (key === 'income');
  state.page = 1;
  goTo('results');
}
window.applyHomeFilterChip = applyHomeFilterChip;

/* Generic toggle: state.<key> ↔ rerender results */
function toggleResultsFilter(key) {
  state[key] = !state[key];
  state.page = 1;
  if (currentScreen === 'results') {
    renderAppScreen('results');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.toggleResultsFilter = toggleResultsFilter;

/* Pagination */
function gotoPage(p) {
  if (p < 1) return;
  state.page = p;
  if (currentScreen === 'results') {
    renderAppScreen('results');
    setTimeout(() => lucide.createIcons(), 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
window.gotoPage = gotoPage;

/* Дэлгэрэнгүй шүүлтүүр modal — бүх боломжит filter-уудыг нэгтгэж харуулна */
function openAdvancedFilters() {
  const districtRows = DISTRICTS.map(d => {
    const checked = state.filterDistrict === d ? 'checked' : '';
    return `<label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
      <input type="radio" name="adv-district" ${checked} value="${d}" class="accent-[var(--gold-brand)]" />
      <span class="flex-1 text-sm">${d}</span>
      <span class="text-xs" style="color: var(--text-3);">${activeListings().filter(l => l.district === d && l.mode === state.mode).length}</span>
    </label>`;
  }).join('');

  const roomChips = [1,2,3,4].map(n => {
    const sel = state.filterRooms === n;
    return `<button onclick="document.querySelectorAll('[data-adv-room]').forEach(b=>b.classList.remove('active')); this.classList.add('active');" data-adv-room="${n}" class="bm-chip ${sel?'active':''}" style="${sel?'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);':''}">${n}${n===4?'+':''} өрөө</button>`;
  }).join('');

  const ist = state.mode === 'rent';
  const priceMax = state.filterPriceMax || (ist ? 2000000 : 600000000);
  const priceStep = ist ? 100000 : 10000000;
  const priceMaxLimit = ist ? 5000000 : 2000000000;

  openModal(`
    <div class="p-6 max-h-[80vh] overflow-y-auto">
      <div class="flex items-start justify-between mb-5">
        <div>
          <h3 class="text-xl font-bold tracking-tight">Дэлгэрэнгүй шүүлтүүр</h3>
          <p class="text-xs mt-1" style="color: var(--text-3);">Шаардлагатай шүүлтүүрээ сонгож "Хэрэглэх" дарна уу.</p>
        </div>
        <button onclick="closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)]" style="color: var(--text-3);"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>

      <div class="grid md:grid-cols-2 gap-5">
        <div>
          <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">ГОРИМ</div>
          <div class="flex gap-2">
            <button class="bm-chip ${state.mode==='sale'?'active':''}" onclick="state.mode='sale'; openAdvancedFilters();" style="${state.mode==='sale'?'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);':''}">Худалдах</button>
            <button class="bm-chip ${state.mode==='rent'?'active':''}" onclick="state.mode='rent'; openAdvancedFilters();" style="${state.mode==='rent'?'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);':''}">Түрээслэх</button>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">ӨРӨӨНИЙ ТОО</div>
          <div class="flex flex-wrap gap-2">
            ${roomChips}
            <button onclick="document.querySelectorAll('[data-adv-room]').forEach(b=>b.classList.remove('active'));" class="bm-chip">Бүгд</button>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">${ist?'САРЫН ТҮРЭЭС':'ҮНЭ'} (₮)</div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Доод</label>
              <input id="adv-price-min" type="number" placeholder="0" value="${state.filterPriceMin||''}" class="input num" />
            </div>
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Дээд</label>
              <input id="adv-price-max" type="number" placeholder="${priceMax}" value="${state.filterPriceMax||''}" class="input num" />
            </div>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">ТАЛБАЙ (м²)</div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Доод</label>
              <input id="adv-area-min" type="number" placeholder="40" value="${state.filterAreaMin||''}" class="input num" />
            </div>
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Дээд</label>
              <input id="adv-area-max" type="number" placeholder="200" value="${state.filterAreaMax||''}" class="input num" />
            </div>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">ОНЦЛОГ</div>
          <div class="space-y-1.5">
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-verified" type="checkbox" ${state.filterVerified?'checked':''} class="accent-[var(--gold-brand)]"/> Зөвхөн Verified</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-ipoteh" type="checkbox" ${state.filterIpoteh?'checked':''} class="accent-[var(--gold-brand)]"/> Ипотектэй</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-new" type="checkbox" ${state.filterNewProject?'checked':''} class="accent-[var(--gold-brand)]"/> Шинэ төсөл</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-school" type="checkbox" ${state.filterSchool?'checked':''} class="accent-[var(--gold-brand)]"/> Сургууль ойр</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-income" type="checkbox" ${state.filterIncome?'checked':''} class="accent-[var(--gold-brand)]"/> Орлого өгөх</label>
          </div>
        </div>

        <div>
          <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">БАЙРШИЛ (ДҮҮРЭГ)</div>
          <div class="space-y-0.5">
            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
              <input type="radio" name="adv-district" ${!state.filterDistrict?'checked':''} value="" class="accent-[var(--gold-brand)]" />
              <span class="flex-1 text-sm">Бүх дүүрэг</span>
            </label>
            ${districtRows}
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 mt-6 pt-5" style="border-top: 1px solid var(--border);">
        <button onclick="clearAllFilters(); closeModal();" class="text-sm" style="color: var(--text-3);">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 inline"></i> Бүгдийг арилгах
        </button>
        <div class="flex gap-2">
          <button onclick="closeModal()" class="bm-btn-outline !py-2.5">Цуцлах</button>
          <button onclick="applyAdvancedFilters()" class="bm-btn-gold">Хэрэглэх</button>
        </div>
      </div>
    </div>
  `, 'lg');
  setTimeout(() => lucide.createIcons(), 0);
}
window.openAdvancedFilters = openAdvancedFilters;

function applyAdvancedFilters() {
  const sel = document.querySelector('input[name="adv-district"]:checked');
  state.filterDistrict = (sel && sel.value) ? sel.value : null;

  const activeRoom = document.querySelector('[data-adv-room].active');
  state.filterRooms = activeRoom ? parseInt(activeRoom.dataset.advRoom, 10) : null;

  const pMin = parseFloat(document.getElementById('adv-price-min')?.value);
  const pMax = parseFloat(document.getElementById('adv-price-max')?.value);
  state.filterPriceMin = isFinite(pMin) && pMin > 0 ? pMin : null;
  state.filterPriceMax = isFinite(pMax) && pMax > 0 ? pMax : null;

  const aMin = parseFloat(document.getElementById('adv-area-min')?.value);
  const aMax = parseFloat(document.getElementById('adv-area-max')?.value);
  state.filterAreaMin = isFinite(aMin) && aMin > 0 ? aMin : null;
  state.filterAreaMax = isFinite(aMax) && aMax > 0 ? aMax : null;

  state.filterVerified   = !!document.getElementById('adv-verified')?.checked;
  state.filterIpoteh     = !!document.getElementById('adv-ipoteh')?.checked;
  state.filterNewProject = !!document.getElementById('adv-new')?.checked;
  state.filterSchool     = !!document.getElementById('adv-school')?.checked;
  state.filterIncome     = !!document.getElementById('adv-income')?.checked;

  state.page = 1;
  closeModal();
  if (currentScreen !== 'results') goTo('results');
  else { renderAppScreen('results'); setTimeout(() => lucide.createIcons(), 0); }
  showToast('Шүүлтүүр шинэчлэгдлээ', 'success', { duration: 1200 });
}
window.applyAdvancedFilters = applyAdvancedFilters;

function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  state.modeWasChanged = true;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  renderAppScreen(currentScreen);
  showToast(mode === 'rent' ? 'Түрээслэх горим' : 'Худалдан авах горим', 'info', { duration: 1200 });
}

function openFullMap() {
  state.fullMap = true;
  if (currentScreen !== 'results') goTo('results');
  else { renderAppScreen('results'); setTimeout(() => lucide.createIcons(), 0); }
}
function closeFullMap() {
  state.fullMap = false;
  state.highlightedId = null;
  renderAppScreen('results');
  setTimeout(() => lucide.createIcons(), 0);
}

/* ============== TOAST ============== */
function showToast(msg, kind = 'success', opts = {}) {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  const iconMap = { success: 'check-circle-2', info: 'info', warning: 'alert-triangle', danger: 'alert-circle' };
  const colorMap = { success: '#2D6A4F', info: '#0E5D6F', warning: '#B8860B', danger: '#9B2C2C' };
  t.innerHTML = `
    <div class="mt-0.5" style="color:${colorMap[kind]||colorMap.info}"><i data-lucide="${iconMap[kind]||'info'}" class="w-4 h-4"></i></div>
    <div class="flex-1 text-sm">${msg}</div>
    <button class="text-[#8A93A8] hover:text-[#1A1A1A]" onclick="this.parentElement.remove()"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
  `;
  wrap.appendChild(t);
  lucide.createIcons();
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    t.style.transition = 'all .2s ease';
    setTimeout(() => t.remove(), 220);
  }, opts.duration || 2800);
}

/* ============== MODAL ============== */
function openModal(html, size = '') {
  const bd = document.getElementById('modal-backdrop');
  const shell = document.getElementById('modal-shell');
  shell.className = 'modal ' + size;
  shell.innerHTML = html;
  bd.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => lucide.createIcons(), 0);
}
function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function openHeroPicker(field) {
  const ist = state.mode === 'rent';
  let body = '', title = '';
  if (field === 'district') {
    title = 'Дүүрэг сонгох';
    body = `
      <p class="text-xs text-[#4A5874] mb-3">Олон сонголт хийж болно</p>
      <div class="space-y-1.5">
        ${DISTRICTS.map(d => {
          const count = activeListings().filter(l => l.district === d).length;
          const checked = ['Хан-Уул','Сүхбаатар'].includes(d);
          return `<label class="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0EAD9] cursor-pointer">
            <input type="checkbox" ${checked?'checked':''} class="accent-[#0A1F44]" />
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
        ${[1,2,3,4].map(n => `<button onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected')); this.classList.add('selected');" class="src-chip py-3 ${n===2||n===3?'selected':''}">${n}${n===4?'+':''} өрөө</button>`).join('')}
      </div>
    `;
  } else if (field === 'price') {
    title = 'Үнийн хүрээ';
    body = `
      <p class="text-xs text-[#4A5874] mb-3">${ist ? 'Сарын түрээс' : 'Зарын үнэ'}</p>
      <div class="flex items-end gap-[2px] h-14 mb-3">
        ${[2,4,6,9,12,18,22,28,24,18,14,10,7,5,4,3,2,1].map(h => `<div class="flex-1 bg-[#0A1F44] rounded-sm opacity-${h>15?'80':h>10?'60':h>5?'40':'25'}" style="height:${h*3.5}%"></div>`).join('')}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1 block">Доод</label><input class="input" value="${ist?'800,000':'300,000,000'}" /></div>
        <div><label class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1 block">Дээд</label><input class="input" value="${ist?'2,000,000':'600,000,000'}" /></div>
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
      <a href="tel:${agent.phone.replace(/[^0-9+]/g,'')}" class="btn btn-cta flex-1"><i data-lucide="phone" class="w-4 h-4"></i> Залгах</a>
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
      const labels = ex.lifestyle.map(k => (LIFESTYLE_DEFS.find(x => x.key === k) || {}).label).filter(Boolean);
      if (labels.length) parts.push(`Шаардлага: ${labels.join(', ')}`);
    }
  }
  if (state.filterLifestyle && state.filterLifestyle.length && !ex) {
    const labels = state.filterLifestyle.map(k => (LIFESTYLE_DEFS.find(x => x.key === k) || {}).label).filter(Boolean);
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
    ? `Сайн байна уу. Би доорх нөхцлүүдээр хайж байгаа:\n\n${lead.map(p => '• ' + p).join('\n')}\n\n${l ? l.khotkhon + '-ийн зар тохирч байх шиг байна. Үзэлт товлох боломжтой юу?' : 'Тохирох зар санал болгоход баярлалаа.'}`
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
      <button onclick="closeModal(); showToast('${hasLead?'Lead summary-тай мессеж илгээгдлээ':'Мессеж илгээгдлээ'}', 'success'); setTimeout(()=>goTo('activity'), 500);" class="btn btn-primary"><i data-lucide="send" class="w-4 h-4"></i> Илгээх</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

function openSmartSearch(query) {
  closeModal();
  showToast('"' + (query || 'Бэлэн орох') + '" хайж байна...', 'info', { duration: 1500 });
  setTimeout(() => goTo('results'), 600);
}

function openRescheduleModal(viewingId) {
  const v = VIEWINGS.find(x => x.id === viewingId);
  if (!v) return;
  const l = getListing(v.listingId);
  const times = ['10:00','11:00','14:00','15:00','16:00','17:00','18:00'];
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Үзэлт өөрчлөх</h3><p class="text-xs text-[#8A93A8] mt-0.5">${l.khotkhon} · одоогийн ${v.date} ${v.time}</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <div class="eyebrow mb-2">Шинэ цаг</div>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
        ${times.map(t => `<button class="src-chip ${t===v.time?'':''}">${t}</button>`).join('')}
      </div>
      <div class="card p-3 bg-[#F0EAD9] border-[#E8E4DA] flex items-start gap-2 text-xs text-[#4A5874]">
        <i data-lucide="info" class="w-3.5 h-3.5 text-[#0A1F44] shrink-0 mt-0.5"></i>
        Агент мэдэгдэл хүлээж авч 2 цагт баталгаажуулна.
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('Өөрчлөлт илгээгдлээ · агент баталгаажуулна', 'success');" class="btn btn-primary">Хадгалах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
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
  const districtOrder = DISTRICTS.filter(d => groups[d]);
  const body = districtOrder.map(d => `
    <div class="mb-4">
      <div class="eyebrow mb-2 flex items-center gap-1.5"><i data-lucide="map-pin" class="w-3 h-3"></i> ${d}</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${groups[d].map(s => {
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
                ${s.routes.map(r => `<span class="num text-[10px] px-1.5 py-0.5 rounded" style="background: var(--surface-2); color: var(--text-2);">${r}</span>`).join('')}
              </div>
            </div>
            <span class="num text-xs text-[var(--text-3)] shrink-0">${cnt}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  openModal(`
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
  `, 'lg');
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
      <div class="grid grid-cols-6 gap-2">
        ${['heart','home','map-pin','star','sparkles','building-2'].map((ic,i) => `<button class="src-chip py-3 flex items-center justify-center ${i===0?'selected':''}" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected')); this.classList.add('selected');"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`).join('')}
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
  const id = (SAVED_LISTS.reduce((m,l) => Math.max(m,l.id), 0)) + 1;
  SAVED_LISTS.push({ id, name, icon: 'heart', listingIds: [] });
  state.savedListId = id;
  closeModal();
  showToast('"' + name + '" жагсаалт үүслээ', 'success');
  if (currentScreen === 'saved') { renderAppScreen('saved'); setTimeout(() => lucide.createIcons(), 0); }
}

function openShareListModal(listId) {
  const list = SAVED_LISTS.find(l => l.id === listId);
  const link = 'neo.mn/list/' + listId + '/share';
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Жагсаалтаа хуваалцах</h3><p class="text-xs text-[#8A93A8] mt-0.5">${list?.name||'Жагсаалт'}</p></div>
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
  const s = SAVED_SEARCHES.find(x => x.id === searchId);
  if (!s) return;
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Хайлт засах</h3><p class="text-xs text-[#8A93A8] mt-0.5">${s.name}</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-3">
      <div><label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Нэр</label><input class="input" value="${s.name}" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Доод үнэ</label><input class="input num" value="${(s.priceRange[0]/(s.mode==='rent'?1000:1000000)).toFixed(0)}${s.mode==='rent'?'K':'M'}" /></div>
        <div><label class="text-xs font-medium text-[#4A5874] mb-1.5 block">Дээд үнэ</label><input class="input num" value="${(s.priceRange[1]/(s.mode==='rent'?1000:1000000)).toFixed(0)}${s.mode==='rent'?'K':'M'}" /></div>
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('Хайлт шинэчлэгдлээ', 'success');" class="btn btn-primary">Хадгалах</button>
    </div>
  `);
}

function openSavedSearchModal() {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Хайлтаа хадгалах</h3><p class="text-xs text-[#8A93A8] mt-0.5">Шинэ зар орох тутамд мэдэгдэл авна</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <label class="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Нэр</label>
        <input class="input" placeholder="Жишээ: Эхний орон сууц" value="Хан-Уул 2-3 өрөө" />
      </div>
      <div class="card p-4 bg-[#F0EAD9] border-[#E8E4DA]">
        <div class="text-xs font-semibold mb-2">Хайлтын нөхцөл</div>
        <div class="space-y-1 text-sm text-[#5C5C5C]">
          <div class="flex justify-between"><span>Горим</span><span class="font-medium">${state.mode==='rent'?'Түрээс':'Зарах'}</span></div>
          <div class="flex justify-between"><span>Дүүрэг</span><span class="font-medium">Хан-Уул, Сүхбаатар</span></div>
          <div class="flex justify-between"><span>Өрөө</span><span class="font-medium">2-3 өрөө</span></div>
          <div class="flex justify-between"><span>Үнэ</span><span class="font-medium num">${state.mode==='rent'?'800K-2M':'300M-600M'}₮</span></div>
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">Мэдэгдлийн давтамж</div>
        <div class="grid grid-cols-3 gap-2">
          <button class="src-chip selected !text-xs">Тэр даруй</button>
          <button class="src-chip !text-xs">Өдөрт нэг</button>
          <button class="src-chip !text-xs">7 хоногт нэг</button>
        </div>
      </div>
      <div>
        <div class="eyebrow mb-2">Хэрхэн авах вэ?</div>
        <div class="flex flex-wrap gap-3 text-sm">
          <label class="flex items-center gap-1.5"><input type="checkbox" checked class="accent-[#0E5D6F]" /> SMS</label>
          <label class="flex items-center gap-1.5"><input type="checkbox" checked class="accent-[#0E5D6F]" /> И-мэйл</label>
          <label class="flex items-center gap-1.5"><input type="checkbox" checked class="accent-[#0E5D6F]" /> Push</label>
        </div>
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="closeModal(); showToast('Хайлт хадгалагдлаа · Шинэ зар орвол мэдэгдэнэ', 'success'); goTo('alerts');" class="btn btn-primary"><i data-lucide="bell-plus" class="w-4 h-4"></i> Хадгалах</button>
    </div>
  `);
}

function openFiltersModal() {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <h3 class="font-semibold text-lg">Шүүлтүүр</h3>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">${renderFilterBlocks()}</div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-between bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цэвэрлэх</button>
      <button onclick="closeModal(); renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="btn btn-primary">Хэрэглэх</button>
    </div>
  `);
}

function openMobileMap() {
  // Legacy alias — route to fullMap mode
  openFullMap();
}

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

function openSignOutConfirm() {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <h3 class="font-semibold text-lg">Гарах уу?</h3>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 text-sm text-[#5C5C5C]">Дахин нэвтрэх хүртэл мэдэгдэл ирэхгүй.</div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Болих</button>
      <button onclick="closeModal(); showToast('Гарлаа', 'info'); goTo('auth');" class="btn !bg-[#9B2C2C] !text-white">Тийм, гарах</button>
    </div>
  `);
}

function showOtpStep() {
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">SMS код оруулах</h3><p class="text-xs text-[#8A93A8] mt-0.5">+976 9911 5544 руу 6 оронтой код илгээсэн</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <div class="flex justify-between gap-2 mb-3">
        ${[4,7,2,9,'',''].map(v => `<input class="otp-box" maxlength="1" value="${v}" />`).join('')}
      </div>
      <button class="text-xs text-[#0E5D6F] font-medium hover:underline">Дахин илгээх (30с)</button>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Буцах</button>
      <button onclick="closeModal(); showToast('Тавтай морил, Энхтуяа', 'success'); goTo('home');" class="btn btn-primary">Баталгаажуулах</button>
    </div>
  `);
}

/* ============== SCHEDULE SUBMIT ============== */
function submitSchedule() {
  const l = getListing(state.currentListingId);
  showToast(`<strong>${l.khotkhon}</strong>-д ${state.scheduleDate} ${state.scheduleTime}-д үзэлт товлогдлоо`, 'success', { duration: 3500 });
  setTimeout(() => goTo('confirmation'), 400);
  state.scheduleStep = 1;
}

/* ============== HEART TOGGLE ============== */
function toggleSaved(id, btnEl) {
  const wasSaved = SAVED_IDS.has(id);
  if (wasSaved) {
    SAVED_IDS.delete(id);
    // Remove from all lists too
    SAVED_LISTS.forEach(l => { l.listingIds = l.listingIds.filter(x => x !== id); });
    showToast('Хадгалснаас хаслаа', 'info', { duration: 1500 });
  } else {
    SAVED_IDS.add(id);
    // Default to first list
    if (!SAVED_LISTS[0].listingIds.includes(id)) SAVED_LISTS[0].listingIds.push(id);
    showToast('Хадгалагдлаа · <strong>' + SAVED_LISTS[0].name + '</strong>', 'success', { duration: 2000 });
  }
  // Update all instances of this heart button
  document.querySelectorAll(`[data-listing-id="${id}"] .heart-btn`).forEach(el => {
    el.classList.toggle('saved', !wasSaved);
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 350);
  });
  if (btnEl) {
    btnEl.classList.toggle('saved', !wasSaved);
    btnEl.classList.add('pop');
    setTimeout(() => btnEl.classList.remove('pop'), 350);
  }
}

/* ============== COMMAND PALETTE ============== */
let cmdSelected = 0;
let cmdFlat = [];

const CMD_SCREENS = [
  { type: 'screen', key: 'home', label: 'Эхлэл', icon: 'home' },
  { type: 'screen', key: 'results', label: 'Хайлтын үр дүн', icon: 'list' },
  { type: 'screen', key: 'activity', label: 'Үзэлтүүд', icon: 'calendar-check' },
  { type: 'screen', key: 'saved', label: 'Хадгалсан зарууд', icon: 'heart' },
  { type: 'screen', key: 'alerts', label: 'Мэдэгдэл, хадгалсан хайлт', icon: 'bell' },
  { type: 'screen', key: 'profile', label: 'Профайл', icon: 'user' }
];

const CMD_ACTIONS = [
  { type: 'action', key: 'mode-rent', label: 'Түрээслэх горим руу шилжих', icon: 'home', fn: () => setMode('rent') },
  { type: 'action', key: 'mode-sale', label: 'Худалдан авах горим руу шилжих', icon: 'banknote', fn: () => setMode('sale') },
  { type: 'action', key: 'new-search', label: 'Шинэ хайлт хадгалах', icon: 'bell-plus', fn: () => openSavedSearchModal() }
];

function openCmd() {
  document.getElementById('cmd-backdrop').classList.add('open');
  document.getElementById('cmd-input').value = '';
  cmdSelected = 0;
  renderCmdList('');
  setTimeout(() => { document.getElementById('cmd-input').focus(); }, 50);
}

function closeCmd() {
  document.getElementById('cmd-backdrop').classList.remove('open');
}

function renderCmdList(q) {
  const ql = q.toLowerCase().trim();
  const groups = [];

  const matchScreens = CMD_SCREENS.filter(s => !ql || s.label.toLowerCase().includes(ql));
  if (matchScreens.length) groups.push({ title: 'Скрин', items: matchScreens });

  const matchActions = CMD_ACTIONS.filter(a => !ql || a.label.toLowerCase().includes(ql));
  if (matchActions.length) groups.push({ title: 'Үйлдэл', items: matchActions });

  const matchListings = LISTINGS.filter(l => !ql || l.khotkhon.toLowerCase().includes(ql) || l.district.toLowerCase().includes(ql)).slice(0, 6);
  if (matchListings.length) groups.push({
    title: 'Зарууд',
    items: matchListings.map(l => ({ type: 'listing', key: l.id, label: `${l.khotkhon} · ${l.rooms}ө ${l.area}м²`, sub: `${l.district}, ${l.khoroo}-р хороо · ${listingPriceShort(l)}`, icon: 'building-2' }))
  });

  const matchDistricts = DISTRICTS.filter(d => ql && d.toLowerCase().includes(ql));
  if (matchDistricts.length) groups.push({
    title: 'Дүүрэг',
    items: matchDistricts.map(d => ({ type: 'district', key: d, label: d + ' дүүрэг', icon: 'map-pin' }))
  });

  cmdFlat = groups.flatMap(g => g.items);
  cmdSelected = Math.min(cmdSelected, Math.max(cmdFlat.length - 1, 0));

  const list = document.getElementById('cmd-list');
  if (!cmdFlat.length) {
    list.innerHTML = '<div class="text-center text-sm text-[#8A93A8] py-8">Үр дүн олдсонгүй</div>';
    return;
  }

  let idx = 0;
  list.innerHTML = groups.map(g => `
    <div class="cmd-group-title">${g.title}</div>
    ${g.items.map(it => {
      const i = idx++;
      return `<div class="cmd-item ${i===cmdSelected?'selected':''}" data-idx="${i}" onclick="runCmd(${i})">
        <i data-lucide="${it.icon}" class="w-4 h-4"></i>
        <div class="flex-1 min-w-0"><div class="truncate">${it.label}</div>${it.sub?`<div class="text-xs text-[#8A93A8]">${it.sub}</div>`:''}</div>
      </div>`;
    }).join('')}
  `).join('');
  lucide.createIcons();
}

function runCmd(i) {
  const it = cmdFlat[i];
  if (!it) return;
  closeCmd();
  if (it.type === 'screen') goTo(it.key);
  else if (it.type === 'action') it.fn();
  else if (it.type === 'listing') openProperty(it.key);
  else if (it.type === 'district') { state.filterDistrict = it.key; goTo('results'); }
}

document.getElementById('cmd-input').addEventListener('input', e => {
  cmdSelected = 0;
  renderCmdList(e.target.value);
});

/* ============== KEYBOARD SHORTCUTS ============== */
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCmd();
  }
  if (e.key === 'Escape') {
    closeCmd();
    if (document.getElementById('modal-backdrop').classList.contains('open')) closeModal();
  }
  if (document.getElementById('cmd-backdrop').classList.contains('open')) {
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelected++; renderCmdList(document.getElementById('cmd-input').value); }
    if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelected = Math.max(0, cmdSelected - 1); renderCmdList(document.getElementById('cmd-input').value); }
    if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdSelected); }
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
  { key: 'profile', icon: 'user', label: 'Профайл' }
];

function buildDemoPill() {
  const pill = document.getElementById('demo-pill');
  pill.innerHTML = DEMO_SCREENS.map(s => `
    <button data-target="${s.key}" onclick="goTo('${s.key}')">
      <i data-lucide="${s.icon}" class="w-4 h-4"></i>
      <span class="tip">${s.label}</span>
    </button>
  `).join('');
}

/* ============== BOOT ============== */
buildDemoPill();
goTo('home');
// Sync header mode toggle on initial render
document.querySelectorAll('#header-mode [data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));
lucide.createIcons();
// First-time tour
setTimeout(() => { if (!window.__tourSeen) startTour(); }, 800);
