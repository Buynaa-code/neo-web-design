/* ============== COMPONENTS — cards, footer, floorplan, trust, AI chat ============== */

function renderGlobalAIChat() {
  const aiHistory = state.homeAIChat || [];
  return `
    <div class="home-ai-panel ${state.homeAIChatCollapsed ? 'collapsed' : ''}" id="home-ai-panel">
      <div class="home-ai-header" onclick="toggleHomeAIChat()">
        <div class="home-ai-header-icon"><i data-lucide="sparkles" class="w-4 h-4"></i></div>
        <div class="home-ai-header-text">
          <div class="home-ai-header-title">AI туслах</div>
          <div class="home-ai-header-sub">Юу хайж байна вэ?</div>
        </div>
        <button class="home-ai-header-toggle text-[var(--text-3)] hover:text-[var(--text)]" aria-label="AI чатыг хураах">
          <i data-lucide="chevron-down" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="home-ai-body" id="home-ai-body">
        ${
          aiHistory.length === 0
            ? `
          <div class="home-ai-msg bot">
            Сайн уу 👋 Би таны хайж буй үл хөдлөхийг олоход тусална. Доорх жишээгээр эхэлж эсвэл өөрийн үгээр асууж болно.
          </div>
          <div class="home-ai-suggest">
            ${AI_EXAMPLES.slice(0, 4)
              .map(
                (ex) => `
              <button onclick="sendHomeAIMessage(${JSON.stringify(ex.text).replace(/"/g, '&quot;')})">${ex.text}</button>
            `,
              )
              .join('')}
          </div>
        `
            : aiHistory
                .map(
                  (m) => `
          <div class="home-ai-msg ${m.role}">${m.text}</div>
          ${m.suggestions ? `<div class="home-ai-suggest">${m.suggestions.map((s) => `<button onclick="sendHomeAIMessage(${JSON.stringify(s).replace(/"/g, '&quot;')})">${s}</button>`).join('')}</div>` : ''}
        `,
                )
                .join('')
        }
      </div>
      <div class="home-ai-input">
        <input id="home-ai-input" type="text" placeholder="Асуултаа бичнэ үү..."
          onkeydown="if(event.key==='Enter'){ event.preventDefault(); sendHomeAIMessage(this.value); this.value=''; }" />
        <button onclick="(()=>{const i=document.getElementById('home-ai-input'); sendHomeAIMessage(i.value); i.value='';})()" aria-label="Илгээх">
          <i data-lucide="send" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}
window.renderGlobalAIChat = renderGlobalAIChat;

function refreshGlobalAIChat(options = {}) {
  const slot = document.getElementById('global-ai-slot');
  if (!slot) return;
  slot.innerHTML = renderGlobalAIChat();
  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
    if (options.scroll) {
      const body = document.getElementById('home-ai-body');
      if (body) body.scrollTop = body.scrollHeight;
    }
  }, 0);
}
window.refreshGlobalAIChat = refreshGlobalAIChat;

function refreshAIChatSurface(options = {}) {
  const screen = window.currentScreen || currentScreen;
  if (screen === 'home' || screen === 'results') {
    renderAppScreen(screen);
    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
      if (options.scroll) {
        const body = document.getElementById('home-ai-body');
        if (body) body.scrollTop = body.scrollHeight;
      }
    }, 0);
  } else {
    refreshGlobalAIChat({ scroll: !!options.scroll });
  }
}

/* AI чатын panel-ийг нээх/хаах */
window.toggleHomeAIChat = function () {
  state.homeAIChatCollapsed = !state.homeAIChatCollapsed;
  const el = document.getElementById('home-ai-panel');
  if (el) el.classList.toggle('collapsed', state.homeAIChatCollapsed);
};

/* AI чатад мессеж явуулах — extractFilters-ийг ашиглаж зөвлөмж буцаана */
window.sendHomeAIMessage = function (text) {
  text = (text || '').trim();
  if (!text) return;
  if (text === 'Үр дүнг бүгдийг үзэх') {
    state.page = 1;
    goTo('results');
    return;
  }
  if (text === 'Шүүлтүүр цэвэрлэх') {
    clearAllFilters();
    state.homeAIChat = [];
    refreshAIChatSurface({ scroll: false });
    return;
  }
  if (text === 'Дахин шүүлт хийе') {
    state.homeAIChat = [];
    refreshAIChatSurface({ scroll: false });
    return;
  }
  if (!Array.isArray(state.homeAIChat)) state.homeAIChat = [];
  state.homeAIChat.push({ role: 'user', text });
  const ex = typeof parseAIQuery === 'function' ? parseAIQuery(text) : null;
  const parts = [];
  if (ex) {
    if (ex.mode) {
      state.mode = ex.mode;
      parts.push(ex.mode === 'rent' ? 'түрээс' : 'худалдах');
    }
    if (ex.district) {
      state.filterDistrict = ex.district;
      parts.push(ex.district + ' дүүрэг');
    }
    if (ex.rooms) {
      state.filterRooms = ex.rooms;
      parts.push(ex.rooms + ' өрөө');
    }
    if (ex.maxPrice) {
      state.filterPriceMax = ex.maxPrice;
      parts.push((ex.maxPrice / 1000000).toFixed(0) + 'сая хүртэл');
    }
    if (ex.lifestyle && ex.lifestyle.length) state.filterLifestyle = ex.lifestyle;
    state.aiExtracted = ex;
  }
  const count = (typeof filteredListings === 'function' ? filteredListings() : LISTINGS).length;
  const reply = parts.length
    ? `Ойлгов · ${parts.join(', ')}. ${count} зар олдлоо. Газрын зураг дээр харагдаж байна.`
    : `${count} зар олдлоо. Дүүрэг эсвэл өрөөний тоог нэмбэл нарийсна.`;
  state.homeAIChat.push({
    role: 'bot',
    text: reply,
    suggestions: count > 0 ? ['Үр дүнг бүгдийг үзэх', 'Дахин шүүлт хийе'] : ['Шүүлтүүр цэвэрлэх'],
  });
  state.aiQuery = text;
  refreshAIChatSurface({ scroll: true });
};


function renderFloorplan(l) {
  const rooms = l.rooms;
  const area = l.area;
  // Үндсэн хэмжээ: 600x340 SVG; өрөөг сараалжаар байрлуулна
  const layouts = {
    1: [
      ['Studio + Кухнэ', 0, 0, 60, 60],
      ['Угаалга', 60, 0, 40, 40],
      ['Тагт', 60, 40, 40, 20],
    ],
    2: [
      ['Зочны өрөө', 0, 0, 50, 60],
      ['Унтлагын', 50, 0, 50, 35],
      ['Кухнэ', 50, 35, 30, 25],
      ['Угаалга', 80, 35, 20, 25],
    ],
    3: [
      ['Зочны өрөө', 0, 0, 45, 55],
      ['Унтлагын 1', 45, 0, 28, 35],
      ['Унтлагын 2', 73, 0, 27, 35],
      ['Кухнэ', 45, 35, 30, 25],
      ['Угаалга', 75, 35, 25, 25],
      ['Тагт', 0, 55, 45, 10],
    ],
    4: [
      ['Зочны өрөө', 0, 0, 42, 50],
      ['Унтлагын 1', 42, 0, 28, 32],
      ['Унтлагын 2', 70, 0, 30, 32],
      ['Унтлагын 3', 42, 32, 28, 28],
      ['Кухнэ', 70, 32, 30, 28],
      ['Угаалга', 0, 50, 42, 15],
    ],
  };
  const layout = layouts[Math.min(4, rooms)] || layouts[2];
  return `
    <svg class="fp-svg" viewBox="0 0 100 65" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="fp-grid" width="2" height="2" patternUnits="userSpaceOnUse">
          <path d="M 2 0 L 0 0 0 2" fill="none" stroke="rgba(196,242,94,.08)" stroke-width="0.1"/>
        </pattern>
      </defs>
      <rect width="100" height="65" fill="url(#fp-grid)"/>
      <!-- Outer wall -->
      <rect x="0.5" y="0.5" width="99" height="64" fill="none" stroke="var(--primary)" stroke-width="0.6" rx="1"/>
      ${layout
        .map(
          ([name, x, y, w, h]) => `
        <g>
          <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" fill="rgba(196,242,94,.04)" stroke="rgba(196,242,94,.4)" stroke-width="0.3"/>
          <text x="${x + w / 2}" y="${y + h / 2}" font-size="2.2" fill="var(--text-2)" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, monospace">${name}</text>
          <text x="${x + w / 2}" y="${y + h / 2 + 3}" font-size="1.6" fill="var(--text-3)" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, monospace">${Math.round(area * ((w * h) / 6500))}м²</text>
        </g>
      `,
        )
        .join('')}
      <text x="50" y="62.5" font-size="2" fill="var(--text-3)" text-anchor="middle" font-family="ui-monospace, monospace" letter-spacing="0.3">${l.khotkhon.toUpperCase()} · ${rooms} ӨРӨӨ · ${area}М²</text>
    </svg>
  `;
}

function trustBadges(l) {
  const ag = getAgent(l.agentId);
  return [
    { on: ag.verified, icon: 'badge-check', label: 'Баталгаажсан агент' },
    { on: true, icon: 'image', label: 'Зураг бодит' },
    { on: l.lat != null, icon: 'map-pin', label: 'Координат батлагдсан' },
    { on: (l.priceHistory || []).length > 0, icon: 'line-chart', label: 'Үнийн түүхтэй' },
    { on: l.year >= 2018, icon: 'sparkles', label: 'Шинэ ашиглалт' },
  ];
}


function bmListingCard(l) {
  const verified = isListingVerified(l);
  const saved = SAVED_IDS.has(l.id);
  return `
    <div class="bm-listing" onclick="openProperty(${l.id})">
      <div class="bm-listing-photo" style="background-image:url('${photoUrl(l, 0, '600/450')}')">
        ${verified ? `<span class="bm-verified"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
      </div>
      <div class="bm-listing-body">
        <div class="bm-listing-title">${l.khotkhon}</div>
        <div class="bm-listing-loc">${l.district} дүүрэг, ${l.khoroo}-р хороо</div>
        <div class="bm-listing-specs">
          <span><i data-lucide="bed-double" class="w-3.5 h-3.5"></i>${l.rooms} өрөө</span>
          <span><i data-lucide="ruler" class="w-3.5 h-3.5"></i>${l.area} м²</span>
        </div>
        <div class="bm-listing-price-wrap">
          <div>
            <div class="bm-listing-price num">${l.price.toLocaleString('en-US')}₮</div>
            <div class="bm-listing-ppm num">${listingPpm(l).toLocaleString('en-US')}₮/м²</div>
          </div>
          <button class="bm-listing-heart ${saved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
            <i data-lucide="heart" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>`;
}

/* Horizontal row (used on results list) */
function bmListingRow(l) {
  const verified = isListingVerified(l);
  const saved = SAVED_IDS.has(l.id);
  const ipoteh = hasIpoteh(l);
  const floors = l.floor && /\//.test(l.floor) ? l.floor : l.floor + '/—';
  return `
    <div class="bm-listing-row" onclick="openProperty(${l.id})">
      <div class="bm-listing-photo" style="background-image:url('${photoUrl(l, 0, '400/300')}')">
        ${verified ? `<span class="bm-verified"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
      </div>
      <div class="bm-listing-row-body">
        <div class="bm-listing-row-top">
          <div class="min-w-0">
            <div class="bm-listing-row-title">${l.khotkhon}</div>
            <div class="bm-listing-row-loc">${l.district} дүүрэг, ${l.khoroo}-р хороо</div>
          </div>
          <button class="bm-listing-heart ${saved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
            <i data-lucide="heart" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="bm-listing-row-specs">
          <span><i data-lucide="bed-double" class="w-3.5 h-3.5"></i>${l.rooms} өрөө</span>
          <span><i data-lucide="ruler" class="w-3.5 h-3.5"></i>${l.area} м²</span>
          <span><i data-lucide="building" class="w-3.5 h-3.5"></i>${floors} давхар</span>
        </div>
        <div>
          <div class="bm-listing-row-price num">${l.price.toLocaleString('en-US')}₮</div>
          <div class="bm-listing-row-ppm num">${listingPpm(l).toLocaleString('en-US')}₮/м²</div>
        </div>
        <div class="bm-listing-row-bottom">
          ${ipoteh ? '<span class="bm-tag">Ипотектэй</span>' : '<span></span>'}
          <span class="bm-time">${listingMinutesAgo(l)}</span>
        </div>
      </div>
    </div>`;
}

function listingCard(l, opts = {}) {
  const { compact = false, pinIndex = null } = opts;
  const ag = getAgent(l.agentId);
  const isSaved = SAVED_IDS.has(l.id);
  const status = STATUS_PILL[l.status] || ['', ''];
  const ns = nearestStop(l);
  const stopMin = ns.stop ? stopWalkMinutes(ns.dist) : null;
  const viewed = isViewed(l.id);
  return `
    <div class="prop-card ${state.highlightedId === l.id ? 'highlighted' : ''} ${viewed ? 'viewed' : ''}"
      data-listing-id="${l.id}"
      onclick="openProperty(${l.id})"
      onmouseenter="setHover(${l.id}, true)"
      onmouseleave="setHover(${l.id}, false)">
      ${pinIndex != null ? `<span class="card-pin-badge num" title="Газрын зураг дээрх ${pinIndex}-р pin">${pinIndex}</span>` : ''}
      <div class="photo" style="background-image:url('${photoUrl(l, 0, '600/400')}')">
        <div class="absolute top-3 left-3 flex gap-1.5" style="${pinIndex != null ? 'margin-left: 32px;' : ''}">
          ${status[0] ? `<span class="pill ${status[0]}">${status[1]}</span>` : ''}
          ${l.listedDays <= 3 ? `<span class="pill pill-new">${l.listedDays === 0 ? 'Өнөөдөр' : l.listedDays + ' хоног'}</span>` : ''}
          ${viewed ? `<span class="viewed-badge"><i data-lucide="eye" class="w-2.5 h-2.5"></i> Үзсэн</span>` : ''}
        </div>
        <button class="heart-btn absolute top-2.5 right-2.5 ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaved(${l.id}, this)">
          <i data-lucide="heart" class="w-4 h-4"></i>
        </button>
        <div class="photo-dots"><span class="active"></span><span></span><span></span><span></span></div>
      </div>
      <div class="p-4">
        <div class="flex items-start justify-between gap-2 mb-1">
          <div class="min-w-0">
            <div class="font-semibold text-[15px] truncate">${l.khotkhon}</div>
            <div class="text-xs text-[var(--text-3)] mt-0.5">${l.district}, ${l.khoroo}-р хороо</div>
          </div>
          <div class="text-right">
            <div class="num text-[15px]" style="color: var(--primary);">${l.mode === 'rent' ? fmtCompact(l.price) + '/сар' : fmtCompact(l.price)}</div>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-[var(--text-2)] mt-2">
          <span class="flex items-center gap-1"><i data-lucide="bed-double" class="w-3 h-3"></i> ${l.rooms} өрөө</span>
          <span class="flex items-center gap-1"><i data-lucide="ruler" class="w-3 h-3"></i> ${l.area}м²</span>
          <span class="flex items-center gap-1"><i data-lucide="building" class="w-3 h-3"></i> ${l.floor}</span>
        </div>
        ${
          ns.stop
            ? `<div class="flex items-center gap-1.5 text-[11px] mt-2" style="color: var(--text-3);">
          <i data-lucide="bus" class="w-3 h-3" style="color: var(--primary);"></i>
          <span class="truncate">${ns.stop.name}</span>
          <span class="text-[var(--text-3)]">·</span>
          <span class="num">${stopMin} мин</span>
        </div>`
            : ''
        }
        ${
          compact
            ? ''
            : `<div class="flex items-center justify-between mt-3 pt-3 border-t" style="border-color: var(--border);">
          <div class="flex items-center gap-2 text-xs text-[var(--text-3)]">
            <div class="w-5 h-5 rounded-full text-white text-[9px] font-semibold flex items-center justify-center" style="background: linear-gradient(135deg, #0A1F44 0%, #051028 100%);">${ag.initials}</div>
            <span>${ag.name.split(' ').slice(-1)[0]}</span>
            ${ag.verified ? '<i data-lucide="badge-check" class="w-3 h-3" style="color: var(--primary);"></i>' : ''}
          </div>
          <span class="text-[11px] text-[var(--text-3)]">${l.viewCount} үзсэн</span>
        </div>`
        }
      </div>
    </div>
  `;
}

/* ============== NEOMAP — SHARED FOOTER ============== */
function bmFooter() {
  return `
    <footer class="bm-footer mt-16 lg:mt-24">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-14">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div class="col-span-2 md:col-span-3 lg:col-span-2">
            <div class="flex items-center mb-4">
              <img src="assets/images/logo/horizontal-light.png" alt="NEOMAP" class="neo-logo neo-logo-light h-10" />
              <img src="assets/images/logo/horizontal-dark.png" alt="NEOMAP" class="neo-logo neo-logo-dark h-10" />
            </div>
            <p class="text-sm" style="color: var(--text-2); max-width: 360px; line-height: 1.6;">
              NEOMAP бол Монголын үл хөдлөхийн хамгийн найдвартай, ухаалаг, хүртээмжтэй зуучлал, зөвлөгөө, үнэлгээний цогц платформ юм.
            </p>
            <div class="flex items-center gap-3 mt-6">
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="message-circle" class="w-4 h-4"></i></a>
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="camera" class="w-4 h-4"></i></a>
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="play" class="w-4 h-4"></i></a>
              <a class="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--gold-soft)] transition" style="color: var(--text-2);"><i data-lucide="briefcase" class="w-4 h-4"></i></a>
            </div>
          </div>

          <div>
            <div class="bm-footer-h">Үндсэн цэс</div>
            <ul class="space-y-2.5">
              <li><a onclick="goTo('home')">Нүүр</a></li>
              <li><a onclick="setMode('sale'); goTo('results')">Худалдах</a></li>
              <li><a onclick="setMode('rent'); goTo('results')">Түрээслэх</a></li>
              <li><a onclick="goTo('results')">Төслүүд</a></li>
              <li><a onclick="goTo('results')">Коммерц</a></li>
            </ul>
          </div>

          <div>
            <div class="bm-footer-h">Туслами</div>
            <ul class="space-y-2.5">
              <li><a>Туслами төв</a></li>
              <li><a>Хэрэглэх зааварчилгаа</a></li>
              <li><a>Нууцлалын бодлого</a></li>
              <li><a>Үйлчилгээний нөхцөл</a></li>
            </ul>
          </div>

          <div>
            <div class="bm-footer-h">Бидний тухай</div>
            <ul class="space-y-2.5">
              <li><a>Бидний тухай</a></li>
              <li><a>Мэдээ, нийтлэл</a></li>
              <li><a>Ажлын байр</a></li>
              <li><a>Хамтран ажиллах</a></li>
            </ul>
          </div>

          <div class="col-span-2 md:col-span-3 lg:col-span-1">
            <div class="bm-footer-h">Холбоо барих</div>
            <ul class="space-y-2.5 text-sm" style="color: var(--text-2);">
              <li class="flex items-start gap-2"><i data-lucide="phone" class="w-4 h-4 mt-0.5" style="color: var(--gold-brand);"></i> 5517-1010</li>
              <li class="flex items-start gap-2"><i data-lucide="mail" class="w-4 h-4 mt-0.5" style="color: var(--gold-brand);"></i> info@neolimit.mn</li>
              <li class="flex items-start gap-2"><i data-lucide="map-pin" class="w-4 h-4 mt-0.5" style="color: var(--gold-brand);"></i> Сүхбаатар дүүрэг, 1-р хороо,<br/>Peace Tower, 11 давхар</li>
            </ul>
          </div>
        </div>

        <div class="mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs" style="border-top: 1px solid var(--border); color: var(--text-3);">
          <div>© ${new Date().getFullYear()} NEOMAP LLC. Бүх эрх хуулиар хамгаалагдсан.</div>
          <div>Made with <span style="color: var(--gold-brand);">♥</span> in Mongolia</div>
        </div>
      </div>
    </footer>`;
}

/* ============== HOME (NEOMAP — Image 1) ============== */
