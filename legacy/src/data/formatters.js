/* ============== NEOMAP FORMATTERS — price, area, time, mortgage ============== */

function fmtFullPrice(n, mode) {
  const base = n.toLocaleString('en-US') + '₮';
  return mode === 'rent' ? base + '/сар' : base;
}

/* m² rate: full integer formatted */
function listingPpm(l) { return Math.round(l.price / l.area); }
function fmtPpm(l) { return listingPpm(l).toLocaleString('en-US') + '₮/м²'; }

/* Listing flags (synthesized from data — keeps mock data minimal) */
function isListingVerified(l) {
  const ag = AGENTS.find(a => a.id === l.agentId);
  return !!(ag && ag.verified);
}
function hasIpoteh(l) {
  return (l.features || []).some(f => /Зээ?л|Ипотек/i.test(f)) || l.mode === 'sale';
}
function isNewProject(l) { return l.year >= 2022 || l.status === 'new'; }
function listingTimeAgo(l) {
  const d = l.listedDays || 0;
  if (d === 0) return 'Дөнгөж сая';
  if (d === 1) return '1 хоногийн өмнө';
  if (d < 7) return d + ' хоногийн өмнө';
  if (d < 30) return Math.floor(d/7) + ' долоо хоногийн өмнө';
  return Math.floor(d/30) + ' сарын өмнө';
}
/* Минут-аар сүүлийн зар хэдийгээр өмнө орсныг харуулна.
   listedDays>0 бол хоног, өнөөдрийн зар бол синтетик минут/цаг. */
function listingMinutesAgo(l) {
  const d = l.listedDays || 0;
  if (d > 0) return listingTimeAgo(l);
  const seed = (l.id * 17 + l.photos * 5) % 240;
  if (seed < 60) return Math.max(1, seed) + ' минутын өмнө';
  return Math.floor(seed/60) + ' цагийн өмнө';
}

/* Property orientation (Баруун харсан / Зүүн / Урд / Хойд) — deterministic from lat */
function listingOrientation(l) {
  const opts = ['Баруун харсан', 'Зүүн харсан', 'Урд харсан', 'Хойд харсан'];
  return opts[(l.id + l.photos) % opts.length];
}
function listingHeating(l) {
  return l.year >= 2018 ? 'Төвийн халаалт' : 'Зуухтай';
}


function mortgageMonthly(price, downPct = 30, years = 20, annualRate = 12) {
  const loan = price * (1 - downPct/100);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(loan / n);
  const m = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
  return Math.round(m);
}

function fmtSale(n) { return '₮' + n.toLocaleString('en-US'); }
function fmtRent(n) { return '₮' + n.toLocaleString('en-US') + '/сар'; }
function fmtCompact(n) {
  if (n >= 1000000000) return '₮' + (n/1000000000).toFixed(2) + 'тэрбум';
  if (n >= 1000000) {
    const v = n / 1000000;
    return '₮' + (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'сая';
  }
  if (n >= 1000) return '₮' + Math.round(n/1000) + 'мянган';
  return '₮' + n;
}
function fmtPinPrice(n, mode) {
  if (mode === 'rent') return '₮' + (n/1000).toFixed(0) + 'к';
  if (n >= 1000000000) return '₮' + (n/1000000000).toFixed(1) + 'тэр';
  return '₮' + (n/1000000).toFixed(0) + 'M';
}
function fmtMapPinPrice(l) {
  const n = Number(l.price) || 0;
  if (l.mode === 'rent') {
    if (n >= 1000000) return '₮' + (n/1000000).toFixed(1).replace(/\.0$/, '') + 'M/сар';
    return '₮' + Math.round(n/1000) + 'K/сар';
  }
  if (n >= 1000000000) return '₮' + (n/1000000000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + 'тэр';
  return '₮' + Math.round(n/1000000) + 'M';
}
function fmtListingArea(area) {
  const n = Number(area);
  if (!Number.isFinite(n) || n <= 0) return '';
  return (Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, '')) + 'м²';
}
function fmtMapPinMeta(l) {
  const area = fmtListingArea(l.area);
  return [l.rooms ? l.rooms + 'ө' : '', area].filter(Boolean).join(' · ');
}
function fmtPinPpm(l) {
  if (!l.area || l.area <= 0) return fmtPinPrice(l.price, l.mode);
  const ppm = l.price / l.area;
  if (l.mode === 'rent') return '₮' + Math.round(ppm/1000) + 'к/м²';
  if (ppm >= 1000000) return '₮' + (ppm/1000000).toFixed(1) + 'M/м²';
  return '₮' + Math.round(ppm/1000) + 'к/м²';
}
function listingPrice(l) { return l.mode === 'rent' ? fmtRent(l.price) : fmtSale(l.price); }
function listingPriceShort(l) { return l.mode === 'rent' ? fmtCompact(l.price) + '/сар' : fmtCompact(l.price); }

function formatAddressLine(addr) {
  if (!addr) return '';
  const parts = ADDRESS_LEVELS.map(lvl => addr[lvl.key]).filter(v => v && String(v).trim() !== '');
  return parts.join(', ');
}

/* ============== 3. ЦОНХНЫ 8 ЧИГЛЭЛ ============== */

function calcBrokerageFee({ typeKey, totalPrice, rightForm = 'open', urgent = false }) {
  const tier = (totalPrice >= 1000000000) ? 'above1bn' : 'below1bn';
  const row  = (BROKERAGE_FEE_MATRIX[typeKey] || BROKERAGE_FEE_MATRIX.other)[tier];
  const base = (rightForm === 'exclusive') ? row.inclVAT : row.agreed;
  const pct  = base + (urgent ? row.urgentExtra : 0);
  return { tier, pct, amount: Math.round(totalPrice * pct / 100) };
}

