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
