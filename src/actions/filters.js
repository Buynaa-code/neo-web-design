/* ============== ACTIONS — filters + nav + mode ============== */

function toggleNavMenu(key) {
  const group = document.querySelector(`[data-nav-group="${key}"]`);
  if (!group) return;
  const isOpen = group.classList.contains('open');
  closeNavMenu();
  if (!isOpen) group.classList.add('open');
}
function closeNavMenu() {
  document.querySelectorAll('.bm-nav-group.open').forEach((g) => g.classList.remove('open'));
}
window.toggleNavMenu = toggleNavMenu;
window.closeNavMenu = closeNavMenu;
document.addEventListener('click', (e) => {
  if (!e.target.closest('.bm-nav-group')) closeNavMenu();
});

/* Сүүлд үзсэн зарын ID-ууд — recency-ийн дарааллаар */

function selectDistrictZone(name, ev) {
  if (ev) ev.stopPropagation();
  const hasListings = modeListings().some((l) => l.district === name);
  if (!hasListings) {
    showToast(name + ' дүүрэгт зар алга байна', 'info', { duration: 1500 });
    return;
  }
  state.filterDistrict = state.filterDistrict === name ? null : name;
  state.highlightedId = null;
  if (currentScreen !== 'results') goTo('results');
  else {
    renderAppScreen('results');
    setTimeout(() => lucide.createIcons(), 0);
  }
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
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 50);
}

/* Home filter chip → filter setter + navigate */
function applyHomeFilterChip(key) {
  state.filterVerified = key === 'verified';
  state.filterSchool = key === 'school';
  state.filterIpoteh = key === 'ipoteh';
  state.filterNewProject = key === 'new';
  state.filterIncome = key === 'income';
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


function openAdvancedFilters() {
  const districtRows = DISTRICTS.map((d) => {
    const checked = state.filterDistrict === d ? 'checked' : '';
    return `<label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
      <input type="radio" name="adv-district" ${checked} value="${d}" class="accent-[var(--gold-brand)]" />
      <span class="flex-1 text-sm">${d}</span>
      <span class="text-xs" style="color: var(--text-3);">${activeListings().filter((l) => l.district === d && l.mode === state.mode).length}</span>
    </label>`;
  }).join('');

  const roomChips = [1, 2, 3, 4]
    .map((n) => {
      const sel = state.filterRooms === n;
      return `<button onclick="document.querySelectorAll('[data-adv-room]').forEach(b=>b.classList.remove('active')); this.classList.add('active');" data-adv-room="${n}" class="bm-chip ${sel ? 'active' : ''}" style="${sel ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">${n}${n === 4 ? '+' : ''} өрөө</button>`;
    })
    .join('');

  const ist = state.mode === 'rent';
  const priceMax = state.filterPriceMax || (ist ? 2000000 : 600000000);
  const priceStep = ist ? 100000 : 10000000;
  const priceMaxLimit = ist ? 5000000 : 2000000000;

  openModal(
    `
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
            <button class="bm-chip ${state.mode === 'sale' ? 'active' : ''}" onclick="state.mode='sale'; openAdvancedFilters();" style="${state.mode === 'sale' ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">Худалдах</button>
            <button class="bm-chip ${state.mode === 'rent' ? 'active' : ''}" onclick="state.mode='rent'; openAdvancedFilters();" style="${state.mode === 'rent' ? 'border-color: var(--gold-brand); background: var(--gold-soft); color: var(--gold-brand);' : ''}">Түрээслэх</button>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">ӨРӨӨНИЙ ТОО</div>
          <div class="flex flex-wrap gap-2">
            ${roomChips}
            <button onclick="document.querySelectorAll('[data-adv-room]').forEach(b=>b.classList.remove('active'));" class="bm-chip">Бүгд</button>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">${ist ? 'САРЫН ТҮРЭЭС' : 'ҮНЭ'} (₮)</div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Доод</label>
              <input id="adv-price-min" type="number" placeholder="0" value="${state.filterPriceMin || ''}" class="input num" />
            </div>
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Дээд</label>
              <input id="adv-price-max" type="number" placeholder="${priceMax}" value="${state.filterPriceMax || ''}" class="input num" />
            </div>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">ТАЛБАЙ (м²)</div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Доод</label>
              <input id="adv-area-min" type="number" placeholder="40" value="${state.filterAreaMin || ''}" class="input num" />
            </div>
            <div>
              <label class="text-[11px]" style="color: var(--text-3);">Дээд</label>
              <input id="adv-area-max" type="number" placeholder="200" value="${state.filterAreaMax || ''}" class="input num" />
            </div>
          </div>

          <div class="text-xs font-semibold mt-5 mb-2" style="color: var(--text-3); letter-spacing: .06em;">ОНЦЛОГ</div>
          <div class="space-y-1.5">
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-verified" type="checkbox" ${state.filterVerified ? 'checked' : ''} class="accent-[var(--gold-brand)]"/> Зөвхөн Verified</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-ipoteh" type="checkbox" ${state.filterIpoteh ? 'checked' : ''} class="accent-[var(--gold-brand)]"/> Ипотектэй</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-new" type="checkbox" ${state.filterNewProject ? 'checked' : ''} class="accent-[var(--gold-brand)]"/> Шинэ төсөл</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-school" type="checkbox" ${state.filterSchool ? 'checked' : ''} class="accent-[var(--gold-brand)]"/> Сургууль ойр</label>
            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm"><input id="adv-income" type="checkbox" ${state.filterIncome ? 'checked' : ''} class="accent-[var(--gold-brand)]"/> Орлого өгөх</label>
          </div>
        </div>

        <div>
          <div class="text-xs font-semibold mb-2" style="color: var(--text-3); letter-spacing: .06em;">БАЙРШИЛ (ДҮҮРЭГ)</div>
          <div class="space-y-0.5">
            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
              <input type="radio" name="adv-district" ${!state.filterDistrict ? 'checked' : ''} value="" class="accent-[var(--gold-brand)]" />
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
  `,
    'lg',
  );
  setTimeout(() => lucide.createIcons(), 0);
}
window.openAdvancedFilters = openAdvancedFilters;

function applyAdvancedFilters() {
  const sel = document.querySelector('input[name="adv-district"]:checked');
  state.filterDistrict = sel && sel.value ? sel.value : null;

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

  state.filterVerified = !!document.getElementById('adv-verified')?.checked;
  state.filterIpoteh = !!document.getElementById('adv-ipoteh')?.checked;
  state.filterNewProject = !!document.getElementById('adv-new')?.checked;
  state.filterSchool = !!document.getElementById('adv-school')?.checked;
  state.filterIncome = !!document.getElementById('adv-income')?.checked;

  state.page = 1;
  closeModal();
  if (currentScreen !== 'results') goTo('results');
  else {
    renderAppScreen('results');
    setTimeout(() => lucide.createIcons(), 0);
  }
  showToast('Шүүлтүүр шинэчлэгдлээ', 'success', { duration: 1200 });
}
window.applyAdvancedFilters = applyAdvancedFilters;

function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  state.modeWasChanged = true;
  document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  renderAppScreen(currentScreen);
  showToast(mode === 'rent' ? 'Түрээслэх горим' : 'Худалдан авах горим', 'info', { duration: 1200 });
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
