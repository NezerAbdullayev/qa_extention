# Progress jurnalı

Ən yeni qeyd yuxarıda.

---

## 2026-11-04
**Görülən işlər**
- ADR-003: React + TypeScript + Vite + Tailwind CSS
- `extension/` layihə skeleti: manifest (MV3), side panel (kiçilt / bağla), background recorder (Start / Stop, yalnız XHR / Fetch, canlı siyahı), i18n (`_locales/az`), DevTools "Name" qaydası
- F-001: request / response headers (ExtraInfo), payload, response body (≤ 5 MB), IndexedDB + service worker bərpası
- F-008: açılan qutu — URL, method, status, Payload, Response (JSON, max 300px)
- F-008: JSON DevTools Preview kimi açılan ağac (D3); Headers göstərilmir (D4); max 300px (D1)
- Ad dəyişdi: QA Debugger → **API Lens**
- F-008: Headers bölməsi çıxarıldı (D4); ayrı pəncərə rejimi — ikinci monitor üçün (D5)
- F-008: geniş pəncərədə DevTools kimi bölünmüş görünüş (D6)

**Növbəti addım**
- F-003: 💾 yadda saxlama (ad popup-u, 6 rəqəmli avtomatik ad)
- F-001: console error-lar, redirect zənciri

**Bloklar**
- —

---

## 2026-11-03
**Görülən işlər**
- Layihə strukturu qurulub (docs, PR şablonu, CONTRIBUTING, .gitignore)
- Biznes sənədlərinin qaralamaları yazılıb
- F-001…F-005 spec qaralamaları
- ADR-001: `chrome.debugger` seçimi
- Sessiya #1, Q1: əsas istifadəçilər təyin olundu (developer FE+BE, QA); müştərilər hələlik yox
- Sessiya #1, Q3: avtomatik göndərmə təxirə salındı — manual göndərmə
- Sessiya #1, Q4: istənilən saytda işləyir; layihə daxilidir (yalnız öz şirkətimiz üçün)
- Sessiya #1, Q5: interfeys dili — Azərbaycan dili, i18n ilə (ADR-002)
- Yeni axın sənədləşdi: F-008 request siyahısı (500px açılan qutular), F-003 API yadda saxlama (6 rəqəmli avtomatik ad), F-004 müqayisə (key / dəyər / key+dəyər + hesabat)
- Sessiya #2, Q1: UI side panel-də (bağla, kiçilt, əl ilə en dəyişmə)
- Sessiya #2, Q6: müqayisə yalnız response body üzrə
- Sessiya #2, Q3: siyahıda ad DevTools "Name" ilə eyni + method, status, müddət; açılan qutu max 500px (Q15)
- Sessiya #2, Q5 + 5a + 5b: açıq qutu JSON formasında — URL → method → Request headers → Response headers → Payload → Response
- Sessiya #2, Q11: yalnız XHR / Fetch request-ləri yazılır
- Sessiya #2, Q14: JSON olmayan response müqayisə olunmur, xəbərdarlıq göstərilir
- Sessiya #2, Q15: açılan qutu məzmuna görə, maksimum 500px
- Sessiya #2, Q12: yeni Start → siyahı silinir, saxlanmışlar qalır
- Sessiya #2, Q13: axtarış / filtr yoxdur
- Sessiya #2, Q5c: açıq qutuda method altında status
- Sessiya #2, Q2: siyahı canlı yenilənir
- Sessiya #2, Q4: bir neçə qutu eyni anda açıq ola bilər
- Sessiya #2, Q7: fərqli API-lər müqayisə oluna bilər, xəbərdarlıq ilə
- Sessiya #2, Q9: müqayisə JSON formasında qarşı-qarşıya (A | B)
- Sessiya #2, Q10: MVP = F-001, F-008, F-003, F-004, F-002, F-005 (hamısı birdən)
- Git repo yaradıldı, commit qaydaları `CLAUDE.md`-də yazıldı
- GitHub remote qoşuldu; GitLab → GitHub keçidi (PR şablonu `.github/`-da)

**Növbəti addım**
- Sessiya #2: F-008 / F-003 / F-004 açıq sualları (13 sual)

**Bloklar**
- —
