# NEOMAP — Зар оруулах wizard-ийн UX сайжруулалтад шаардагдах backend requirement

> **Огноо:** 2026-07-01
> **Хамрах хүрээ:** `POST /listings`, `PUT /listings/{id}`, `PATCH /listings/{id}/draft`,
> `POST /media`, `GET /listings/form-options`. Wizard-ийн UX/бүтцийн шинэчлэлээс үүссэн
> backend-ийн **дутуу талбар/endpoint**-уудыг энд бүртгэв.
>
> **Одоогийн байдал:** `StoreListingRequest`/`UpdateListingRequest` нь 120 талбартай бөгөөд
> хаяг (street_number, zipcode_id, street_id), давхрын бүтэц (basement/main/total_floor_count,
> selected_floor, floor_type), гэрчилгээ (certificate_status, property_registration_number),
> ашиглалт (commissioned_status, commissioned_year, expected_commission_date), төлбөр
> (sale_payment_terms[], payment_schedule[], rent_*), VAT (vat_included, provides_vat_ebarimt),
> amenities[]/included_items[]/infrastructure[] (дурын string хүлээж авдаг), room_details[]
> зэргийг **аль хэдийн дэмждэг**. Доорх 6 зүйл л дутуу байна.

---

## 1. Түрээсийн гэрээлэх хугацаа (lease term) — ДУТУУ

**UX:** Түрээсийн зар дээр "Гэрээлэх хугацаа" (доод/дээд хязгаар эсвэл тодорхой саруудаар)
сонгодог талбар шаардлагатай. Одоо wizard-д огт байхгүй, backend-д ч талбар алга.

**Санал (StoreListingRequest / UpdateListingRequest / ListingResource):**
```
min_lease_months        integer|null   # хамгийн богино гэрээлэх хугацаа (сар)
max_lease_months        integer|null   # хамгийн урт (null = хязгааргүй)
# эсвэл нэг талбар:
lease_term_months       integer|null   # тохиролцсон тодорхой хугацаа
lease_term_note         string|null    # чөлөөт тайлбар ("6 сараас дээш" гэх мэт)
```

**Validation:** `mode=rent` үед л хамаарна; `min_lease_months >= 1`, `max >= min`.

**Гаралт (ListingResource):** `minLeaseMonths`, `maxLeaseMonths` (camelCase).

---

## 2. Tag / дагалдах зүйл тус бүрийн нэмэлт тайлбар — ДУТУУ

**UX (07, 08-р алхам):** Хэрэглэгч сонгосон amenity / included-item / infrastructure item
**тус бүр дээр нэмэлт тайлбар** бичдэг байх (LinkedIn skills дээр тайлбар нэмдэг шиг).
Одоо эдгээр нь зөвхөн `string[]` тул тайлбар хадгалах бүтэц алга (ганц ерөнхий
`infrastructure_description` л бий).

**Санал — сонголт A (илүү тохиромжтой):** массивыг objects болгох, эсвэл зэрэгцээ
`*_details` талбар нэмэх:
```
amenities_details        array<{ key: string, note: string|null }> | null
included_items_details   array<{ key: string, note: string|null }> | null
infrastructure_details   array<{ key: string, note: string|null }> | null
```
`amenities`/`included_items`/`infrastructure` (string[]) хэвээр үлдэж, `*_details` нь
тайлбартай зүйлсийг л агуулна (буцаж нийцтэй).

**Санал — сонголт B (хямд):** одоогийн string массив дотор `"key::тайлбар"` форматаар
кодлох. Гэхдээ query/filter хийхэд эвгүй тул A-г зөвлөж байна.

**Гаралт:** ListingResource дээр `amenitiesDetails` гэх мэтээр буцаах.

---

## 3. Зургийг өрөөгөөр tag-лах (photo ↔ room холбоо) — ДУТУУ

**UX:** Дотор зураг оруулсны дараа "энэ зураг ямар өрөөнийх вэ" гэдгийг нэмсэн
өрөөнүүдээсээ **1-3 өрөөгөөр** tag-лаж болдог байх (нэг зураг олон өрөө хамарч болно).
Одоо `MediaResource`-д өрөөтэй холбогдох талбар алга, `room_details[]` нь зурагт
холбогддоггүй.

**Санал — сонголт A:** media дээр өрөөний холбоо:
```
# StoreMediaRequest / update-media дээр
room_keys        array<string> | null    # эсвэл room_details доторх өрөөний id/uid
# MediaResource гаралт дээр
roomKeys         array<string>
```

**Санал — сонголт B:** `room_details[]` элемент бүр дээр зургийн id:
```
room_details[].image_ids   array<integer>   # тухайн өрөөнд хамаарах media id-ууд
```
Frontend талд өрөөг локал `uid`-аар зохицуулдаг тул **сонголт B** (room → image_ids)
хэрэгжүүлэхэд ойлгомжтой. Аль нэгийг сонгоно уу.

---

## 4. Танилцуулга / брошур файл (PDF) байршуулах — ДУТУУ

**UX:** Зарт **танилцуулга/брошур**-ыг файлаар (ихэвчлэн PDF) хавсаргах хэсэг.
Одоо `POST /media` зөвхөн зураг/бичлэг хүлээж авдаг (jpeg/png/webp ≤8MB,
mp4/webm ≤100MB); PDF болон "document/brochure" category алга.

**Санал:**
```
# form-options.enumOptions.photo_categories (эсвэл шинэ media_categories) дээр:
brochure | document

# POST /media validation дээр:
category = brochure/document үед  →  mime: application/pdf (+ magadgui doc/docx),
                                     size ≤ 25MB (тохируулж болно)

# listing-д холбох талбар:
brochure_ids   array<integer> | null   # (одоогийн *_image_ids[] загвартай ижил)
```

**Гаралт:** `ListingResource.brochures` (URL/мета) эсвэл `brochureIds`.

---

## 5. Хэрэглэгчийн нэмсэн custom tag-уудыг сануулах — ХЭСЭГЧЛЭН

**UX:** Хэрэглэгч 07/08-д **өөрийн tag нэмж** болдог (энэ нь одоо ажиллана — `amenities`,
`included_items`, `infrastructure` нь дурын string хүлээж авдаг ✅). Гэхдээ "өмнө
нэмэгдсэн tag-уудыг дараагийн хэрэглэгчдэд санал болгох" бол сервер тал шаардна.

**Санал (заавал биш — эхэндээ frontend localStorage-оор шийднэ):**
```
GET /listings/tags?group=amenities|included|infrastructure&q=<хайлт>
    → { data: [{ key, label, usage_count }] }   # түгээмэл/өмнө хэрэглэгдсэн tag-ууд
```
Хэрэв backend хийхгүй бол frontend localStorage дээр хэрэглэгчийн нэмсэн tag-уудыг
хадгалж, зөвхөн тухайн төхөөрөмж дээр санал болгоно (доогуур чанар).

---

## 6. lat/lng — WGS84 координатыг татгалздаг BUG (мэдэгдэл)

**Одоогийн байдал:** `POST /listings` дээр `lat`/`lng`-ийг **"0-1 хооронд"** гэж
шалгадаг тул бодит Улаанбаатарын координат (47.9x, 106.9x) татгалзагддаг (backend bug).
Google map зөв ажиллаж, зураг дээрх байршил хадгалагдахад **энэ validation-ийг WGS84
хүрээнд (lat −90..90, lng −180..180) засах** шаардлагатай.

---

## 7. Хаяг/zip-ийн координат (газрын зургийг байршил руу дүхэх) — ДУТУУ

**UX:** Хэрэглэгч дүүрэг/хороо/zip сонгоход газрын зураг тухайн байршил руу автоматаар
дүхэж (center), дараа нь хэрэглэгч цэгээ нарийвчилдаг. Одоо **district-ийн ойролцоо
координатаар** (frontend hardcode) төвлөрүүлж байгаа. Zip/хороо түвшний нарийвчлалд
`AddressOptionResource` (khoroo/zipcode) дээр **координат байхгүй**.

**Санал:** address cascade-ийн resource-уудад төв цэгийн координат нэмэх:
```
# AddressOptionResource (district/khoroo/zipcode) дээр
center_lat   number|null
center_lng   number|null
```
Байвал frontend сонгосон хороо/zip-ийн center рүү газрын зургийг дүхнэ.

## Хураангуй — backend TODO

| # | Зүйл | Төрөл | Тэргүүлэх |
|---|------|-------|-----------|
| 1 | Түрээсийн lease term талбар(ууд) | шинэ талбар | Өндөр |
| 2 | amenities/included/infra тус бүрийн тайлбар (`*_details`) | шинэ талбар | Дунд |
| 3 | Зураг↔өрөө холбоо (`room_details[].image_ids`) | шинэ талбар | Дунд |
| 4 | Брошур/PDF category + `brochure_ids[]` | media + талбар | Дунд |
| 5 | Custom tag санал болгох endpoint | шинэ endpoint | Бага (frontend түр шийднэ) |
| 6 | lat/lng WGS84 validation засвар | bug fix | Өндөр |
| 7 | Address resource-д center координат (zip-ээр дүхэх) | шинэ талбар | Дунд |

> Дээрх 6-гаас бусад бүх wizard сайжруулалт (гарчиг салгах, scroll-top, давхар dropdown,
> өрөө нэмэх popup, гэрчилгээ/ашиглалт conditional, төлбөр logic, амениети multi-select
> + collapsible, хаяг цэгцлэх, Миний зар Үзэх/Засах г.м) **одоогийн API дээр frontend-ээр
> хийгдэнэ** — backend хүлээх шаардлагагүй.
