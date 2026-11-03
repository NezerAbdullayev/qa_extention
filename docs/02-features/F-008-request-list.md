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
│ ▸ MY_TASKS_COLUMNS                  GET   200   45 ms [💾]│  ← bağlı qutu
│ ▾ passports                         GET   200   85 ms [💾]│  ← açıq qutu
│ ┌───────────────────────────────────────────────────────┐ │
│ │ https://site.az/api/v1/passports?page=1               │ │  ▲
│ │ method: GET                                           │ │  │
│ │ status: 200                                           │ │  │
│ │                                                       │ │  │
│ │ Request headers  (göndərilən)                         │ │  │ hündürlük
│ │ {                                                     │ │  │ max 500px
│ │   "Accept": "application/json",                       │ │  │ (daxildə scroll)
│ │   "Authorization": "***"                              │ │  │
│ │ }                                                     │ │  │
│ │                                                       │ │  │
│ │ Response headers  (qayıdan)                           │ │  │
│ │ {                                                     │ │  │
│ │   "Content-Type": "application/json",                 │ │  │
│ │   "Set-Cookie": "***"                                 │ │  │
│ │ }                                                     │ │  │
│ │                                                       │ │  │
│ │ Payload  (göndərilən)                                 │ │  │
│ │ {                                                     │ │  │
│ │   "page": "1"                                         │ │  │
│ │ }                                                     │ │  │
│ │                                                       │ │  │
│ │ Response  (qayıdan)                                   │ │  │
│ │ {                                                     │ │  │
│ │   "data": [ { "id": 42, "fin": "5ABC123" } ],         │ │  │
│ │   "total": 1                                          │ │  │
│ │ }                                                     │ │  ▼
│ └───────────────────────────────────────────────────────┘ │
│ ▸ passports                         GET   200   80 ms [💾]│
│ ▸ tasks?sort=regNumber&taskSta…     GET   200  120 ms [💾]│
│ ▸ find.batch                        POST  500  310 ms [💾]│  ← xəta: qırmızı
│ ▸ list?checkFin=true                GET   200   60 ms [💾]│
└───────────────────────────────────────────────────────────┘
```

### Açıq qutunun məzmunu — JSON formasında (Sessiya #2, Q5)
Bölmələr **alt-alta**, bu sıra ilə:

| # | Bölmə | Format |
|---|---|---|
| 1 | **API-nin tam ünvanı** | Tam URL (host + path + query), məs. `https://site.az/api/v1/passports?page=1` |
| 2 | **method + status** | Tam ünvanın altında: `method: GET`, onun altında `status: 200` (uğursuz request-də səbəb, məs. `status: (failed) net::ERR_CONNECTION_REFUSED`) (Sessiya #2, Q5c) |
| 3 | **Request headers** (göndərilən) | JSON obyekt: `{ "Header-Adı": "dəyər", … }` — brauzerin serverə göndərdiyi header-lər. Həssas header-lər mask olunur (`"***"`, [F-005](F-005-masking.md)) |
| 4 | **Response headers** (qayıdan) | JSON obyekt — serverin qaytardığı header-lər (`Content-Type`, `Set-Cookie` → `"***"` və s.) |
| 5 | **Payload** (göndərilən) | Request-in göndərdiyi data, **formatlanmış JSON**. DevTools "Payload" tab-ı kimi: POST/PUT/PATCH body + query string parametrləri (`?page=1` → `{ "page": "1" }`). Həssas sahələr mask olunur |
| 6 | **Response** (qayıdan) | Response body **formatlanmış JSON** (pretty-print, 2 boşluq girinti) |

- Payload yoxdursa (məs. query-siz GET) → Payload bölməsi göstərilmir.
- Payload və ya Response JSON deyilsə (form-data, HTML, mətn) → olduğu kimi mətn göstərilir.
- Response boşdursa → `(boş)`.

### Bağlı sətirdə ad — DevTools "Name" sütunu ilə eyni (Sessiya #2, Q3)
QA və developer DevTools → Network-da gördüyü adı burada da eyni görsün ki, qarışdırılmasın.

| Tam URL | Siyahıda görünən ad |
|---|---|
| `https://site.az/api/settings/MY_TASKS_COLUMNS` | `MY_TASKS_COLUMNS` |
| `https://site.az/api/v1/passports` | `passports` |
| `https://site.az/api/tasks?sort=regNumber&taskStatus=IN_WORK` | `tasks?sort=regNumber&taskStatus=IN_WORK` |
| `https://site.az/api/find.batch` | `find.batch` |
| `https://site.az/api/users/list?checkFin=true` | `list?checkFin=true` |
| `https://site.az/api/users/` (sonda `/`) | `users/` |

**Qayda:** URL path-in **son seqmenti** + varsa **query string** (`?…`). Host və əvvəlki path göstərilmir.
- Path sonda `/` ilə bitirsə → əvvəlki seqment + `/` (DevTools kimi).
- Eyni adlı request-lər (məs. iki `passports`) ayrı-ayrı sətirlərdə, çağırılma sırası ilə göstərilir.
- Ad uzundursa sonu `…` ilə kəsilir; mouse üzərinə gələndə (hover) **tam URL** göstərilir.
- URL-də kodlanmış simvollar (`%20` və s.) DevTools-dakı kimi decode olunmuş göstərilir.

**Sətirin sütunları (soldan sağa):** `Ad` · `Method` · `Status` · `Müddət` · `[💾]`
- Status rəngi: `2xx` — adi · `3xx` — boz · `4xx`/`5xx` və uğursuz (`net::ERR_*`, CORS) — **qırmızı**.
- Uğursuz request-də status yerinə səbəb qısa yazılır (məs. `(failed)`, `CORS`) — DevTools kimi.

## Qəbul meyarları
- [ ] Siyahı side panel-də göstərilir
- [ ] Side panel **✕ düyməsi** ilə bağlanır; qeyd davam edirsə dayanmır
- [ ] **— Kiçilt / ▢ Böyüt** düyməsi: kompakt rejim (yalnız REC statusu, say, Start/Stop) ↔ tam rejim
- [ ] Panelin eni **əl ilə dartılaraq** dəyişdirilir; en və rejim yadda qalır
- [ ] Start → Stop arasındakı bütün API request-ləri (**yalnız XHR / Fetch**) ümumi siyahıda (box) göstərilir
- [ ] Siyahı **canlı** yenilənir: hər request baş verən kimi dərhal siyahıya əlavə olunur (DevTools → Network kimi). Status və müddət cavab gələndə sətirdə yenilənir (gözləyəndə `(pending)`) (Sessiya #2, Q2)
- [ ] Qeyd davam edərkən də (Stop basmadan) istənilən sətiri açıb baxmaq və 💾 ilə saxlamaq olur
- [ ] **Yeni Start** basılanda əvvəlki qeydin siyahısı **silinir**; əvvəlki qeyddən 💾 ilə **yadda saxlanmış** API-lər qalır ([F-003](F-003-snapshots.md)) (Sessiya #2, Q12)
- [ ] Siyahıda **axtarış və filtr yoxdur** (Sessiya #2, Q13)
- [ ] Bağlı sətir API adını **DevTools Network "Name" sütunu ilə eyni** göstərir: son path seqmenti + query (məs. `tasks?sort=regNumber&taskStatus=IN_WORK`)
- [ ] Addan sonra **method, status, müddət** göstərilir; xətalı status (4xx, 5xx, failed) qırmızı (Sessiya #2, Q3)
- [ ] Hover → tam URL
- [ ] Sətirə klik → qutu aşağıya doğru açılır; təkrar klik → bağlanır
- [ ] Açılan qutunun hündürlüyü **məzmuna görədir, maksimum 500px** (CSS `max-height: 500px`): qısa məzmunda qutu kiçik olur, 500px-dən çox olanda qutunun daxilində scroll (Sessiya #2, Q15)
- [ ] Açıq qutuda **JSON formasında**, alt-alta: 1) tam URL · 2) `method: …` + `status: …` · 3) Request headers (JSON) · 4) Response headers (JSON) · 5) Payload — göndərilən (JSON) · 6) Response — qayıdan (formatlanmış JSON) (Sessiya #2, Q5, 5a, 5b)
- [ ] Hər sətirin **sağ tərəfində "Yadda saxla" düyməsi** (💾) — bax: [F-003](F-003-snapshots.md)
- [ ] Mətnlər i18n ilə ([ADR-002](../03-architecture/decisions/ADR-002-i18n.md))
- [ ] Həssas sahələr mask olunmuş göstərilir ([F-005](F-005-masking.md))

## Texniki qeydlər
- Data mənbəyi: [F-001](F-001-recorder.md) recorder-in IndexedDB-yə yazdığı request-lər
- JSON body formatlanmış (pretty-print) göstərilir

## Açıq suallar
Bax: [Sessiya #2](../06-qa-sessions/2026-11-03-session-2.md)
