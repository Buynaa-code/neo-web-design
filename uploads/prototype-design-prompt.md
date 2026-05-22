# Prompt: Mongolian Real Estate Agent CRM — Interactive Prototype

> **Хэрхэн ашиглах**: Энэ файлыг бүтнээр нь Claude.ai (Claude Opus 4.x) chat-руу хуулж paste хий. Claude single-file HTML artifact үүсгэх ёстой — таны browser-аас нээгээд customer-т demo харуулна.

---

## YOUR ROLE

You are a senior product designer specializing in B2B SaaS for emerging markets. You design tools that look **professional but warm**, **trustworthy but modern**, and that work for users who are NOT tech-savvy.

You are designing an interactive clickable prototype for **a Mongolian real estate agent CRM** called **"Зууч"** (working name; pronounced "Zooch" — means "broker/agent" in Mongolian).

This prototype will be shown to real Mongolian real estate agency owners during customer discovery interviews. It MUST feel real, not generic. It must convince agency owners to prepay 300,000₮ for a 3-month pilot before you write any backend code.

---

## OUTPUT FORMAT — STRICT

- **Single HTML file artifact** (no React, no external dependencies beyond Tailwind CDN + lucide-icons CDN + minimal vanilla JS)
- Tailwind via `<script src="https://cdn.tailwindcss.com"></script>`
- Lucide icons via inline SVG or CDN
- All screens in one file with `data-screen` attributes; click navigation via small vanilla JS
- Single hidden navigation pill at bottom-right to jump between any screen (for demo flexibility)
- **NO localStorage** — pure in-memory state
- Mobile responsive (must look good at 375px width — agents demo on their phone)
- Use **system fonts** but ensure Mongolian Cyrillic renders correctly: `font-family: 'Inter', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;`

---

## BRAND & DESIGN SYSTEM

### Personality
- **Trustworthy** — real estate involves life-changing money
- **Modern but not aggressive** — your users are 35-55 year old agency owners, not 22-year-old startup founders
- **Mongolian-first** — every label, every button, every microcopy in Mongolian (Cyrillic). English ONLY for brand name "Зууч" and technical terms like "CRM" if needed
- **Calm density** — show information without overwhelming. Agents look at this 8 hours/day

### Color palette (use exactly these CSS variables)
```
--bg: #FAFAF7              /* warm off-white background */
--surface: #FFFFFF         /* card backgrounds */
--surface-2: #F5F4EF       /* subtle hover/section background */
--border: #E8E6DF          /* hairline borders */
--text: #1A1A1A            /* primary text */
--text-2: #5C5C5C          /* secondary text */
--text-3: #8E8E8E          /* tertiary, hints */
--primary: #1B4332         /* deep forest green — trust, real estate, Mongolian steppe */
--primary-soft: #D8E5DF    /* primary tint for backgrounds */
--accent: #C4661F          /* warm terracotta — CTA, money */
--accent-soft: #F5E4D7
--success: #2D6A4F
--warning: #B8860B
--danger: #9B2C2C
--info: #2B6CB0
```

### Typography scale
- Headlines: 32/40/48px, font-weight 600
- Body: 14-16px, font-weight 400
- Small/labels: 12-13px, font-weight 500, uppercase tracking-wide for section headers
- Numbers (currency): font-weight 600, tabular-nums

### Spacing
- Generous: cards have 24px padding, sections separate by 32-48px
- Border radius: 12px for cards, 8px for buttons, 6px for inputs
- Shadows: subtle (`shadow-sm` Tailwind), never harsh

### Component specs
- **Buttons**: 
  - Primary: `bg-[#1B4332] text-white hover:bg-[#15362A]` rounded-lg px-4 py-2.5
  - Secondary: outlined, `border border-[#E8E6DF] hover:bg-[#F5F4EF]`
  - Destructive: text-only red, or `bg-[#9B2C2C]` for confirm dialogs
- **Inputs**: clean, 1px border, focus ring in primary color
- **Cards**: white surface, 1px border-[#E8E6DF], hover:shadow-sm transition
- **Status pills**: small, rounded-full, soft background + dark text

---

## SCREENS TO DESIGN (10 screens, linked)

Each screen must have a `data-screen="screen-name"` attribute. Click navigation between screens via in-page links and the demo jump menu.

### Screen 1: Landing page (`data-screen="landing"`)
- Hero: "Үл хөдлөхийн агентын ажлыг бүхэлд нь нэг газарт" (subhead about Excel → CRM)
- Sub-CTA: "14 хоног үнэгүй туршаад үзэх" (free trial)
- Social proof row: "10+ агентлаг бидэнтэй хамтран ажиллаж байна" + 4 fake logos (greyed text logos like "RE/MAX", "Marco", "MGG", "Chestertons")
- 3-column feature highlight: Listing удирдлага, Lead pipeline, Тайлан гаргалт
- Pricing snippet (3 tier cards: Free / Starter 99K₮ / Pro 199K₮)
- FAQ accordion (3 items)
- Footer with Mongolian links

### Screen 2: Signup (`data-screen="signup"`)
- Centered card, 400px wide
- Logo at top: "Зууч" in primary green
- Steps: (1) Phone number (+976 format), (2) OTP 6-digit boxes, (3) Office name + agent name
- Progressive disclosure: only show next step after current valid
- Subtle "Алдагдсан холбоо тантай хамаагүй" trust microcopy

### Screen 3: Dashboard (`data-screen="dashboard"`)
- Top bar: Logo left, search center (placeholder "Listing эсвэл lead хайх..."), user avatar dropdown right
- Left sidebar (collapsible on mobile): Dashboard, Listings, Leads, Calendar, Reports, Settings, Billing
- Main content:
  - Welcome line: "Сайн байна уу, [Бат]. Өнөөдөр 3 viewing бий."
  - 4 stat cards: Active listings, Open leads, Viewings this week, Sold this month — show actual numbers (e.g., 14 / 27 / 8 / 3)
  - "Дараагийн viewing-ууд" — list of 3 upcoming appointments today/tomorrow with listing thumbnail
  - "Шинэ lead-үүд" — last 5 leads with phone, source pill, time
  - "Анхаарал шаардсан" widget: 4 leads that haven't been contacted in 3+ days (red dot indicators)

### Screen 4: Listings list (`data-screen="listings"`)
- Top bar with breadcrumb "Listing-үүд" + "Шинэ зар" primary button
- Filter row: Status (Бүгд / Идэвхтэй / Захиалагдсан / Зарагдсан), Дүүрэг dropdown, Өрөөний тоо, Price range
- View toggle: Grid / List
- Grid mode: 3-column cards with photo, district, room count, area, price (formatted "₮250,000,000"), status pill
- Each card has small action menu (...) for Edit / Duplicate / Mark as sold
- Use realistic Mongolian data: districts (Хан-Уул, Баянзүрх, Сүхбаатар, Чингэлтэй, Сонгинохайрхан), хотхон names (Time Tower, Energy Residence, Twin Tower, Global Garden, Buyant-Ukhaa)
- 8-12 sample listings with varied room counts (1-4), area (35-180 м²), prices (180M-900M ₮)

### Screen 5: Listing detail (`data-screen="listing-detail"`)
- Header: title "Хан-Уул 15-р хороо, Time Tower хотхон, 3 өрөө 92м²"
- Hero photo gallery (5 images placeholder, use https://picsum.photos/seed/{n}/800/500)
- Sidebar right: Price ₮420,000,000, Status pill "Идэвхтэй", primary CTA "Lead болгох" + secondary "Засах"
- Tabs: Дэлгэрэнгүй / Тайлбар / Lead-үүд (5) / Үзүүлэлт (Viewings) (3) / Дотоод тэмдэглэл
- Дэлгэрэнгүй tab: 2-column grid of fields (Талбай, Давхар, Ашиглалтанд орсон он, Цонх, Хаалга, Шал, Гараж, Тагт, Төлбөрийн нөхцөл)
- Lead-үүд tab: small table of leads interested in this listing with stage pill
- Footer action bar (mobile): sticky CTA buttons

### Screen 6: Leads kanban (`data-screen="leads"`)
- 5 columns: Шинэ / Холбогдсон / Үзсэн / Хэлэлцэж буй / Дуусгасан
- Cards: lead name, phone, interested listing thumbnail, last activity time, agent avatar
- Drag indicators (but not actually draggable in prototype, just visual hint)
- "Сүүлийн 7 хоног / Сүүлийн 30 хоног" filter at top
- "+ Шинэ lead" floating button bottom-right
- Won column shows total deal value sum at bottom: "= ₮840,000,000 нийт"
- Mix of leads at different stages, ~3-5 per column

### Screen 7: Lead detail (`data-screen="lead-detail"`)
- Header: Lead name (Б. Эрдэнэбаатар), phone (+976 9911 5544), source pill (Facebook)
- Stage progress bar at top (5 nodes, current highlighted)
- Left: contact info, budget range (₮300M-450M), requirements (3 өрөө, Хан-Уул, бэлэн орох)
- Right side activity timeline:
  - Today 14:30 — Утсаар ярилаа (15 мин), interested in 2 listings
  - Today 11:00 — Viewing товлосон Time Tower 92м² (Маргааш 16:00)
  - Yesterday — Lead үүссэн (Facebook Messenger-аас)
- Quick action bar: Call / Message / Add note / Schedule viewing / Change stage
- Related listings shown as cards (3 listings matching their requirements)

### Screen 8: Calendar (`data-screen="calendar"`)
- Week view (Mon-Sun column layout)
- Time slots 9:00-19:00 in left column
- Viewings shown as colored blocks (primary green for confirmed, warning yellow for tentative, gray for completed)
- Today's date column highlighted with subtle accent background
- Click on slot opens "New viewing" sheet (visual indication only, doesn't need to actually open)
- 5-8 viewings spread across the week
- Each viewing block: listing thumbnail, lead name, duration
- Toggle top: Day / Week / Month, agent filter (Бүх агент / зөвхөн миний)

### Screen 9: Reports (`data-screen="reports"`)
- Date range picker top: "Сүүлийн 30 хоног"
- 4 big number cards: Шинэ lead-үүд (47), Viewing хийсэн (23), Хаасан хэлцэл (5), Орлого олсон (₮42M в commission)
- Funnel chart: Lead → Contacted → Viewed → Negotiated → Won (with conversion % between stages)
- Per-agent leaderboard table: 5 agents with listings count, leads converted, revenue
- Source breakdown donut chart: Facebook 45%, Unegui 28%, Walk-in 12%, Referral 10%, Other 5%
- "Excel-руу татах" button top-right

### Screen 10: Billing (`data-screen="billing"`)
- Current plan card: "Pro Plan" badge, 199,000₮/сар, "Дараагийн төлбөр: 2026-06-15"
- QR code placeholder (use a static QR-like square image) + "QPay-ээр төлөх" — show a Mongolian payment flow
- Plan comparison: 3-column (Free / Starter / Pro / Office) with checkmarks
- "Жилийн төлбөр сонгох" toggle showing "2 сар үнэгүй болно" badge
- Invoice history table: 6 past invoices with date, amount, status (Төлөгдсөн pill), download icon
- Cancel link at bottom (small, gray) "Захиалгаа цуцлах"

---

## DEMO NAVIGATION

Add a small floating pill bottom-right (z-50, always visible):
```html
<div class="fixed bottom-4 right-4 bg-white border border-[#E8E6DF] rounded-full shadow-lg px-2 py-1.5 flex gap-1 z-50">
  <!-- buttons for each screen, small icons + Mongolian label tooltip -->
</div>
```

This is for demo purposes — agency owner can quickly jump screens during the meeting.

---

## REALISM REQUIREMENTS — TAKE THESE SERIOUSLY

This prototype will be shown to real Mongolian agency owners. If anything feels fake, they will lose trust. Therefore:

1. **All names**: real Mongolian names. Б. Эрдэнэбаатар, Д. Болормаа, Г. Энхтайван, etc. Mix of male/female.
2. **All phones**: +976 followed by 8 digits starting with 8 or 9
3. **All districts**: real UB districts and хороо (1-р хороо through 32-р хороо)
4. **All хотхон names**: real ones (Time Tower, Energy Residence, Twin Tower, Olympic Residence, Global Garden, Encanto, Sky Tower, Buyant-Ukhaa-2, Tokyo Residence)
5. **All prices**: realistic. Use real 2026 м² benchmarks (Сүхбаатар ~6.25M ₮/м², Хан-Уул ~4.64M ₮/м², Баянзүрх ~4.44M ₮/м²). Multiply by area for total.
6. **Photos**: use https://picsum.photos/seed/N/800/500 placeholders (deterministic, won't break) OR https://unsplash.com/random/?apartment,interior
7. **No emoji** in any UI (Mongolian B2B doesn't use them)
8. **No lorem ipsum** anywhere
9. **Currency format**: "₮420,000,000" with thousands separators, ₮ prefix, no decimals
10. **Date format**: YYYY-MM-DD or "2026 оны 5-р сарын 19" Mongolian
11. **Time format**: 24-hour (14:30, not 2:30 PM)

---

## ANIMATION & MICRO-INTERACTIONS

Keep it minimal and tasteful:
- Hover states on cards (subtle border color change or shadow lift)
- Active nav item has primary green left border (4px wide)
- Kanban card has slight rotation on hover (1deg) to suggest draggability
- Number changes use simple count-up if you can fit it cheaply, otherwise static is fine
- No bouncy animations, no parallax, no scroll-triggered nonsense

---

## ANTI-PATTERNS — DO NOT DO

- ❌ Generic "modern dashboard" purple-blue gradients
- ❌ Stock photo of smiling diverse people on landing page
- ❌ "Trusted by 10,000+ companies" exaggerations
- ❌ Excessive iconography — use icons only when they add clarity
- ❌ Dark mode (V1 — Mongolian agents demo in daylight, light mode primary)
- ❌ Centered narrow content on wide screens (use full width with sensible max-w)
- ❌ Loading spinners or skeleton screens (this is a static prototype)
- ❌ Sound effects, video autoplay
- ❌ Cookie banner, GDPR popup (Mongolia doesn't require, distracts from demo)
- ❌ AI / GPT references anywhere (we're selling CRM, not AI)

---

## DELIVERABLE CHECKLIST

Before responding, verify:
- [ ] All 10 screens present with `data-screen` attribute
- [ ] Demo navigation pill works
- [ ] At least 8 listings, 12 leads, 5 viewings populated with realistic data
- [ ] All text in Mongolian (except brand "Зууч")
- [ ] Currency, dates, phones formatted correctly
- [ ] Mobile responsive (test mentally at 375px)
- [ ] Color palette exactly as specified (CSS variables defined in `:root`)
- [ ] No external dependencies beyond Tailwind CDN and Lucide icons
- [ ] Click navigation between screens works
- [ ] Looks like something an agency owner would happily pay 99K₮/month for

---

## OUTPUT NOW

Generate the complete HTML file as a single artifact. Do NOT explain what you did before/after the code. Output ONLY the artifact.

After the artifact, in a brief postscript (max 4 lines), list:
1. Which 2 screens you spent most attention on
2. One thing you'd iterate on next if given more time
