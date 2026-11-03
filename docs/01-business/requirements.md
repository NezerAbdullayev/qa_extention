# Tələblər

## Funksional (FR)
| ID | Tələb | Feature | Prioritet |
|---|---|---|---|
| FR-01 | İstifadəçi aktiv tab üçün qeydi başlada və dayandıra bilir | F-001 | Must |
| FR-02 | Yalnız **XHR / Fetch** request-ləri yazılır (statik resurslar yox — Sessiya #2, Q11); hər biri üçün URL, method, headers, payload, status, response headers, body, timing, initiator | F-001 | Must |
| FR-03 | Uğursuz request-lər (net::ERR, CORS, blocked, canceled) yazılır | F-001 | Must |
| FR-04 | Console error və JS exception-lar yazılır | F-001 | Should |
| FR-05 | Qeyd HAR faylı kimi export olunur | F-002 | Must |
| FR-06 | Authorization, Cookie, token, parol sahələri mask olunur | F-005 | Must |
| FR-07 | Siyahıdakı istənilən API ad verilərək yadda saxlanılır; ad boşdursa təsadüfi 6 rəqəmli tam ədəd verilir | F-003 | Must |
| FR-08 | İki saxlanmış API-nin **yalnız response body**-si müqayisə olunur: key-lərə görə / dəyərlərə görə / key + dəyər (Sessiya #2, Q6) | F-004 | Must |
| FR-09 | Müqayisədə ignore ediləcək sahələr təyin olunur | F-004 | Should |
| FR-10 | Saxlanmış API-lər JSON kimi export/import olunur | F-003 | Should |
| FR-11 | Extension istənilən saytda işləyir (domen məhdudiyyəti yoxdur). İstifadəçi istəsə yalnız seçdiyi host-ları yazmaq üçün filtr qura bilir (Sessiya #1, Q4) | F-006 | Should |
| FR-12 | Qeyd birbaşa backend-ə göndərilir — **hələlik yox** (Sessiya #1, Q3): fayl yüklənir, istifadəçi özü manual göndərir | F-007 | Won't (indi) |
| FR-13 | Start–Stop arasındakı API-lər ümumi siyahıda **canlı** göstərilir (hər request dərhal əlavə olunur — Sessiya #2, Q2); sətirdə: ad (DevTools "Name" ilə eyni) + method + status + müddət; sətirə klik → qutu açılır (hündürlük məzmuna görə, maksimum 500px; çox olanda daxildə scroll — Sessiya #2, Q15) | F-008 | Must |
| FR-14 | Açılan qutuda JSON formasında, alt-alta: tam URL → `method: …` → `status: …` → Request headers → Response headers → Payload (göndərilən) → Response (qayıdan) (Sessiya #2, Q5, 5a, 5b) | F-008 | Must |
| FR-15 | Hər müqayisə rejimi üçün hesabat: xülasə (saylar) + iki response JSON formasında qarşı-qarşıya (A solda, B sağda), fərqlər rənglə işarələnir (Sessiya #2, Q9) | F-004 | Must |

## Qeyri-funksional (NFR)
| ID | Tələb |
|---|---|
| NFR-01 | Manifest V3, kənar serverdən kod yüklənmir |
| NFR-02 | Data default olaraq yalnız lokal saxlanılır (IndexedDB) |
| NFR-03 | Response body limiti (məs. 5 MB/request) — konfiqurasiya olunan |
| NFR-04 | Qeyd üçün maksimum 3 addım (Start, Stop, Yüklə). Faylı developer-ə istifadəçi özü manual göndərir |
| NFR-05 | İnterfeys dili: **Azərbaycan dili** (default). Çoxdilli ola bilsin deyə **i18n** istifadə olunur — kodda hardcoded mətn yoxdur, bütün mətnlər `_locales/az/messages.json`-dadır ([ADR-002](../03-architecture/decisions/ADR-002-i18n.md)). Texniki terminlər (request, response, header, payload, status) tərcümə olunmur (Sessiya #1, Q5) |
| NFR-06 | Daxili alət: yalnız öz şirkətimiz üçün, ictimai yayım yoxdur (Sessiya #1, Q4) |

Prioritet: Must · Should · Could · Won't (MoSCoW)
