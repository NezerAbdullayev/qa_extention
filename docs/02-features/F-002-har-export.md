# F-002 — HAR Export

**Status:** 🔵 Hazırlanır (v2.4.1) · **Mərhələ:** MVP · **Tələblər:** FR-05

## Niyə
Developer faylı öz Chrome-unda DevTools → Network tab-ına sürükləyib Inspect-dəki kimi görsün.

## UI / Axın
1. **Start** → sayt üzərində işlər → **Stop**
2. Qeyd zolağında **⬇ HAR** düyməsi (qeyd gedərkən və siyahı boş olanda deaktivdir)
3. Fayl yüklənir: `<host>_<YYYY-MM-DD_HH-mm>.har` (məs. `pink-avis2.e-taxes.gov.az_2026-11-04_14-05.har`)
4. Developer faylı DevTools → Network-ə sürükləyir (və ya ⬆ "Import HAR file")

## Qəbul meyarları
- [x] Stop-dan sonra "HAR yüklə" düyməsi
- [x] Fayl HAR 1.2 standartına uyğundur, Chrome DevTools-a import olunur
- [x] Fayl adı: `<host>_<YYYY-MM-DD_HH-mm>.har`
- [x] Mask olunmuş sahələr (F-005) export-da da mask olunub
- [ ] Console logları ayrıca JSON və ya HAR `_console` sahəsində — console hələ yazılmır (F-001-in açıq hissəsi)

## Texniki qeydlər
- Kod: `extension/src/shared/har.ts` (`buildHar`), background-da `EXPORT_HAR` mesajı
- Faylda **yalnız son qeydin** XHR / Fetch request-ləri var (Start yeni qeyd başladır)
- Hər entry: method, URL, bütün request / response headers (çox dəyərli header-lər, məs. `Set-Cookie`, ayrı-ayrı sətir), query, payload, status + statusText, protokol (`HTTP/2.0`), response body (binary → `encoding: base64`), müddət, `_resourceType: xhr | fetch`
- Uğursuz request → `status: 0`, `_error: "CORS" / net::ERR_*`
- Body 5 MB-dan böyükdürsə kəsilir və `content.comment`-də qeyd olunur
- `startedDateTime` CDP `wallTime`-dan gəlir (2.4.1-dən əvvəl yazılmış qeydlərdə export vaxtı istifadə olunur)
- Timings sadələşdirilib: bütün müddət `wait`-dədir (DNS / connect / SSL ayrıca yazılmır)
- Mask (F-005): Authorization, Cookie, Set-Cookie, X-API-Key header-ləri; password, token, accessToken, refreshToken, secret — URL query, payload və response-da `***`

## Açıq suallar
- ❓ Console logları HAR-ın içində, yoxsa ayrıca fayl? (console yazılması F-001-də hazırlananda qərar veriləcək)
