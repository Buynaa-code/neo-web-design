# NEOMAP — API холболтын газрын зураг

> Энэ баримт бичиг нь web аппыг **бүрэн** ажиллуулахад шаардлагатай бүх API endpoint-уудыг,
> тэдгээрийн **зориулалт / логик**, аль нэгийг нь UI-д **холбосон эсэх** төлөвтэй нь хамт нэгтгэв.
>
> - **Base URL:** `http://core.neomap.mn/api` (`NEXT_PUBLIC_API_URL`)
> - **Auth:** Laravel Sanctum **Bearer token** (localStorage → `Authorization: Bearer <token>`)
> - **Caching:** TanStack Query + localStorage persist. "Лавлах" (reference) дата (metadata + address)
>   1 цаг хүртэл cache-лэгдэж, stale-while-revalidate-ээр шинэчлэгдэнэ. Динамик дата (зар/auth) cache-лэгдэхгүй.
> - **Нийт operation: 28** (25 зам). Холбогдсон: **18**, Тодорхойлсон ч UI-д хараахан холбоогүй: **10**.

---

## Нэг харцаар (summary)

| # | Method | Endpoint | Auth | Зориулалт | Төлөв |
|---|--------|----------|:----:|-----------|:-----:|
| 1 | GET | `/listings` | — | Зарын нийтийн жагсаалт | ✅ Холбогдсон |
| 2 | GET | `/listings/{id}` | — | Зарын дэлгэрэнгүй | ✅ Холбогдсон |
| 3 | POST | `/listings` | 🔒 | Шинэ зар үүсгэх | ✅ Холбогдсон |
| 4 | GET | `/listings/form-options` | — | Зар бөглөх формын бүх сонголт | ✅ Холбогдсон |
| 5 | GET | `/my/listings` | 🔒 | Миний зарууд | ✅ Холбогдсон |
| 6 | DELETE | `/listings/{id}` | 🔒 | Зар устгах | ✅ Холбогдсон |
| 7 | POST | `/auth/register` | — | Бүртгүүлэх | ✅ Холбогдсон |
| 8 | POST | `/auth/login` | — | Нэвтрэх | ✅ Холбогдсон |
| 9 | GET | `/auth/user` (`/user`) | 🔒 | Одоогийн хэрэглэгч | ✅ Холбогдсон |
| 10 | PUT | `/auth/profile` | 🔒 | Профайл шинэчлэх | ✅ Холбогдсон |
| 11 | PUT | `/auth/password` | 🔒 | Нууц үг солих | ✅ Холбогдсон |
| 12 | POST | `/auth/logout` | 🔒 | Гарах | ✅ Холбогдсон |
| 13 | GET | `/address/countries` | — | Улсын жагсаалт | ✅ Холбогдсон |
| 14 | GET | `/address/cities` | — | Хот/аймаг | ✅ Холбогдсон |
| 15 | GET | `/address/districts` | — | Дүүрэг/сум | ✅ Холбогдсон |
| 16 | GET | `/address/khoroos` | — | Хороо/баг | ✅ Холбогдсон |
| 17 | GET | `/address/zipcodes` | — | Зип код | ✅ Холбогдсон |
| 18 | GET | `/address/streets` | — | Гудамж | ✅ Холбогдсон |
| 19 | GET | `/address/complexes` | — | Хотхон/цогцолбор | ✅ Холбогдсон |
| 20 | GET | `/address/building-blocks` | — | Барилгын блок | ✅ Холбогдсон |
| 21 | GET | `/listing-flow` | — | Зарын урсгалын metadata | ⚠️ Тодорхойлсон, холбоогүй |
| 22 | GET | `/property-categories` | — | Ангиллын metadata | ⚠️ Тодорхойлсон, холбоогүй |
| 23 | PUT | `/listings/{id}` | 🔒 | Зар засах | ⚠️ Тодорхойлсон, холбоогүй |
| 24 | PATCH | `/listings/{id}/draft` | 🔒 | Ноорог хадгалах | ⚠️ Тодорхойлсон, холбоогүй |
| 25 | POST | `/listings/{id}/submit` | 🔒 | Нийтлэхээр илгээх | ⚠️ Тодорхойлсон, холбоогүй |
| 26 | POST | `/listings/register` | 🔒 | Олон алхамт бүртгэл | ⚠️ Тодорхойлсон, холбоогүй |
| 27 | POST | `/auth/logout-all` | 🔒 | Бүх төхөөрөмжөөс гарах | ⚠️ Функц бичсэн, UI товч алга |
| 28 | GET | `/user` | 🔒 | `/auth/user`-ийн давхардсан зам | ✅ (`/auth/user`-аар хангагдсан) |

🔒 = Bearer token шаардана.

---

## 1. Зар (Listings) — гол урсгал

### `GET /listings` — Зарын нийтийн жагсаалт ✅
- **Зориулалт:** Нүүр хуудас, хайлтын үр дүн, газрын зураг дээр харагдах бүх зар.
- **Логик:** `<ListingsBootstrap>` (layout-д) апп ачаалахад нэг удаа `useListings({perPage:100})`-г дуудаж,
  буцаж ирсэн `ListingResource[]`-г `toListing()`-оор UI `Listing` болгон хувиргаж, seed `LISTINGS`
  массивыг **байрандаа** (`replaceListings`) солино. Дараа нь store-ийн `listingsVersion`-г bump хийж
  холбоотой дэлгэцүүдийг re-render хийлгэнэ. Filters энэ бодит датаг л уншина.
- **Файл:** `infrastructure/api/listings.ts → listListings`, `application/queries/listings.ts → useListings`.

### `GET /listings/{id}` — Зарын дэлгэрэнгүй ✅
- **Зориулалт:** `/property/[id]` хуудасны бүрэн мэдээлэл (зураг, үнэ, байршил, агент).
- **Логик:** Хуудас `force-dynamic`. Server талд `resolveListing(id)` нь бодит `getListing`+`toListing`-г
  оролдоод, амжилтгүй бол seed дата руу унана. Агент seed-д байхгүй бол `FALLBACK_AGENT` ашиглана.
- **Файл:** `app/property/[id]/page.tsx`, `useListing`.

### `POST /listings` — Шинэ зар үүсгэх 🔒 ✅
- **Зориулалт:** `/list-property` wizard-аар зар нэмэх.
- **Логик:** Нэвтэрсэн үед `submit()` нь `buildCreateRequest(draft, formOptions.classification)`-аар
  payload бүтээж `createListing` дуудна. `CATEGORY_API` нь wizard-ийн PropertyKey→API category,
  `resolveSubtypeKey` нь subtype LABEL→API key руу form-options metadata-аар буулгана. Нэвтрээгүй бол
  локал `submitListingDraft` shim руу унана.
- **Анхаарах:** Backend нь `property_subtype` заавал шаарддаг; `lat/lng`-г 0–1 хооронд гэж буруу
  валидаци хийдэг тул **орхиж** илгээдэг (backend bug).
- **Файл:** `list-property-wizard.tsx`, `useCreateListing`.

### `GET /listings/form-options` — Формын бүх сонголт ✅
- **Зориулалт:** Зар бөглөх формын бүх dropdown/enum утгыг **нэг дуудлагаар** авах
  (ангилал, subtype, өрөөний төрөл, нөхцөл, гэрчилгээний төлөв гэх мэт).
- **Логик:** `useFormOptions()` — reference дата тул 1 цаг cache. Wizard эндээс subtype/enum-уудаа уншина.
- **Файл:** `metadata.ts → fetchFormOptions`.

---

## 2. Хэрэглэгч / Auth

### `POST /auth/register` ✅ ба `POST /auth/login` ✅
- **Зориулалт:** Имэйл/нууц үгээр бүртгүүлэх / нэвтрэх. Хариу нь `{customer, token, tokenType:"Bearer"}`.
- **Логик:** Токеныг localStorage-д хадгалаад (`token.ts`) дараагийн бүх дуудлагад `Authorization: Bearer`
  болгон залгана. `AuthScreen` нь имэйл/нууц үг + register toggle (хуучин утасны OTP-г сольсон).
- **Файл:** `auth.ts → register/login`, `AuthScreen.tsx`.

### `GET /auth/user` (давхар `/user`) 🔒 ✅
- **Зориулалт:** Нэвтэрсэн хэрэглэгчийн мэдээллийг сэргээх (хуудас сэргээх үед session шалгах).
- **Логик:** `useCurrentUser()` — `ProfileScreen` ашиглана. 401 ирвэл `notifyUnauthorized()` токеныг цэвэрлэнэ.

### `PUT /auth/profile` 🔒 ✅ / `PUT /auth/password` 🔒 ✅
- **Зориулалт:** Профайл (нэр/утас/имэйл) шинэчлэх; нууц үг солих (одоогийн нууц үг шалгаад бусад
  төхөөрөмжийн токеныг хүчингүй болгоно).
- **Файл:** `useUpdateProfile`, `useUpdatePassword` → `ProfileScreen`.

### `POST /auth/logout` 🔒 ✅
- **Зориулалт:** Одоогийн төхөөрөмжийн токеныг хүчингүй болгож гарах.
- **Логик:** `useLogout` → `ProfileScreen`. `store.signOut()` мөн локал токеныг цэвэрлэнэ.

---

## 3. Миний зарууд

### `GET /my/listings` 🔒 ✅
- **Зориулалт:** Хэрэглэгчийн өөрийн оруулсан зарууд (профайл доторх жагсаалт).
- **Файл:** `useMyListings` → `ProfileScreen`.

### `DELETE /listings/{id}` 🔒 ✅
- **Зориулалт:** Өөрийн зараа устгах.
- **Файл:** `useDeleteListing` → `ProfileScreen`.

---

## 4. Хаягийн каскад (Address cascade) — лавлах дата ✅

Бүгд reference дата → **1 цаг cache**, эцэг сонголт сонгогдсон үед л lazy дуудна (`enabled: !!parentId`).
Wizard-ийн 04-р алхамд (`<AddressCascade>`) дараах дарааллаар хамаарна:

```
Улс → Хот/аймаг → Дүүрэг/сум → Хороо/баг
                                   ├─ Зип код
                                   ├─ Гудамж → Хотхон/цогцолбор → Барилгын блок
```

| Endpoint | Hook | Эцэг параметр |
|----------|------|---------------|
| `GET /address/countries` | `useCountries()` | — |
| `GET /address/cities` | `useCities(countryId)` | `country_id` |
| `GET /address/districts` | `useDistricts(cityId)` | `city_id` |
| `GET /address/khoroos` | `useKhoroos(districtId)` | `district_id` |
| `GET /address/zipcodes` | `useZipcodes(khorooId)` | `khoroo_id` |
| `GET /address/streets` | `useStreets(khorooId)` | `khoroo_id` |
| `GET /address/complexes` | `useComplexes(khorooId, streetId)` | `khoroo_id`/`street_id` |
| `GET /address/building-blocks` | `useBuildingBlocks(complexId)` | `complex_id` |

- **Логик:** Сонгосон нэр + master id-г `draft.address.{country,city,district,khoroo}Id`-д хадгалж,
  create payload-д `country_id/city_id/district_id/khoroo_id` болгон илгээнэ. Ганц сонголттой үед
  улс/хот автоматаар сонгогдоно.
- **Анхаарах:** AddressOption `id` нь **integer**; `code`/`name` талбарууд **null** байж болно.
- **Файл:** `address.ts`, `application/queries/address.ts`.

---

## 5. ⚠️ Тодорхойлсон ч UI-д хараахан холбоогүй (бүрэн болгоход үлдсэн)

> Эдгээрийн infrastructure функц / query hook аль хэдийн бичигдсэн — зөвхөн UI-д залгах л үлдсэн.

### `GET /listing-flow` — Зарын урсгалын metadata ⚠️
- **Зориулалт:** Зар оруулах wizard-ийн алхам бүрд ямар талбар, ямар дарааллаар гарахыг тодорхойлсон metadata.
- **Яаж холбох:** Wizard-ийн алхмуудыг hardcode-оос салгаж энэ metadata-аар динамик жолоодох.
- **Файл:** `metadata.ts → fetchListingFlow`, `useListingFlow` (тодорхойлсон, дуудаагүй).

### `GET /property-categories` — Ангиллын metadata ⚠️
- **Зориулалт:** Үл хөдлөхийн ангиллын мод (орон сууц, газар, оффис г.м).
- **Яаж холбох:** Wizard-ийн ангилал сонголт болон **filter**-ийн category сонголтыг hardcode `DISTRICTS`/
  category-аас салгаж эндээс жолоодох.
- **Файл:** `usePropertyCategories` (тодорхойлсон, дуудаагүй).

### `PUT /listings/{id}` — Зар засах 🔒 ⚠️
- **Зориулалт:** Аль хэдийн үүсгэсэн зараа засах.
- **Яаж холбох:** `ProfileScreen`-ийн "Миний зарууд" дотор "Засах" товч → wizard-г edit горимоор нээх.
- **Файл:** `useUpdateListing` (тодорхойлсон, UI товч алга).

### `PATCH /listings/{id}/draft` — Ноорог хадгалах 🔒 ⚠️
- **Зориулалт:** Wizard дундуур орхисон ноорог зарыг backend-д хадгалах (одоо зөвхөн локал store-д хадгалдаг).
- **Яаж холбох:** Wizard-ийн алхам бүрийн дараа эсвэл "Дараа үргэлжлүүлэх" дээр дуудах.

### `POST /listings/{id}/submit` — Нийтлэхээр илгээх 🔒 ⚠️
- **Зориулалт:** Үүсгэсэн зарыг модераци/нийтлэлд илгээх.
- **Анхаарах (blocker):** Backend нь баримтжуулаагүй дүрэм шаарддаг — `floor_type` нь `selected_floor`-той
  таарах ёстой, `floor_type`-ийн зөв утгууд тодорхойгүй. Тиймээс create хийгээд submit-г автоматаар
  дуудахгүй байна. Энэ дүрмийг backend-ээс тодруулах хэрэгтэй.

### `POST /listings/register` — Олон алхамт бүртгэл 🔒 ⚠️
- **Зориулалт:** Зарыг алхам алхмаар (step-by-step) бүртгэх альтернатив урсгал.
- **Яаж холбох:** `POST /listings` (нэг дор үүсгэх)-ийн оронд эсвэл хамт ашиглаж болно. Одоо бид нэг дор
  үүсгэх замыг сонгосон тул нэмэлт.

---

## 6. Бүрэн ажиллахад үлдсэн ажлууд (priority)

1. **🔴 Production blocker — API нь HTTP-only.** HTTPS дээр deploy хийвэл browser mixed-content-оор
   бүх `http://core.neomap.mn` дуудлагыг блоклоно. Засвар: backend HTTPS нээх **эсвэл** Next.js
   proxy rewrite (`/api/* → http://core.neomap.mn/api/*`) хийх. CORS асуудалгүй (`*`).
2. **🟠 Submit blocker** — `floor_type`/`selected_floor` дүрмийг backend-ээс тодруулж submit-г холбох (#25).
3. **🟡 Зар засах** — `PUT /listings/{id}` UI товч нэмэх (#23).
4. **🟡 Filter metadata** — category/district сонголтыг `/property-categories` + address API-аар жолоодох (#22).
5. **🟢 Ноорог хадгалах** — `PATCH .../draft` wizard-д холбох (#24).
6. **⚪ Зураг upload** — backend endpoint **байхгүй** тул хойшлуулсан.

---

## 7. UI / хуудас бүрд хэрэгтэй API

> Энэ web-ийн **хуудас (route) бүрийг** ямар API тэжээдэг, ямар API дутаж байгааг харуулав.
> ⚠️ Чухал: backend-д **зөвхөн зар + auth + хаяг + metadata** endpoint байгаа. **Хадгалсан / харьцуулах /
> сэрэмжлүүлэг / цаг товлох / сонирхол / мэдээ** зэрэг feature-ийн backend endpoint **байхгүй** —
> эдгээр одоо зөвхөн **локал store (localStorage)** дээр ажиллаж байгаа.

| Хуудас (route) | UI / дэлгэц | Шаардлагатай API | Төлөв |
|----------------|-------------|------------------|-------|
| `/` | Нүүр (HomeSplitScreen, HomeMap, RecentlyAdded) | `GET /listings` | ✅ Бодит (boot-д ачаална) |
| `/results` | Хайлтын үр дүн + газрын зураг + filters | `GET /listings`; *(filter-т `GET /property-categories` + `/address/*` нэмбэл сайн)* | ✅ Бодит / 🟡 filter metadata дутуу |
| `/property/[id]` | Зарын дэлгэрэнгүй | `GET /listings/{id}` | ✅ Бодит |
| `/list-property` | Зар нэмэх wizard | `GET /listings/form-options`, бүх `/address/*`, `POST /listings`; *(`/listing-flow`, `.../draft`, `.../submit` нэмбэл бүрэн)* | ✅ Үндсэн / ⚠️ draft+submit дутуу |
| `/auth` | Нэвтрэх / бүртгүүлэх | `POST /auth/register`, `POST /auth/login` | ✅ Бодит |
| `/profile` | Профайл, миний зарууд | `GET /auth/user`, `PUT /auth/profile`, `PUT /auth/password`, `POST /auth/logout`, `GET /my/listings`, `DELETE /listings/{id}`; *(`PUT /listings/{id}` засах товч нэмбэл)* | ✅ Бодит / 🟡 засах дутуу |
| `/confirmation` | Зар үүсгэсний баталгаа | (Шинэ API үгүй — `POST /listings`-ийн хариуг харуулна) | ✅ Бодит |
| `/saved` | Хадгалсан зарууд | `GET /listings` (нэр татахад) + **хадгалах backend endpoint БАЙХГҮЙ** | 🔴 Локал store only |
| `/compare` | Зар харьцуулах | `GET /listings` (бодит) + харьцуулалт локал | 🟠 Зар бодит, сонголт локал |
| `/activity` | Үйл ажиллагааны түүх | **Backend endpoint БАЙХГҮЙ** | 🔴 Локал store only |
| `/schedule` | Цаг товлох (үзлэг) | **Backend endpoint БАЙХГҮЙ** | 🔴 Локал store only |
| `/alerts` | Үнэ/зарын сэрэмжлүүлэг | **Backend endpoint БАЙХГҮЙ** | 🔴 Локал store only |
| `/interests` | Сонирхсон зүйлс | **Backend endpoint БАЙХГҮЙ** | 🔴 Локал store only |
| `/rental-mgmt` | Түрээсийн удирдлага | **Backend endpoint БАЙХГҮЙ** | 🔴 Локал/mock only |
| `/news` | Мэдээ | **Backend endpoint БАЙХГҮЙ** | 🔴 Локал/mock only |

**Дүгнэлт:** Гол арилжааны урсгал (browse → detail → auth → зар нэмэх → профайл) **бүрэн бодит API-тай**.
Харин **хэрэглэгчийн хувийн feature-үүд** (saved/compare/activity/schedule/alerts/interests/rental-mgmt/news)
backend дэмжлэггүй тул локалд л ажиллаж байна. Эдгээрийг бодит болгохын тулд backend-д шинэ endpoint
(жишээ нь `/favorites`, `/alerts`, `/appointments`) нэмэх шаардлагатай — одоогийн OpenAPI-д байхгүй.

---

_Үүсгэсэн: 2026-06-19. Эх сурвалж: `docs/document-2.json` (OpenAPI 3.1.0) + бодит сервер._
