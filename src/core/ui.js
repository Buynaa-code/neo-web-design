/* ============== ROUTER + MODAL + TOAST + HEADER ============== */

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
