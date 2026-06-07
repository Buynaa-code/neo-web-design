/* ============== STATE + STORAGE (localStorage) ============== */

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
  postAuthRedirect: null,
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
  state.postAuthRedirect = null;
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
