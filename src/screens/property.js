/* ============== SCREEN: RESULTS + PROPERTY ============== */

function renderResults() {
  const list = filteredListings();
  const buying = state.mode === 'sale';
  const compareList =
    typeof COMPARE_SET !== 'undefined' && COMPARE_SET.size
      ? [...COMPARE_SET]
          .map((id) => getListing(id))
          .filter(Boolean)
          .slice(0, 3)
      : list.slice(0, 3);
  const dist = state.filterDistrict;
  const districtStr = dist || 'Бүх дүүрэг';

  // Stats for current filter context
  const baseForStats = dist ? modeListings().filter((l) => l.district === dist) : modeListings();
  const avgPrice = baseForStats.length
    ? Math.round(baseForStats.reduce((s, l) => s + l.price, 0) / baseForStats.length)
    : 0;
  const avgPpm = baseForStats.length
    ? Math.round(baseForStats.reduce((s, l) => s + l.price / l.area, 0) / baseForStats.length)
    : 0;

  // Map pin positioning — show first 8 listings as gold drop pins
  const mapPins = list.slice(0, 10);

  const fullMapHtml = state.fullMap ? renderFullMapOverlay() : '';

  return `
    ${fullMapHtml}
    <!-- ============== TOP SEARCH BAR ============== -->
    <section class="bm-hero pb-6 pt-6">
      <div class="max-w-7xl mx-auto px-4 lg:px-8">
        <div class="bm-search-mega">
          <i data-lucide="sparkles" class="w-5 h-5 bm-search-icon"></i>
          <input id="bm-res-search" type="text" value="${state.aiQuery || (dist ? dist + ' дүүрэг, ' + (state.filterRooms || 3) + ' өрөө, 350 саяас доош' : '')}" placeholder="Хайлтаа боловсруулна уу..."
            onkeydown="if(event.key==='Enter'){ event.preventDefault(); runAISearch(this.value); }" />
          <button onclick="clearAISearch()" class="text-[var(--text-3)] hover:text-[var(--text)] px-3"><i data-lucide="x" class="w-4 h-4"></i></button>
          <button class="bm-search-mega-btn" onclick="runAISearch(document.getElementById('bm-res-search').value)">
            <i data-lucide="search" class="w-5 h-5"></i>
          </button>
        </div>

        ${
          state.aiQuery && state.aiExtracted
            ? `
          <div class="mt-3 p-3 rounded-xl flex items-start gap-3" style="background: var(--surface); border: 1px solid var(--primary);">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--primary); color: #0A0C0E;">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-[11px] font-medium uppercase tracking-wider mb-1.5" style="color: var(--primary); letter-spacing: .12em;">
                AI таны хайлтаас дараахыг ойлгов
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">${aiExtractedChips(state.aiExtracted)}</div>
            </div>
            <button onclick="clearAISearch()" class="text-[var(--text-3)] hover:text-[var(--text)] shrink-0" title="Цэвэрлэх">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        `
            : ''
        }

        ${
          !state.aiQuery
            ? `
          <div class="mt-3 flex items-start gap-2 flex-wrap">
            <span class="text-[11px] font-medium uppercase tracking-wider pt-1.5 flex items-center gap-1" style="color: var(--text-3); letter-spacing: .12em;">
              <i data-lucide="sparkles" class="w-3 h-3" style="color: var(--gold-brand);"></i> Жишээ AI хайлт
            </span>
            ${AI_EXAMPLES.slice(0, 4)
              .map(
                (ex) => `
              <button onclick="runAIExample(${JSON.stringify(ex.text).replace(/"/g, '&quot;')})"
                class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition"
                style="background: var(--surface); border: 1px solid var(--border); color: var(--text-2);">
                <i data-lucide="${ex.icon}" class="w-3 h-3"></i> ${ex.text}
              </button>
            `,
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-10">
      <!-- Title row -->
      <div class="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Хайлтын үр дүн</h1>
          <p class="text-sm mt-1" style="color: var(--text-3);"><span class="num">${list.length}</span> үл хөдлөх хөрөнгө олдлоо</p>
        </div>
        <button onclick="openSavedSearchModal && openSavedSearchModal()" class="bm-btn-outline !py-2.5">
          <i data-lucide="bookmark-plus" class="w-4 h-4"></i> Хайлтаа хадгалах
        </button>
      </div>

      <!-- Filter recap row -->
      <div class="flex flex-wrap items-center gap-2.5 mb-3">
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Үнэ</span>
          <span class="bm-recap-val">${buying ? '350 сая хүртэл' : '1.5 саяс хүртэл'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Өрөө</span>
          <span class="bm-recap-val">${state.filterRooms ? state.filterRooms + ' өрөө' : '3 өрөө'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Талбай</span>
          <span class="bm-recap-val">60-120 м² <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <button class="bm-recap-chip" onclick="openAdvancedFilters()">
          <span class="bm-recap-label">Байршил</span>
          <span class="bm-recap-val">${dist ? dist + ' дүүрэг' : 'Бүх дүүрэг'} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
        </button>
        <div class="flex flex-wrap items-center gap-2.5 ml-auto">
          <button class="bm-toggle ${state.filterVerified ? 'on' : ''}" onclick="toggleResultsFilter('filterVerified')">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Verified <span class="bm-switch"></span>
          </button>
          <button class="bm-toggle ${state.filterIpoteh ? 'on' : ''}" onclick="toggleResultsFilter('filterIpoteh')">
            <i data-lucide="landmark" class="w-3.5 h-3.5"></i> Ипотектэй <span class="bm-switch"></span>
          </button>
          <button class="bm-toggle ${state.filterNewProject ? 'on' : ''}" onclick="toggleResultsFilter('filterNewProject')">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Шинэ төсөл <span class="bm-switch"></span>
          </button>
          <button class="bm-btn-outline !py-2.5" onclick="openAdvancedFilters()">
            <i data-lucide="sliders" class="w-4 h-4"></i> Дэлгэрэнгүй шүүлтүүр
          </button>
        </div>
      </div>

      ${
        state.filterDistrict ||
        state.filterRooms ||
        state.filterVerified ||
        state.filterIpoteh ||
        state.filterNewProject ||
        state.filterSchool ||
        state.filterIncome ||
        state.filterPriceMax ||
        state.aiQuery
          ? `
      <div class="flex items-center gap-2 mb-3 text-xs flex-wrap">
        <span style="color: var(--text-3);">Идэвхтэй шүүлтүүр:</span>
        ${state.filterDistrict ? `<span class="bm-tag">${state.filterDistrict} <button onclick="state.filterDistrict=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        ${state.filterRooms ? `<span class="bm-tag">${state.filterRooms} өрөө <button onclick="state.filterRooms=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        ${state.filterVerified ? `<span class="bm-tag">Verified <button onclick="toggleResultsFilter('filterVerified')" class="ml-1">×</button></span>` : ''}
        ${state.filterIpoteh ? `<span class="bm-tag">Ипотектэй <button onclick="toggleResultsFilter('filterIpoteh')" class="ml-1">×</button></span>` : ''}
        ${state.filterNewProject ? `<span class="bm-tag">Шинэ төсөл <button onclick="toggleResultsFilter('filterNewProject')" class="ml-1">×</button></span>` : ''}
        ${state.filterSchool ? `<span class="bm-tag">Сургууль ойр <button onclick="toggleResultsFilter('filterSchool')" class="ml-1">×</button></span>` : ''}
        ${state.filterIncome ? `<span class="bm-tag">Орлого өгөх <button onclick="toggleResultsFilter('filterIncome')" class="ml-1">×</button></span>` : ''}
        ${state.filterPriceMax ? `<span class="bm-tag">${(state.filterPriceMax / 1000000).toFixed(0)}сая хүртэл <button onclick="state.filterPriceMax=null; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);" class="ml-1">×</button></span>` : ''}
        <button class="text-[var(--gold-brand)] hover:underline" onclick="clearAllFilters()">Бүгдийг арилгах</button>
      </div>
      `
          : ''
      }

      <!-- Sort + view toggle -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2 text-sm" style="color: var(--text-3);">
          Эрэмблэх:
          <select onchange="state.sortBy=this.value; renderAppScreen('results')" class="bg-transparent border-0 outline-none font-medium" style="color: var(--text); appearance: none; padding-right: 18px; background-image: linear-gradient(45deg, transparent 50%, var(--gold-brand) 50%), linear-gradient(135deg, var(--gold-brand) 50%, transparent 50%); background-position: calc(100% - 12px) 50%, calc(100% - 7px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;">
            <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Шинэ нэмэгдсэн (сүүлийн үеэр)</option>
            <option value="priceAsc" ${state.sortBy === 'priceAsc' ? 'selected' : ''}>Үнэ өсөх</option>
            <option value="priceDesc" ${state.sortBy === 'priceDesc' ? 'selected' : ''}>Үнэ буурах</option>
            <option value="recommended" ${state.sortBy === 'recommended' ? 'selected' : ''}>Зөвлөмжтэй</option>
          </select>
        </div>
        <div class="inline-flex bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5">
          <button class="px-2.5 py-1.5 rounded-md ${state.viewMode !== 'grid' ? 'bg-[var(--surface-2)] text-[var(--gold-brand)]' : 'text-[var(--text-3)]'}" onclick="state.viewMode='list'; renderAppScreen('results')"><i data-lucide="list" class="w-4 h-4"></i></button>
          <button class="px-2.5 py-1.5 rounded-md ${state.viewMode === 'grid' ? 'bg-[var(--surface-2)] text-[var(--gold-brand)]' : 'text-[var(--text-3)]'}" onclick="state.viewMode='grid'; renderAppScreen('results')"><i data-lucide="grid-2x2" class="w-4 h-4"></i></button>
        </div>
      </div>

      <!-- 2 columns: list (left) + map+side (right) -->
      <div class="grid lg:grid-cols-[1fr_540px] gap-5">

        <!-- LEFT: LISTINGS -->
        <div class="flex flex-col gap-3">
          ${(() => {
            if (!list.length)
              return `<div class="card p-12 text-center">
              <i data-lucide="search-x" class="w-10 h-10 mx-auto mb-3" style="color: var(--text-3);"></i>
              <div class="font-semibold mb-1">Тохирох зар олдсонгүй</div>
              <div class="text-sm" style="color: var(--text-3);">Шүүлтүүрээ өөрчилж үзнэ үү</div>
              <button class="bm-btn-outline mt-4" onclick="clearAllFilters()"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Шүүлтүүр арилгах</button>
            </div>`;
            const ps = state.pageSize || 8;
            const page = Math.max(1, state.page || 1);
            const start = (page - 1) * ps;
            return list
              .slice(start, start + ps)
              .map((l) => bmListingRow(l))
              .join('');
          })()}

          ${(() => {
            const ps = state.pageSize || 8;
            const totalPages = Math.ceil(list.length / ps);
            if (totalPages <= 1) return '';
            const cur = Math.max(1, Math.min(totalPages, state.page || 1));
            const pageBtns = [];
            const push = (p, active) =>
              pageBtns.push(
                `<button class="w-9 h-9 rounded-lg ${active ? 'bg-[var(--gold-brand)] text-[#0A1F44] font-semibold' : 'border border-[var(--border)] hover:border-[var(--gold-brand)]'}" style="${active ? '' : 'color: var(--text-2);'}" onclick="gotoPage(${p})">${p}</button>`,
              );
            // Эхний 4 + ellipsis + сүүлийн
            const shown = new Set([1, cur - 1, cur, cur + 1, totalPages].filter((p) => p >= 1 && p <= totalPages));
            let prev = 0;
            [...shown]
              .sort((a, b) => a - b)
              .forEach((p) => {
                if (p - prev > 1) pageBtns.push(`<span style="color: var(--text-3);">…</span>`);
                push(p, p === cur);
                prev = p;
              });
            return `
              <div class="flex items-center justify-center gap-1 mt-4">
                <button class="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center ${cur === 1 ? 'opacity-40 cursor-not-allowed' : ''}" style="color: var(--text-3);" onclick="${cur === 1 ? '' : `gotoPage(${cur - 1})`}"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                ${pageBtns.join('')}
                <button class="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center ${cur === totalPages ? 'opacity-40 cursor-not-allowed' : ''}" style="color: var(--text-2);" onclick="${cur === totalPages ? '' : `gotoPage(${cur + 1})`}"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
              </div>
            `;
          })()}
        </div>

        <!-- RIGHT: MAP + SIDE PANELS -->
        <aside class="space-y-4">
          <!-- Map (embed) -->
          <div class="bm-side-block !p-0 overflow-hidden" style="height: 520px; position: relative;">
            <div class="bm-map-embed-head">
              <button class="bm-toggle on" onclick="openFullMap()" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px); color: #fff; border-color: var(--gold-brand);" title="Бүрэн дэлгэц рүү шилжих">
                <span class="bm-switch"></span> Газрын зураг
              </button>
              <div class="flex gap-1.5">
                <button onclick="startDrawZone()" class="bm-btn-outline !py-1.5 !text-xs" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px); color: #fff; border-color: rgba(255,255,255,.18);" title="Бүс зурж хайх">
                  <i data-lucide="pen-line" class="w-3.5 h-3.5"></i>
                </button>
                <button class="bm-btn-outline !py-1.5 !text-xs" onclick="openFullMap()" style="background: rgba(6,17,43,.85); backdrop-filter: blur(10px); color: #fff; border-color: rgba(255,255,255,.18);">
                  <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Бүрэн дэлгэц
                </button>
              </div>
            </div>
            <div style="height: 100%;">${mapBackground(mapPins, { selectedId: state.highlightedId, showControls: false, showContext: false, showZoneSummary: false })}</div>
          </div>

          <!-- Зах зээлийн тойм -->
          <div class="bm-side-block">
            <div class="bm-side-title">
              <span>Зах зээлийн тойм <span style="color: var(--text-3); font-weight: 400;">(${districtStr}${dist ? ' дүүрэг' : ''})</span></span>
              <button onclick="openDetailedStatsModal('${dist || 'all'}')" class="text-xs hover:underline" style="color: var(--gold-brand);">Дэлгэрэнгүй статистик →</button>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Дундаж үнэ (${state.filterRooms || 3} өрөө)</div>
                <div class="num text-lg font-bold">${
                  avgPrice
                    ? Math.round(avgPrice / 1000000) +
                      ',' +
                      String(avgPrice % 1000000)
                        .padStart(6, '0')
                        .slice(0, 3) +
                      ',000₮'
                    : '—'
                }</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 4.6% емнөх сараас</div>
              </div>
              <div class="text-center" style="border-left: 1px solid var(--border); border-right: 1px solid var(--border);">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Идэвхтэй зар</div>
                <div class="num text-lg font-bold">${list.length || '186'}</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 12.1% емнөх сараас</div>
              </div>
              <div class="text-center">
                <div class="text-xs mb-1.5" style="color: var(--text-3);">Дундаж үнэ / м²</div>
                <div class="num text-lg font-bold">${avgPpm ? avgPpm.toLocaleString('en-US') + '₮' : '—'}</div>
                <div class="text-[11px] mt-1" style="color: var(--success);">▲ 3.8% емнөх сараас</div>
              </div>
            </div>
          </div>

          <!-- AI санал болгох -->
          <div class="bm-side-block">
            <div class="bm-ai-pick">
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--gold-brand); color: #0A1F44;"><i data-lucide="sparkles" class="w-4 h-4"></i></div>
                  <div>
                    <div class="text-sm font-semibold">AI санал болгох</div>
                    <div class="text-[11px]" style="color: var(--text-3);">Таны хайлтад илүү сайн тохирох боломжууд.</div>
                  </div>
                </div>
                <div class="bm-ai-pick-check"><i data-lucide="check-circle-2" class="w-4 h-4"></i> 60-120 м² талбайтай 3 өрөө байрнууд хамгийн их эрэлттэй байна.</div>
                <div class="bm-ai-pick-check"><i data-lucide="check-circle-2" class="w-4 h-4"></i> ${districtStr} сүүлийн 30 хоногт үнэ дундажаар 4.6% өссөн.</div>
                <button class="bm-btn-gold !text-xs !py-2 mt-3" onclick="state.filterAreaMin=60; state.filterAreaMax=120; state.filterRooms=3; state.page=1; renderAppScreen('results'); setTimeout(()=>lucide.createIcons(),0);">Бүх зөвлөмжийг харах</button>
              </div>
              <div class="bm-ai-pick-photo" style="background-image:url('${photoUrl(list[0] || LISTINGS[0], 1, '300/300')}'); position: relative;">
                <div style="position:absolute; bottom:6px; left:6px; right:6px; padding:4px 8px; background: rgba(6,17,43,.85); border-radius:8px; font-size:10px; color: var(--gold-brand); font-weight:600; text-align: center;">
                  <i data-lucide="sparkles" class="w-3 h-3 inline"></i> AI Picks
                </div>
              </div>
            </div>
          </div>

          <!-- Харьцуулах жагсаалт -->
          <div class="bm-side-block">
            <div class="bm-side-title">
              <span>Харьцуулах жагсаалт <span style="color: var(--text-3); font-weight: 400;">${compareList.length} үл хөдлөх нэмэгдлээ</span></span>
              <i data-lucide="git-compare" class="w-4 h-4" style="color: var(--gold-brand);"></i>
            </div>
            <div class="grid grid-cols-4 gap-2">
              ${compareList
                .map(
                  (l) => `
                <div class="bm-compare-thumb" onclick="openProperty(${l.id})" style="background-image:url('${photoUrl(l, 0, '120/120')}')">
                  <div class="bm-compare-thumb-label">
                    <div style="font-weight:600;">${l.khotkhon.length > 14 ? l.khotkhon.slice(0, 12) + '…' : l.khotkhon}</div>
                    <div style="color: var(--gold-brand);" class="num">${Math.round(l.price / 1000000)} саяс</div>
                  </div>
                </div>
              `,
                )
                .join('')}
              ${
                compareList.length < 4
                  ? Array(4 - compareList.length)
                      .fill(0)
                      .map(
                        () => `
                <button class="bm-compare-add" onclick="${typeof COMPARE_SET !== 'undefined' && COMPARE_SET.size ? 'openCompareView()' : `showToast('Зар нэмэхийн тулд листинг дээр сум сонгоно уу', 'info')`}">
                  <i data-lucide="sparkles" class="w-4 h-4 mb-1"></i>
                  Харьцуулах
                </button>
              `,
                      )
                      .join('')
                  : ''
              }
            </div>
          </div>

          <!-- Хайлтаа хадгалсан -->
          <div class="bm-side-block">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold mb-1">Хайлтаа хадгалсан</div>
                <div class="text-xs" style="color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${state.aiQuery || dist + ' ' + (state.filterRooms || 3) + ' өрөө, 350 саяас доош, сургууль ойр байр'}</div>
              </div>
              <button class="bm-toggle on !p-1.5" onclick="openSavedSearchModal && openSavedSearchModal()">
                <span class="bm-switch"></span>
              </button>
            </div>
            <p class="text-xs mt-3" style="color: var(--text-3);">Шинэ тохирох зар гармагц танд мэдэгдэх болно.</p>
            <button class="bm-btn-outline !text-xs !py-2 mt-3" onclick="openNotifSettingsModal && openNotifSettingsModal()">Мэдэгдлийн тохиргоо</button>
          </div>

          <div class="text-[11px]" style="color: var(--text-3);">
            * Үнэ нь зарын хугацаа, давхар, төлөв байдлаас хамаарч өөрчлөгдөх боломжтой.
          </div>
        </aside>
      </div>
    </section>

    ${bmFooter()}
  `;
}

/* ============== PROPERTY (NEOMAP — Image 3) ============== */
function pdEsc(v) {
  if (typeof lpEsc === 'function') return lpEsc(v);
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
}
function pdItems(v) {
  if (!Array.isArray(v)) {
    if (v && typeof v === 'object') {
      const label = v.item || v.label || v.name || v.title || v.value;
      return pdHasScalar(label) ? [String(label)] : [];
    }
    return pdHasScalar(v) ? [String(v)] : [];
  }
  return v
    .flatMap((item) => {
      if (item == null) return [];
      if (typeof item === 'string' || typeof item === 'number') return String(item).trim() ? [String(item)] : [];
      if (typeof item === 'object') {
        const enabled = item.has !== false && item.checked !== false && item.active !== false;
        const label = item.item || item.label || item.name || item.title || item.value;
        return enabled && pdHasScalar(label) ? [String(label)] : [];
      }
      return [];
    })
    .filter(Boolean);
}
function pdHasScalar(v) {
  return v !== undefined && v !== null && String(v).trim() !== '';
}
function pdFirst() {
  for (const v of arguments) {
    if (Array.isArray(v)) {
      const items = pdItems(v);
      if (items.length) return items.join(' · ');
    } else if (pdHasScalar(v)) {
      return v;
    }
  }
  return '';
}
function pdArea(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n.toLocaleString('en-US')} м²`;
}
function pdTypeLabel(detail) {
  const raw = detail?.type?.primary || '';
  if (raw && typeof lpType === 'function') {
    const found = (typeof SMART_LIST_PROP_TYPES !== 'undefined' ? SMART_LIST_PROP_TYPES : []).find((x) => x.key === raw || x.label === raw);
    return found ? found.label : lpType(raw).label;
  }
  return raw || 'Орон сууц';
}
function pdGoalLabel(detail, l) {
  const raw = detail?.type?.purpose || '';
  if (raw && typeof lpGoal === 'function') return lpGoal(raw).label;
  return (detail?.pricing?.mode || l.mode) === 'rent' ? 'Түрээслэх' : 'Худалдах';
}
function pdSubtypeLabel(detail) {
  return detail?.type?.subtype || '';
}
function pdRoomCount(detail, l) {
  const roomArr = detail?.specs?.rooms;
  const fromDetail = Array.isArray(roomArr) ? roomArr.find((x) => Number(x) > 0) : roomArr;
  return Number(pdFirst(fromDetail, detail?.uxDraft?.specs?.rooms, l.rooms)) || 0;
}
function pdBedroomCount(detail, l) {
  return Number(pdFirst(detail?.specs?.bedrooms, detail?.uxDraft?.specs?.bedrooms, Math.max((l.rooms || 1) - 1, 1))) || 0;
}
function pdFloorText(detail, l) {
  const floor = pdFirst(detail?.address?.floor, detail?.uxDraft?.address?.selectedFloor);
  const total = pdFirst(detail?.specs?.totalFloors, detail?.uxDraft?.address?.floorTotal);
  if (floor && total) return `${floor} / ${total}`;
  return pdFirst(l.floor, floor);
}
function pdWindowText(detail, l) {
  if (typeof lpWindowSummary === 'function') {
    const draftSummary = lpWindowSummary(detail?.uxDraft?.specs?.windows);
    if (draftSummary) return draftSummary;
  }
  const draftWindows = pdItems(detail?.uxDraft?.specs?.windows);
  if (draftWindows.length) return draftWindows.join(' · ');
  const counts = detail?.specs?.windowCounts || {};
  const dirs = Object.keys(counts).filter((k) => k !== 'total' && Number(counts[k]) > 0);
  if (dirs.length) return dirs.map((k) => `${k} ${counts[k]}`).join(' · ');
  return listingOrientation(l);
}
function pdInfraValue(detail, key) {
  const infra = detail?.infra || {};
  const draft = detail?.uxDraft?.infra || {};
  if (key === 'road') {
    const road = infra.road || {};
    const parts = [];
    if (Number(road.asphaltPct) > 0) parts.push(`Асфальт ${road.asphaltPct}%`);
    if (Number(road.dirtKm) > 0) parts.push(`Шороон ${road.dirtKm} км`);
    return parts.join(' · ') || draft.road || '';
  }
  if (key === 'internet') return pdFirst(infra.internet, draft.internet);
  return pdFirst(infra[key]?.primary, draft[key]);
}
function propertyFeatureCards(l, detail) {
  const raw = [
    ...(Array.isArray(l.features) ? l.features : []),
    ...pdItems(detail?.community?.amenities),
    ...pdItems(detail?.community?.security),
    ...pdItems(detail?.included?.furniture),
    ...pdItems(detail?.included?.equipment),
    ...pdItems(detail?.uxDraft?.specs?.officeNeeds),
  ];
  const uniq = [...new Set(raw.filter(Boolean))].slice(0, 8);
  const iconFor = (label) => {
    if (/харуул|CCTV|домофон|нэвтрэлт|хаалттай/i.test(label)) return 'shield';
    if (/зогсоол|гараж|EV/i.test(label)) return 'car';
    if (/фитнес|gym|саун|спа|бассейн/i.test(label)) return 'dumbbell';
    if (/тавилга|шүүгээ|гал тогоо|хөшиг/i.test(label)) return 'sofa';
    if (/лифт|access|disabled|налуу/i.test(label)) return 'accessibility';
    if (/ногоон|алхалт|террас|талбай/i.test(label)) return 'trees';
    return 'sparkles';
  };
  const list = uniq.length ? uniq : ['Тодорхой мэдээлэлтэй зар'];
  return list.map((label) => ({ icon: iconFor(label), label, desc: '' }));
}
function renderProperty() {
  const l = getListing(state.currentListingId);
  if (!l) return '<div class="p-8">Зар олдсонгүй</div>';
  const detail = typeof getListingDetail === 'function' ? getListingDetail(l) : (l.detail || null);
  const propGoalLabel = pdGoalLabel(detail, l);
  const propTypeLabel = pdTypeLabel(detail);
  const propSubtype = pdSubtypeLabel(detail);
  const propRoomCount = pdRoomCount(detail, l) || l.rooms;
  const propBedroomCount = pdBedroomCount(detail, l);
  const propArea = Number(pdFirst(detail?.specs?.areaCert, l.area)) || l.area;
  const propFloor = pdFloorText(detail, l);
  const propAddress = detail?.address || {};
  const propMedia = detail?.uxDraft?.media || {};
  const propPhotoCount = Array.isArray(propMedia.photos) ? propMedia.photos.length : (l.photos || 0);
  const propHasVideo = !!propMedia.videoLink;
  const propTitleTypeLine = propRoomCount && !['Газар', 'Авто дулаан зогсоол'].includes(propTypeLabel) ? `${propRoomCount} өрөө ${propTypeLabel}` : propTypeLabel;
  const propDistrict = pdFirst(propAddress.district, l.district);
  const propKhoroo = pdFirst(propAddress.khoroo, l.khoroo);
  const propProject = pdFirst(propAddress.project, l.khotkhon);
  const propYear = pdFirst(detail?.state?.commissionYear, l.year);
  const ag = getAgent(l.agentId);
  const isSaved = SAVED_IDS.has(l.id);
  const verified = isListingVerified(l);
  const bank = getBank(state.loanBankId);
  const downPct = Math.max(bank.minDownPct, state.loanDownPct);
  const years = Math.min(bank.maxYears, state.loanYears);
  const monthly = mortgageMonthly(l.price, downPct, years, bank.rate);
  const down = Math.round((l.price * downPct) / 100);
  const loan = l.price - down;
  const totalPaid = monthly * years * 12;
  const totalInterest = totalPaid - loan;
  const propId = 'RG-' + String(l.id).padStart(4, '0') + '-' + (l.photos * 7 + 13);
  const _curIdx = LISTINGS.findIndex((x) => x.id === l.id);
  const nextId = LISTINGS[(_curIdx + 1) % LISTINGS.length].id;
  const prevId = LISTINGS[(_curIdx - 1 + LISTINGS.length) % LISTINGS.length].id;

  const reasons = [
    propDistrict && `${propDistrict} дүүргийн байршил`,
    propArea && `${propArea} м² талбай`,
    pdInfraValue(detail, 'heating') && `${pdInfraValue(detail, 'heating')} дулаан`,
    pdItems(detail?.community?.security).slice(0, 1)[0],
    pdItems(detail?.community?.amenities).slice(0, 1)[0],
  ].filter(Boolean).slice(0, 4);

  const features = propertyFeatureCards(l, detail);

  const pois = [
    { kind: 'Сургууль', name: 'British School of Ulaanbaatar', dist: '1.1 км (3 мин)', icon: 'graduation-cap' },
    { kind: 'Худалдаа', name: 'Хүннү Молл', dist: '2.5 км (6 мин)', icon: 'shopping-bag' },
    { kind: 'Эмнэлэг', name: 'Интермед эмнэлэг', dist: '2.3 км (6 мин)', icon: 'cross' },
    { kind: 'Тээвэр', name: 'Зайсангийн эцэс автобусны буудал', dist: '500 м (7 мин явган)', icon: 'bus' },
    { kind: 'Цэцэрлэгт хүрэлэн', name: 'Зайсангийн цэцэрлэгт хүрэлэн', dist: '1.0 км (3 мин)', icon: 'trees' },
  ];

  return `
    <div class="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <!-- Breadcrumb + prev/next -->
      <div class="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div class="bm-breadcrumb">
          <a onclick="goTo('home')">Нүүр</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="setMode('${detail?.pricing?.mode || l.mode}'); goTo('results')">${pdEsc(propGoalLabel)}</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="goTo('results')">${pdEsc(propTypeLabel)}</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <a onclick="state.filterDistrict='${pdEsc(propDistrict)}'; goTo('results')">${pdEsc(propDistrict)} дүүрэг</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sep"></i>
          <span style="color: var(--text);">${pdEsc(propProject)} — ${pdEsc(propTitleTypeLine)}</span>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <button onclick="openProperty(${prevId})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)]" style="color: var(--text-2);"><i data-lucide="chevron-left" class="w-4 h-4"></i> Буцах</button>
          <button onclick="openProperty(${nextId})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)]" style="color: var(--text-2);">Дараагийн зар <i data-lucide="chevron-right" class="w-4 h-4"></i></button>
        </div>
      </div>

      <!-- Hero gallery + main info -->
      <div class="grid lg:grid-cols-[1.35fr_1fr] gap-6 mb-8">
        <!-- LEFT: GALLERY -->
        <div class="bm-gallery">
          <div class="bm-gallery-hero" style="background-image:url('${photoUrl(l, 0, '900/680')}')">
            ${verified ? `<span class="bm-verified"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
            <div class="bm-gallery-overlay-tag" style="left: 14px; bottom: 14px;">
              <i data-lucide="image" class="w-3.5 h-3.5"></i> ${propPhotoCount} зураг
            </div>
            ${propHasVideo ? `<div class="bm-gallery-overlay-tag" style="left: 130px; bottom: 14px;"><i data-lucide="play" class="w-3.5 h-3.5"></i> Видео</div>` : ''}
          </div>
          <div class="bm-gallery-side">
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 1, '300/200')}'); position:relative;">
              <div style="position:absolute; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center;">
                <i data-lucide="play-circle" class="w-9 h-9" style="color: white;"></i>
              </div>
            </div>
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 2, '300/200')}')"></div>
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 3, '300/200')}')"></div>
            <div class="bm-gallery-thumb" style="background-image:url('${photoUrl(l, 4, '300/200')}')"></div>
          </div>
        </div>

        <!-- RIGHT: TITLE + PRICE + SPECS + ACTIONS -->
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <h1 class="bm-prop-title">${pdEsc(propProject)} —<br/>${pdEsc(propTitleTypeLine)}</h1>
            ${verified ? `<span class="bm-verified shrink-0 mt-2"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
          </div>
          <div class="bm-prop-loc">
            <i data-lucide="map-pin" class="w-4 h-4" style="color: var(--gold-brand);"></i>
            ${pdEsc(propDistrict)} дүүрэг, ${pdEsc(propKhoroo)}-р хороо, ${pdEsc(propProject)} <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </div>

          <div class="mt-6 mb-5">
            <div class="bm-prop-price-big num">${l.price.toLocaleString('en-US')}₮</div>
            <div class="bm-prop-ppm-big num">${listingPpm(l).toLocaleString('en-US')}₮ / м²</div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mb-5">
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${pdArea(propArea)}</div>
              <div class="bm-prop-spec-lbl">Нийт талбай</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${propRoomCount} өрөө</div>
              <div class="bm-prop-spec-lbl">Өрөөний тоо</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${pdEsc(propFloor)} давхар</div>
              <div class="bm-prop-spec-lbl">Байрлал</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val num">${pdEsc(propYear)} он</div>
              <div class="bm-prop-spec-lbl">Ашиглалтад орсон</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val text-base">${pdEsc(pdWindowText(detail, l))}</div>
              <div class="bm-prop-spec-lbl">Цонхны харьц</div>
            </div>
            <div class="bm-prop-spec">
              <div class="bm-prop-spec-val text-base">${pdEsc(pdFirst(pdInfraValue(detail, 'heating'), listingHeating(l)))}</div>
              <div class="bm-prop-spec-lbl">Дулаан хангамж</div>
            </div>
          </div>

          <div class="flex gap-2.5 mb-4">
            <button class="bm-btn-gold flex-1" onclick="openCallAgent && openCallAgent(${ag.id})">
              <i data-lucide="phone" class="w-4 h-4"></i> Холбоо барих
            </button>
            <button class="bm-btn-navy" onclick="goTo('schedule')">
              <i data-lucide="calendar" class="w-4 h-4"></i> Үзлэг товлох
            </button>
            <button class="bm-btn-outline ${isSaved ? '!border-[var(--gold-brand)] !text-[var(--gold-brand)]' : ''}" onclick="toggleSaved(${l.id}, this)">
              <i data-lucide="heart" class="w-4 h-4" ${isSaved ? 'fill="currentColor"' : ''}></i> Хадгалах
            </button>
          </div>

          <div class="flex items-center justify-between text-xs flex-wrap gap-2" style="color: var(--text-3);">
            <span>Зарын дугаар: <span style="color: var(--text-2);" class="num">${propId}</span></span>
            <span>Нийтэлсэн: <span style="color: var(--text-2);" class="num">${(() => {
              const d = new Date();
              d.setDate(d.getDate() - (l.listedDays || 0));
              return (
                d.getFullYear() +
                '.' +
                String(d.getMonth() + 1).padStart(2, '0') +
                '.' +
                String(d.getDate()).padStart(2, '0')
              );
            })()}</span></span>
            <button class="flex items-center gap-1 hover:text-[var(--gold-brand)]"><i data-lucide="share-2" class="w-3.5 h-3.5"></i> Хуваалцах</button>
          </div>
        </div>
      </div>

      <!-- AI Reason Card -->
      <div class="bm-ai-reason mb-7">
        <div class="flex items-start gap-4">
          <div class="bm-ai-reason-icon"><i data-lucide="sparkles" class="w-5 h-5"></i></div>
          <div>
            <div class="text-sm font-semibold mb-1.5" style="color: var(--gold-brand);">AI Хайлтаас танд тохирох шалтгаан</div>
            <p class="text-sm" style="color: var(--text-2); line-height: 1.6;">
              Энэхүү ${pdEsc(propTypeLabel)} нь ${pdEsc(propDistrict)} дүүрэгт байрлах ${pdEsc(pdArea(propArea))} талбайтай зар. Зорилго, байршил, үзүүлэлт, дэд бүтэц, төлбөрийн нөхцөл нь зар оруулах хэсгийн дататай холбогдож харагдаж байна.
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              ${reasons.map((r) => `<span class="bm-ai-reason-chip"><i data-lucide="check" class="w-3 h-3"></i>${r}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Main grid: info + sidebar -->
      <div class="grid lg:grid-cols-[1fr_360px] gap-6">
        <div class="space-y-7">

          <!-- Key info + floor plan -->
          <div class="grid md:grid-cols-2 gap-5">
            <div>
              <h3 class="text-base font-semibold mb-3">Түлхүүр мэдээлэл</h3>
              <div class="bm-keytbl">
                ${[
                  ['Байршил', `${propDistrict} дүүрэг, ${propKhoroo}-р хороо, ${propProject}`, 'map-pin'],
                  ['Хотхон', propProject, 'building'],
                  ['Барилгын төрөл', [propTypeLabel, propSubtype].filter(Boolean).join(' · '), 'building-2'],
                  ['Нийт талбай', pdArea(propArea), 'ruler'],
                  ['Өрөөний тоо', `${propRoomCount} өрөө${propBedroomCount ? ` (${propBedroomCount} унтлагын өрөө)` : ''}`, 'bed-double'],
                  ['Давхар / Нийт', propFloor, 'arrow-up-down'],
                  ['Ашиглалтад орсон', propYear ? `${propYear} он` : '', 'calendar'],
                  ['Зогсоол', pdFirst(pdItems(detail?.community?.amenities).filter((x) => /зогсоол|гараж/i.test(x)), detail?.specs?.areaGarage ? `Зогсоолын талбай ${pdArea(detail.specs.areaGarage)}` : '', 'Мэдээлэл оруулаагүй'), 'car'],
                  ['Цонхны харьц', pdWindowText(detail, l), 'sun'],
                  ['Засвар', pdFirst(detail?.state?.interior, detail?.state?.current, 'Мэдээлэл оруулаагүй'), 'sparkles'],
                ]
                  .map(
                    ([k, v, ic]) => `
                    <div class="bm-keytbl-row">
                      <div class="bm-keytbl-row-k"><i data-lucide="${ic}" class="w-3.5 h-3.5" style="color: var(--gold-brand);"></i>${k}</div>
                    <div class="bm-keytbl-row-v">${pdEsc(v)}</div>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            </div>
            <div>
              <h3 class="text-base font-semibold mb-3">Давхарын зураглал</h3>
              <div class="bm-floorplan">
                <div class="bm-floorplan-img">
                  <svg viewBox="0 0 200 150" fill="none" stroke="#0A1F44" stroke-width="2">
                    <rect x="10" y="10" width="180" height="130" />
                    <line x1="80" y1="10" x2="80" y2="80" />
                    <line x1="80" y1="80" x2="190" y2="80" />
                    <line x1="130" y1="80" x2="130" y2="140" />
                    <line x1="80" y1="120" x2="130" y2="120" />
                    <rect x="20" y="20" width="50" height="50" stroke-width="1" />
                    <text x="30" y="48" font-size="6" fill="#0A1F44" stroke="none">Зочны</text>
                    <text x="100" y="48" font-size="6" fill="#0A1F44" stroke="none">Гал тогоо</text>
                    <text x="140" y="100" font-size="6" fill="#0A1F44" stroke="none">Унтл-1</text>
                    <text x="90" y="100" font-size="6" fill="#0A1F44" stroke="none">Унтл-2</text>
                    <text x="40" y="100" font-size="6" fill="#0A1F44" stroke="none">Угаалга</text>
                  </svg>
                </div>
                <button class="bm-btn-outline w-full !text-xs !py-2"><i data-lucide="zoom-in" class="w-3.5 h-3.5"></i> Томоор харах</button>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div>
            <h3 class="text-base font-semibold mb-4">Онцлог & Давуу талууд</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-2 card p-5">
              ${features
                .map(
                  (f) => `
                <div class="bm-feat-item">
                  <i data-lucide="${f.icon}" class="w-5 h-5"></i>
                  <div>
                    <div style="color: var(--text);">${pdEsc(f.label)}</div>
                    ${f.desc ? `<div style="color: var(--text-3); font-size: 11px;">${pdEsc(f.desc)}</div>` : ''}
                  </div>
                </div>
              `,
                )
                .join('')}
            </div>
          </div>

          <!-- Location -->
          <div>
            <h3 class="text-base font-semibold mb-3">Байршил</h3>
            <div class="grid md:grid-cols-[1fr_1.2fr] gap-4">
              <div class="card overflow-hidden" style="height: 240px; position: relative;">
                <div style="height:100%;">${mapBackground([l], { selectedId: l.id, showControls: false, showContext: false, showZoneSummary: false, interactiveZones: false })}</div>
              </div>
              <div class="card p-5">
                <div class="text-sm font-semibold mb-3">${pdEsc(propDistrict)} дүүрэг, ${pdEsc(propKhoroo)}-р хороо,<br/>${pdEsc(propProject)}</div>
                <ul class="space-y-2 text-sm" style="color: var(--text-2);">
                  ${BUS_STOPS.map((bs) => ({ bs, km: placeDistanceKm(bs, l) }))
                    .sort((a, b) => a.km - b.km)
                    .slice(0, 5)
                    .map(({ bs, km }) => {
                      const t = placeTravel(km);
                      const kmTxt = km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
                      return `<li class="flex items-center gap-2"><span style="width:6px; height:6px; border-radius:50%; background: var(--gold-brand);"></span> ${bs.name} (буудал) — <span class="num">${kmTxt}</span> · 🚶 ${t.walkMin} мин · 🚗 ${t.driveMin} мин</li>`;
                    })
                    .join('')}
                </ul>
                <button class="bm-btn-outline w-full mt-4 !text-xs !py-2">Газрын зураг дээр харах <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></button>
              </div>
            </div>
          </div>

          <!-- My Places — commute times -->
          ${renderMyPlacesCommute(l)}

          <!-- POI strip: schools, services, transport -->
          <div>
            <h3 class="text-base font-semibold mb-3">Ойролцоох сургууль, үйлчилгээ, тээвэр</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              ${pois
                .map(
                  (p) => `
                <div class="bm-poi">
                  <div class="bm-poi-icon"><i data-lucide="${p.icon}" class="w-5 h-5"></i></div>
                  <div class="min-w-0">
                    <div class="bm-poi-kind">${p.kind}</div>
                    <div class="bm-poi-name truncate">${p.name}</div>
                    <div class="bm-poi-dist">${p.dist}</div>
                  </div>
                </div>
              `,
                )
                .join('')}
            </div>
          </div>

        </div>

        <!-- SIDEBAR -->
        <aside class="space-y-4">
          <!-- Agent card -->
          <div class="bm-agent">
            <div class="text-xs font-semibold mb-3" style="color: var(--text-3);">Зарын эзэн / Зуучлагч</div>
            <div class="flex items-center gap-3 mb-4">
              <div class="bm-agent-avatar">${ag.initials}</div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold flex items-center gap-1">${ag.name} ${ag.verified ? '<i data-lucide="badge-check" class="w-4 h-4" style="color: var(--gold-brand);"></i>' : ''}</div>
                <div class="text-xs" style="color: var(--text-3);">Байр борлуулалтын менежер</div>
                <div class="flex items-center gap-2 mt-1">
                  ${ag.verified ? `<span class="text-[10px] flex items-center gap-1" style="color: var(--success);"><i data-lucide="badge-check" class="w-3 h-3"></i> Verified</span>` : ''}
                  <span class="text-[10px]" style="color: var(--gold-brand);">NEOMAP Partner</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 mb-4 text-sm">
              <span style="color: var(--gold-brand);">★★★★★</span>
              <span class="font-semibold">${ag.rating || '5.0'}</span>
              <span class="text-xs" style="color: var(--text-3);">(${ag.reviewCount || 128} үнэлгээ)</span>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4 text-center" style="border-top: 1px solid var(--border); padding-top: 14px;">
              <div>
                <div class="text-xs" style="color: var(--text-3);">Нийт зар</div>
                <div class="num text-base font-bold">${ag.listings || 152}</div>
              </div>
              <div>
                <div class="text-xs" style="color: var(--text-3);">Амжилттай борлуулалт</div>
                <div class="num text-base font-bold">96%</div>
              </div>
            </div>
            <div class="space-y-2">
              <button class="bm-btn-gold w-full" onclick="openCallAgent && openCallAgent(${ag.id})">
                <i data-lucide="phone" class="w-4 h-4"></i> Холбоо барих
              </button>
              <button class="bm-btn-navy w-full" onclick="openAgentMessage && openAgentMessage(${ag.id}, ${l.id})">
                <i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp чат
              </button>
            </div>
          </div>

          <!-- Verification badge -->
          <div class="bm-side-block flex items-start gap-3" style="border-color: rgba(201,163,95,.3);">
            <i data-lucide="shield-check" class="w-5 h-5 mt-0.5" style="color: var(--gold-brand);"></i>
            <p class="text-xs" style="color: var(--text-2); line-height: 1.55;">
              Энэхүү зар нь NEOMAP-аар баталгаажсан. Баримт бичиг болон мэдээлэл бодитой.
            </p>
          </div>

          <!-- Mortgage calculator — Bank partner aware -->
          <div class="bm-side-block">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="text-sm font-semibold">Зээлийн тооцоолуур</div>
                <div class="text-[11px]" style="color: var(--text-3);">Банк/санхүүгийн байгууллагатай хамтарсан</div>
              </div>
              <span class="pill pill-gold"><i data-lucide="handshake" class="w-3 h-3"></i> Партнёр</span>
            </div>

            <!-- Bank tabs -->
            <div class="flex flex-wrap gap-1 mb-3 p-1 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border);">
              ${BANKS.map((b) => {
                const sel = b.id === bank.id;
                return `<button onclick="setLoanBank('${b.id}')" class="text-[11px] px-2.5 py-1.5 rounded-md font-medium transition" style="${sel ? `background: ${b.color}; color: #fff;` : 'color: var(--text-2);'}">${b.short}</button>`;
              }).join('')}
            </div>

            <!-- Selected bank header -->
            <div class="flex items-start gap-2 mb-3 p-3 rounded-lg" style="background: var(--surface-2); border: 1px solid var(--border); border-left: 3px solid ${bank.color};">
              <div class="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-white" style="background: ${bank.color}">${bank.short.slice(0, 2)}</div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold">${bank.name}</div>
                <div class="text-[11px] mt-0.5" style="color: var(--text-3);">${bank.tag}</div>
                <div class="flex gap-1 mt-1">
                  <span class="num text-[10px] px-1.5 py-0.5 rounded" style="background: var(--gold-soft); color: var(--gold-brand);">${bank.rate}% жилийн</span>
                  <span class="num text-[10px] px-1.5 py-0.5 rounded" style="background: var(--surface); color: var(--text-2);">${bank.maxYears} жил хүртэл</span>
                </div>
              </div>
            </div>

            <!-- Adjustable params -->
            <div class="mb-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px]" style="color: var(--text-3);">Урьдчилгаа</span>
                <span class="num text-xs font-semibold">${downPct}% · ${fmtCompact(down)}</span>
              </div>
              <input type="range" min="${bank.minDownPct}" max="60" step="5" value="${downPct}" oninput="setLoanDown(this.value)" class="w-full accent-[var(--gold-brand)]" />
              <div class="text-[10px] mt-0.5" style="color: var(--text-3);">Доод хязгаар: ${bank.minDownPct}% (${bank.short})</div>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px]" style="color: var(--text-3);">Хугацаа</span>
                <span class="num text-xs font-semibold">${years} жил</span>
              </div>
              <input type="range" min="5" max="${bank.maxYears}" step="1" value="${years}" oninput="setLoanYears(this.value)" class="w-full accent-[var(--gold-brand)]" />
            </div>

            <div class="bm-mortgage-row">
              <span class="k">Орон сууцны үнэ</span>
              <span class="v num">${l.price.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Зээлийн дүн (${100 - downPct}%)</span>
              <span class="v num">${loan.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Жилийн хүү</span>
              <span class="v num" style="color: ${bank.color}; font-weight: 600;">${bank.rate}%</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Нийт төлөх</span>
              <span class="v num">${totalPaid.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-row">
              <span class="k">Нийт хүү</span>
              <span class="v num" style="color: var(--warning);">${totalInterest.toLocaleString('en-US')} ₮</span>
            </div>
            <div class="bm-mortgage-monthly">
              <span class="k">Сарын төлбөр (ойролцоогоор)</span>
              <span class="v num">${monthly.toLocaleString('en-US')} ₮</span>
            </div>
            <p class="text-[11px] mt-3" style="color: var(--text-3); line-height: 1.5;">
              Тооцоолол нь урьдчилсан, банкны эцсийн зөвшөөрөл/нөхцөлөөс хамаарч өөрчлөгдөнө.
            </p>
            <div class="grid grid-cols-2 gap-2 mt-3">
              <button onclick="openLoanCompare()" class="bm-btn-outline !text-xs !py-2"><i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i> Банк харьцуул</button>
              <button onclick="openLoanApplyModal('${bank.id}', ${l.id})" class="bm-btn-gold !text-xs !py-2"><i data-lucide="send" class="w-3.5 h-3.5"></i> Хүсэлт явуул</button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    ${bmFooter()}
  `;
}

