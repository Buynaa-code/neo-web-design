# NEOMAP — Зураг/медиа хадгалах API (хэрэгжсэн — нэг policy bug үлдсэн)

> **ШИНЭЧЛЭЛ 2026-06-26:** `docs/document.json` дээр энэ специйн санал болгосон бүх зүйл
> **backend дээр хэрэгжсэн** — `POST /media`, `GET /media`, `DELETE /media/{id}`,
> `StoreMediaRequest`, `MediaResource`, мөн listing-д холбох `cover_image_id` +
> `*_image_ids[]` талбарууд (доорх жагсаалт). Эдгээр нь одоо **бодит backend талбарууд** болсон.
>
> ## 🐞 БЛОКЛОГЧ BUG (live дээр шалгасан, 2026-06-26)
>
> `/media`-ийн **бүх** route нь вэб апп-ийн хэрэглэгчид **HTTP 500** буцааж байна:
> ```
> POST /media  → 500  MediaPolicy::create(): Argument #1 ($user) must be of type
>                       App\Models\User, App\Models\Customer given
> GET  /media  → 500  MediaPolicy::viewAny(): ... App\Models\Customer given
> ```
> **Шалтгаан:** `App\Policies\MediaPolicy`-ийн `viewAny/create/delete` методууд
> `App\Models\User` гэж type-hint хийсэн. Гэтэл `register`-ээр үүсдэг вэб хэрэглэгч нь
> **`App\Models\Customer`**. Тиймээс policy gate type error өгч crash болж байна.
>
> **Засвар (backend):** `MediaPolicy`-ийн методуудын аргументыг `Customer` (эсвэл аль
> алийг хүлээх union / `Authenticatable`) болгох, эсвэл media-г Customer guard дээр зөв
> policy-той холбох. Засмагц `*_image_ids[]` холболт ажиллана (тэдгээр нь `exists:media,id`-аар
> шалгадаг тул эхлээд media id үүсэх шаардлагатай).
>
> ## Одоо ажилладаг түр зам (policy засагдтал)
> `photos`-ийг JSON **grouped object** (category → URL **string**[]) хэлбэрээр илгээх,
> мөн `photo_seeds` (string[]) ба `cover_image_id` (int). Энэ нь хэвээрээ ажиллана.
>
> ## Фронт талын бэлэн байдал (2026-06-26)
> Клиент интеграц **бичигдсэн**: `MediaResource` schema, `infrastructure/api/media.ts`
> (`uploadMedia/listMedia/deleteMedia`), `apiFetch` multipart дэмжлэг, wizard-д файл
> сонгож upload→`*_image_ids[]`/`cover_image_id` холбох UI. Тест: `tests/api/media-upload.e2e.test.ts`
> (одоо 500-г баримтжуулдаг; backend засагдсаны дараа `NEOMAP_MEDIA_FIXED=1`-ээр happy-path шалгана).

**Конвенц** (одоо байгаа API-тай нэгдсэн):
- Base URL: `https://core.neomap.mn/api` (**HTTPS**, http нь 301 redirect хийж POST body-г эвддэг).
- Auth: **Bearer token** (`Authorization: Bearer <token>`) — бүгд 🔒.
- Алдаа: Laravel validation формат `{ message, errors: { field: [msg] } }`, статус `422`.
- Файл upload: `Content-Type: multipart/form-data`. PUT/PATCH дээр PHP multipart-ийг
  парсдаггүй тул **POST + `_method` spoofing** ашиглана (`-F "_method=PATCH"`).

---

## Нэг харцаар — нэмэх ёстой зүйлс

| # | Хэсэг | Endpoint / талбар | Зорилго |
|---|-------|-------------------|---------|
| 1 | Медиа upload | `POST /media` | Нэг буюу олон файл хүлээж аваад хадгалж `{ id, url }` буцаах |
| 2 | Медиа жагсаалт | `GET /media` | Хэрэглэгчийн/зарын upload хийсэн медиаг жагсаах |
| 3 | Медиа устгах | `DELETE /media/{id}` | Upload хийсэн файлыг устгах |
| 4 | Зар-д холбох | `POST /listings`, `PUT /listings/{id}`, `PATCH /listings/{id}/draft` | `cover_image_id` + category талбаруудаар медиаг зард холбох |
| 5 | Response | `ListingResource.photos` | Холбогдсон медиаг grouped object болгон буцаах |

**Урсгал (flow):**
1. Хэрэглэгч файл сонгоно → фронт `POST /media`-руу multipart-аар илгээнэ → backend хадгалж `{ id, url, ... }` буцаана.
2. Фронт буцаж ирсэн `id`-уудыг цуглуулна.
3. Зар хадгалах үед (`POST /listings` эсвэл draft step 10) тэдгээр `id`-г category талбаруудад (`interior_image_ids[]` г.м.) болон `cover_image_id`-д онооно.
4. `GET /listings/{id}` нь `photos`-ийг grouped object (category → URL[]) болгон буцаана.

---

## 1. Медиа upload — `POST /media` 🔒

Нэг буюу олон зураг/видео файл хүлээж авч, серверт (storage/S3) хадгалж, цаашид зар-д
холбох боломжтой **id + url** буцаана. Зар үүсгэхээс **өмнө** дуудагдаж болохоор бие даасан.

```
POST /media   🔒   Content-Type: multipart/form-data
```

**Request талбарууд:**

| Талбар | Төрөл | Заавал | Тайлбар |
|--------|-------|--------|---------|
| `files[]` | file[] | ✅ | Нэг буюу олон файл. `image/jpeg,image/png,image/webp,video/mp4`. |
| `category` | string | — | Зургийн ангилал (доорх category жагсаалтаас). Өгөөгүй бол `other`. |
| `listing_id` | int | — | Тодорхой зар-д урьдчилан холбох бол (draft үед). |

**Validation:**
- Зураг: `mimes:jpeg,png,webp`, `max:8192` (8MB), `dimensions:min_width=400,min_height=300`.
- Видео: `mimes:mp4,webm`, `max:102400` (100MB).
- Нэг хүсэлтэд дээд тал нь `20` файл.

**Response `201`:**
```json
{
  "data": [
    {
      "id": 1024,
      "url": "https://core.neomap.mn/storage/listings/2026/06/abc123.webp",
      "thumbnailUrl": "https://core.neomap.mn/storage/listings/2026/06/abc123_thumb.webp",
      "category": "interior",
      "mimeType": "image/webp",
      "sizeBytes": 245680,
      "width": 1600,
      "height": 1200,
      "createdAt": "2026-06-26T08:30:00Z"
    }
  ]
}
```

**Алдаа `422`** (validation), `413` (хэтэрхий том файл).

---

## 2. Медиа жагсаах — `GET /media` 🔒

```
GET /media?listing_id={id}   🔒   → { data: [MediaResource], meta }
GET /media                   🔒   → нэвтэрсэн хэрэглэгчийн бүх upload (paginated)
```

**Query:** `listing_id?` (тухайн зарынхыг шүүх), `category?`, `per_page?`, `page?`.

---

## 3. Медиа устгах — `DELETE /media/{id}` 🔒

```
DELETE /media/{id}   🔒   → 204
```
Зөвхөн **эзэмшигч** хэрэглэгч устгана (403 эсээс). Storage файлыг бас устгана.

---

## 4. Зар-д медиа холбох (create / update / draft)

Upload хийсэн медиаг зард холбох талбарууд. Эдгээр нь одоогийн listing-flow step 10
(`media_upload`)-ийн талбаруудтай нийцнэ, гэхдээ **файлын оронд `id` (int) массив** хүлээж авна.

**Нэмэх request талбарууд** (`StoreListingRequest`, `UpdateListingRequest`, draft step 10):

| Талбар | Төрөл | Зурагийн category key |
|--------|-------|------------------------|
| `cover_image_id` | int\|null | Нүүр зураг (`cover`) — `/media`-аас авсан id |
| `cover_image_ids[]` | int[] | Нүүр зургуудын id |
| `floor_plan_image_ids[]` | int[] | `plan` |
| `interior_image_ids[]` | int[] | `interior` |
| `exterior_image_ids[]` | int[] | `exterior` |
| `master_plan_image_ids[]` | int[] | `master_plan` |
| `view_from_inside_image_ids[]` | int[] | `view_from_inside` |
| `complex_amenity_image_ids[]` | int[] | `amenity` |
| `video_ids[]` | int[] | `video` |
| `media_links[]` | string[] | Гадаад линк (YouTube г.м.) — `media_links` |

> **Тайлбар:** одоогийн step metadata-д `floor_plan_images`, `interior_images` гэх **файл** талбарууд
> зарлагдсан. Хэрэв upload-ыг зар үүсгэх хүсэлт дотор **шууд** (нэг алхамд) хийхийг хүсвэл эдгээрийг
> `multipart/form-data` файл массив болгон storage-д бичих логикийг идэвхжүүлж, response `photos`-д URL-ийг
> нэмнэ. Хоёр аргын аль нэгийг сонгоно (тусдаа `/media` — илүү тохиромжтой, эсвэл inline multipart).

**Validation:** `exists:media,id` ба тухайн id нь нэвтэрсэн хэрэглэгчийнх байх (`owned`).

---

## 5. Response — `ListingResource.photos` (grouped object)

`GET /listings/{id}` болон `GET /listings` нь холбогдсон медиаг **grouped object** болгон буцаана.
Энэ бүтэц одоо аль хэдийн ажиллаж байгаа (фронт `toListing` үүнийг `photoUrls` болгон тэгшилдэг).

```json
{
  "data": {
    "id": 123,
    "coverImageId": 1024,
    "photos": {
      "cover":            ["https://core.neomap.mn/storage/.../abc.webp"],
      "exterior":         ["https://.../ext1.webp", "https://.../ext2.webp"],
      "interior":         ["https://.../int1.webp"],
      "view_from_inside": [],
      "plan":             ["https://.../plan.webp"],
      "master_plan":      [],
      "amenity":          [],
      "other":            [],
      "video":            ["https://.../clip.mp4"]
    },
    "photoSeeds": []
  }
}
```

**Category key-үүд (9):** `cover`, `exterior`, `interior`, `view_from_inside`, `plan`,
`master_plan`, `amenity`, `other`, `video`.

**Дүрэм:**
- Absolute `http(s)://` URL хэвээр буцна; харьцангуй зам нь `{APP_URL}/storage/`-оор угтварлагдана (одоо ингэж ажилладаг).
- `cover` группын эхний зураг нь нүүр зураг; эсвэл `coverImageId`-р зааж өгнө.
- `photoSeeds` нь placeholder-д л үлдэнэ (бодит зураггүй үед demo харагдац).

---

## Backend хийх ажлын жагсаалт (checklist)

- [ ] `media` хүснэгт: `id, user_id, listing_id(nullable), category, path, disk, mime_type, size_bytes, width, height, created_at`.
- [ ] `POST /media` — multipart хүлээн авах, дүрс боловсруулах (resize/thumbnail/webp), storage-д бичих, `{id,url}` буцаах.
- [ ] `GET /media`, `DELETE /media/{id}` — эзэмшигчийн хяналттай.
- [ ] `StoreListingRequest`/`UpdateListingRequest`/draft step 10-д `*_image_ids[]` + `cover_image_id` хүлээн авах, `media.listing_id`-г холбох.
- [ ] `ListingResource@photos` — холбогдсон медиаг category-аар бүлэглэж URL-тэйгээр буцаах (одоогийн grouped бүтэцтэй ижил).
- [ ] Зар устгах/update үед холбоо тасрах медиаг цэвэрлэх (orphan cleanup).
- [ ] CORS + `Content-Type: multipart/form-data` зөвшөөрөх; HTTPS дээр ажиллах.
- [ ] Validation: mime/хэмжээ/dimensions/тоо; алдааг `422`-аар буцаах.

---

## Фронт талын бэлэн байдал

- ✅ `ListingResource.photos` grouped object-ийг уншиж `Listing.photoUrls` болгодог (`toListing`).
- ✅ `photoUrl()` нь бодит URL-ийг seed-ээс түрүүлж сонгодог → property card/detail дээр шууд харагдана.
- ✅ Wizard `buildCreateRequest` нь grouped `photos` (URL string) + `photo_seeds` илгээдэг; URL paste composer бий.
- ⏳ **Дутуу (энэ спек хэрэгжсэний дараа):** жинхэнэ файл сонгож `POST /media`-руу илгээх drag-drop UI,
  upload progress, буцаж ирсэн `id`-уудыг `*_image_ids[]`/`cover_image_id`-д онооход шилжих.

_Эх сурвалж: live сервер дээрх шалгалт (2026-06-26) + `docs/document (1).json` listing-flow step 10 `media_upload`._
