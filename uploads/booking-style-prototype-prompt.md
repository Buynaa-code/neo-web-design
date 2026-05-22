# Prompt: Mongolian Real Estate Consumer Marketplace — Interactive Prototype

> **Хэрхэн ашиглах**: Энэ файлыг бүтнээр нь Claude.ai чат руу хуулж paste хий. [PLACEHOLDER] хэсгүүдийг өөрчилж эсвэл хэвээр үлдээгээрэй.

---

## CONTEXT

This is a **consumer-facing real estate marketplace** for Mongolia — the demand side of the market. It is the counterpart to **Зууч**, which is the agent CRM (supply side). Agents using Зууч publish their listings into this marketplace, and consumers use this app to find a home to **rent** or **buy**.

The UX is modeled on **Booking.com's mechanics** — search-driven, map+list dual view, deep filtering, urgency cues, save-to-wishlist, comparable listings — but applied to real estate.

---

## YOUR ROLE

You are a senior product designer specializing in **consumer marketplaces for big-ticket purchases**. You design product experiences that feel **trustworthy when someone is about to put down their life savings on a home**, **fast to scan when comparing dozens of properties**, and **respectful of the anxiety that comes with finding a place to live**.

You are designing an interactive clickable prototype for **a Mongolian-language real estate consumer marketplace** called **"[BRAND_NAME]"** (working name: **"Орлоо"** — past tense of "Орох" = "to enter / move in"; literally means "moved in"). Alternative working names: "Орон" (a place), "Гэртээ" (at home), "Хаяг" (address).

The app has **two primary modes**:
1. **Түрээс (Rent)** — monthly rental search, lease terms 6-24 months typical
2. **Зарах (Buy)** — purchase, includes mortgage/affordability calculator

Users are Mongolian consumers:
- **Renters**: 25-40 year olds, students, young professionals, expats. Budget 600K-2M ₮/month.
- **Buyers**: 30-55 year olds, often first-time buyers or upgrading. Budget 200M-1.5B ₮ purchase.
- They search alone or with a partner; may use the app for 1-3 months before committing.
- They are mostly Mongolian-only readers; whole app must work in Mongolian.

This prototype will be shown to potential investors, real estate agents (validate listing supply side), and 10-15 real consumer interviewees. It must feel like a finished product.

---

## OUTPUT FORMAT — STRICT

- **Single HTML file artifact** (no React, no external dependencies beyond Tailwind CDN + lucide-icons + minimal vanilla JS)
- Tailwind via `<script src="https://cdn.tailwindcss.com"></script>`
- Lucide icons via CDN
- All screens in one file with `data-screen` attributes
- Single hidden navigation pill at bottom-right to jump between any screen
- **NO localStorage** — pure in-memory state
- **Mobile-first**: design for 375px width first, then scale up. Most consumer users browse on phone.
- System fonts with Mongolian Cyrillic support: `font-family: 'Inter', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;`
- **CSS override fix**: Tailwind CDN loads after inline `<style>`. Add `.screen:not(.active) { display: none !important; }` so screens with Tailwind display utilities still hide.

---

## BRAND & DESIGN SYSTEM

### Personality
- **Trustworthy** — life-changing money on the line
- **Fast & confident** — clear facts, clear next step, no decoration anxiety
- **Warm but grown-up** — buying a home is a serious adult moment
- **Mongolian-first** — every label in Cyrillic. English allowed for chain agency names ("RE/MAX"), хотхон / building names where natural ("Time Tower"), and technical terms ("CRM").
- **Honest urgency** — "Сүүлийн 24 цагт 5 хүн харсан" is fine. No "BUY NOW LAST CHANCE!".

### Color palette (use exactly these CSS variables)
```
--bg: #FAFAF6              /* warm off-white background */
--surface: #FFFFFF
--surface-2: #F4F1EA       /* hover, section backgrounds */
--border: #E8E4DA
--text: #1A1A1A
--text-2: #5C5C5C
--text-3: #9A958A
--primary: #0E5D6F         /* deep teal — calm, distance, water */
--primary-soft: #D6E8EC
--primary-dark: #094654
--accent: #E8714C          /* warm terracotta — CTA, savings */
--accent-soft: #FBE2D6
--accent-dark: #D85F3E
--gold: #C89B2A            /* premium / verified badge */
--gold-soft: #F4E9C8
--success: #2D6A4F
--warning: #B8860B
--danger: #9B2C2C
```

### Typography scale
- Hero/page titles: 28/32/40px, font-weight 600
- Card titles: 16-18px, font-weight 600
- Body: 14-15px
- Small: 12-13px
- Prices: font-weight 700, tabular-nums

### Spacing & shapes
- Border radius: 10px cards, 8px buttons, 6px inputs
- Card padding: 16-20px (denser on mobile — scannable list)

### Component specs

**Buttons**:
- Primary: `bg-[#0E5D6F] text-white` — secondary navigation
- CTA: `bg-[#E8714C] text-white` — "Үзэлт товлох", "Зочдын чатад мессеж" — the moment of action
- Secondary: outlined, `border border-[#E8E4DA] hover:bg-[#F4F1EA]`

**Rent/Buy toggle**: segmented control at top of search, large enough for thumb on mobile. Switching modes resets the price filter range.

**Property card** (most important component):
- Photo strip with prev/next + photo count badge
- Heart icon top-right (filled if saved)
- Status pill top-left: "Шинэ" (≤3 days), "Үнэ буусан" (price dropped), "Хурдан зарагдаж буй"
- Title line: district + хороо + хотхон
- Spec row: rooms · area · floor · year built
- Price block: monthly rent OR purchase price; per-m² in subtle gray
- Agent strip: small avatar + agency badge + "Баталгаажсан" (verified) check
- Urgency line (used sparingly): "Сүүлийн 24 цагт 12 хүн харсан"

**Saved-search alert badge**: gold dot on saved search row when new listings match.

**Map pins**: rounded rectangles showing price `₮420M` or `₮1.2M/сар`, viewed-state grayed, selected state filled primary.

---

## SCREENS TO DESIGN (10 screens, linked)

Each screen has `data-screen="..."` and `data-screen-label="01 Home"` etc.

### Screen 1: Home (`data-screen="home"`)
- **Top bar**: Орлоо logo, "Түрээс / Зарах" segmented toggle, profile avatar, ⌘K
- **Hero search**: full-width search card
  - Mode toggle: **Түрээс | Зарах** (radio cards)
  - Дүүрэг multi-select with chips ("Хан-Уул", "Сүхбаатар" — last picked)
  - Өрөөний тоо (1/2/3/4+, multi)
  - Үнэ range (default 600K-1.2M for Rent, 300M-600M for Buy)
  - Large CTA "Хайх" (terracotta)
- **Saved searches strip** (returning users): horizontal list of 3 saved searches with new-match counts
- **Featured хотхон row**: 6 cards (Time Tower, Encanto, Olympic Residence, Energy Residence, Sky Tower, Twin Tower) with photo, district, average price
- **Тренд** ("Энэ долоо хоногт"): 4 properties — newly listed, hot, price-dropped, ending soon
- **Browse by district**: small map of UB with clickable districts → routes to results
- **Trust band**: 4 icons — "Баталгаажсан агентууд", "Үнийн түүх", "Цуцлалт үнэгүй", "МН-аар дэмжлэг"
- **Footer** with Mongolian links

### Screen 2: Search Results (`data-screen="results"`)
- **Sticky condensed search bar**: shows current query "Түрээс · Хан-Уул, Сүхбаатар · 2-3 өрөө · 600K-1.2M₮/сар", "Засах" button
- **Result count + sort**: "342 зар олдлоо · Эрэмбэлэх: Хамгийн шинэ / Үнэ өсөх / Үнэ буурах / Үзсэн тоо"
- **Sidebar filters** (collapsible drawer on mobile):
  - Mode: Түрээс / Зарах (radio cards)
  - Үнэ: slider with histogram
  - Өрөө: 1/2/3/4+ chips
  - Талбай: slider (м²)
  - Давхар: 1-3 / 4-9 / 10+ chips
  - Дүүрэг: checkbox list with counts ("Хан-Уул (87)", "Сүхбаатар (54)")
  - Хотхон: searchable checkbox list
  - Барилгын төрөл: Хотхон / Хаус / Гэр хороолол
  - Ашиглалтанд орсон: 2020+, 2010-2020, before 2010
  - Онцлог: ☑ Тагт, ☑ Гараж, ☑ Тавилгатай, ☑ Зээлээр, ☑ Тэжээвэр амьтантай, ☑ Бэлэн орох
  - Зөвхөн: ☑ Шинэ зар, ☑ Үнэ буурсан, ☑ Видео тур
- **Main list**: 8-10 property cards (see Component specs above)
- **Filter chips above results**: applied filters as removable chips with × buttons
- **Right column**: sticky map preview with district outline + price pins. Selected pin highlights its card.
- **Mobile**: floating "Газрын зураг" button toggles full-screen map

### Screen 3: Property Detail (`data-screen="property"`)
- **Photo gallery hero**: 5-photo collage (1 large + 4 small), click "+18 зураг" badge
- **Header below gallery**:
  - District + хотхон, address, room/area summary
  - Heart icon, share icon, "Тайлан мэдэгдэх" report icon
- **Sticky tabs**: Тойм / Дэлгэрэнгүй / Байршил / Үнийн түүх / Зээл тооцоологч / Агент
- **Two-column main**:
  - **Left**: 
    - Key facts grid: Өрөө, Талбай (м²), Давхар, Ашиглалтанд орсон, Цонх, Шал, Гараж, Тагт, Тавилга, Дулаалга, Эрчим хүчний зэрэг
    - Тайлбар (description) paragraph from agent
    - Онцлог чиглэлүүд: chips listing key features ("Зээлээр авч болно", "Бэлэн орох", "Тэжээвэр амьтантай")
    - **Байршил**: small map snippet + nearby ("Метро 5 мин · Сургууль 12 мин · Эмнэлэг 8 мин")
    - **Үнийн түүх**: small line chart showing price changes ("3-р сард 450M → 5-р сард 420M, -6.7%")
    - **Зээл тооцоологч** (buy mode only): inputs for урьдчилгаа / хугацаа / хүү, computed monthly
    - **Иж төстэй зарууд**: 3-card row
  - **Right (sticky)**: 
    - Price block (large): "₮420,000,000" + "₮4,565,217 / м²"
    - Status pill: "Шинэ" + listed date
    - View counter: "Сүүлийн 7 хоногт 87 хүн харсан · 3 хүн viewing товлосон"
    - **Agent card**: avatar, name, agency, "Баталгаажсан" pill, last-active "Идэвхтэй"
    - Large CTAs:
      - **Үзэлт товлох** (terracotta) — opens scheduling modal
      - **Мессеж илгээх** (secondary)
      - **Утсаар холбогдох** (secondary, shows number)
    - Trust micro: "Бүх агент Зууч системээр баталгаажсан"
- **Mobile sticky bottom bar**: price + "Үзэлт товлох" CTA

### Screen 4: Schedule Viewing (`data-screen="schedule"`)
- **3-step modal or page**: (1) Цаг / (2) Холбоо барих / (3) Баталгаажуулалт
- **Step 1 — Огноо/цаг**: calendar grid with available slots highlighted, time chip selection (10:00 / 11:00 / 14:00 / 16:00 / 18:00)
- **Step 2 — Холбоо барих**: name, phone (+976 OTP if not logged in), email optional, message to agent textarea, optional "Гэр бүлийн хамт ирнэ" toggle
- **Step 3 — Сонголтууд**: ☑ SMS сануулга, ☑ Бусад тохирох зарыг харуулах, ☑ Үзэлт хийсний дараа сэтгэгдэл өгөх
- **Right sticky summary** (desktop): property card preview + chosen date/time

### Screen 5: Confirmation (`data-screen="confirmation"`)
- Large success: "Үзэлт товлогдлоо"
- Booking ID: copyable
- Summary card: property + date/time + agent contact
- Add to calendar buttons
- "Үзэлтэд бэлдэх 3 зөвлөгөө" — checklist (паспорт, орлогын тодорхойлолт, асуултууд)
- Next: "Миний үзэлтүүд" link

### Screen 6: My Activity (`data-screen="activity"`)
- Tabs: **Үзэлтүүд (3)** / Мессежүүд (5) / Хадгалсан (12) / Хайлт (4)
- **Виewings tab default**: list of scheduled viewings with countdown ("Маргааш 16:00 · Time Tower"), agent contact, "Чиглэл харах", "Өөрчлөх", "Цуцлах" actions
- **Messages tab**: chat list with agents (avatar, last msg, unread badge)
- Each viewing card: property thumb, dates, status pill (Баталгаажсан / Хүлээгдэж буй / Дуусгасан)

### Screen 7: Saved Lists (`data-screen="saved"`)
- Multiple named lists: "Эхний орон сууц", "Хан-Уул хайлт", "Гэр бүлд тохирох"
- Switch between lists at top with counts
- Each list: 2-3 column grid of saved property cards
- "Шинэ жагсаалт +" to create
- "Гэр бүлтэйгээ хуваалцах" (generates fake share link)
- Per-card: heart filled, "Үнэ өөрчлөгдсөн" badge if price changed since saved, "Сүүлд харсан" timestamp

### Screen 8: Saved Searches & Alerts (`data-screen="alerts"`)
- This is a key real-estate-specific feature.
- Header: "Хайлтаа хадгалаад шинэ зар гарахад мэдэгдэх"
- List of 4 saved searches as cards:
  - Each: search summary "Түрээс · 2-3 өрөө · Хан-Уул · 800K-1.2M₮", new-match count badge, alert frequency dropdown (Тэр даруй / Өдөрт нэг / Долоо хоногт нэг), edit/delete buttons
  - Toggle: SMS / Email / Push
- "Шинэ хайлт хадгалах" CTA
- Bottom: tips "Шинэ зар орох тутамд мэдэгдэл авч цаг алдахгүй"

### Screen 9: Sign In / Sign Up (`data-screen="auth"`)
- Centered card, 400px
- Tabs: Нэвтрэх / Бүртгүүлэх
- Phone (+976) + OTP 6-digit
- Social: Google, Facebook
- Trust microcopy: "Бид утасны дугаараа баталгаажуулсан үед мэдэгдэл, viewing товлох боломжтой. Хувийн мэдээллээ хадгалахгүй."
- One reason to sign up: "Хадгалсан жагсаалт + хайлтын мэдэгдэл + viewing товлолт"

### Screen 10: Profile / Account (`data-screen="profile"`)
- Header with avatar, name, phone, email
- **My preferences** card: hunting mode (Түрээс/Зарах), preferred districts, budget, alert frequency
- **Stats strip**: "12 хадгалсан · 4 хайлт · 3 viewing · 5 мессеж"
- Sections (list):
  - Хувийн мэдээлэл (name, phone, email)
  - Орлогын тодорхойлолт хавсаргах (for rental verification — optional)
  - Зээлийн чадавхи шалгалт (mortgage pre-qualification — buy mode)
  - Мэдэгдлийн тохиргоо (SMS, email, push toggles per category)
  - Нууцлал ба өгөгдөл
  - Тусламж
  - Гарах (red)

---

## DEMO NAVIGATION

Floating pill bottom-right with all 10 screens. Mobile bottom-tab bar for **Home / Saved / Activity / Alerts / Profile**.

---

## KEY UX PATTERNS TO INCLUDE

1. **Mode toggle persistence**: Түрээс/Зарах stays consistent across screens; price filters auto-adjust
2. **Map + list sync**: hovering result card highlights its map pin; clicking pin highlights card
3. **Filter chips**: applied filters as removable chips above results
4. **Heart with toast**: tapping heart on any card adds to default Saved list, with undo
5. **Saved-search recency badge**: ★ gold dot on a saved search when new matches arrive
6. **Price-drop indicator**: properties whose price has dropped since user saved them
7. **Comparable view**: "Иж төстэй зарууд" at bottom of property detail (smart matching by district + room + price ±20%)
8. **View count signal**: small "Сүүлийн 24 цагт N хүн харсан" — only when meaningfully high (>10)
9. **Smart defaults**: default mode = Түрээс (more common), default price = market median
10. **Saved-search → notification → list flow** is a major retention mechanism — design it as a clear loop

---

## REALISM REQUIREMENTS

1. **Districts**: real УБ дүүрэг (Хан-Уул, Баянзүрх, Сүхбаатар, Чингэлтэй, Сонгинохайрхан, Налайх, Багануур, Багахангай) + хороо numbers (1-32)
2. **Хотхон names**: Time Tower, Encanto, Olympic Residence, Twin Tower, Energy Residence, Sky Tower, Buyant-Ukhaa-2, Tokyo Residence, Global Garden, Riverside, Khan Palace, Royal County, Central Tower
3. **Rental prices** (₮/сар): 1-room 700K-1.5M, 2-room 1.2-2.2M, 3-room 1.8-3.5M, 4+ 2.8M-5M+. Тагт/тавилгатай дээгүүр.
4. **Buy prices**: see Зууч's м² benchmarks (Сүхбаатар ~6.25M, Хан-Уул ~4.64M, Баянзүрх ~4.44M). Multiply by area.
5. **Realistic Mongolian names** for agents: "Б. Эрдэнэбаатар", "Д. Болормаа", "Г. Энхтайван", "Ц. Сарангэрэл"
6. **Agency names**: real-feeling mix — RE/MAX Mongolia, Marco Realty, MGG, Chestertons, бие даасан агент
7. **Photos**: `https://picsum.photos/seed/{stableSeed}/800/600`
8. **No lorem ipsum**. Write specific descriptions ("Бэлэн орох, 2 жил ашиглалттай, 2 машины гараж...")
9. **Currency**: `₮420,000,000` purchase, `₮1,200,000/сар` rent — always with thousands separator and ₮ prefix
10. **Dates**: "2026 оны 5-р сарын 19" or compact "5/19"
11. **Time**: 24-hour (14:30)

---

## INTERACTIVITY EXPECTATIONS

These specific things must actually work:
- **Hайх button on home** → goes to results
- **Mode toggle (Түрээс/Зарах)** → switches everywhere + adjusts default prices
- **Property card click** → property detail
- **"Үзэлт товлох" CTA** → schedule flow
- **Schedule "Баталгаажуулах"** → confirmation
- **Heart icon** → toggles save + toast + lights up
- **Filter chips** → removable
- **Activity tab switching** → real tab content
- **⌘K command palette** → quick navigate + search listings
- **Map view toggle on mobile** → swaps list ↔ map
- **Saved-search create flow** → adds to alerts screen

---

## ANIMATION & MICRO-INTERACTIONS

- Heart: scale pop on save, smooth fill
- Photo gallery: simple crossfade
- Map pin selected state: subtle pulse
- CTA hover: color darken only
- Filter sidebar collapse: smooth height transition
- **No bouncy animations. No parallax.** Big-ticket purchase = calm.

---

## ANTI-PATTERNS — DO NOT DO

- ❌ Booking.com-style scarcity hellfire ("8 PEOPLE LOOKING NOW!")
- ❌ Stock photo of smiling families with keys
- ❌ "Limited time" deal pressure on home purchases
- ❌ Auto-playing video tours on the home page
- ❌ Cookie / GDPR popup
- ❌ Hiding fees until checkout — show commission policy upfront
- ❌ AI / GPT references
- ❌ Endless scroll on home page — keep it tight, opinionated
- ❌ Visiting hours / "Buy in 2 minutes" gimmicks — real estate is serious
- ❌ Multiple competing CTAs per screen — primary = "Үзэлт товлох", everything else is secondary

---

## DELIVERABLE CHECKLIST

- [ ] All 10 screens with `data-screen` + `data-screen-label`
- [ ] Demo nav pill works
- [ ] Mobile bottom tab bar on small viewports
- [ ] At least 15 listings, mix of Түрээс + Зарах, varied districts and price points
- [ ] 4 saved searches, 3 viewings, 12 saved listings populated
- [ ] All text in Mongolian (except chain agency names + хотхон names where natural)
- [ ] Currency, dates, phones formatted correctly
- [ ] Mode toggle (Түрээс/Зарах) actually switches data
- [ ] Mobile responsive — test mentally at 375px
- [ ] Color palette in `:root` exactly as specified
- [ ] No external dependencies beyond Tailwind CDN + Lucide
- [ ] **Looks like an app a Mongolian family would trust with finding their next home**

---

## OUTPUT NOW

Generate the complete HTML file as a single artifact. After the artifact, in a brief postscript (max 4 lines), list:
1. Which 2 screens you spent most attention on
2. One thing you'd iterate on next if given more time

---

## OPTIONAL FOLLOW-UPS (later turns)

- "Add a 'compare properties' side-by-side flow (select up to 4 from saved)"
- "Build a real mortgage calculator with adjustable rate slider + amortization preview"
- "Add neighborhood guides — clickable district pages with schools, transit, average prices"
- "Add an inquiry/offer flow for buyers — submit a non-binding offer through the platform"
- "Add a 'verified income / pre-qualified buyer' badge flow"
