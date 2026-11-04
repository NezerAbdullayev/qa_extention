# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/) · Versiya: [SemVer](https://semver.org/)

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
