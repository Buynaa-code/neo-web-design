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

### 9. `bbox` шүүлт бодит датад ажиллахгүй байна — **Блоклогч (Өндөр)**
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

### 12. `/v1/districts`, `/v1/khoroos`, `/v1/buildings`, `/v1/khotkons` — 500 "Route [login] not defined" — Дунд
Эдгээр endpoint-үүд (ямар ч Authorization header-гүйгээр ч) auth guard-аас `login`-руу
redirect хийхийг оролдоод, тухайн named route байхгүй тул 500 шидэж байна (API-only app-д
`web`-ийн auth guard тохируулагдсан бололтой). Иймд `khoroo_id`/`district_id`-г нэр рүү
хөрвүүлэх боломжгүй байгаа тул одоогоор зөвхөн id хэлбэрээр л ашиглах боломжтой (жишээ нь
core API-гийн address cascade-той тааруулах оролдлого хийхээс өмнө эдгээрийг эхлээд засах
хэрэгтэй).

**Дүгнэлт:** `layer-cache-data` endpoint-ийн response бүтэц (`data/links/meta`,
`LayerCacheDataResource` талбарууд) зөв ажиллаж байгаа ч, **bbox шүүлт (#9) засагдахгүй бол**
энэ feature-ийг бодит байдлаар нэвтрүүлэх боломжгүй. Frontend клиент (`infrastructure/api/neodata.ts`)
болон contract зохих смоук тест (`tests/api/neodata.smoke.test.ts`) бэлдсэн — bbox засагдмагц
UI wiring (map zoom-to-18 → bbox → auto-fill district/khoroo) хийхэд бэлэн.

| # | Зүйл | Төрөл | Тэргүүлэх |
|---|------|-------|-----------|
| 9 | `layer-cache-data` bbox шүүлт hit өгдөггүй | bug fix | **Өндөр (блоклогч)** |
| 10 | `only_has_zznm` зөвхөн 1/0 хүлээж авдаг (true/false биш) | bug fix | Бага |
| 11 | `district`/`khoroo`/`province` embed хэзээ ч ирдэггүй | bug fix эсвэл спек засвар | Дунд |
| 12 | `/v1/districts,khoroos,buildings,khotkons` auth guard 500 | bug fix | Дунд |
