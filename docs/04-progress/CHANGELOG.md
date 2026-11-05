# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/) · Versiya: [SemVer](https://semver.org/)

## [2.5.8] — 2026-11-05
### Changed
- State tab-ının düyməsi: **İzləməyə başla / İzləməni dayandır** → **Watch / Unwatch**

## [2.5.7] — 2026-11-05
### Changed
- 3-cü tab-ın adı yenidən **State** (İzləmə → State); funksionallıq dəyişmir

## [2.5.6] — 2026-11-05
### Changed
- 3-cü tab **State** → **İzləmə**
- İzləmə Record-dan tam ayrıldı: yalnız tab-ın öz düyməsi ilə açılır / bağlanır (Record lazım deyil, Stop onu söndürmür; lazım olanda debugger-i özü qoşur)
- Düymə solda, boz rəngdə və keçidlidir: **İzləməyə başla** ⇄ **İzləməni dayandır**; dayandıranda səhifədən hər şey (`$watch`, skan, skript) silinir
- Tab aktiv tab local olanda görünür (Record-dan asılı deyil); panel bağlananda izləmə də dayanır

## [2.5.5] — 2026-11-05
### Added
- `dəyər?.$watch?.('ad', dəyər)` — istənilən dəyərin öz metodu kimi (Aktivləşdir basılanda `Object.prototype`-a görünməz, üzərinə yazıla bilən metod əlavə olunur; `Object.keys` / `JSON` / `for…in` onu görmür)

## [2.5.4] — 2026-11-05
### Added
- `window.$watch?.('ad', dəyər)` — koddan istənilən dəyişəni (obyekt, massiv, primitiv; hook, funksiya, React-dən kənar) State tab-ında izləmək; yeni dəyər dərhal, yerində mutasiya (`obj.name = …`) ≤ 1 san ərzində görünür

## [2.5.3] — 2026-11-05
### Changed
- State watcher artıq Record ilə avtomatik başlamır — yalnız State tab-ındakı **Aktivləşdir** düyməsi ilə inject olunur (Record aktiv olmalıdır); Stop / yeni Record onu söndürür

## [2.5.2] — 2026-11-05
### Fixed
- Local yoxlaması genişləndi: bütün `127.x.x.x`, `*.localhost`, `[::1]`, `0.0.0.0` (əvvəl yalnız `localhost` / `127.0.0.1`); LAN IP-ləri local sayılmır

## [2.5.1] — 2026-11-05
### Fixed
- State tab yalnız local səhifədə (`localhost` / `127.0.0.1`) görünür və watcher yalnız orada inject olunur; digər saytlarda tab gizlidir (xəta verirdi)

## [2.5.0] — 2026-11-05
### Changed
- 3-cü tab **Redux** → **State** (F-010): `data-watch` prop-u olan React komponent / state / react-hook-form dəyərləri canlı göstərilir (state-watcher prototipinin məntiqi)
- Açıq səhifədə də dərhal işləyir — yeniləmək lazım deyil

### Removed
- F-009 Redux action izləməsi və scope-lar

## [2.4.19] — 2026-11-05
### Added
- F-009 Redux Action Tracker: 3-cü tab **Redux** — qeyd zamanı Redux action-ları (type, payload) və istifadəçinin əlavə etdiyi scope-ların state-i
- Scope-lar (məs. `taxpayerSlice`) yadda saxlanılır; Redux DevTools ilə birlikdə işləyir; yeni icazə yoxdur (CDP)

## [2.4.18] — 2026-11-05
### Changed
- Record düyməsinin hover rəngi: `oklch(0.4 0.17 263.22)`

## [2.4.17] — 2026-11-05
### Changed
- Record düyməsinin fonu: `oklch(0.27 0.11 263.35)` (tünd göy)

## [2.4.16] — 2026-11-05
### Changed
- "Start" düyməsi "Record" adlandırıldı və rəngi mavi oldu

## [2.4.15] — 2026-11-05
### Changed
- Saxlanmışlarda tək sətri 🗑 ilə silmək artıq təsdiq soruşmur; təsdiq yalnız "Hamısını sil"də qalır

## [2.4.14] — 2026-11-05
### Changed
- Start / Stop düyməsi Qeyd alt sətrinin ən soluna, "Təmizlə"nin yanına köçürüldü (siyahı boş olanda da görünür)

## [2.4.13] — 2026-11-05
### Changed
- "Təmizlə" düyməsi Qeyd siyahısının üstündəki (Müqayisə et olan) sətrin ən soluna köçürüldü

## [2.4.12] — 2026-11-05
### Added
- Qeyd hissəsində 🚫 "Təmizlə" düyməsi — yalnız Qeyd siyahısını silir (DevTools kimi); qeyd gedirsə davam edir, saxlanmışlar qalır

## [2.4.11] — 2026-11-04
### Removed
- Müqayisədə "Nəzərə alma" sahəsi (yeri boş saxlanılır)
### Changed
- Müqayisədə A / B blokunun üstünə və altına +4px məsafə

## [2.4.10] — 2026-11-04
### Removed
- "— Kiçilt / ▢ Böyüt" düyməsi (panelin ölçüsünü dəyişmirdi)

## [2.4.9] — 2026-11-04
### Changed
- Panel istənilən yolla bağlananda (Chrome-un öz "Close side panel" ✕-i, ikon, ayrı pəncərənin ✕-i) saxlanmamış Qeyd silinir və qeyd dayanır; ⧉ / ⇥ keçidində data qalır

## [2.4.8] — 2026-11-04
### Changed
- ✕ Bağla: qeyd dayanır və saxlanmamış "Qeyd" siyahısı silinir (Saxlanmışlar qalır)

## [2.4.7] — 2026-11-04
### Added
- Detallarda Payload və Response üçün kopyala düyməsi

## [2.4.6] — 2026-11-04
### Changed
- Yadda saxlama popup-unda placeholder: "məs. sifariş-uğurlu" → "API üçün ad yazın"

## [2.4.5] — 2026-11-04
### Added
- Saxlanmışlarda **Hamısını sil** (təsdiq ilə)

## [2.4.4] — 2026-11-04
### Added
- Qeyd tab-ında müqayisə: 2 request seç → ⇄ Müqayisə et (yalnız cari qeydin request-ləri)

## [2.4.3] — 2026-11-04
### Changed
- "Yadda saxla" düyməsi: emoji əvəzinə çərçivəli bookmark ikonu, hover-də mavi

## [2.4.2] — 2026-11-04
### Removed
- Saxlanmışlarda Export / Import və "Hamısını seç"

## [2.4.1] — 2026-11-04
### Added
- HAR export (F-002): Stop → ⬇ HAR, HAR 1.2, DevTools-a import olunur, həssas sahələr mask olunur

## [2.4.0] — 2026-11-04
### Added
- Layihə strukturu və sənədləşmə
- Extension skeleti: React + TypeScript + Vite + Tailwind, side panel, Start / Stop recorder (XHR / Fetch)
- Recorder: headers, payload, response body, IndexedDB
- Side panel: açılan request qutusu (JSON formasında)
- Ayrı pəncərə rejimi (⧉ / ⇥), yazılan tab-ın göstərilməsi
- Geniş pəncərədə DevTools kimi bölünmüş görünüş (siyahı | detallar)
- API yadda saxlama (F-003): 💾, Saxlanmışlar tab-ı, adını dəyiş, sil, JSON export / import (həssas sahələr export-da mask olunur)
- Sabit extension ID
- Saxlanmışlar tab-ında geniş pəncərədə bölünmüş görünüş
- Dark mode (default) və ☀️ / 🌙 keçid
- API müqayisəsi (F-004): key / dəyər / key + dəyər, JSON qarşı-qarşıya, siyahı hesabatı, ignore siyahısı, id-yə görə uyğunlaşdırma
- Müqayisədə path parametrləri keçilir: `objects/123` ↔ `objects/456` eyni API sayılır

### Fixed
- Bölünmüş görünüşdə yalnız ad kliklənirdi — indi bütün sətir kliklənir

### Changed
- Extension adı: QA Debugger → API Lens
