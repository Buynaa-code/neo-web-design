# NEOMAP — Дутуу API-уудын тодорхойлолт (backend-д нэмэх)

> Энэ баримт нь web UI-г **бүрэн** ажиллуулахад одоогийн backend дээр **байхгүй**, тиймээс шинээр
> бичих шаардлагатай API endpoint-уудын тодорхойлолт юм. Бүгд одоо зөвхөн **локал store
> (localStorage)** дээр ажиллаж байгаа feature-үүд.
>
> **Конвенц** (одоо байгаа API-тай нэгдсэн байх ёстой):
> - Base URL: `http://core.neomap.mn/api`
> - Auth: **Bearer token** (`Authorization: Bearer <token>`) — бүгд 🔒 нэвтрэлт шаардана.
> - Жагсаалт: `{ data: [...], meta: { current_page, last_page, per_page, total } }` (одоогийн paginator-тай адил).
> - Огноо: ISO 8601 (`2026-06-19` эсвэл `2026-06-19T16:00:00Z`).
> - `listing_id` нь одоо байгаа `/listings/{id}`-тэй холбогдоно.

---

## Нэг харцаар — нэмэх ёстой 8 модуль

| # | Модуль | UI хуудас | Үндсэн endpoint-ууд |
|---|--------|-----------|---------------------|
| A | Хадгалсан / Favorites | `/saved` | `GET/POST/DELETE /favorites`, `/saved-lists` CRUD |
| B | Хадгалсан хайлт + Сэрэмжлүүлэг | `/saved`, `/alerts` | `/saved-searches` CRUD, `/alerts` |
| C | Цаг товлох / Appointments | `/schedule` | `/appointments` CRUD |
| D | Үзсэн түүх / Activity | `/activity` | `GET/POST /views` |
| E | Чат / Мессеж | `/activity` (мессеж) | `/conversations`, `/messages` |
| F | Сонирхол / Preferences | `/interests` | `GET/PUT /preferences` |
| G | Түрээсийн удирдлага | `/rental-mgmt` | `/rental/tenants`, `/rental/contracts`, `/rental/income` |
| H | Мэдээ / Articles | `/news` | `GET /articles` |

---

## A. Хадгалсан зар / Favorites — `/saved`

Хэрэглэгчийн "зүрх" дарж хадгалсан зарууд, мөн нэртэй жагсаалт (list) болгон бүлэглэх.

### A1. Favorite зарууд
```
GET    /favorites              🔒  → { data: [ListingResource], meta }   # хадгалсан бүх зар
POST   /favorites              🔒  body: { listing_id }                  → 201
DELETE /favorites/{listing_id} 🔒                                        → 204
```

### A2. Нэртэй жагсаалт (Saved lists)
UI бүтэц: `{ id, name, icon, listingIds[] }`
```
GET    /saved-lists                          🔒  → { data: [SavedList] }
POST   /saved-lists                          🔒  body: { name, icon }              → SavedList
PUT    /saved-lists/{id}                      🔒  body: { name?, icon? }            → SavedList
DELETE /saved-lists/{id}                      🔒                                    → 204
POST   /saved-lists/{id}/items                🔒  body: { listing_id }              → 201   # жагсаалтад нэмэх
DELETE /saved-lists/{id}/items/{listing_id}   🔒                                    → 204   # жагсаалтаас хасах
```
**SavedList resource:** `{ id, name, icon, listing_ids: number[], listings_count }`

---

## B. Хадгалсан хайлт + Сэрэмжлүүлэг — `/saved`, `/alerts`

Хэрэглэгч хайлтын шүүлтүүрээ хадгалж, тохирох шинэ зар гарахад мэдэгдэл авна.

### B1. Saved searches
UI бүтэц: `{ id, mode, name, districts[], rooms[], priceRange[min,max], newMatches, alertFreq, sms, email, push, lastAlert }`
```
GET    /saved-searches        🔒  → { data: [SavedSearch] }
POST   /saved-searches        🔒  body ↓                          → SavedSearch
PUT    /saved-searches/{id}   🔒  body ↓                          → SavedSearch
DELETE /saved-searches/{id}   🔒                                  → 204
```
**Request/Resource body:**
```jsonc
{
  "mode": "rent | sale",
  "name": "Эхний орон сууц",
  "filters": {                       // /listings GET query-тэй ижил түлхүүр
    "districts": ["Хан-Уул"],
    "rooms": [2, 3],
    "price_min": 1200000,
    "price_max": 2000000
  },
  "alert_freq": "instant | daily | weekly",
  "channels": { "sms": true, "email": true, "push": true }
}
```
**Resource нэмэлт (server тооцоолно):** `new_matches: number`, `last_alert_at: datetime|null`.

### B2. Alerts (сэрэмжлүүлгийн дэлгэц)
Хадгалсан хайлтуудаас үүсэх "шинэ тохирох зар" мэдэгдлүүд.
```
GET    /alerts                🔒  → { data: [Alert], meta }   # ?unread=1 шүүлттэй
PATCH  /alerts/{id}/read      🔒                              → 200   # уншсан гэж тэмдэглэх
POST   /alerts/read-all       🔒                              → 200
```
**Alert resource:** `{ id, saved_search_id, listing_id, listing: ListingResource, created_at, read_at }`

---

## C. Цаг товлох / Appointments — `/schedule`

Зар үзэх цаг товлох (UI: `Viewing` — `{ listingId, date, time, status, note, outcome }`).
```
GET    /appointments              🔒  → { data: [Appointment], meta }   # ?status=upcoming|past
POST   /appointments              🔒  body ↓                            → Appointment (201)
PATCH  /appointments/{id}         🔒  body: { date?, time?, status?, note? }  → Appointment
DELETE /appointments/{id}         🔒                                     → 204   # цуцлах
```
**Request body:**
```jsonc
{ "listing_id": 12, "date": "2026-06-20", "time": "16:00", "note": "Гэр бүлийн хамт" }
```
**Appointment resource:**
```jsonc
{
  "id": 1, "listing_id": 12, "listing": { /* ListingResource */ },
  "agent_id": 1,
  "date": "2026-06-20", "time": "16:00",
  "status": "pending | confirmed | completed | cancelled",
  "note": "...", "outcome": "...",          // outcome зөвхөн completed үед
  "created_at": "..."
}
```
> UI-ийн `dayLabel`/`countdown` нь client талд `date`-аас тооцоологдоно — backend буцаах шаардлагагүй.

---

## D. Үзсэн түүх / Activity — `/activity`

Хэрэглэгчийн саяхан үзсэн зарууд (UI: `viewedIds[]`).
```
GET    /views    🔒  → { data: [ListingResource], meta }   # сүүлд үзсэн дарааллаар
POST   /views    🔒  body: { listing_id }                  → 200   # зар нээх бүрд бичигдэнэ
```
> Эсвэл нэгдсэн `GET /activity` — appointments + alerts + views-ийг нэг feed болгон буцааж болно
> (timeline хэлбэрийн дэлгэцэд тохиромжтой): `{ data: [{ type, ref_id, payload, created_at }] }`.

---

## E. Чат / Мессеж — `/conversations`, `/messages`

Хэрэглэгч ↔ агент хоорондын харилцаа (UI: `Message` — `{ agentId, lastMsg, time, unread, listingId }`).
```
GET    /conversations                    🔒  → { data: [Conversation] }
GET    /conversations/{id}/messages       🔒  → { data: [Message], meta }
POST   /conversations/{id}/messages       🔒  body: { body }            → Message (201)
POST   /conversations                     🔒  body: { agent_id, listing_id, body }  → Conversation
PATCH  /conversations/{id}/read           🔒                            → 200
```
**Conversation:** `{ id, agent_id, agent: {...}, listing_id, last_message, last_message_at, unread_count }`
**Message:** `{ id, conversation_id, sender: "customer|agent", body, created_at, read_at }`

---

## F. Сонирхол / Preferences — `/interests`

Хэрэглэгчийн амьдралын хэв маяг / сонголтын профайл (зар санал болгоход ашиглана).
```
GET    /preferences    🔒  → Preferences
PUT    /preferences    🔒  body ↓   → Preferences
```
**Resource/Request:**
```jsonc
{
  "lifestyle": "family | young-pro | student | investor",
  "vibes": ["downtown", "park-near"],
  "bedrooms": [2, 3],
  "bathrooms_min": 1,
  "needs_office": true,
  "must_haves": ["parking", "elevator"],
  "purpose": "live | invest",
  "conditions": ["renovated", "has_certificate"],
  "notification_channels": ["app", "email"]
}
```
> Сонголтын боломжит утгууд (lifestyle/vibe/must-have/condition жагсаалт) аль хэдийн client-д
> hardcode байгаа — эдгээрийг ирээдүйд `/listings/form-options`-той адил metadata endpoint-оор
> өгвөл бүр сайн (`GET /preference-options`).

---

## G. Түрээсийн удирдлага — `/rental-mgmt`

Түрээслүүлэгчийн самбар: түрээслэгч, гэрээ, орлого.
```
GET    /rental/tenants        🔒  → { data: [RmTenant] }
POST   /rental/tenants        🔒  → RmTenant
PUT    /rental/tenants/{id}   🔒  → RmTenant
DELETE /rental/tenants/{id}   🔒  → 204

GET    /rental/contracts      🔒  → { data: [RmContract] }
POST   /rental/contracts      🔒  → RmContract
PUT    /rental/contracts/{id} 🔒  → RmContract

GET    /rental/income         🔒  → { data: [RmIncomeMonth] }   # ?year=2026 сараар нэгтгэсэн
```
**RmTenant:** `{ id, name, listing_id, phone, lease_start, lease_end, rent_amount, status, ... }`
**RmContract:** `{ id, tenant_id, listing_id, start, end, amount, status, ... }`
**RmIncomeMonth:** `{ month, expected, received, ... }`
> Талбаруудыг `src/infrastructure/data/rental-mgmt.ts`-ийн бодит бүтцээс авч тодотгоно.

---

## H. Мэдээ / Articles — `/news`

Мэдээний дэлгэц (одоо бүрэн mock).
```
GET    /articles            → { data: [Article], meta }   # нийтийн, auth шаардлагагүй
GET    /articles/{slug}     → Article
```
**Article:** `{ id, slug, title, excerpt, body, cover_image, category, published_at }`

---

## Хэрэгжүүлэх дараалал (санал)

1. **A. Favorites + B. Saved searches/Alerts** — хэрэглэгчид хамгийн ихээр харагдах, хамгийн их хүсэлттэй.
2. **C. Appointments** — арилжааны гол үнэ цэнэ (агенттай холбох).
3. **D. Views / E. Messages** — engagement.
4. **F. Preferences** — recommendation сайжруулна.
5. **G. Rental / H. News** — тусдаа модуль, сүүлд.

> Backend эдгээрийг нэмсэний дараа web тал дээр хийх ажил: `src/infrastructure/api/`-д шинэ модуль
> (`favorites.ts`, `saved-searches.ts`, `appointments.ts` ...), `src/application/queries/`-д TanStack
> hook-ууд бичээд, холбогдох дэлгэцүүдийн локал store-уудыг сольж бодит API руу шилжүүлнэ.

---

_Үүсгэсэн: 2026-06-19. Эх сурвалж: одоогийн локал store/data бүтэц + `docs/api-integration-map.md`._
