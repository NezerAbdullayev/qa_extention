# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/) · Versiya: [SemVer](https://semver.org/)

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
