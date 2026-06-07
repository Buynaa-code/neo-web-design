/* ============== NEO FEATURES ============== */

/* Wishlist status pipeline */
const WISHLIST_STATUS = {
  saved: { label: 'Хадгалсан', icon: 'heart', color: '#A9AFB9' },
  contacted: { label: 'Холбогдсон', icon: 'message-circle', color: '#5FD4E5' },
  viewed: { label: 'Үзсэн', icon: 'eye', color: '#C9A35F' },
  decided: { label: 'Шийдсэн', icon: 'check-circle', color: '#4DD09E' },
};
const LISTING_STATUS = {}; // listingId -> status key
[1, 2, 5].forEach((id) => (LISTING_STATUS[id] = 'contacted'));
[3, 6].forEach((id) => (LISTING_STATUS[id] = 'viewed'));
LISTING_STATUS[7] = 'decided';

function statusForListing(id) {
  return LISTING_STATUS[id] || 'saved';
}
function setStatus(id, status) {
  LISTING_STATUS[id] = status;
  showToast(`<strong>${WISHLIST_STATUS[status].label}</strong>-руу шилжүүллээ`, 'success', { duration: 1500 });
  if (currentScreen === 'saved') {
    renderAppScreen('saved');
    setTimeout(() => lucide.createIcons(), 0);
  }
}

/* Search history */
window.SEARCH_HISTORY = window.SEARCH_HISTORY || [
  { mode: 'rent', districts: ['Хан-Уул'], rooms: '2-3', priceLabel: '1M-2M ₮', ts: '2 цаг өмнө' },
  { mode: 'sale', districts: ['Сүхбаатар'], rooms: '3', priceLabel: '400M-600M ₮', ts: 'Өчигдөр' },
  { mode: 'rent', districts: ['Баянзүрх'], rooms: '4+', priceLabel: '2.5M-4M ₮', ts: '3 хоног өмнө' },
];

/* ============== 1. PHOTO LIGHTBOX ============== */
let lightboxState = { listingId: null, index: 0 };

function openPhotoLightbox(listingId, startIndex = 0) {
  lightboxState.listingId = listingId;
  lightboxState.index = startIndex;
  let el = document.getElementById('lightbox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'lightbox';
    el.className = 'fixed inset-0 z-[200] hidden items-center justify-center';
    el.style.background = 'rgba(0,0,0,.92)';
    el.style.backdropFilter = 'blur(8px)';
    el.onclick = (e) => {
      if (e.target === el) closeLightbox();
    };
    document.body.appendChild(el);
  }
  el.classList.remove('hidden');
  el.style.display = 'flex';
  renderLightbox();
  document.addEventListener('keydown', lightboxKeys);
}
function closeLightbox() {
  const el = document.getElementById('lightbox');
  if (el) el.style.display = 'none';
  document.removeEventListener('keydown', lightboxKeys);
}
function lightboxKeys(e) {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lightboxNext(1);
  if (e.key === 'ArrowLeft') lightboxNext(-1);
}
function lightboxNext(delta) {
  const l = getListing(lightboxState.listingId);
  const total = 5 + (l.photos % 6) + 14;
  lightboxState.index = (lightboxState.index + delta + total) % total;
  renderLightbox();
}
function renderLightbox() {
  const el = document.getElementById('lightbox');
  const l = getListing(lightboxState.listingId);
  if (!el || !l) return;
  const total = 5 + (l.photos % 6) + 14;
  const i = lightboxState.index;
  el.innerHTML = `
    <button onclick="closeLightbox()" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur z-10"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    <div class="absolute top-4 left-4 z-10 text-white">
      <div class="text-xs opacity-70 uppercase tracking-wider">${l.district} · ${l.khotkhon}</div>
      <div class="text-sm font-medium mt-0.5">${l.rooms} өрөө · ${l.area}м²</div>
    </div>
    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white text-sm bg-white/10 backdrop-blur rounded-full px-3 py-1 num">${i + 1} / ${total}</div>
    <button onclick="lightboxNext(-1)" class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur z-10"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
    <button onclick="lightboxNext(1)" class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur z-10"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
    <div class="max-w-[1200px] max-h-[80vh] w-[92%] aspect-[4/3] bg-cover bg-center bg-no-repeat rounded-lg" style="background-image:url('${photoUrl(l, i, '1600/1200')}')"></div>
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 max-w-[88vw] overflow-x-auto px-4 py-2 rounded-full bg-black/40 backdrop-blur no-scrollbar">
      ${Array.from({ length: Math.min(total, 12) }, (_, k) => `<button onclick="lightboxState.index=${k}; renderLightbox();" class="w-12 h-9 rounded shrink-0 bg-cover bg-center transition" style="background-image:url('${photoUrl(l, k, '160/120')}'); opacity:${k === i ? 1 : 0.45}; outline:${k === i ? '2px solid #fff' : 'none'}; outline-offset:1px;"></button>`).join('')}
    </div>
  `;
}

/* ============== 2. CALENDAR (.ics download) ============== */
function downloadIcs(opts) {
  const { title, location, start, end, description } = opts;
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NEO//Property Viewing//EN',
    'BEGIN:VEVENT',
    'UID:' + Date.now() + '@neo.mn',
    'DTSTAMP:' + fmt(new Date()),
    'DTSTART:' + fmt(start),
    'DTEND:' + fmt(end),
    'SUMMARY:' + title,
    'LOCATION:' + (location || ''),
    'DESCRIPTION:' + (description || ''),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'neo-uzelt.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Календарын файл татагдлаа', 'success');
}

function addBookingToCalendar() {
  const l = getListing(state.currentListingId);
  const today = new Date();
  const fallback = today.getMonth() + 1 + '/' + (today.getDate() + 1);
  const m = (state.scheduleDate || fallback).split('/');
  const [hh, mm] = (state.scheduleTime || '16:00').split(':');
  let year = today.getFullYear();
  const month = parseInt(m[0]) - 1;
  const day = parseInt(m[1]);
  // If chosen month/day is already past this year, roll to next year
  const candidate = new Date(year, month, day, parseInt(hh), parseInt(mm));
  if (candidate.getTime() < today.getTime() - 24 * 60 * 60 * 1000) year += 1;
  const start = new Date(year, month, day, parseInt(hh), parseInt(mm));
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  downloadIcs({
    title: 'Үзэлт: ' + l.khotkhon + ' · ' + l.rooms + ' өрөө',
    location: l.district + ', ' + l.khoroo + '-р хороо',
    start,
    end,
    description: 'NEO-аар товлосон үзэлт. Агент: ' + getAgent(l.agentId).name + ' · ' + getAgent(l.agentId).phone,
  });
}

/* ============== 3. VOUCHER DOWNLOAD ============== */
function openVoucherModal() {
  const l = getListing(state.currentListingId);
  const agent = getAgent(l.agentId);
  const id = 'OR-2026-' + (58721 + l.id);
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Voucher</h3><p class="text-xs text-[#8A93A8] mt-0.5">Хэвлэж эсвэл утсандаа хадгалаарай</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5">
      <div class="border-2 border-dashed border-[#E8E4DA] rounded-lg p-5">
        <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#E8E4DA]">
          <div>
            <div class="text-[10px] uppercase tracking-wider text-[#8A93A8]">VOUCHER</div>
            <div class="num text-lg">#${id}</div>
          </div>
          <div class="text-right">
            <div class="text-[10px] uppercase tracking-wider text-[#8A93A8]">NEO</div>
            <div class="text-xs font-medium">2026.05.21</div>
          </div>
        </div>
        <div class="mb-4">
          <div class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1">Зар</div>
          <div class="font-semibold text-sm">${l.khotkhon} · ${l.rooms} өрөө ${l.area}м²</div>
          <div class="text-xs text-[#4A5874]">${l.district}, ${l.khoroo}-р хороо</div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div><div class="text-[10px] uppercase tracking-wider text-[#8A93A8]">Огноо</div><div class="text-sm font-medium">${state.scheduleDate || '5/20'}</div></div>
          <div><div class="text-[10px] uppercase tracking-wider text-[#8A93A8]">Цаг</div><div class="text-sm font-medium">${state.scheduleTime || '16:00'}</div></div>
        </div>
        <div class="mb-4">
          <div class="text-[10px] uppercase tracking-wider text-[#8A93A8] mb-1">Агент</div>
          <div class="text-sm">${agent.name} · ${agent.phone}</div>
        </div>
        <div class="flex items-center justify-center bg-[#F0EAD9] rounded mt-4 p-3">
          <!-- Fake QR -->
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            ${Array.from({ length: 64 }, (_, i) => {
              const x = (i % 8) * 10,
                y = Math.floor(i / 8) * 10;
              return Math.random() > 0.5 ? `<rect x="${x}" y="${y}" width="10" height="10" fill="#0A1F44"/>` : '';
            }).join('')}
            <rect x="0" y="0" width="30" height="30" fill="none" stroke="#0A1F44" stroke-width="3"/>
            <rect x="50" y="0" width="30" height="30" fill="none" stroke="#0A1F44" stroke-width="3"/>
            <rect x="0" y="50" width="30" height="30" fill="none" stroke="#0A1F44" stroke-width="3"/>
          </svg>
        </div>
        <div class="text-[10px] text-[#8A93A8] text-center mt-2">Агентад үзүүлэхэд хангалттай</div>
      </div>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="window.print()" class="btn btn-secondary"><i data-lucide="printer" class="w-4 h-4"></i> Хэвлэх</button>
      <button onclick="closeModal(); showToast('PDF татагдсан', 'success');" class="btn btn-primary"><i data-lucide="download" class="w-4 h-4"></i> PDF татах</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

/* ============== 4. REVIEW SUBMISSION ============== */
const REVIEWS = []; // user-submitted reviews { listingId, rating, criteria, text, date, author }

function openReviewModal(listingId) {
  const l = getListing(listingId);
  const criteria = [
    ['photos', 'Зурагтай таарсан эсэх'],
    ['cleanliness', 'Цэвэрлэгээ'],
    ['agent', 'Агентын үйлчилгээ'],
    ['location', 'Байршил, хүрэх зам'],
  ];
  openModal(`
    <div class="p-5 border-b border-[#E8E4DA] flex items-center justify-between">
      <div><h3 class="font-semibold text-lg">Бичлэг үлдээх</h3><p class="text-xs text-[#8A93A8] mt-0.5">${l.khotkhon} · ${l.rooms} өрөө ${l.area}м²</p></div>
      <button onclick="closeModal()" class="text-[#8A93A8] hover:text-[#1A1A1A]"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-5">
      <div>
        <div class="eyebrow mb-2">Ерөнхий үнэлгээ</div>
        <div id="review-stars" class="flex items-center gap-1 text-3xl select-none">
          ${[1, 2, 3, 4, 5].map((n) => `<button data-star="${n}" onclick="window.__reviewRating=${n}; document.querySelectorAll('[data-star]').forEach(b=>b.classList.toggle('text-[#C9A35F]', parseInt(b.dataset.star)<=${n})); document.querySelectorAll('[data-star]').forEach(b=>b.classList.toggle('text-[#E4DDC9]', parseInt(b.dataset.star)>${n}));" class="${n <= 4 ? 'text-[#C9A35F]' : 'text-[#E4DDC9]'} hover:scale-110 transition">★</button>`).join('')}
          <span class="text-sm text-[#4A5874] ml-3 font-medium">Маш сайн</span>
        </div>
      </div>

      <div>
        <div class="eyebrow mb-3">Нарийвчилсан үнэлгээ</div>
        <div class="space-y-2.5">
          ${criteria
            .map(
              ([k, label]) => `
            <div class="flex items-center gap-3">
              <span class="text-sm flex-1">${label}</span>
              <div class="flex gap-0.5">
                ${[1, 2, 3, 4, 5].map((n) => `<button class="${n <= 4 ? 'text-[#C9A35F]' : 'text-[#E4DDC9]'} text-lg hover:scale-110 transition">★</button>`).join('')}
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>

      <div>
        <label class="eyebrow mb-2 block">Туршлагаа бичээрэй</label>
        <textarea id="review-text" class="input" rows="4" placeholder="Юу таалагдсан, юу муу байсан, бусад хэрэглэгчдэд ямар зөвлөмж байх вэ?"></textarea>
      </div>

      <label class="flex items-center gap-2 text-xs text-[#4A5874]">
        <input type="checkbox" checked class="accent-[#0A1F44]" />
        Нэрээ нууцлах (зөвхөн "Б. Э." гэх нэр харагдана)
      </label>
    </div>
    <div class="p-4 border-t border-[#E8E4DA] flex gap-2 justify-end bg-[#FAFAF6]">
      <button onclick="closeModal()" class="btn btn-secondary">Цуцлах</button>
      <button onclick="submitReview(${listingId})" class="btn btn-primary"><i data-lucide="send" class="w-4 h-4"></i> Бичлэг илгээх</button>
    </div>
  `);
  setTimeout(() => lucide.createIcons(), 0);
}

function submitReview(listingId) {
  const now = new Date();
  const monthName = now.getFullYear() + ' оны ' + (now.getMonth() + 1) + ' сар';
  const verified = Array.isArray(PAST_VIEWINGS) && PAST_VIEWINGS.some((v) => v.listingId === listingId);
  REVIEWS.push({
    listingId,
    rating: window.__reviewRating || 4,
    text: document.getElementById('review-text')?.value || '',
    author: 'Б. Э.',
    initials: 'БЭ',
    verified,
    date: monthName,
  });
  closeModal();
  showToast('Бичлэг илгээгдлээ · Талархлаа', 'success');
}

/* ============== 5. REVIEWS SECTION (renderer) ============== */
const SAMPLE_REVIEWS = [
  {
    author: 'Ц. С.',
    initials: 'ЦС',
    rating: 4.8,
    date: '2026 оны 4 сар',
    verified: true,
    text: 'Зурагтай яг таарсан. Гэрэлтэй цэвэрхэн байр. Агент Эрдэнэбаатар маш найрсаг, цаг гарган тайлбарласан. Энэ хороололд эрж хайж байгаа хүмүүст санал болгож байна.',
    helpful: 12,
  },
  {
    author: 'О. Б.',
    initials: 'ОБ',
    rating: 4.5,
    date: '2026 оны 3 сар',
    verified: true,
    text: 'Орчны чимээ багатай, хүүхдийн сургуультай ойр. Цонх хуучирсан байсан учир тав тухтай биш юм. Үнэдээ тохирно.',
    helpful: 8,
  },
  {
    author: 'Г. М.',
    initials: 'ГМ',
    rating: 5.0,
    date: '2026 оны 3 сар',
    verified: false,
    text: 'Дотор нь шинээр заслагдсан, гал тогоо том. Тавилгатай орох боломжтой нь онцлог.',
    helpful: 4,
  },
];

function renderReviewsSection(listingId) {
  const userReviews = REVIEWS.filter((r) => r.listingId === listingId);
  const all = [
    ...userReviews.map((r) => ({
      ...r,
      initials:
        r.initials ||
        (r.author || '')
          .split(/\s+/)
          .map((w) => w[0] || '')
          .join('')
          .replace(/\./g, '')
          .slice(0, 2)
          .toUpperCase(),
      verified: r.verified === true,
    })),
    ...SAMPLE_REVIEWS,
  ];
  const avg = (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1);
  return `
    <div class="card p-5 mb-5">
      <div class="flex items-center justify-between mb-4">
        <div class="eyebrow">Хэрэглэгчдийн сэтгэгдэл</div>
        <span class="text-xs text-[#8A93A8]">${all.length} бичлэг</span>
      </div>

      <div class="flex items-center gap-5 mb-5 pb-5 border-b border-[#E8E4DA]">
        <div class="text-center">
          <div class="num text-4xl text-[#0A1F44]">${avg}</div>
          <div class="text-[#C9A35F] text-sm mt-1">★★★★★</div>
          <div class="text-[10px] text-[#8A93A8] mt-1 uppercase tracking-wider">${all.length} бичлэг</div>
        </div>
        <div class="flex-1 space-y-1.5">
          ${[5, 4, 3, 2, 1]
            .map((n) => {
              const count = all.filter((r) => Math.round(r.rating) === n).length;
              const pct = all.length ? (count / all.length) * 100 : 0;
              return `<div class="flex items-center gap-2 text-xs">
              <span class="w-2 text-[#4A5874]">${n}</span>
              <span class="text-[#C9A35F]">★</span>
              <div class="flex-1 h-1.5 rounded-full bg-[#F0EAD9] overflow-hidden"><div style="width:${pct}%; background: var(--primary);" class="h-full"></div></div>
              <span class="w-6 text-right num text-[#8A93A8]">${count}</span>
            </div>`;
            })
            .join('')}
        </div>
      </div>

      <div class="space-y-4">
        ${all
          .slice(0, 3)
          .map(
            (r) => `
          <div class="flex gap-3">
            <div class="w-10 h-10 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0" style="background: linear-gradient(135deg, #0A1F44 0%, #051028 100%);">${r.initials}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="font-semibold text-sm">${r.author}</span>
                ${r.verified ? '<span class="pill pill-verified !text-[10px]">Үзэлт хийсэн</span>' : ''}
                <span class="text-[#C9A35F] text-xs">${'★'.repeat(Math.round(r.rating))}</span>
                <span class="text-[11px] text-[#8A93A8] ml-auto">${r.date}</span>
              </div>
              <p class="text-sm text-[#4A5874] leading-relaxed">${r.text}</p>
              ${
                r.helpful
                  ? `<div class="flex items-center gap-3 mt-2 text-[11px] text-[#8A93A8]">
                <button class="hover:text-[#1A1A1A] flex items-center gap-1"><i data-lucide="thumbs-up" class="w-3 h-3"></i> Хэрэгтэй (${r.helpful})</button>
              </div>`
                  : ''
              }
            </div>
          </div>
        `,
          )
          .join('')}
      </div>

      <button onclick="openReviewModal(${listingId})" class="btn btn-secondary w-full mt-5"><i data-lucide="pencil" class="w-4 h-4"></i> Сэтгэгдэл бичих</button>
    </div>
  `;
}

/* ============== 6. PROPERTY COMPARISON ============== */
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
const PLACE_SCALE_KM = 20; // 1 нэгж ≈ 20 км
const WALK_KMH = 4.5; // явган хурд
const DRIVE_KMH = 25; // хотын дундаж жолоо хурд (түгжрэлтэй)

const PLACE_KINDS = {
  home: { label: 'Гэр', icon: 'home', color: '#4DD09E' },
  work: { label: 'Ажил', icon: 'briefcase', color: '#0A1F44' },
  school: { label: 'Сургууль', icon: 'graduation-cap', color: '#C9A35F' },
  kindergarten: { label: 'Цэцэрлэг', icon: 'baby', color: '#F59E0B' },
  other: { label: 'Бусад', icon: 'map-pin', color: '#5FD4E5' },
};

// Тухайн kind-ын одоо хадгалагдсан тоо.
function placesByKindCount(kind) {
  return (state.myPlaces || []).filter((p) => p.kind === kind).length;
}

function placeKindMeta(kind) {
  return PLACE_KINDS[kind] || PLACE_KINDS.other;
}

function placeDistanceKm(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy) * PLACE_SCALE_KM;
}

function placeTravel(km) {
  return {
    km,
    walkMin: Math.max(1, Math.round((km / WALK_KMH) * 60)),
    driveMin: Math.max(1, Math.round((km / DRIVE_KMH) * 60)),
  };
}

/* ---- CRUD ---- */
function addOrUpdatePlace(p) {
  state.myPlaces = state.myPlaces || [];
  if (p.id) {
    const idx = state.myPlaces.findIndex((x) => x.id === p.id);
    if (idx >= 0) state.myPlaces[idx] = { ...state.myPlaces[idx], ...p };
  } else {
    const id = 'pl-' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
    state.myPlaces.push({ id, kind: p.kind || 'other', label: p.label || 'Газар', lat: p.lat, lng: p.lng });
  }
  saveMyPlaces();
}

function removePlace(id) {
  state.myPlaces = (state.myPlaces || []).filter((p) => p.id !== id);
  saveMyPlaces();
  showToast('Газар устгагдлаа', 'info', { duration: 1500 });
  if (currentScreen === 'property') {
    renderAppScreen('property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.removePlace = removePlace;

/* ============== PLACE PICKER MODAL ============== */
function openPlacePicker(editId) {
  const existing = editId ? (state.myPlaces || []).find((p) => p.id === editId) : null;
  // Шинэ газар нэмэхэд хоосон kind-ийг урьтал болгож тавина — гэр, ажил, сургууль, цэцэрлэг.
  // Бүгд хадгалагдсан байвал 'work' дээр зогсоно (хамгийн их давтагдах хандлагатай).
  const existingKinds = new Set((state.myPlaces || []).map((p) => p.kind));
  const defaultKind = !existingKinds.has('home')
    ? 'home'
    : !existingKinds.has('work')
      ? 'work'
      : !existingKinds.has('school')
        ? 'school'
        : !existingKinds.has('kindergarten')
          ? 'kindergarten'
          : 'work';
  state.placePicker = existing
    ? { editId: existing.id, kind: existing.kind, label: existing.label, lat: existing.lat, lng: existing.lng }
    : { editId: null, kind: defaultKind, label: '', lat: null, lng: null };
  renderPlacePickerModal();
}
window.openPlacePicker = openPlacePicker;

function renderPlacePickerModal() {
  const pp = state.placePicker || { kind: 'home', label: '', lat: null, lng: null };
  const kindBtns = Object.entries(PLACE_KINDS)
    .map(([k, m]) => {
      const sel = pp.kind === k;
      const cnt = placesByKindCount(k) - (pp.editId && pp.kind === k ? 1 : 0);
      const badge =
        cnt > 0
          ? `<span style="position:absolute; top:4px; right:4px; min-width:16px; height:16px; padding:0 4px; border-radius:8px; background:${sel ? 'rgba(255,255,255,.25)' : 'var(--surface-2)'}; color:${sel ? '#fff' : 'var(--text-3)'}; font-size:10px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; line-height:1;">${cnt}</span>`
          : '';
      const baseStyle = sel
        ? `background:${m.color}; color:#fff; border:1px solid ${m.color};`
        : 'background:var(--surface); color:var(--text-2); border:1px solid var(--border);';
      return `<button onclick="setPlacePickerKind('${k}')" class="relative flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition" style="${baseStyle}">
      ${badge}
      <i data-lucide="${m.icon}" class="w-[18px] h-[18px]"></i>
      <span>${m.label}</span>
    </button>`;
    })
    .join('');

  const hasPoint = pp.lat != null && pp.lng != null;
  const existingPlaces = state.myPlaces || [];
  const sameKindCount =
    placesByKindCount(pp.kind) -
    (pp.editId && pp.kind === (existingPlaces.find((p) => p.id === pp.editId) || {}).kind ? 1 : 0);
  const labelRequired = sameKindCount > 0;
  const labelPlaceholder =
    pp.kind === 'home'
      ? sameKindCount > 0
        ? 'ж: Аав ээжийнх'
        : 'ж: Манай гэр'
      : pp.kind === 'work'
        ? sameKindCount > 0
          ? 'ж: Эхнэрийн ажил'
          : 'ж: Миний оффис'
        : pp.kind === 'school'
          ? sameKindCount > 0
            ? 'ж: Дүүгийн сургууль'
            : 'ж: Хүүгийн сургууль'
          : pp.kind === 'kindergarten'
            ? sameKindCount > 0
              ? 'ж: Дунд хүүгийн цэцэрлэг'
              : 'ж: Том хүүгийн цэцэрлэг'
            : 'ж: Эмнэлэг, эцэг эх...';

  openModal(
    `
    <div class="px-5 py-4 border-b flex items-center justify-between" style="border-color: var(--border);">
      <h3 class="font-semibold text-base">${pp.editId ? 'Байршил засах' : 'Байршил нэмэх'}</h3>
      <button onclick="closePlacePicker()" class="hover:opacity-70" style="color: var(--text-3);"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-2);">Төрөл</div>
        <div class="grid grid-cols-5 gap-2">${kindBtns}</div>
      </div>
      <div>
        <div class="text-xs font-semibold mb-2" style="color: var(--text-2);">
          Нэр ${
            labelRequired
              ? `<span style="color: var(--danger); font-weight: 600;">*</span>`
              : `<span style="color: var(--text-3); font-weight: 400;">(заавал биш)</span>`
          }
        </div>
        <input id="pp-label" type="text" value="${(pp.label || '').replace(/"/g, '&quot;')}" placeholder="${labelPlaceholder}"
               oninput="state.placePicker.label = this.value; window.__refreshPickerSaveBtn && window.__refreshPickerSaveBtn();"
               class="input" style="${labelRequired && !(pp.label || '').trim() ? 'border-color: var(--danger);' : ''}" />
      </div>
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold" style="color: var(--text-2);">Байршил</div>
          <button onclick="useMyLocationForPicker()" class="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--surface-2)] transition" style="color: var(--primary);">
            <i data-lucide="crosshair" class="w-3.5 h-3.5"></i> Миний байршил
          </button>
        </div>
        <div class="rounded-lg overflow-hidden" style="height: 320px; position: relative; border: 1px solid var(--border);">
          <div id="leaflet-place-picker" style="position:absolute; inset:0; z-index: 1;"></div>
        </div>
        <div id="picker-status" class="text-xs mt-2 flex items-center gap-1.5" style="color: ${hasPoint ? 'var(--success)' : 'var(--text-3)'};">
          <i data-lucide="${hasPoint ? 'check-circle-2' : 'map-pin'}" class="w-3.5 h-3.5"></i>
          <span>${hasPoint ? 'Байршил сонгогдсон' : 'Газрын зураг дээр товшиж байршлаа тогтооно уу'}</span>
        </div>
      </div>
    </div>
    <div class="px-5 py-3 border-t flex gap-2 items-center" style="border-color: var(--border);">
      ${pp.editId ? `<button onclick="confirmRemovePlace('${pp.editId}')" class="text-xs inline-flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-[var(--surface-2)]" style="color: var(--danger);"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Устгах</button>` : ''}
      <div class="flex-1"></div>
      <button onclick="closePlacePicker()" class="btn btn-secondary !py-2 !px-4 !text-sm">Цуцлах</button>
      <button id="picker-save-btn" data-label-required="${labelRequired ? '1' : ''}" onclick="savePlacePicker()" class="btn btn-primary !py-2 !px-4 !text-sm" ${hasPoint && !(labelRequired && !(pp.label || '').trim()) ? '' : 'style="opacity:.5; pointer-events:none;"'}>Хадгалах</button>
    </div>
  `,
    'lg',
  );
  setTimeout(() => lucide.createIcons(), 0);
  setTimeout(() => initPlacePickerLeafletMap(), 30);
}
// Label оруулах үед save товчны идэвхтэй байдлыг шинэчилнэ.
window.__refreshPickerSaveBtn = function () {
  const btn = document.getElementById('picker-save-btn');
  if (!btn) return;
  const pp = state.placePicker || {};
  const labelRequired = btn.dataset.labelRequired === '1';
  const hasPoint = pp.lat != null && pp.lng != null;
  const labelOK = !labelRequired || !!(pp.label || '').trim();
  if (hasPoint && labelOK) {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  } else {
    btn.style.opacity = '.5';
    btn.style.pointerEvents = 'none';
  }
  // input border-ыг улаан/энгийн болгож шинэчлэх
  const input = document.getElementById('pp-label');
  if (input && labelRequired) {
    input.style.borderColor = (pp.label || '').trim() ? 'var(--border)' : 'var(--danger)';
  }
};
window.renderPlacePickerModal = renderPlacePickerModal;

let placePickerMap = null;
let placePickerMarker = null;
let placePickerSetMarker = null;

function placePickerBounds(pad = 0) {
  return [
    [UB_BOUNDS.latMin - pad, UB_BOUNDS.lngMin - pad],
    [UB_BOUNDS.latMax + pad, UB_BOUNDS.lngMax + pad],
  ];
}

function clampRealLatLngToUb(lat, lng) {
  return {
    lat: Math.max(UB_BOUNDS.latMin, Math.min(UB_BOUNDS.latMax, lat)),
    lng: Math.max(UB_BOUNDS.lngMin, Math.min(UB_BOUNDS.lngMax, lng)),
  };
}

function destroyPlacePickerLeafletMap() {
  if (placePickerMap) {
    try {
      placePickerMap.remove();
    } catch (e) {}
  }
  placePickerMap = null;
  placePickerMarker = null;
  placePickerSetMarker = null;
}

function initPlacePickerLeafletMap() {
  if (typeof L === 'undefined') return;
  const el = document.getElementById('leaflet-place-picker');
  if (!el) return;
  destroyPlacePickerLeafletMap();

  const pp = state.placePicker || {};
  placePickerMap = L.map(el, {
    zoomControl: true,
    attributionControl: false,
    minZoom: 11,
    maxZoom: 18,
    maxBounds: placePickerBounds(0.02),
    maxBoundsViscosity: 0.9,
  }).setView(UB_CENTER, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(placePickerMap);

  function setMarkerAt(realLat, realLng) {
    const ppk = state.placePicker;
    if (!ppk) return;
    const clamped = clampRealLatLngToUb(realLat, realLng);
    const norm = realLatLngToNormalized(clamped.lat, clamped.lng);
    ppk.lat = norm.x;
    ppk.lng = norm.y;
    const lbl = document.getElementById('pp-label');
    if (lbl) ppk.label = lbl.value;
    const meta = placeKindMeta(ppk.kind);
    if (placePickerMarker) {
      placePickerMap.removeLayer(placePickerMarker);
    }
    const icon = L.divIcon({
      className: 'leaflet-marker-icon-wrap',
      html: `<div style="background:${meta.color}; color:#fff; padding:8px 14px; border-radius:999px; font-size:12px; font-weight:700; box-shadow:0 6px 18px rgba(0,0,0,.5); display:inline-flex; align-items:center; gap:6px; white-space:nowrap; transform:translate(-50%,-110%); border: 3px solid #fff; animation: pickerPulse 1.4s ease-in-out infinite;">
        <i data-lucide="${meta.icon}" style="width:14px; height:14px;"></i> ${(ppk.label && ppk.label.trim()) || meta.label}
      </div>`,
      iconSize: null,
      iconAnchor: [0, 0],
    });
    placePickerMarker = L.marker([clamped.lat, clamped.lng], { icon }).addTo(placePickerMap);
    // Status шинэчилнэ — байршил тогтоогдсон гэж заана
    const status = document.getElementById('picker-status');
    if (status) {
      status.style.color = 'var(--success)';
      status.innerHTML = `<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Байршил сонгогдсон</span>`;
    }
    setTimeout(() => {
      try {
        if (window.lucide) lucide.createIcons();
      } catch (e) {}
    }, 0);
    if (window.__refreshPickerSaveBtn) window.__refreshPickerSaveBtn();
  }

  placePickerSetMarker = setMarkerAt;

  if (pp.lat != null && pp.lng != null) {
    const [rLat, rLng] = listingToLatLng({ lat: pp.lat, lng: pp.lng });
    setMarkerAt(rLat, rLng);
    placePickerMap.setView([rLat, rLng], 14, { animate: false });
  }
  placePickerMap.on('click', (ev) => {
    setMarkerAt(ev.latlng.lat, ev.latlng.lng);
  });

  setTimeout(() => {
    try {
      if (placePickerMap) placePickerMap.invalidateSize();
    } catch (e) {}
  }, 50);
}
window.initPlacePickerLeafletMap = initPlacePickerLeafletMap;
window.destroyPlacePickerLeafletMap = destroyPlacePickerLeafletMap;

function useMyLocationForPicker() {
  if (!navigator.geolocation) {
    showToast('Энэ хөтөч геолокаци дэмждэггүй', 'warning');
    return;
  }
  showToast('Байршил хайж байна…', 'info', { duration: 1200 });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (
        latitude < UB_BOUNDS.latMin - 0.5 ||
        latitude > UB_BOUNDS.latMax + 0.5 ||
        longitude < UB_BOUNDS.lngMin - 0.5 ||
        longitude > UB_BOUNDS.lngMax + 0.5
      ) {
        showToast('Та одоо УБ-аас гадна байгаа бололтой. Газрын зураг дээр гараар сонгоно уу.', 'warning', {
          duration: 3000,
        });
        return;
      }
      if (placePickerMap && placePickerSetMarker) {
        const clamped = clampRealLatLngToUb(latitude, longitude);
        placePickerMap.setView([clamped.lat, clamped.lng], 15);
        placePickerSetMarker(clamped.lat, clamped.lng);
      }
    },
    (err) => {
      const msg = err.code === 1 ? 'Та байршил хуваалцах зөвшөөрөл өгөөгүй' : 'Байршил тогтоох амжилтгүй';
      showToast(msg, 'error', { duration: 2500 });
    },
    { enableHighAccuracy: true, timeout: 8000 },
  );
}
window.useMyLocationForPicker = useMyLocationForPicker;

/* ============== ONBOARDING — анх орох хэрэглэгчид ============== */
const ONBOARD_DISMISSED_KEY = 'orloo.onboardingDismissed.v1';

const ONBOARD_KINDS = ['work', 'school', 'kindergarten', 'home'];

function onboardRemainingKinds() {
  return ONBOARD_KINDS.filter((k) => placesByKindCount(k) === 0);
}

function shouldShowOnboarding() {
  if (typeof window !== 'undefined' && window.__SKIP_ONBOARD__) return false;
  try {
    const href = typeof location !== 'undefined' ? location.href || '' : '';
    const search = typeof location !== 'undefined' ? location.search || '' : '';
    const hash = typeof location !== 'undefined' ? location.hash || '' : '';
    if (/noOnboard|skipOnboard/i.test(href + search + hash)) return false;
  } catch (e) {}
  try {
    if (localStorage.getItem(ONBOARD_DISMISSED_KEY)) return false;
  } catch (e) {}
  if (onboardRemainingKinds().length === 0) return false;
  return true;
}

function maybeShowOnboarding() {
  if (!shouldShowOnboarding()) return;
  if (document.getElementById('onboard-modal-root')) return;
  setTimeout(() => {
    if (shouldShowOnboarding() && !document.getElementById('onboard-modal-root')) renderOnboardingModal();
  }, 400);
}
window.maybeShowOnboarding = maybeShowOnboarding;

function renderOnboardingModal() {
  if (document.getElementById('onboard-modal-root')) return;
  const remaining = onboardRemainingKinds();
  if (remaining.length === 0) return;

  const ONBOARD_ROW_META = {
    work: { icon: 'briefcase', title: 'Ажлын байршил', desc: 'Гэрээс ажил хүртэлх зайг тооцоолно' },
    school: { icon: 'graduation-cap', title: 'Хүүхдийн сургууль', desc: 'Олон сургууль нэмэх боломжтой' },
    kindergarten: { icon: 'baby', title: 'Цэцэрлэг', desc: 'Бага насны хүүхдийн цэцэрлэгийн байршил' },
    home: { icon: 'home', title: 'Одоогийн оршин суух газар', desc: 'Шилжих санал өгөхөд хэрэг болно' },
  };

  const rowsHtml = remaining
    .map((k) => {
      const meta = ONBOARD_ROW_META[k];
      return `
        <button class="onboard-kind-row" onclick="onboardStart('${k}')">
          <div class="onboard-kind-icon" style="background:${PLACE_KINDS[k].color};">
            <i data-lucide="${meta.icon}" style="width:20px;height:20px;"></i>
          </div>
          <div class="onboard-kind-text">
            <div class="onboard-kind-title">${meta.title}</div>
            <div class="onboard-kind-desc">${meta.desc}</div>
          </div>
          <i data-lucide="chevron-right" class="onboard-kind-arrow" style="width:16px;height:16px;"></i>
        </button>`;
    })
    .join('');

  const root = document.createElement('div');
  root.id = 'onboard-modal-root';
  root.className = 'onboard-modal';
  root.addEventListener('click', (e) => {
    if (e.target === root) onboardSkip();
  });
  root.innerHTML = `
    <div class="onboard-card" onclick="event.stopPropagation()">
      <div class="onboard-hero">
        <button onclick="onboardSkip()" aria-label="Хаах" class="onboard-close"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
        <div class="onboard-hero-icon">
          <i data-lucide="map-pinned" style="width:22px;height:22px;"></i>
        </div>
        <div class="onboard-title">Тавтай морил</div>
        <div class="onboard-subtitle">Танд тохирох гэрийг олоход туслахын тулд хэдхэн зүйл асууя</div>
      </div>
      <div class="onboard-body">
        <p class="onboard-intro">
          Та <strong>ажил</strong> болон <strong>хүүхдийн сургуулийн</strong> байршлыг оруулбал, бид танд тохирох <strong>гэрийг</strong> ойролцоо талбайгаас санал болгоно.
        </p>
        ${rowsHtml}
      </div>
      <div class="onboard-footer">
        <button class="onboard-skip" onclick="onboardSkip()">Дараа нь</button>
        <span class="onboard-tip"><i data-lucide="clock" style="width:11px;height:11px;"></i> ~30 секунд</span>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  setTimeout(() => {
    try {
      lucide.createIcons();
    } catch (e) {}
  }, 0);
}
window.renderOnboardingModal = renderOnboardingModal;

function onboardStart(kind) {
  closeOnboardingModal();
  state.placePicker = { editId: null, kind, label: '', lat: null, lng: null, source: 'onboarding' };
  renderPlacePickerModal();
}
window.onboardStart = onboardStart;

function onboardSkip() {
  try {
    localStorage.setItem(ONBOARD_DISMISSED_KEY, '1');
  } catch (e) {}
  closeOnboardingModal();
}
window.onboardSkip = onboardSkip;

function closeOnboardingModal() {
  document.querySelectorAll('#onboard-modal-root').forEach((el) => el.remove());
}
window.closeOnboardingModal = closeOnboardingModal;

function showPlaceSuccessBanner(label, meta, isEdit) {
  const id = 'place-success-banner';
  const old = document.getElementById(id);
  if (old) old.remove();
  const banner = document.createElement('div');
  banner.id = id;
  banner.style.cssText = `
    position: fixed; top: 84px; left: 50%; transform: translateX(-50%) translateY(-20px);
    z-index: 9999; opacity: 0;
    background: linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%);
    color: #fff; padding: 14px 20px; border-radius: 14px;
    box-shadow: 0 12px 40px ${meta.color}88, 0 4px 12px rgba(0,0,0,.3);
    display: flex; align-items: center; gap: 14px;
    min-width: 320px; max-width: 90vw;
    font-size: 14px; font-weight: 600;
    border: 2px solid rgba(255,255,255,.25);
    transition: transform .35s cubic-bezier(.2,.9,.3,1.2), opacity .25s;
  `;
  banner.innerHTML = `
    <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.22); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
      <i data-lucide="check" style="width: 22px; height: 22px;"></i>
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-size: 15px; font-weight: 800; letter-spacing: -0.01em;">${isEdit ? 'Шинэчлэгдлээ!' : 'Амжилттай нэмэгдлээ!'}</div>
      <div style="font-size: 12px; opacity: .9; margin-top: 2px;">
        <i data-lucide="${meta.icon}" style="width:12px; height:12px; display:inline; vertical-align:-2px;"></i>
        ${meta.label} · <strong>${label}</strong>
      </div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.18); border:0; color:#fff; width:28px; height:28px; border-radius:50%; cursor:pointer; flex-shrink:0;">
      <i data-lucide="x" style="width: 14px; height: 14px;"></i>
    </button>
  `;
  document.body.appendChild(banner);
  setTimeout(() => {
    try {
      lucide.createIcons();
    } catch (e) {}
  }, 0);
  requestAnimationFrame(() => {
    banner.style.transform = 'translateX(-50%) translateY(0)';
    banner.style.opacity = '1';
  });
  setTimeout(() => {
    if (!document.getElementById(id)) return;
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => banner.remove(), 350);
  }, 3500);
}
window.showPlaceSuccessBanner = showPlaceSuccessBanner;

function confirmRemovePlace(id) {
  if (confirm('Энэ газрыг устгах уу?')) {
    removePlace(id);
    closePlacePicker();
    if (currentScreen === 'home') {
      renderAppScreen('home');
    }
  }
}
window.confirmRemovePlace = confirmRemovePlace;

function realLatLngToNormalized(lat, lng) {
  // inverse of listingToLatLng — clamp to 0..1
  const y = (UB_BOUNDS.latMax - lat) / (UB_BOUNDS.latMax - UB_BOUNDS.latMin);
  const x = (lng - UB_BOUNDS.lngMin) / (UB_BOUNDS.lngMax - UB_BOUNDS.lngMin);
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}
window.realLatLngToNormalized = realLatLngToNormalized;

function setPlacePickerKind(kind) {
  if (!state.placePicker) return;
  state.placePicker.kind = kind;
  renderPlacePickerModal();
}
window.setPlacePickerKind = setPlacePickerKind;

function onPlacePickerMapClick(ev) {
  ev.stopPropagation();
  const rect = ev.currentTarget.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width; // lat (0..1)
  const y = (ev.clientY - rect.top) / rect.height; // lng (0..1)
  if (!state.placePicker) state.placePicker = { kind: 'work', label: '', lat: null, lng: null };
  state.placePicker.lat = Math.max(0, Math.min(1, x));
  state.placePicker.lng = Math.max(0, Math.min(1, y));
  // input-ийн утгыг хадгал
  const lbl = document.getElementById('pp-label');
  if (lbl) state.placePicker.label = lbl.value;
  renderPlacePickerModal();
}
window.onPlacePickerMapClick = onPlacePickerMapClick;

function savePlacePicker() {
  const pp = state.placePicker;
  if (!pp) return;
  const lbl = document.getElementById('pp-label');
  if (lbl) pp.label = lbl.value;
  if (pp.lat == null || pp.lng == null) {
    showToast('Газрын зураг дээр товшиж байршил сонгоно уу', 'warning');
    return;
  }
  // Ижил kind-аас аль хэдийн нэг буюу хэд хэдийг хадгалсан байвал нэр заавал
  // — нэр өгөхгүй бол "Ажил", "Ажил" хоёр ялгагдахгүй болно.
  const existingPlaces = state.myPlaces || [];
  const sameKindCount = existingPlaces.filter((p) => p.kind === pp.kind && p.id !== pp.editId).length;
  const trimmedLabel = (pp.label || '').trim();
  if (sameKindCount > 0 && !trimmedLabel) {
    showToast(`Энэ "${placeKindMeta(pp.kind).label}" төрлөөс өөр газартай ялгах нэр оруулна уу`, 'warning');
    if (lbl) lbl.focus();
    return;
  }
  if (!trimmedLabel) {
    pp.label = placeKindMeta(pp.kind).label;
  }
  const isEdit = !!pp.editId;
  const meta = placeKindMeta(pp.kind);
  addOrUpdatePlace({ id: pp.editId, kind: pp.kind, label: pp.label.trim(), lat: pp.lat, lng: pp.lng });
  closePlacePicker();
  showPlaceSuccessBanner(pp.label.trim(), meta, isEdit);
  if (currentScreen === 'home') {
    renderAppScreen('home');
    setTimeout(() => lucide.createIcons(), 0);
  } else if (currentScreen === 'property') {
    renderAppScreen('property');
    setTimeout(() => lucide.createIcons(), 0);
  }
}
window.savePlacePicker = savePlacePicker;

function closePlacePicker() {
  const wasFromOnboarding = !!(state.placePicker && state.placePicker.source === 'onboarding');
  state.placePicker = null;
  destroyPlacePickerLeafletMap();
  closeModal({ skipPlacePicker: true });
  if (wasFromOnboarding && shouldShowOnboarding()) {
    setTimeout(() => renderOnboardingModal(), 50);
  }
}
window.closePlacePicker = closePlacePicker;

/* ============== COMMUTE CARD — property page ============== */
function renderMyPlacesCommute(l) {
  const places = state.myPlaces || [];
  const header = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-semibold flex items-center gap-2">
        <i data-lucide="route" class="w-4 h-4" style="color: var(--gold-brand);"></i>
        Миний газруудаас энэ үл хөдлөх хүртэлх зай & хугацаа
      </h3>
      ${places.length ? `<button onclick="openPlacePicker()" class="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-2)]" style="color: var(--gold-brand);" title="Олон ажил/сургууль/цэцэрлэг нэр өгөөд нэмж болно"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Газар нэмэх</button>` : ''}
    </div>`;

  if (!places.length) {
    return `
    <div>
      ${header}
      <div class="card p-6 text-center" style="border: 1px dashed var(--gold-brand); background: linear-gradient(135deg, rgba(201,163,95,.05) 0%, transparent 100%);">
        <div class="mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center" style="background: var(--gold-brand); color: #0A1F44;">
          <i data-lucide="map-pinned" class="w-7 h-7"></i>
        </div>
        <div class="text-sm font-semibold mb-1">Гэр, ажил, сургуулиа нэмбэл хэдэн минут хол байгааг харна</div>
        <p class="text-xs mb-4" style="color: var(--text-3); max-width: 420px; margin-left: auto; margin-right: auto;">
          Та өөрийн гэр, ажил, хүүхдийн сургууль, цэцэрлэгийн байршлуудыг газрын зурагт тэмдэглэвэл — энэ үл хөдлөх хүртэл алхаж хэдэн минут, машинаар хэдэн минут зарцуулахыг тооцон харуулна. Олон ажил/сургууль/цэцэрлэгийг тус бүрд нь нэр өгөөд нэмж болно.
        </p>
        <button onclick="openPlacePicker()" class="bm-btn-gold !text-xs"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Эхний газраа нэмэх</button>
      </div>
    </div>`;
  }

  const rows = places
    .map((p) => {
      const meta = placeKindMeta(p.kind);
      const km = placeDistanceKm(p, l);
      const t = placeTravel(km);
      const kmTxt = km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
      return `
      <div class="card p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background:${meta.color}; color:#fff;">
          <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold truncate">${p.label}</div>
          <div class="text-[11px]" style="color: var(--text-3);">${meta.label} · <span class="num">${kmTxt}</span></div>
        </div>
        <div class="flex items-center gap-3 text-center shrink-0">
          <div class="px-3 py-1.5 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border); min-width: 78px;">
            <div class="flex items-center justify-center gap-1.5 text-[10px] mb-0.5" style="color: var(--text-3);">
              <i data-lucide="footprints" class="w-3 h-3"></i> Алхаж
            </div>
            <div class="num text-sm font-semibold">${t.walkMin} мин</div>
          </div>
          <div class="px-3 py-1.5 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border); min-width: 78px;">
            <div class="flex items-center justify-center gap-1.5 text-[10px] mb-0.5" style="color: var(--text-3);">
              <i data-lucide="car" class="w-3 h-3"></i> Машинаар
            </div>
            <div class="num text-sm font-semibold">${t.driveMin} мин</div>
          </div>
        </div>
        <button onclick="openPlacePicker('${p.id}')" class="p-2 rounded-md hover:bg-[var(--surface-2)] shrink-0" title="Засах" style="color: var(--text-3);">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
      </div>
    `;
    })
    .join('');

  return `
    <div>
      ${header}
      <div class="space-y-2.5">${rows}</div>
      <div class="text-[10px] mt-2" style="color: var(--text-3);">
        <i data-lucide="info" class="w-3 h-3 inline"></i>
        Тооцоолол: алхах ${WALK_KMH} км/ц · машин ${DRIVE_KMH} км/ц (хотын дундаж). Тоо нь ойролцоо утга.
      </div>
    </div>
  `;
}
window.renderMyPlacesCommute = renderMyPlacesCommute;

/* ============== LEAFLET REAL MAP (home-map-hero only) ==============
   Listings нь одоогоор normalized 0–1 lat/lng-тэй (синтетик газрын зураг).
   Эдгээрийг УБ хотын жинхэнэ хязгаар руу map хийж жинхэнэ OSM tile дээр
   pin байрлуулна. Бусад дэлгэц (results, property) синтетик map хэвээр. */

const UB_BOUNDS = { latMin: 47.875, latMax: 47.965, lngMin: 106.82, lngMax: 107.04 };
const UB_CENTER = [47.918, 106.917];

function listingToLatLng(l) {
  /* Хуучин l.lat (0–1) → зүүн/баруун (lng), l.lng (0–1) → дээш/доош (lat).
     y=0 нь дээд тал, харин жинхэнэ газарт хойшоо lat-аар их утга. */
  const lat = UB_BOUNDS.latMax - l.lng * (UB_BOUNDS.latMax - UB_BOUNDS.latMin);
  const lng = UB_BOUNDS.lngMin + l.lat * (UB_BOUNDS.lngMax - UB_BOUNDS.lngMin);
  return [lat, lng];
}
window.listingToLatLng = listingToLatLng;

let homeLeafletMap = null;
let homeLeafletMarkers = [];
let homeLeafletListingMarkers = [];
let homeLeafletMapEl = null;
let homeLeafletReclusterTimer = null;

function rectsIntersect(a, b, gap = 0) {
  return !(a.right + gap <= b.left || a.left - gap >= b.right || a.bottom + gap <= b.top || a.top - gap >= b.bottom);
}

function declutterHomeLeafletMarkers(items, el) {
  if (!homeLeafletMap || !items.length) return;
  // Маркер бүрийг эхлээд жинхэнэ lat/lng дээр нь буцаана — өмнөх declutter-аас үлдсэн
  // шилжүүлэлт zoom/pan-ы дараа маркеруудыг газартаа хазайлгадаг.
  items.forEach((item) => {
    if (item.base) item.marker.setLatLng(item.base);
  });
  const mapRect = el.getBoundingClientRect();
  const markerW = 126;
  const markerH = 44;
  const pad = 8;
  const blockers = [
    ...document.querySelectorAll('.home-ai-panel:not(.collapsed), .home-stats-strip, .home-topbar, .qf-bar'),
  ]
    .filter((node) => getComputedStyle(node).display !== 'none')
    .map((node) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
  const offsets = [[0, 0]];
  for (let ring = 1; ring <= 6; ring++) {
    const radius = ring * 54;
    const steps = ring === 1 ? 8 : 12;
    for (let i = 0; i < steps; i++) {
      const angle = (Math.PI * 2 * i) / steps;
      offsets.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
  }
  const placed = [];
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  sorted.forEach((item) => {
    const base = homeLeafletMap.latLngToContainerPoint(item.base);
    let chosen = null;
    for (const [dx, dy] of offsets) {
      const x = base.x + dx;
      const y = base.y + dy;
      const rect = {
        left: mapRect.left + x - markerW / 2,
        right: mapRect.left + x + markerW / 2,
        top: mapRect.top + y - markerH / 2,
        bottom: mapRect.top + y + markerH / 2,
      };
      const inMap =
        rect.left >= mapRect.left + pad &&
        rect.right <= mapRect.right - pad &&
        rect.top >= mapRect.top + pad &&
        rect.bottom <= mapRect.bottom - pad;
      if (!inMap) continue;
      const hitsUi = blockers.some((b) => rectsIntersect(rect, b, 6));
      const hitsPin = placed.some((p) => rectsIntersect(rect, p, 6));
      if (!hitsUi && !hitsPin) {
        chosen = { x, y, rect };
        break;
      }
    }
    if (chosen) {
      item.marker.setLatLng(homeLeafletMap.containerPointToLatLng(L.point(chosen.x, chosen.y)));
      placed.push(chosen.rect);
    }
  });
}

function destroyHomeLeafletMap() {
  if (homeLeafletReclusterTimer) {
    clearTimeout(homeLeafletReclusterTimer);
    homeLeafletReclusterTimer = null;
  }
  if (homeLeafletMap) {
    try {
      homeLeafletMap.remove();
    } catch (e) {}
    homeLeafletMap = null;
    homeLeafletMarkers = [];
    homeLeafletListingMarkers = [];
    homeLeafletMapEl = null;
  }
}
window.destroyHomeLeafletMap = destroyHomeLeafletMap;

function initHomeLeafletMap(listings) {
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded');
    return;
  }
  const el = document.getElementById('leaflet-home-map');
  if (!el) return;
  destroyHomeLeafletMap();
  homeLeafletMapEl = el;

  homeLeafletMap = L.map(el, {
    zoomControl: false,
    attributionControl: false,
    minZoom: 11,
    maxZoom: 18,
    maxBounds: [
      [UB_BOUNDS.latMin - 0.1, UB_BOUNDS.lngMin - 0.1],
      [UB_BOUNDS.latMax + 0.1, UB_BOUNDS.lngMax + 0.1],
    ],
    maxBoundsViscosity: 0.7,
  }).setView(UB_CENTER, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(homeLeafletMap);

  const listingBounds = [];
  const listingMarkers = [];
  homeLeafletListingMarkers = listingMarkers;

  // Zoom/move үед маркеруудыг base lat/lng руу нь буцаагаад дахин declutter хийнэ.
  // Үгүй бол өмнөх declutter-аас үлдсэн шилжүүлэлт zoom-ын дараа маркеруудыг
  // мапны байршилтай харьцангуй хазайлгадаг.
  const scheduleRecluster = () => {
    if (homeLeafletReclusterTimer) clearTimeout(homeLeafletReclusterTimer);
    homeLeafletReclusterTimer = setTimeout(() => {
      homeLeafletReclusterTimer = null;
      if (homeLeafletMap && homeLeafletMapEl && homeLeafletListingMarkers.length) {
        declutterHomeLeafletMarkers(homeLeafletListingMarkers, homeLeafletMapEl);
      }
    }, 80);
  };
  homeLeafletMap.on('zoomend moveend', scheduleRecluster);

  (listings || []).forEach((l) => {
    const [lat, lng] = listingToLatLng(l);
    const isHot = l.status === 'hot';
    const isFeatured = isHot || l.isUserListing;
    const priceText = typeof fmtMapPinPrice === 'function' ? fmtMapPinPrice(l) : l.price + '';
    const metaText = typeof fmtMapPinMeta === 'function' ? fmtMapPinMeta(l) : l.area ? `${l.area}м²` : '';
    const html = `<div class="leaflet-price-pin ${isFeatured ? 'hot' : ''}" onclick="openProperty(${l.id})">
      <span class="pin-house-mark"><i data-lucide="home" class="pin-house-svg"></i></span>
      <span class="pin-copy">
        <span class="pin-price-line num">${priceText}</span>
        ${metaText ? `<span class="pin-area-line">${metaText}</span>` : ''}
      </span>
    </div>`;
    const icon = L.divIcon({
      className: `leaflet-marker-icon-wrap leaflet-listing-icon-wrap`,
      html,
      iconSize: [160, 52],
      iconAnchor: [80, 26],
      tooltipAnchor: [0, -24],
    });
    const marker = L.marker([lat, lng], { icon, zIndexOffset: isFeatured ? 500 : 0 }).addTo(homeLeafletMap);
    // Tag the DOM with listing id so highlight-by-card can find it
    setTimeout(() => {
      const el = marker.getElement();
      if (el) {
        el.dataset.listingId = String(l.id);
      }
    }, 0);
    listingBounds.push([lat, lng]);
    listingMarkers.push({ marker, base: L.latLng(lat, lng), priority: isFeatured ? 2 : 1 });
    const ag = typeof getAgent === 'function' ? getAgent(l.agentId) : { name: '', initials: '' };
    const priceLabel = typeof listingPrice === 'function' ? listingPrice(l) : l.price;
    const photoSrc = typeof photoUrl === 'function' ? photoUrl(l, 0, '320/200') : '';
    const tipHtml = `
      <div class="hover-tip-card" onclick="openProperty(${l.id})">
        <div class="hover-tip-photo" style="background-image:url('${photoSrc}')">
          ${isFeatured ? '<div class="hover-tip-badge">★ Онцлох</div>' : ''}
        </div>
        <div class="hover-tip-body">
          <div class="hover-tip-price num">${priceLabel}</div>
          <div class="hover-tip-title">${l.khotkhon}</div>
          <div class="hover-tip-meta">${l.rooms} өрөө · ${l.area}м² · ${l.floor} давхар · ${l.year} он</div>
          <div class="hover-tip-sub"><i data-lucide="map-pin" style="width:11px;height:11px;display:inline;vertical-align:-1px;"></i> ${l.district}, ${l.khoroo}-р хороо</div>
          ${ag.name ? `<div class="hover-tip-agent"><span class="hover-tip-avatar">${ag.initials || ''}</span> ${ag.name}${ag.verified ? ' <i data-lucide="badge-check" style="width:11px;height:11px;display:inline;color:var(--gold-brand);"></i>' : ''}</div>` : ''}
          <div class="hover-tip-cta">Дэлгэрэнгүй →</div>
        </div>
      </div>
    `;
    marker.bindTooltip(tipHtml, {
      direction: 'top',
      offset: [0, -6],
      opacity: 1,
      sticky: true,
      className: 'hover-tip-wrap',
      permanent: false,
    });
    marker.on('tooltipopen', () => {
      setTimeout(() => {
        try {
          lucide.createIcons();
        } catch (e) {}
      }, 0);
    });
    marker.on('click', () => openProperty(l.id));
    marker.on('mouseover', () => {
      if (window.highlightHomeCard) window.highlightHomeCard(l.id, true);
    });
    marker.on('mouseout', () => {
      if (window.highlightHomeCard) window.highlightHomeCard(null, false);
    });
    homeLeafletMarkers.push(marker);
  });

  if (listingBounds.length === 1) {
    homeLeafletMap.setView(listingBounds[0], 13, { animate: false });
  } else if (listingBounds.length > 1) {
    const aiPanel = document.querySelector('.home-ai-panel:not(.collapsed)');
    const aiWidth = aiPanel ? aiPanel.getBoundingClientRect().width : 0;
    const rightPadding = aiWidth ? Math.min(Math.round(aiWidth + 260), Math.round(el.clientWidth * 0.58)) : 130;
    homeLeafletMap.fitBounds(L.latLngBounds(listingBounds), {
      paddingTopLeft: [130, 150],
      paddingBottomRight: [rightPadding, 150],
      maxZoom: 12,
      animate: false,
    });
  }
  declutterHomeLeafletMarkers(listingMarkers, el);

  // My Places — гэр, ажил, сургуулийн pin-ийг харуулна
  (state.myPlaces || []).forEach((p) => {
    const meta = placeKindMeta(p.kind);
    const [lat, lng] = listingToLatLng({ lat: p.lat, lng: p.lng });
    const html = `<div onclick="openPlacePicker('${p.id}')" style="background:${meta.color}; color:#fff; padding:5px 10px; border-radius:999px; font-size:11px; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,.4); display:inline-flex; align-items:center; gap:6px; white-space:nowrap; cursor:pointer; transform:translate(-50%,-110%); border:2px solid #fff;" title="${(p.label || meta.label).replace(/"/g, '&quot;')} — засах">
      ★ ${(p.label || meta.label).slice(0, 18)}
    </div>`;
    const icon = L.divIcon({ className: 'leaflet-marker-icon-wrap', html, iconSize: null, iconAnchor: [0, 0] });
    const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(homeLeafletMap);
    homeLeafletMarkers.push(marker);
  });

  setTimeout(() => {
    try {
      homeLeafletMap.invalidateSize();
      declutterHomeLeafletMarkers(listingMarkers, el);
      if (window.lucide) lucide.createIcons();
    } catch (e) {}
  }, 50);
}
window.initHomeLeafletMap = initHomeLeafletMap;
