# NEOMAP — Бүрэн холболтын CHECKLIST

> Backend-д **39 шинэ endpoint** нэмэгдсэн (`docs/document (1).json`). Зорилго: эдгээрийг бүгдийг
> нь холбож, локал store дээр ажиллаж байсан feature-үүдийг бодит API руу шилжүүлэх. Доорх жагсаалтыг
> зогсолтгүй дуустал нь гүйцэтгэнэ.

## 0. Суурь (foundation) — shared файлууд
- [x] `domain/schemas/api.ts` — шинэ resource + request schema нэмсэн (camelCase resource / snake_case request)
- [x] `infrastructure/query/keys.ts` — шинэ query key + reference domain (articles)
- [x] **HTTPS** — сервер одоо HTTPS дэмждэг болсон; `NEXT_PUBLIC_API_URL` + vitest fallback-г `https://` болгосон → **mixed-content production blocker шийдэгдсэн**

## 1. Favorites + Saved lists + Saved searches → `/saved` дэлгэц
- [x] `infrastructure/api/favorites.ts` (list/add/remove)
- [x] `infrastructure/api/saved-lists.ts` (CRUD + items)
- [x] `infrastructure/api/saved-searches.ts` (CRUD)
- [x] `application/queries/saved.ts` (hooks)
- [x] `SavedScreen.tsx`-г бодит API руу холбосон (favorites + saved searches)
- [x] `SavedSearchModals.tsx` create/edit/delete API руу холбосон
- [ ] Saved-lists нэртэй жагсаалтын UI байхгүй тул hook бэлэн ч холбоогүй (UI байхгүй)

## 2. Alerts → `/alerts` дэлгэц
- [x] `infrastructure/api/alerts.ts` (list/read/read-all) + hooks
- [x] `/alerts` нь `SavedScreen` (searches tab)-аар холбогдсон

## 3. Appointments → `/schedule` дэлгэц
- [x] `infrastructure/api/appointments.ts` (list/create/update/delete) + hooks
- [x] `ActivityScreen.tsx` (viewings жагсаалт) + `ConfirmationScreen.tsx` (booking → create) холбосон

## 4. Views + Messages → `/activity` дэлгэц
- [x] `infrastructure/api/views.ts` (list/record) + `PropertyDetail` нээхэд view бичдэг
- [x] `infrastructure/api/conversations.ts` (conversations/messages CRUD) + hooks
- [x] `ActivityScreen.tsx`-д "Сүүлд үзсэн" хэсэг нэмсэн
- [ ] Conversations/messages UI: hook бэлэн ч одоогийн дэлгэцэд чат UI байхгүй тул дэлгэцэд гараагүй

## 5. Preferences → `/interests` дэлгэц
- [x] `infrastructure/api/preferences.ts` (get/update) + hooks
- [x] `InterestsScreen.tsx` hydrate + save холбосон (auth үед)

## 6. Rental management → `/rental-mgmt` дэлгэц
- [x] `infrastructure/api/rental.ts` (tenants/contracts/income) + hooks
- [x] `RentalMgmtScreen.tsx` холбосон (tenants/contracts/income); mutation UI байхгүй тул бичих хэсэг хойшилсон

## 7. Articles → `/news` дэлгэц
- [x] `infrastructure/api/articles.ts` (list/get) + hooks
- [x] `NewsScreen.tsx` холбосон (хоосон үед mock fallback)

## 8. Тест + чанар
- [x] Шинэ public endpoint smoke тест (`articles.smoke.test.ts`) — ногоон
- [x] e2e (`engagement.e2e.test.ts`) — бүх шинэ write endpoint live сервер дээр 10/10 ногоон
- [x] `npx tsc --noEmit` цэвэр
- [x] `npm run build` цэвэр (19 route)
- [x] Нийт тест: 13 smoke + 25 e2e = **38/38 ногоон** (live HTTPS сервер)

## Үлдсэн (UI байхгүй тул хойшилсон — backend бэлэн)
- Saved-lists нэртэй жагсаалтын UI
- Чат/мессеж дэлгэц (conversations/messages)
- Rental tenant/contract нэмэх/засах форм

---
_Эх сурвалж: `docs/document (1).json`. Дууссан: 2026-06-22._
