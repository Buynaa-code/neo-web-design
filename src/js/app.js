/* ============== BAIRMAP APP LOGIC ============== */

const state = {
  mode: 'sale', // 'sale' | 'rent'
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
  filterBusStop: null, // BUS_STOPS[].id — сонгосон автобусны буудал
  filterLifestyle: [], // ['family','work-close','school-near','investment','pet','furnished','mortgage']
  filterVerified: false, // зөвхөн баталгаажсан агенттай
  filterIpoteh: false, // зөвхөн ипотекийн боломжтой
  filterNewProject: false, // зөвхөн шинэ төсөл
  filterSchool: false, // сургууль ойр
  filterIncome: false, // орлого өгөх
  filterPriceMax: null, // нийт үнэ — дээд хязгаар (₮)
  filterPriceMin: null, // нийт үнэ — доод хязгаар (₮)
  filterPpmMin: null, // ₮/м² (sale) эсвэл ₮/м²/сар (rent) — доод
  filterPpmMax: null, // ₮/м² (sale) эсвэл ₮/м²/сар (rent) — дээд
  priceFilterMode: 'total', // 'total' | 'ppm' — аль үнийн филтер идэвхтэй
  filterAreaMin: null,
  filterAreaMax: null,
  aiQuery: '', // Сүүлд гүйцэтгэсэн AI хайлтын текст
  aiExtracted: null, // AI-аас гарсан шүүлтүүрийн товч жагсаалт
  sortBy: 'newest',
  page: 1,
  pageSize: 8,
  viewMode: 'list',
  fullMap: false,
  mobileView: 'list', // 'list' | 'map' — гар утсан дээрх толгоргооцоо
  mediaTab: 'photos', // property page-ийн hero gallery: 'photos' | 'floorplan' | 'tour' | 'video'
  mapMode: 'pins', // 'pins' | 'heatmap' — газрын зургийн дүрс
  savedTab: 'listings', // 'listings' | 'searches' — Хадгалсан дэлгэцийн tab
  drawingPolygon: false, // газрын зураг дээр zone зурж байгаа эсэх
  drawnPolygon: null, // [{x,y}, ...] 0..1 координат — listing шүүлтэд ашиглана
  loanBankId: 'khan', // Зээлийн тооцоолуурт сонгосон банк
  loanDownPct: 30, // Урьдчилгаа %
  loanYears: 20, // Зээлийн хугацаа
  rentalMgmtTab: 'overview', // Түрээсийн менежментийн tab
  listPropMode: 'rent', // List property: sale | rent
  listPropStep: 1, // List property: 1..5 бүлэг (дотроо 13 алхмын дата)
  listPropDraft: null, // Зар оруулах smart wizard-ийн draft
  homeAIChat: [], // [{role:'user'|'bot', text, suggestions?}]
  homeAIChatCollapsed: false,
  mapZoom: 1, // 1..4 — газрын зургийн томруулалт
  mapPanX: 0, // -1..1 — pan offset (зүүн/баруун)
  mapPanY: 0, // -1..1 — pan offset (дээш/доош)
  myPlaces: [], // [{ id, kind:'work'|'school'|'other', label, lat, lng }] — localStorage-д хадгалагдана
  placePicker: null, // { editId, kind, label } | null — modal дотор сонгож буй цэг
  isLoggedIn: false, // нэвтэрсэн эсэх
  currentUser: null, // { name, phone, initials } | null — localStorage-д persist хийгдэнэ
  authPhoneDraft: '', // auth screen дээр оруулж буй утас
  authResendLeft: 0, // resend countdown секунд (0 = идэвхтэй)
  userInterests: null, // идэвхтэй профайл — userInterestsList-аас sync хийгдэнэ
  userInterestsList: [], // [{ id, name, lifestyle, mode, budgetMin, budgetMax, bedrooms:[], bathroomsMin, office, districts:[], mustHaves:[], vibe, updatedAt }]
  activeInterestsId: null, // одоо идэвхтэй профайлын id
  userTier: 'free', // 'free' | 'pro' — free хэрэглэгч хамгийн ихдээ 1 профайл хадгална
  userTierPlan: null, // 'monthly' | 'yearly' | null — Pro хэрэглэгчийн сонгосон төлбөрийн багц
  userTierActivatedAt: null, // Pro идэвхжсэн огноо (ISO)
  upgradeDraftPlan: null, // upgrade modal дотор сонгож буй plan key
  interestsWizardStep: 1, // 1..6
  interestsWizardMode: 'edit', // 'edit' | 'create' — wizard дуусахад одоогийн профайл засах эсвэл шинэ нэмэх
  interestsWizardDraft: null, // setup wizard-ийн оруулж буй өгөгдөл
  interestsDismissedIds: [], // feed-ээс swipe-аар хассан listing id-ууд
};
window.state = state;

/* ============== MY PLACES — load/save (localStorage) ============== */
const MY_PLACES_KEY = 'orloo.myPlaces.v1';
try {
  const raw = localStorage.getItem(MY_PLACES_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) state.myPlaces = parsed;
  }
} catch (e) {
  /* private mode — алгасъя */
}
function saveMyPlaces() {
  try {
    localStorage.setItem(MY_PLACES_KEY, JSON.stringify(state.myPlaces || []));
  } catch (e) {}
}
window.saveMyPlaces = saveMyPlaces;

/* ============== AUTH — load/save (localStorage) ============== */
const AUTH_KEY = 'orloo.auth.v1';
try {
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.isLoggedIn && parsed.currentUser) {
      state.isLoggedIn = true;
      state.currentUser = parsed.currentUser;
    }
  }
} catch (e) {
  /* private mode — алгасъя */
}
function saveAuth() {
  try {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        isLoggedIn: !!state.isLoggedIn,
        currentUser: state.currentUser || null,
      }),
    );
  } catch (e) {}
}
function clearAuth() {
  state.isLoggedIn = false;
  state.currentUser = null;
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (e) {}
}
window.saveAuth = saveAuth;
window.clearAuth = clearAuth;

/* ============== USER INTERESTS — load/save (localStorage) ============== */
const INTERESTS_KEY = 'orloo.interests.v1';
const INTERESTS_DISMISS_KEY = 'orloo.interests.dismissed.v1';
const USER_TIER_KEY = 'orloo.userTier.v1';

function normalizeInterestsProfile(p) {
  if (!p) return p;
  // Хуучин rooms[] (нийт өрөө) -> bedrooms[] (унтлагын өрөө) migration
  if (!p.bedrooms && Array.isArray(p.rooms)) {
    p.bedrooms = [...new Set(p.rooms.map((r) => Math.max(1, Math.min(4, r - 1))))];
    delete p.rooms;
  }
  if (p.bathroomsMin == null) p.bathroomsMin = 0;
  if (p.office == null) p.office = false;
  // Шинэ талбарууд — 9-алхамт wizard-ын өргөтгөсөн схем
  if (!p.purpose) p.purpose = 'any';
  if (!Array.isArray(p.subTypes)) p.subTypes = [];
  if (p.budgetAny == null) p.budgetAny = false;
  if (!Array.isArray(p.conditions)) p.conditions = [];
  if (!Array.isArray(p.notifChannels) || !p.notifChannels.length) p.notifChannels = ['app'];
  return p;
}

function makeInterestsProfileName(p) {
  const meta =
    typeof INTEREST_LIFESTYLES !== 'undefined' ? INTEREST_LIFESTYLES.find((x) => x.key === p.lifestyle) : null;
  const lifestyle = (meta && meta.label) || 'Хүсэл';
  const first = (p.districts || [])[0];
  return first ? `${lifestyle} · ${first}` : lifestyle;
}
window.makeInterestsProfileName = makeInterestsProfileName;

function syncActiveInterests() {
  const list = state.userInterestsList || [];
  if (!list.length) {
    state.userInterests = null;
    state.activeInterestsId = null;
    return;
  }
  const active = list.find((p) => p.id === state.activeInterestsId);
  if (active) {
    state.userInterests = active;
  } else {
    state.activeInterestsId = list[0].id;
    state.userInterests = list[0];
  }
}
window.syncActiveInterests = syncActiveInterests;

try {
  const raw = localStorage.getItem(INTERESTS_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.profiles)) {
      // Шинэ list-based формат
      state.userInterestsList = parsed.profiles.map((p) => normalizeInterestsProfile(p)).filter(Boolean);
      state.activeInterestsId =
        parsed.activeId || (state.userInterestsList[0] && state.userInterestsList[0].id) || null;
    } else if (parsed && parsed.lifestyle) {
      // Хуучин нэг профайлтай формат — list-д шилжүүлэх
      normalizeInterestsProfile(parsed);
      if (!parsed.id) parsed.id = Date.now();
      if (!parsed.name) parsed.name = makeInterestsProfileName(parsed);
      state.userInterestsList = [parsed];
      state.activeInterestsId = parsed.id;
    }
    syncActiveInterests();
  }
  const rawD = localStorage.getItem(INTERESTS_DISMISS_KEY);
  if (rawD) {
    const arr = JSON.parse(rawD);
    if (Array.isArray(arr)) state.interestsDismissedIds = arr;
  }
  const tierRaw = localStorage.getItem(USER_TIER_KEY);
  if (tierRaw) {
    try {
      const tp = JSON.parse(tierRaw);
      if (tp && typeof tp === 'object') {
        if (tp.tier === 'pro' || tp.tier === 'free') state.userTier = tp.tier;
        state.userTierPlan = tp.plan || null;
        state.userTierActivatedAt = tp.activatedAt || null;
      } else if (tierRaw === 'pro' || tierRaw === 'free') {
        // Хуучин string формат
        state.userTier = tierRaw;
      }
    } catch (e) {
      if (tierRaw === 'pro' || tierRaw === 'free') state.userTier = tierRaw;
    }
  }
} catch (e) {
  /* private mode — алгасъя */
}

function saveInterests() {
  try {
    const payload = { profiles: state.userInterestsList || [], activeId: state.activeInterestsId };
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(payload));
  } catch (e) {}
}
function saveInterestsDismissed() {
  try {
    localStorage.setItem(INTERESTS_DISMISS_KEY, JSON.stringify(state.interestsDismissedIds || []));
  } catch (e) {}
}
function saveUserTier() {
  try {
    const payload = {
      tier: state.userTier || 'free',
      plan: state.userTierPlan || null,
      activatedAt: state.userTierActivatedAt || null,
    };
    localStorage.setItem(USER_TIER_KEY, JSON.stringify(payload));
  } catch (e) {}
}
function clearInterests() {
  state.userInterests = null;
  state.userInterestsList = [];
  state.activeInterestsId = null;
  state.interestsDismissedIds = [];
  try {
    localStorage.removeItem(INTERESTS_KEY);
    localStorage.removeItem(INTERESTS_DISMISS_KEY);
  } catch (e) {}
}
window.saveInterests = saveInterests;
window.saveInterestsDismissed = saveInterestsDismissed;
window.saveUserTier = saveUserTier;
window.clearInterests = clearInterests;

let currentScreen = 'home';
window.currentScreen = currentScreen;

/* ============== ROUTER ============== */
const APP_SCREENS = [
  'home',
  'results',
  'property',
  'schedule',
  'confirmation',
  'activity',
  'saved',
  'alerts',
  'auth',
  'profile',
  'news',
  'rental-mgmt',
  'list-property',
  'interests',
];
// Нэвтрэлт шаардах дэлгэцүүд — зочин эдгээрт орвол auth руу шилжинэ
const PROTECTED_SCREENS = ['profile', 'activity', 'saved', 'alerts', 'rental-mgmt', 'list-property', 'schedule'];

function goTo(name) {
  if (!APP_SCREENS.includes(name)) return;
  // Auth guard — нэвтрэхгүй байж хамгаалагдсан дэлгэц рүү очвол auth руу шилжүүлнэ
  if (PROTECTED_SCREENS.includes(name) && !state.isLoggedIn) {
    if (typeof showToast === 'function') showToast('Үргэлжлүүлэхийн тулд нэвтэрнэ үү', 'info');
    name = 'auth';
  }
  // Газрын зургийн full-screen overlay-г хаах — өөр screen рүү шилжихэд
  if (name !== 'results' && state.fullMap) {
    state.fullMap = false;
    if (typeof restoreAIAfterFullMap === 'function') restoreAIAfterFullMap();
    document.body.classList.remove('map-fs-open');
  }
  currentScreen = name;
  window.currentScreen = name;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.querySelector(`[data-screen="${name}"]`);
  if (!target) return;
  target.classList.add('active');
  renderAppScreen(name);
  // Sync nav
  document.querySelectorAll('[data-nav]').forEach((el) => el.classList.toggle('active', el.dataset.nav === name));
  document
    .querySelectorAll('[data-nav-mode]')
    .forEach((el) => el.classList.toggle('active', name === 'results' && el.dataset.navMode === state.mode));
  document.querySelectorAll('[data-tab]').forEach((el) => el.classList.toggle('active', el.dataset.tab === name));
  document
    .querySelectorAll('#demo-pill button')
    .forEach((b) => b.classList.toggle('active', b.dataset.target === name));
  window.scrollTo(0, 0);
  setTimeout(() => lucide.createIcons(), 0);
}

function renderAppScreen(name) {
  const target = document.querySelector(`[data-screen="${name}"] main`);
  if (!target) return;
  if (name !== 'home' && typeof destroyHomeLeafletMap === 'function') destroyHomeLeafletMap();
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
  else if (name === 'news') target.innerHTML = renderNews();
  else if (name === 'rental-mgmt') target.innerHTML = renderRentalMgmt();
  else if (name === 'list-property') target.innerHTML = renderListProperty();
  else if (name === 'interests') target.innerHTML = renderInterests();
  if (typeof refreshGlobalAIChat === 'function') refreshGlobalAIChat({ scroll: false });
  setTimeout(() => lucide.createIcons(), 0);
  if (name === 'home' && typeof initHomeLeafletMap === 'function') {
    setTimeout(() => {
      const pins =
        (state && state._homeMapPins) || (typeof modeListings === 'function' ? modeListings() : window.LISTINGS || []);
      initHomeLeafletMap(pins);
    }, 0);
    if (typeof maybeShowOnboarding === 'function') maybeShowOnboarding();
  }
}

/* ============== LOAN CALCULATOR ============== */
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

/* Дэлгэрэнгүй шүүлтүүр modal — бүх боломжит filter-уудыг нэгтгэж харуулна */
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

/* ============== TOAST ============== */
function showToast(msg, kind = 'success', opts = {}) {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  const iconMap = { success: 'check-circle-2', info: 'info', warning: 'alert-triangle', danger: 'alert-circle' };
  const colorMap = { success: '#2D6A4F', info: '#0E5D6F', warning: '#B8860B', danger: '#9B2C2C' };
  t.innerHTML = `
    <div class="mt-0.5" style="color:${colorMap[kind] || colorMap.info}"><i data-lucide="${iconMap[kind] || 'info'}" class="w-4 h-4"></i></div>
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
function closeModal(opts = {}) {
  if (!opts.skipPlacePicker && state.placePicker && typeof closePlacePicker === 'function') {
    closePlacePicker();
    return;
  }
  document.getElementById('modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

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
  goTo('home');
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

/* ============== HEART TOGGLE ============== */
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

/* ============== COMMAND PALETTE ============== */
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

/* ============== HEADER AUTH SLOT ============== */
function renderHeaderAuth() {
  const slot = document.getElementById('header-auth-slot');
  if (!slot) return;
  if (state.isLoggedIn && state.currentUser) {
    const u = state.currentUser;
    const initials = u.initials || (u.name || '?').slice(0, 2);
    slot.innerHTML = `
      <button onclick="goTo('profile')" class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition"
        style="border:1px solid var(--border); color: var(--text);"
        onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'"
        title="Профайл">
        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold"
          style="background: var(--primary, #0E5D6F); color: #fff;">${initials}</span>
        <span class="hidden sm:inline text-sm font-medium">${u.name || ''}</span>
      </button>
    `;
  } else {
    slot.innerHTML = `
      <button onclick="goTo('auth')" class="btn-signin">
        <i data-lucide="user" class="w-4 h-4"></i>
        <span class="hidden sm:inline">Нэвтрэх</span>
      </button>
    `;
  }
  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 0);
}
window.renderHeaderAuth = renderHeaderAuth;

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
