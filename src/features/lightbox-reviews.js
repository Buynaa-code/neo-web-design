/* ============== LIGHTBOX + REVIEWS + VOUCHER + CALENDAR + WISHLIST ============== */

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
