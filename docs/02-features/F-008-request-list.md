# F-008 — Request siyahısı (açılan qutular)

**Status:** 📝 Spec · **Mərhələ:** ❓ (bax: Sessiya #2) · **Tələblər:** FR-13, FR-14

## Niyə
Start və Stop arasında gedən bütün API request-lərini Inspect açmadan, extension-un öz ekranında rahat görmək.

## İstifadəçi hekayəsi
> **QA / developer** kimi, **qeyd olunan API-ləri siyahı şəklində görmək və birinin üzərinə klikləyib detallarına baxmaq** istəyirəm ki, **DevTools açmadan request/response-u yoxlayım**.

## UI / Axın
```
┌───────────────────────────────────────────────────────────┐
│ ● REC  Qeyd: 14 request                    [Start] [Stop] │
├───────────────────────────────────────────────────────────┤
│ ▸ POST  /api/orders            200   120 ms        [💾]   │  ← bağlı qutu
│ ▾ GET   /api/users/42          200    85 ms        [💾]   │  ← açıq qutu
│ ┌───────────────────────────────────────────────────────┐ │
│ │ URL:     https://site.az/api/users/42                 │ │
│ │ Method:  GET          Status: 200                     │ │
│ │ ── Request headers ──                                 │ │  max 500px
│ │ ── Payload ──                                         │ │  (daxildə scroll)
│ │ ── Response headers ──                                │ │
│ │ ── Response body ──                                   │ │
│ │ ── Timing ──                                          │ │
│ └───────────────────────────────────────────────────────┘ │
│ ▸ GET   /api/products          500   310 ms        [💾]   │
└───────────────────────────────────────────────────────────┘
```

## Qəbul meyarları
- [ ] Start → Stop arasındakı bütün API request-ləri ümumi siyahıda (box) göstərilir
- [ ] Hər sətir bağlı halda API-nin adını göstərir (bax: açıq sual — method, path, status, müddət)
- [ ] Sətirə klik → qutu aşağıya doğru açılır; təkrar klik → bağlanır
- [ ] Açılan qutunun hündürlüyü **maksimum 500px**; məzmun çox olarsa qutunun daxilində scroll
- [ ] Açıq qutuda: URL, method, status, request headers, payload, response headers, response body, timing
- [ ] Hər sətirin **sağ tərəfində "Yadda saxla" düyməsi** (💾) — bax: [F-003](F-003-snapshots.md)
- [ ] Mətnlər i18n ilə ([ADR-002](../03-architecture/decisions/ADR-002-i18n.md))
- [ ] Həssas sahələr mask olunmuş göstərilir ([F-005](F-005-masking.md))

## Texniki qeydlər
- Data mənbəyi: [F-001](F-001-recorder.md) recorder-in IndexedDB-yə yazdığı request-lər
- JSON body formatlanmış (pretty-print) göstərilir

## Açıq suallar
Bax: [Sessiya #2](../06-qa-sessions/2026-11-03-session-2.md)
