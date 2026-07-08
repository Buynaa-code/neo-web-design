# NEOMAP — Backend API шаардлага (зар оруулах wizard)

> **Огноо:** 2026-07-02 · **Хамрах endpoint:** `POST /listings`, `PUT /listings/{id}`,
> `PATCH /listings/{id}/draft`, `POST /media`, `GET /listings/form-options`,
> address cascade (`/address/*`).
>
> Энэ баримт нь 2 хэсэгтэй:
> **A.** Frontend одоо юу илгээж/хүлээж байгаа (backend хүлээж авдаг байх ёстой).
> **B.** Backend дээр ДУТУУ, шинээр нэмэх шаардлагатай зүйлс (эрэмбэтэй).
>
> `StoreListingRequest`/`UpdateListingRequest` нь 120 талбартай бөгөөд доорхийн ихэнхийг
> **аль хэдийн дэмждэг**. Зөвхөн B хэсгийн зүйлс дутуу байна.

---

## 🔴🔴 2026-07-08 ШИНЭ РЕГРЕСС — `khoroo_id` FK constraint бүх ID-д эвдэрсэн (яг өнөөдөр ажиллаж байсан)

Жинхэнэ хэрэглэгчийн (`customer_id: 82`) зар нийтлэх оролдлого дараах алдаагаар бүтэлгүйтэв:

```
SQLSTATE[23000]: Integrity constraint violation: 1452 Cannot add or update a child row:
a foreign key constraint fails (`property_prod`.`listings`,
CONSTRAINT `listings_khoroo_id_foreign` FOREIGN KEY (`khoroo_id`) REFERENCES `khoroos` (`id`)
ON DELETE SET NULL)
```

`khoroo_id: 174` ("19-р хороо", Хан-Уул дүүргийн `district_id: 8`) нь **яг
`GET /address/khoroos?district_id=8`-ийн буцаасан жагсаалтаас сонгосон бодит утга** — frontend
тал буруу/хуучирсан id илгээгээгүй. Гэвч `khoroos` хүснэгтэд тухайн ID-тай мөр байхгүй байна.

**Энэ зөвхөн тэр нэг ID дээр биш — бүх khoroo_id-д ажиллахгүй болсон, тэр дундаа ӨНӨӨДӨР
ЭРТ ажиллаж байсан ID-ууд ч орно:**

| Шалгасан | Өнөөдрийн эрт | Одоо |
|---|---|---|
| `district_id:1, khoroo_id:4` (Багануур) | ✅ 201 (энэ session-д баталгаажсан) | ❌ 500 FK |
| `district_id:7, khoroo_id:141` (Сүхбаатар) | ✅ 201 (энэ session-д баталгаажсан) | ❌ 500 FK |
| `district_id:8, khoroo_id:156` (Хан-Уул, жагсаалтын эхний зүйл) | — | ❌ 500 FK |
| `district_id:8`, khoroo_id огт байхгүй | — | ✅ 201 |

Энэ бол **шинэ регресс** — өнөөдрийн эрт ажиллаж байсан яг ижил ID-ууд одоо бүгд FK constraint-
д унаж байна. Хамгийн магадлалтай шалтгаан: `khoroos` хүснэгтийг арын ажил (migration/reseed)
дахин бүтээсэн (шинэ ID-тайгаар), гэвч `GET /address/khoroos` endpoint нь хуучин/өөр эх сурвалж
(кэш эсвэл өөр view)-аас league хэвээр уншиж байгаа тул хэрэглэгчид сонгосон ID нь бодит
хүснэгттэй таарахгүй байна.

**Backend-ээс шалгах ёстой зүйл:**
1. `khoroos` хүснэгтийн бодит мөрүүд (`SELECT id FROM khoroos LIMIT 10`) `/address/khoroos`
   endpoint-ийн буцаадаг ID-тай таарч байгаа эсэх.
2. Хэрэв саяхан `khoroos`-ийг дахин seed/migrate хийсэн бол, `/address/khoroos` endpoint-ийг
   мөн шинэчлэгдсэн эсэхийг баталгаажуулах.
3. Түр зуурын workaround болгож frontend `khoroo_id`-г огт илгээхгүй байхыг зөвлөж болох ч,
   энэ нь хэрэглэгчийн бодит сонгосон хороог алдагдуулна — яаралтай засах шаардлагатай.

---

## 🟡 2026-07-08 CORS — localhost-д ЗАСАГДСАН, production домэйнд хараахан үгүй

Анх илрүүлсэн (доорх түүхэн бичлэг): `core.neomap.mn` ямар ч origin-д `Access-Control-Allow-
Origin` буцаадаггүй байсан тул browser-ийн ямар ч API дуудлага ажиллахгүй байсан.

**Шинэчлэлт (мөн өдрийн дараа хэсэгт):** `localhost:3000`-оос дуудахад одоо **ажиллаж байна**:
```bash
curl -s -I -H "Origin: http://localhost:3000" "https://core.neomap.mn/api/address/provinces" \
  | grep -i "access-control"
# → Access-Control-Allow-Origin: http://localhost:3000
# → Access-Control-Allow-Credentials: true
```
Chrome дээр шууд баталгаажуулав: `fetch('https://core.neomap.mn/api/address/provinces')`
одоо `200`-тай бодит дата буцаадаг болсон, wizard-ын Хот/Аймаг/Дүүрэг/Хороо dropdown-ууд
бодит датаар бөглөгдөж байна.

**Гэхдээ production домэйн (`hdlh.vercel.app`) хараахан жагсаалтад ороогүй:**
```bash
curl -s -I -H "Origin: https://hdlh.vercel.app" "https://core.neomap.mn/api/address/provinces" \
  | grep -i "access-control"
# → хоосон (Access-Control-Allow-Origin ирэхгүй) — production дээр хэвээр эвдэрхий байх магадлалтай
```

**Backend-ээс хүссэн зүйл:** `config/cors.php`-ийн `allowed_origins` жагсаалтад
**production домэйн (`hdlh.vercel.app`) нэмэх мартагдсан бололтой** — localhost-г нэмсэн бол
production-ийг мөн адил нэмнэ үү.

<details><summary>Анхны илэрсэн асуудал (localhost-д засагдсан, production-д хараахан)</summary>

`core.neomap.mn`-ийн ямар ч endpoint (жишээ нь `GET /address/provinces`) хэзээ ч
`Access-Control-Allow-Origin` header буцаадаггүй байсан — `localhost:3000`, production домэйн,
тэр байтугай Origin header-гүй хүсэлт ч гэсэн адилхан. `Vary: Origin` header ирдэг нь CORS
middleware ажиллаж байгааг харуулж байгаа ч, allow origin-ийг хэзээ ч буцаадаггүй байв.
Node/curl-аар шалгахад бүгд 200 амжилттай байсан тул (энэ session-ий бусад бүх шалгалт
node fetch/curl ашигласан) энэ асуудлыг эхэндээ илрүүлээгүй байсан — зөвхөн Chrome дээр бодит
click-through тест хийхэд олдсон.

</details>

---

## 🔴 2026-07-08 ШИНЭ БЛОКЛОГЧ BUG — `province_id` баганагүй тул `POST/PUT /listings` 500 өгдөг

Video upload тест хийх явцад санамсаргүйгээр илэрсэн, **video-той огт хамааралгүй** — аль ч
listing create/update дээр `province_id`-г payload-д оруулбал 500 өгнө:

```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'province_id' in 'field list'
(insert into `listings` (... `province_id`, `district_id`, `khoroo_id`, ...))
```

`district_id`/`khoroo_id`-г ганцаараа явуулбал хэвийн ажилладаг (`201`) — зөвхөн `province_id`
багана `listings` хүснэгтэд байхгүй (migration хийгдээгүй бололтой), гэхдээ `AddressCascade`-ийн
эхний шат (`province_id`) **үргэлж** create/update payload-д ордог тул **энэ бол бодит хэрэглэгчид
зар нийтлэхэд яг одоо тааралдах болзошгүй production bug**.

**Түр зуурын workaround хийлээ (frontend):** `list-property-wizard.tsx`-ийн `buildCreateRequest`-ээс
`province_id`-г бүрмөсөн хассан (`district_id`/`khoroo_id`/бусад cascade id-ууд хэвээрээ явна) —
backend багана нэмэгдмэгц буцааж нэмнэ.

**Backend-ээс хүссэн зүйл:** `listings` хүснэгтэд `province_id` (nullable, FK → provinces) багана
нэмэх migration ажиллуулах.

**Repro (curl-гүй, node fetch — хамгийн энгийн):**
```js
// /auth/register-ээр token аваад:
fetch(`${BASE}/listings`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ ...validMinimalListingPayload, province_id: 1 }),
});
// → 500, "Unknown column 'province_id' in 'field list'"
// Ижил payload-аас `province_id`-г хасаад, эсвэл зөвхөн `district_id: 1` явуулбал → 201.
```

---

## 🟡 2026-07-08 нэмэлт баталгаажуулалт — video upload+create pipeline ажиллаж байна (гэхдээ 1 мэдэгдэж буй зөрүүтэй)

Zar oруулах wizard-д видео upload+тоглуулах feature нэмэхийн өмнө live тест бичиж шалгав
(`tests/api/listing-video.e2e.test.ts`, `NEOMAP_E2E=1`-ээр ажиллана):

- ✅ `POST /media` `category: "video"`-гоор бичлэг (`video/mp4`) upload хийж чадна.
- ✅ Listing create/update дээр `photos: { video: [url] }` (URL хэлбэрээр) явуулбал `GET`-ийн
  readback-д яг тэр URL хадгалагдана.
- ⚠️ **`video_ids: [mediaId]` ганцаараа `photos.video`-г бөглөдөггүй** — энэ нь **шинэ асуудал биш**,
  `list-property-wizard.tsx`-ийн `buildMediaPayload()`-ийн орчинд аль хэдийн бичигдсэн (мөр
  323-324): "the backend does NOT auto-populate ListingResource.photos from the linked ids".
  Wizard үүнийг мэддэг тул `*_image_ids[]`/`video_ids`-тэй ХАМТ үргэлж `photos: {group: [url]}}`-ийг
  ч бас илгээдэг (upload хийсэн ч, URL/seed-ээр орсон ч ялгаагүй) — тиймээс UI талд асуудалгүй.
  Гэхдээ **ирээдүйд хэн нэгэн зөвхөн `*_ids` илгээхээр хялбарчлах гэж оролдвол** энэ дахин эвдэрнэ —
  тест үүнийг хамгаалж байна.

---

## ⚡ 2026-07-03 live тестийн шинэчлэл (production дээр бодит бичилтээр)

`document.json` (шинэ spec) гарсны дараа live smoke test хийж дараах зүйлсийг **батлав**:

**Хийгдсэн / нээгдсэн:**
- ✅ **`GET /listings/tags?group=amenities|included|infrastructure&q=`** ажиллаж байна (B#7). Frontend
  custom-tag санал болголтыг үүн рүү холбосон. (Одоохондоо `data: []` — өгөгдөл ороогүй.)
- ✅ **`POST /media` category-д `brochure`/`document`/`certificate` нэмэгдсэн** (B#2). `StoreListingRequest`-д
  `brochure_ids`, `document_ids` link талбарууд байна. Frontend PDF upload + линк хийсэн.
- ✅ Custom string tag (`amenities: ["balcony","Миний нэмсэн"]`) `POST /listings`-д **хадгалагдана** — A-контракт зөв.

**Шинэ асуудал (backend анхаарах):**
- 🔴 **B#6 (lat/lng) ХАГАС л зассан.** `POST /listings/register` нь WGS84 lat/lng-г (47.9077/106.8832)
  **хадгалдаг болсон**. Гэвч **`POST /listings` (үндсэн create) нь lat/lng-г ХЭВЭЭР УСТГАДАГ** (GET-д `lat:null`).
  Wizard баялаг өгөгдлийн улмаас `POST /listings`-г ашигладаг тул **`POST /listings`-д lat/lng WGS84-ээр
  нэмэх шаардлагатай** хэвээр байна. Одоо frontend зөвхөн `google_map_link`-ээр байршил дамжуулна.
- 🔴 **`POST /listings/register` нь lossy** — amenities, infrastructure, included_items, certificate_status,
  commissioned_status, төлбөрийн нөхцөл, VAT-г **хадгалдаггүй** (тест: бүгд хоосон/null). Тиймээс wizard
  register руу шилжсэнгүй, `POST /listings`-д үлдсэн. Хэрэв register-ийг үндсэн болгох бол дээрх талбаруудыг
  нэмэх ёстой.
- 🔴 **Хаягийн cascade өөрчлөгдсөн ба хоосон.** Шинэ бүтэц:
  `province → district(province_id) → khoroo(district_id) → {street, khoroolol, khotkon, building}(khoroo_id)`.
  Хуучин `/address/{countries,cities,zipcodes,complexes,building-blocks}` **устсан**;
  `districts` param `city_id`→**`province_id`** болсон. Frontend-г шинэ cascade руу шилжүүлсэн.
  **ГЭХДЭЭ `GET /address/provinces` одоо `[]` буцаана — хүснэгтүүд seed хийгдээгүй.** Seed хийх шаардлагатай.
  Мөн `ListingResource.addressMasterIds` нь `{provinceId, districtId, khorooId, khoroololId, khotkonId,
  streetId, buildingId}` буцаадаг тул create payload-д `province_id/district_id/khoroo_id/khoroolol_id/
  khotkon_id/street_id/building_id` илгээхээр шинэчилсэн.

---

## A. Frontend одоогийн payload (backend анхаарах контракт)

Эдгээр нь одоо ажиллаж байгаа тул backend validation нь эдгээрийг **татгалзахгүй** байх ёстой:

| Талбар | Төрөл | Тэмдэглэл |
|--------|-------|-----------|
| `amenities[]`, `included_items[]`, `infrastructure[]` | `string[]` | **Дурын string** хүлээж авна — хэрэглэгчийн нэмсэн custom tag багтана (07/08 «Өөрийн сонголт нэмэх»). Урьдчилан тодорхойлсон enum-оор хатуу шалгаж болохгүй. |
| `infrastructure[]` дотор Internet/IPTV | `string[]` | Олон провайдер (multi-select): жишээ `["Univision","Mobinet"]`. |
| `infrastructure[]` дотор «Бусад» | `string` | Хэрэглэгч чөлөөт текст бичиж болно (жишээ цахилгаан/халуун усны «Бусад: дизель+нар»). |
| `total_price` / `monthly_total_price` | `integer` | Frontend таслалгүй **цэвэр бүхэл тоо** илгээнэ (UI дээр л 450,000,000 гэж харагдана). |
| `selected_floor` | `string` | Нэг давхар «F01» ЭСВЭЛ **давхрын муж «F01-F02»** (нэгж олон давхарт). Хатуу нэг утгаар шалгаж болохгүй. |
| `room_details[]` | `object[]` | Өрөө бүр: `{ typeKey/label, floor, area, windows, tags[], note }`. `floor` нь нэгжийн сонгосон давхруудын нэг. |
| `commissioned_status` + (`commissioned_year` ЭСВЭЛ `expected_commission_date`) | — | «Ашиглалтад орсон» бол он, ороогүй бол огноо. Нэгээс нь л ирнэ. |
| `certificate_status` | `string` | «Ашиглалтад ороогүй» үед `certificate_ready` (Бэлэн гэрчилгээ) **ирэхгүй** (frontend хориглосон). |
| `google_map_link` | `string` | Газрын зураг дээр цэг тавихад **автоматаар** `https://www.google.com/maps?q=<lat>,<lng>` үүснэ. |
| `vat_included`, `provides_vat_ebarimt` | `boolean` | НӨАТ / и-баримт. |

---

## B. Backend дээр ДУТУУ (нэмэх шаардлагатай)

### 1. Түрээсийн гэрээлэх хугацаа (lease term) — Өндөр
Түрээсийн зар дээр «гэрээлэх хугацаа» талбар одоо байхгүй.
```
min_lease_months   integer|null
max_lease_months   integer|null   # null = хязгааргүй
# эсвэл:
lease_term_months  integer|null
lease_term_note    string|null
```
`mode=rent` үед хамаарна. Гаралт: `minLeaseMonths`/`maxLeaseMonths` (camelCase).

### 2. Медиа — брошур/танилцуулга/гэрчилгээ (PDF/document) — Дунд
Одоо `POST /media` зөвхөн зураг/бичлэг (jpeg/png/webp ≤8MB, mp4/webm ≤100MB). Дараах хэрэгтэй:
- **Танилцуулга/брошур** файл (ихэвчлэн PDF).
- **Гэрчилгээ / гэрээ хавсаргах** файл (одоо зөвхөн toggle flag).
```
# form-options.enumOptions.photo_categories (эсвэл шинэ media_categories):
brochure | document | certificate
# POST /media validation:
category ∈ {brochure,document,certificate} → mime: application/pdf (+doc/docx), size ≤ 25MB
# listing-д холбох:
brochure_ids  array<integer>|null
document_ids  array<integer>|null
```
Гаралт: `ListingResource.brochures` / `documents` (URL+мета).

### 3. Tag / included / infra тус бүрийн нэмэлт тайлбар — Дунд
07/08-д tag тус бүрт тайлбар бичих (одоо `string[]` тул бүтэцтэй тайлбар алга).
```
amenities_details        array<{ key: string, note: string|null }>|null
included_items_details   array<{ key: string, note: string|null }>|null
infrastructure_details   array<{ key: string, note: string|null }>|null
```
(`amenities[]` г.м string массив хэвээр үлдэж, тайлбартайг нь л `*_details` агуулна.)

### 4. Зураг ↔ өрөө холбоо — Дунд
Дотор зургийг «аль өрөөнийх» болохыг 1-3 өрөөгөөр tag-лах.
```
# сонголт A: room_details[] дээр
room_details[].image_ids   array<integer>
# сонголт B: media дээр
room_keys                  array<string>   # room_details-ийн id/uid
```
Frontend room-уудыг локал `id`-аар зохицуулдаг тул **A** илүү тохиромжтой.

### 5. Хаяг/zip-ийн координат (газрын зургийг байршилруу дүхэх) — Дунд
Дүүрэг/хороо/zip сонгоход газрын зургийг тухайн байршил руу төвлөрүүлэхэд координат хэрэгтэй.
Одоо frontend зөвхөн **district-ийн ойролцоо** координатаар (hardcode) төвлөрүүлдэг.
```
# AddressOptionResource (district/khoroo/zipcode) дээр:
center_lat   number|null
center_lng   number|null
```
Мөн **zip дэлгэцэнд «нэр /код/» хослолоор** харуулахад (жишээ «13-р хороолол-2 /14220/») zipcode
resource-д нэр + код 2уул ирэх шаардлагатай.

### 6. lat/lng WGS84 validation BUG — Өндөр
`POST /listings` дээр `lat`/`lng`-ийг **«0-1 хооронд»** гэж шалгадаг тул бодит УБ координат
(47.9x, 106.9x) татгалзагддаг. Frontend одоо lat/lng-ийг **top-level payload-д илгээхгүй**
(зөвхөн `google_map_link`). Backend газрын зургийн бодит координатыг хадгалахыг хүсвэл
validation-ийг **WGS84 (lat −90..90, lng −180..180)** болгож засах хэрэгтэй.

### 7. Custom tag санал болгох (заавал биш) — Бага
07/08-д хэрэглэгчийн нэмсэн tag-уудыг **дараагийн хэрэглэгчдэд санал болгох** бол:
```
GET /listings/tags?group=amenities|included|infrastructure&q=<хайлт>
    → { data: [{ key, label, usage_count }] }
```
Хэрэв backend хийхгүй бол frontend одоо localStorage-оор (зөвхөн тухайн төхөөрөмж дээр) санал болгож байгаа.

### 8. MediaPolicy (сануулга — өмнө засагдсан) — DONE
`POST /media` нь `App\Models\Customer`-ыг хүлээж авдаг болсон (2026-06-29 засвар). Хэвээр байгаа эсэхийг баталгаажуулах.

---

## Хураангуй — backend TODO

| # | Зүйл | Төрөл | Тэргүүлэх |
|---|------|-------|-----------|
| 1 | Түрээсийн lease term талбар | шинэ талбар | Өндөр |
| 2 | Брошур/document/certificate PDF байршуулалт + `*_ids[]` | media + талбар | Дунд |
| 3 | amenities/included/infra тус бүрийн тайлбар (`*_details`) | шинэ талбар | Дунд |
| 4 | Зураг↔өрөө холбоо (`room_details[].image_ids`) | шинэ талбар | Дунд |
| 5 | Address resource-д center координат + zip нэр/код | шинэ талбар | Дунд |
| 6 | lat/lng WGS84 validation засвар | bug fix | Өндөр |
| 7 | Custom tag санал болгох endpoint | шинэ endpoint | Бага |

> **A хэсэг (одоогийн payload)-ыг backend татгалзахгүй байх нь хамгийн чухал** — ялангуяа
> custom string tag-ууд, internet олон утга, `selected_floor` муж, таслалгүй үнэ.

---

## C. Neodata (`data.neomap.mn`) — bbox-оор давхаргын мэдээлэл авах (2026-07-08 амьд тест)

Зорилго: wizard-ын байршил алхамд хэрэглэгч барилга дээр тэмдэг тавихад, газрын зургийг
zoom 18-д төвлөрүүлээд, харагдаж буй 4 булан (bbox)-г `GET /layer-cache-data`-д илгээж, тухайн
цэг дээрх бүх давхаргын (тэр дундаа дүүрэг/хороо) мэдээллийг автоматаар бөглөх зорилготой.
Live тестээр дараах зөрүүнүүд илэрсэн:

### 9. `bbox` шүүлт бодит датад ажиллахгүй байна — **🟡 ХЭСЭГЧЛЭН АЖИЛЛАЖ ЭХЭЛСЭН (2026-07-08, тогтвортой биш)**
Сүхбаатарын талбайн яг ойролцоох zoom-18 хэмжээний bbox-оор (~320м × 200м, жинхэнэ Leaflet
`getBounds()`) шалгахад **9 мөр** буцаж, `district_id:7`/`khoroo_id:141` нь core.neomap.mn-ий
`/address/districts,khoroos`-тай **яг таарч байгааг** олон удаа давтан баталгаажууллаа (7 =
"Сүхбаатар", 141 = "6-р хороо" — бодит зөв дүүрэг!). Response-д шинэ `coordinate_lat`/
`coordinate_long` талбар нэмэгдсэн нь ажиглагдав.

**Гэхдээ бүрэн засагдаагүй, тогтмол бус:**
- Яг тэр цэгийг **арай томхон bbox**-оор хүрээлэхэд (жишээ нь хэдхэн км-ийн муж, эсвэл бүхэл
  Улаанбаатар хотын bbox) **`total: 0`** буцдаг — жижиг bbox нь бага зэрэг том bbox-ийн дэд
  олонлог байхад ч ялгаатай хариу өгч байна. Энэ нь bbox intersection логик төгс зассан биш,
  зөвхөн ямар нэг тохиолдолд (магадгүй жижиг bbox → цөөн candidate → шалгах боломжтой хугацаанд
  багтдаг) ажилладаг гэдгийг харуулж байна.
- Зайсан, Баянзүрх, Хан-Уул зэрэг **өөр бодит цэгүүдэд ижил хэмжээний (zoom-18) bbox шалгахад
  бүгд `total: 0`** — Сүхбаатарын талбайн орчимд ямар нэг шалтгаанаар (`sync=false` дараалалд
  саяхан орсон шинэ мөр байх магадлалтай — #13-ийг үзнэ үү) л ажиллаж байгаа бөгөөд ерөнхий
  хамрах хүрээ биш.

**Дүгнэлт:** wizard яг zoom-18 bbox л явуулдаг тул энэ нь тохиолдлын хувьд ажиллаж эхэлж байгаа
ч, ерөнхийдөө найдвартай гэж дүгнэх боломжгүй — ихэнх бодит байршилд (тогтмол sync-той/
боловсруулагдсан барилгуудад) хэвээр `0` буцна. Backend-ээс baталгаажуулах ёстой зүйл:
яагаад ижил хэмжээний bbox нэг цэгт ажиллаад нөгөө цэгт ажиллахгүй байгааг (магадгүй зөвхөн
саяхан sync хийгдсэн, hэвийн боловсруулаагүй мөрүүдэд генерацлагдсан spatial index байдаг байх
магадлалтай).

<details><summary>Анхны илэрсэн асуудал (2026-07-08 эхэн үед, дараа нь дээрх шинэчлэлт орсон)</summary>

`bbox`-гүйгээр (жишээ нь `?per_page=1`) хүсэлт явуулахад нийт **325,494** мөр байгаа нь
харагдсан (жинхэнэ polygon geometry-тэй). Гэвч тэдгээрийн аль нэгийг **яг агуулсан bbox**
явуулахад ч (жишээ нь: sample мөрийн `geometry.coordinates`-ийн цэгийг багтаасан
`bbox=47.930,108.455,47.938,108.468`) `meta.total = 0` буцаж байна — өөрөөр хэлбэл `bbox`
шүүлт **hit өгдөггүй**. Маш том bbox (дэлхий даяар) илгээхэд 500 (timeout шиг) өгсөн — учир нь
docstring-д дурдсанчлан bbox шүүлтийг геометрийг PHP талд бүгдийг нь татаад шалгадаг
(`LayerCacheData::intersectsBbox()`), тэгэхээр энэ функц эсвэл candidate-шүүх query нь буруу
бичигдсэн байх магадлалтай. **Энэ засагдахгүй бол wizard-ын bbox→хороо/дүүрэг автомат бөглөлт
ажиллахгүй.**

**Хуулбарлаад шууд ажиллуулж болох repro (curl):**

```bash
# 1) bbox-гүйгээр эхний мөрийг татаад бодит координат/khoroo_id-г харах —
#    датаг байгааг батлах (нийт 325,494 мөр).
curl -s "https://data.neomap.mn/api/layer-cache-data?per_page=1" | python3 -m json.tool
# → data[0].geometry.coordinates дотор жишээ нь [108.46138681, 47.93389904] (lng,lat),
#   khoroo_id: 4, district_id: 1

# 2) Тэр цэг дээр газрын зургийг ZOOM 18-д төвлөрүүлэхэд Leaflet-ийн
#    map.getBounds() ямар bbox буцаах байсныг Web Mercator-ийн
#    "meters/pixel" томьёогоор тооцоолов (800x500px харагдах цонх, буюу
#    ердийн wizard map панелийн хэмжээ). Энэ бол ЯГ 2 БУЛАН (SW+NE) —
#    ~320м x 200м реал талбай:
curl -s "https://data.neomap.mn/api/layer-cache-data?bbox=47.933001,108.459241,47.934798,108.463533&per_page=5" \
  | python3 -m json.tool
# → Хүлээгдэж буй: дээрх мөрийг агуулсан жагсаалт (total >= 1) — учир нь
#   энэ bbox нь 1-р алхамд гарсан цэгийг (47.93389904, 108.46138681) бүрэн багтаасан.
# → Бодит байдалд: "data": [], "meta": {"total": 0, ...}
```

Энэ bbox нь санамсаргүй том муж биш — яг zoom 18 дээрх бодит map viewport-той тэнцэх хэмжээтэй
(2 булан: SW/NE), Wizard-ын жинхэнэ хэрэглээнд ирэх утгатай ижил төрлийн bbox. `bboxFromCenterZoom()`
функц (`src/infrastructure/api/neodata.ts`) нь яг энэ тооцоог хийдэг.

</details>

### 10. `only_has_zznm` boolean encoding — Бага (баримтжуулаагүй, олдсон)
`only_has_zznm=true`/`false` (string) илгээхэд `422 "The only has zznm field must be true or
false."` буцдаг; зөвхөн `1`/`0` хэлбэрээр ажилладаг. Frontend клиент тал засварлаж ашигласан
(`only_has_zznm=1|0`), гэхдээ Laravel `boolean` rule нь ердийн байдлаар `"true"/"false"`-г ч
хүлээж авдаг тул энэ бол backend талын validation дүрмийн зөрүү (магадгүй custom rule).

### 11. `LayerCacheDataResource.district`/`khoroo`/`province` хэзээ ч ирдэггүй — Дунд
OpenAPI spec-д эдгээр талбарууд `$ref` (embedded object) байдлаар зарлагдсан ч, `only_has_zznm=1`
үед ч гэсэн бодит хариунд огт ирэхгүй байна — зөвхөн `khoroo_id`/`district_id`/`zip_code_id`
(тоон id) ирдэг, нэр биш. Иймд нэрийг (дүүрэг/хорооны нэр) авахын тулд эдгээр id-г өөр
lookup-тэй тааруулах шаардлагатай.

### 12. `/v1/districts`, `/v1/khoroos`, `/v1/buildings`, `/v1/khotkons` — **зөв auth хэрэгтэй, бидэнд token алга** (шинэчилсэн 2026-07-08) — Дунд
Анх "500 auth guard буруу тохиргоо" гэж бүртгэсэн ч, `Accept: application/json` толгойтой
зөв тестлэхэд (бидний `apiFetch` яг ийм толгой үргэлж явуулдаг) цэвэр **`401
{"message":"Unauthenticated."}`** буцаж байгааг олж тогтоолоо — өмнөх 500 нь зүгээр л curl
тест `Accept` толгойгүй явуулсны илэрхийлэл байсан (тухайн тохиолдолд Laravel redirect-руу
оролдоод `login` named route байхгүй тул 500 шидсэн — энэ өөрөө жижиг талын bug, гол асуудал
биш). **Гол асуудал:** эдгээр endpoint жинхэнэ auth шаарддаг бөгөөд бидэнд `data.neomap.mn`-д
зориулсан ямар ч token алга — энэ бол core.neomap.mn-ий харилцагчийн Bearer token-той огт
хамааралгүй тусдаа auth realm бололтой (`/v1/user` endpoint байгаа нь энэ системийн өөрийн
хэрэглэгч/админ auth-тай болохыг илтгэнэ). Иймд:
- Энэ асуудал "bug fix" биш, **"бидэнд token/API key хэрэгтэй"** гэсэн тодруулга — backend/
  Neodata багаас data.neomap.mn-ий `/v1/*` endpoint-д зориулсан хандах эрх (API key эсвэл
  service-to-service token) авах хэрэгтэй.
- `khoroo_id`/`district_id`-г нэр рүү хөрвүүлэх боломжгүй байгаа тул одоогоор зөвхөн id
  хэлбэрээр л ашиглах боломжтой.

**Repro:**
```bash
curl -H "Accept: application/json" "https://data.neomap.mn/api/v1/khoroos/1855"
# → {"message":"Unauthenticated."} (401) — Accept header-гүйгээр бол 500 (routing bug, гол биш)
```

**🟢 ЧУХАЛ ШИНЭЧЛЭЛ (мөн 2026-07-08) — дээрхийг тойрч болно, #12 нь feature-ийг ХААХГҮЙ:**
`layer-cache-data`-ийн буцаадаг `province_id`/`district_id`/`khoroo_id` нь **тусдаа id space
биш** — эдгээр нь яг **core.neomap.mn-ий өөрийн `/address/*` cascade-ийн ижил id-ууд** гэдгийг
шууд баталгаажууллаа:

```bash
# neodata-с ирсэн жишээ мөр: province_id=1, district_id=1, khoroo_id=4
curl -s "https://core.neomap.mn/api/address/provinces" | jq '.data[] | select(.id==1)'
# → {"id":1,"name":"Улаанбаатар"}
curl -s "https://core.neomap.mn/api/address/districts?province_id=1" | jq '.data[] | select(.id==1)'
# → {"id":1,"name":"Багануур"}
curl -s "https://core.neomap.mn/api/address/khoroos?district_id=1" | jq '.data[] | select(.id==4)'
# → {"id":4,"name":"4-р хороо"}
```

Гурвуулаа таарч байна. Тиймээс `khoroo_id`/`district_id`-г нэр рүү хөрвүүлэхэд **neodata-ийн
`/v1/*` endpoint (#12, 401) огт хэрэггүй** — эдгээр id-г шууд core API-ийн `/address/districts`,
`/address/khoroos`-той тааруулаад нэрийг нь авч болно. Клиент код (`resolveCoreAddressFromNeodataIds()`,
`infrastructure/api/neodata.ts`) үүнийг хийдэг болгож шинэчилсэн. **Иймд #12 (401) feature-д
саад болохгүй** — зөвхөн #9 (bbox hit өгдөггүй) л бодит блоклогч хэвээр байна.

### 13. `/layer-cache-data`-ийн зорилго нь бидний хэрэгцээнд тохирохгүй байж болзошгүй — **Чухал (загварын асуулт)**
Endpoint-ийн docstring-д тодорхой бичсэн: "Зөвхөн `sync = false` (өөрөөр хэлбэл дэлгэрэнгүй
мэдээллээр (detail) баяжаагүй, **шинэ**) бичлэгүүдийг буцаана." Энэ бол дотоод sync/ETL
дараалал (worker-т зориулсан "processing хийгээгүй шинэ мөрүүд" queue) шиг ажиллаж байна, бидний
хүссэн "тухайн цэг дээр ямар давхарга бий" гэсэн ерөнхий spatial query биш.

Мөн `sync`-ийг унтраах query параметр байхгүй (parameter жагсаалтад алга).

**Баталгаажуулсан баримт:** 2026-07-08 эхэн үед энэ хүснэгтэд **325,494 мөр** (`sync=false`)
байсан бол, ижил өдрийн дараагийн шалгалтад (~1 цагийн дараа) **bbox-гүйгээр ч, ямар ч шүүлтгүйгээр
ч нийт 0 мөр** буцаж эхэлсэн — өөрөөр хэлбэл тэр 325к мөрийг арын sync worker бүгдийг нь
`sync=true` болгож, энэ endpoint-ийн хараанаас алга болгосон. Улаанбаатар хотын дотор (Сүхбаатарын
талбай, Баянзүрх, Хан-Уул, Чингэлтэй, Сонгинохайрхан г.м. олон цэгээр) bbox шалгахад бүгд
`total: 0` — гэхдээ энэ нь тэр цэгүүдэд давхарга байхгүй гэсэн үг биш, зүгээр л endpoint-ийн
"шинэ, боловсруулаагүй" гэсэн шүүлтэд юу ч таарахгүй байгаа гэсэн үг.

Спекийн 24 замын дунд өөр ямар ч "location-оор хайх" GET endpoint алга (`/layer-cache-data/details`
нь зөвхөн POST-write, `/{id}/detail` нь зөвхөн ID-гаар GET хийдэг — bbox дэмждэггүй).

**Иймд backend-ээс тодруулах ёстой:** wizard-ын bbox→хороо/дүүрэг lookup-д зориулж
`sync` төлөвөөс үл хамааран (бүх боловсруулагдсан давхаргаас) хайх, тусдаа "public spatial
search" GET endpoint хэрэгтэй юу, эсвэл `/layer-cache-data`-д `sync` шүүлтийг унтраах query
параметр нэмэх боломжтой юу гэдгийг асуух хэрэгтэй. #9 (bbox hit өгдөггүй) асуудал нь тэр
325к мөр байх үед ч ажиллаагүй тул хоёулаа тусдаа асуудал — зөвхөн нэгийг нь засаад
дуусахгүй байж болзошгүй.

**Дүгнэлт:** `layer-cache-data` endpoint-ийн response бүтэц (`data/links/meta`,
`LayerCacheDataResource` талбарууд) зөв ажиллаж байгаа ч, **bbox шүүлт (#9) болон endpoint-ийн
"зөвхөн шинэ/sync=false" зорилго (#13) хоёулаа шийдэгдэхгүй бол** энэ feature-ийг бодит
байдлаар нэвтрүүлэх боломжгүй. Frontend клиент (`infrastructure/api/neodata.ts`) болон contract
зохих смоук тест (`tests/api/neodata.smoke.test.ts`) бэлдсэн — эдгээр асуудал шийдэгдмэгц UI
wiring (map zoom-to-18 → bbox → auto-fill district/khoroo) хийхэд бэлэн.

| # | Зүйл | Төрөл | Тэргүүлэх |
|---|------|-------|-----------|
| 9 | `layer-cache-data` bbox шүүлт hit өгдөггүй | bug fix | **Өндөр (блоклогч)** |
| 10 | `only_has_zznm` зөвхөн 1/0 хүлээж авдаг (true/false биш) | bug fix | Бага |
| 11 | `district`/`khoroo`/`province` embed хэзээ ч ирдэггүй | bug fix эсвэл спек засвар | Дунд |
| 13 | `/layer-cache-data` нь зөвхөн sync=false шинэ мөр буцаадаг — location-оор ерөнхий хайлт хийх public endpoint байхгүй | загварын асуулт / шинэ endpoint | **Өндөр (блоклогч)** |
| 12 | `/v1/districts,khoroos,buildings,khotkons` auth guard 500 | bug fix | Дунд |
