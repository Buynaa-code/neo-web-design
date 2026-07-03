# NEOMAP — Зар оруулах wizard UX/бүтцийн requirement (checklist)

> **Огноо:** 2026-07-01 · **Файл:** `src/presentation/components/list-property-wizard.tsx`
> **Backend хамаарал:** доорх ⚙️ тэмдэгтэй зүйлс `docs/api-listing-wizard-requirements.md`-д
> бүртгэсэн backend талбар шаардана. Бусад нь одоогийн API дээр frontend-ээр хийгдэнэ.
> **Аменити/enum эх сурвалж:** `GET /listings/form-options` (`amenityGroups`, `includedItemGroups`,
> `enumOptions`) — hardcode биш, API metadata-г ашиглана.

## Статус тэмдэглэгээ
- [x] Дууссан · [ ] Хийгдээгүй · ⚙️ Backend шаардана

---

## Phase 0 — Шуурхай bug (ДУУССАН)
- [x] Profile "уулзалт" тоо → бодит `useAppointments` (mock `VIEWINGS` биш)
- [x] Profile "Хадгалсан" phantom тоо → сервер favorites-аар зассан (`DEFAULT_SAVED_IDS` устгасан)
- [x] Welcome/Splash дэлгэц устгасан (ачаалал бүрт 4-8с гардаг байсан)

## Phase 1 — Бүтэц ба навигаци
- [x] Дараагийн step рүү орох үед **scroll-to-top** (smooth)
- [x] **Зураг, бичлэгийг тусдаа алхам** болгох (Step 4 дотроос → шинэ Step 5; нийт 5→6 алхам; sidebar/progress/requiredItems бүгд шинэчлэгдсэн)
- [x] **Гарчиг салгах:** медиаг "Төлөв, үнэ ба медиа" бүлгээс салгаж, Step 4 = "Төлөв ба үнэ" болгосон
- [x] **CollapsibleGroup** компонент (дэлгэгддэг/хураагддаг Card + бөглөлт badge + progress bar) үүсгэсэн
- [x] StepThree 06/07/08 + StepFour 09 (Төлөв) / 10 (Үнэ) collapsible болгосон
- [ ] StepTwo Үзүүлэлт/Өрөөний бүтэц/Давхар (нест бүтэц — visual pass дараа) CollapsibleGroup руу
- [ ] Түрээсийн дутуу гарчиг нэмэх (нэг дор нийлсэн 3 бүлгийг ялгах)
- [ ] Тохиромжгүй газрын 2-баганат layout-ыг багасгах

## Phase 2 — Талбарын логик
- [x] **Ашиглалтад орсон эсэх** toggle → сонголтоос хамаарч "орсон он" ЭСВЭЛ "орох хугацаа" нэг талбар харагдана
- [x] **Гэрчилгээтэй эсэх** → зөвхөн гэрчилгээтэй сонголтод бүртгэлийн дугаар + "Гэрчилгээ хавсаргах" гарна
- [x] **Төлбөрийн текст logic**: сонгосон давтамжийг л харуулна (бүх мөр биш)
- [x] Төлбөрийг **"Анхны төлбөр (барьцаа + эхний)" / "Дараагийн төлбөр бүр"** гэж 2 салгасан
- [x] **НӨАТ, ebarimt** текст флип хийхээ больж, тогтвортой болсон
- [ ] **"Дараа нөхөж болно"** badge-уудыг зөв талбарууд дээр байрлуулах
- [ ] ⚙️ **Түрээсийн гэрээлэх хугацаа** талбар (backend #1 бэлэн болмогц)

## Phase 3 — Хаяг ба байршил (screenshot 124809, 124616)
- [x] **Хаягийн cascade-г шинэ backend руу шилжүүлсэн** (2026-07-03): Province→District→Khoroo→
      {Street, Khoroolol, Khotkhon, Building}. Хуучин countries/cities/zipcodes/complexes/building-blocks
      устсан; `districts` param `city_id`→`province_id`. Create payload `province_id/district_id/khoroo_id/
      khoroolol_id/khotkon_id/street_id/building_id` илгээнэ. `provinces` хоосон үед гараар бөглөх warning.
- [ ] Гудамжны нэр (`street_id`, DB) + гудамжны дугаар (`street_number`) **2 тусдаа талбар**
- [ ] Хаягийн бүсийг DB-ээс, **zip + бүсийн нэр хослол** ("13-р хороолол-2 /14220/") — ⚙️ backend seed хэрэгтэй
- [x] **Жинхэнэ Leaflet газрын зураг** (хуучин хуурамч gradient-ийг сольсон): УБ дээр төвлөрч, дарж цэг тавьдаг, бодит WGS84 координат хадгална
- [x] Цэг тавихад **Google Maps линк автоматаар** үүсч, **"Google Maps-д нээх"** шууд линк гарна
- [x] Хуучин 0-1 координатыг migration хийж (далайд гарахаа больсон); tile render fix (Tailwind preflight + invalidateSize)
- [ ] ⚙️ Хаяг/zip-ээр нарийн төвлөрүүлэх — одоо district төвөөр төвлөрдөг; zip-ийн бодит координат backend-ээс хэрэгтэй (backend #7)
- [ ] Google map линк талбарыг давхрын хэсгээс хаягийн хэсэг рүү зөөх (одоо auto-fill болдог)
- [ ] **Түрээсийн зарын хороо сонгогдохгүй bug** засах (address cascade)

## Phase 4 — Давхар ба өрөө (screenshot 124616, 123626)
- [x] **Давхар:** зоорь+үндсэн→нийт (аль хэдийн); давхар сонголт **босоо dropdown** болсон
- [x] Нэгж **олон давхарт** (from/to dropdown → "F01-F02"); `selected_floor` string
- [x] **Өрөө:** "+ Өрөө нэмэх" **pop-up** (modal) — төрөл dropdown, нэр (авто), давхар, талбай, цонх, tag, тайлбар
- [x] Нэмсэн өрөө **ӨРӨӨНҮҮД** хэсэгт **хураангуй мөрөөр** (засах/устгах товчтой); **"Нийт N өрөө · M м²" хөл дүн**
- [ ] ⚙️ Дотор зургийг **нэмсэн өрөөнүүдээр tag-лах** (1 зураг 1-3 өрөө; backend #3 бэлэн болмогц)

## Phase 5 — Аменити ба tag (form-options metadata дээр суурилж)
- [x] **Internet/IPTV multi-select** (олон провайдер chips, comma-joined string)
- [x] **07 tag:** хэрэглэгч custom tag нэмдэг (input + Нэмэх) + **localStorage-д сануулж** дахин ашиглана
- [x] **08 үнэд багтсан:** custom нэмдэг + сануулна
- [x] 06/07/08 бүлэг collapsible + сонголтын тоо badge (Phase 1-д хийсэн)
- [ ] Дулаан/цахилгаан enum дэд сонголтыг илүү нэст UI болгох (одоо dropdown; heating дэд dropdown-тай)
- [ ] ⚙️ 07/08 tag **тус бүрийн нэмэлт тайлбар** (backend #2 бэлэн болмогц)
- [x] **Custom tag сервер санал болголт** (2026-07-03): `GET /listings/tags?group=&q=` руу холбосон
      (`useTagSuggestions`) — "Бусдын нэмсэн:" chips. localStorage дахин ашиглалт хэвээр. (Одоо DB хоосон.)

## Phase 6 — Медиа ба Миний зар
- [x] **Зургийн preview засвар:** шар gradient → жинхэнэ `<img>` + normalizeMediaUrl + "зураг алга" fallback
- [x] **Upload явц:** blob preview + spinner ("Байршуулж байна…") тайлбар
- [x] **Миний зар → Үзэх** товч (→ /property/[id])
- [x] **Миний зар → Засах** (2026-07-03): `/list-property?edit=<id>` → wizard edit mode. `draftFromListing()`
      нь ListingResource-ийг SmartDraft руу reverse map хийнэ (goal/type/subtype, хаяг+id-ууд, specs, state
      enums+гэрчилгээ, үнэ/VAT, amenities/included/infra бүлэгт хуваарилах, зураг). Submit → `PUT /listings/{id}`.
      ProfileScreen-д "Засах" товч нэмсэн. Browser-verified (#109: sale/apartment/cert/2020 бүгд populate).
      ⚠️ Дашрамд илэрсэн **critical bug зассан**: `addressMasterIdsSchema` хуучин key-тэй байсан тул БҮХ зар
      schema parse-д унаж хаягдаж байсан ("Skipping malformed listing") — шинэ key рүү (`provinceId/…/buildingId`,
      optional+passthrough) зассан.
- [x] **Танилцуулга/брошур/гэрчилгээ PDF байршуулах** (2026-07-03): media step-д 3 PDF/DOC upload карт
      (brochure/document/certificate, ≤25MB) + хавсаргасан файлын жагсаалт. `POST /media` category-аар
      илгээж, create payload-д `brochure_ids`/`document_ids`-аар холбоно.

---

## Backend хамаарал (дэлгэрэнгүй: `docs/api-listing-wizard-requirements.md`)
| # | Зүйл | Phase |
|---|------|-------|
| 1 | Түрээсийн lease term | 2 |
| 2 | Tag/included/infra тус бүрийн тайлбар | 5 |
| 3 | Зураг↔өрөө холбоо | 4 |
| 4 | Брошур/PDF байршуулалт | 6 |
| 5 | Custom tag санал болгох endpoint | 5 |
| 6 | lat/lng WGS84 validation bug | 3 |
