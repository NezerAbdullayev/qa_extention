# F-008 — Request siyahısı (açılan qutular)

**Status:** 📝 Spec · **Mərhələ:** ❓ (bax: Sessiya #2) · **Tələblər:** FR-13, FR-14

## Niyə
Start və Stop arasında gedən bütün API request-lərini Inspect açmadan, extension-un öz ekranında rahat görmək.

## İstifadəçi hekayəsi
> **QA / developer** kimi, **qeyd olunan API-ləri siyahı şəklində görmək və birinin üzərinə klikləyib detallarına baxmaq** istəyirəm ki, **DevTools açmadan request/response-u yoxlayım**.

## Yerləşmə — Side panel (Sessiya #2, Q1)
Siyahı brauzerin sağında açılan **side panel**-də göstərilir (`chrome.sidePanel`). Panel səhifə dəyişəndə və kənara klikləyəndə bağlanmır.

| Tələb | Necə |
|---|---|
| **Açmaq** | Extension ikonuna klik → side panel açılır |
| **Bağlamaq (düymə ilə)** | Panelin yuxarı sağ küncündə **✕ Bağla** düyməsi. Qeyd gedirsə, panel bağlansa da qeyd davam edir (yazı background-da gedir) |
| **Kiçiltmək (collapse)** | Yuxarıda **— Kiçilt** düyməsi → panel **kompakt rejimə** keçir: yalnız başlıq zolağı qalır (● REC, request sayı, Start/Stop, ▢ Böyüt). Siyahı gizlənir |
| **Böyütmək (resize, əl ilə)** | Panelin sol kənarını mouse ilə dartıb enini dəyişmək. Seçilmiş en və kompakt/tam rejim yadda qalır (`chrome.storage.local`) |

```
Tam rejim                                Kompakt rejim
┌────────────────────────────┐           ┌────────────────────────────┐
│ Debugger    [— Kiçilt] [✕] │           │ ● REC 14  [Stop] [▢] [✕]   │
├────────────────────────────┤           └────────────────────────────┘
│ ● REC 14 request  [Stop]   │
│ ▸ POST /api/orders 200 ... │
│ ▸ GET  /api/users  200 ... │
⇔ (sol kənar dartılır)       │
└────────────────────────────┘
```

**Texniki məhdudiyyətlər (Chrome side panel):**
- Panelin enini istifadəçi Chrome-un özündə sol kənarı dartmaqla dəyişir; extension kodu eni birbaşa təyin edə bilmir. Chrome-un minimum eni var (~320px), daha dar etmək olmur.
- Kompakt rejimdə panelin **hündürlüyü** dəyişmir (side panel həmişə tam hündürlükdədir) — kiçiltmə panelin **içindəki məzmunu** yığır.
- Bağlama: panel səhifəsindən `window.close()` (və ya yeni Chrome-larda `chrome.sidePanel.close()`).

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
- [ ] Siyahı side panel-də göstərilir
- [ ] Side panel **✕ düyməsi** ilə bağlanır; qeyd davam edirsə dayanmır
- [ ] **— Kiçilt / ▢ Böyüt** düyməsi: kompakt rejim (yalnız REC statusu, say, Start/Stop) ↔ tam rejim
- [ ] Panelin eni **əl ilə dartılaraq** dəyişdirilir; en və rejim yadda qalır
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
