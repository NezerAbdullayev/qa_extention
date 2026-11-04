# F-008 — Request siyahısı (açılan qutular)

**Status:** 🔵 Hazırlanır · **Mərhələ:** MVP · **Tələblər:** FR-13, FR-14

## Niyə
Start və Stop arasında gedən bütün API request-lərini Inspect açmadan, extension-un öz ekranında rahat görmək.

## İstifadəçi hekayəsi
> **QA / developer** kimi, **qeyd olunan API-ləri siyahı şəklində görmək və birinin üzərinə klikləyib detallarına baxmaq** istəyirəm ki, **DevTools açmadan request/response-u yoxlayım**.

## Yerləşmə — Side panel (Sessiya #2, Q1)
Siyahı brauzerin sağında açılan **side panel**-də göstərilir (`chrome.sidePanel`). Panel səhifə dəyişəndə və kənara klikləyəndə bağlanmır.

| Tələb | Necə |
|---|---|
| **Açmaq** | Extension ikonuna klik → side panel açılır |
| **Bağlamaq (düymə ilə)** | Panelin yuxarı sağ küncündə **✕ Bağla** düyməsi. Basılanda **qeyd dayanır və saxlanmamış "Qeyd" siyahısı silinir**; Saxlanmışlar qalır (D15, v2.4.8) |
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
- Bağlama: əvvəl `CLEAR_RECORDING` (Stop + `requests` təmizlənir), cavabdan sonra `window.close()`. Chrome-un öz side panel bağlama düyməsi və ya ikon ilə bağlamaq datanı silmir — yalnız bizim ✕ (D15).

## Ayrı pəncərə rejimi — DevTools "Undock" kimi (test sonrası D5, 2026-11-04)
**Problem:** side panel saytın enini daraldır → bəzi layihələrdə responsive dizayn pozulur, saytla işləmək çətinləşir.
**Həll:** panel ayrıca Chrome pəncərəsində açıla bilir — onu ikinci monitora qoyub, saytda noutbukda tam endə işləmək olur.

| Düymə | Harada | Nə edir |
|---|---|---|
| **⧉ Ayrı pəncərədə aç** | Side panel başlığında | Eyni UI-ı ayrıca pəncərədə açır, side panel bağlanır. Pəncərə artıq açıqdırsa — sadəcə önə gətirir |
| **⇥ Side panel-ə qaytar** | Ayrı pəncərənin başlığında | Side panel-i son istifadə olunan brauzer pəncərəsində açır, ayrı pəncərə bağlanır |

- Pəncərənin **yeri və ölçüsü yadda qalır** → növbəti dəfə eyni monitorda, eyni ölçüdə açılır.
- Ayrı pəncərədə **Start** son istifadə olunan **brauzer pəncərəsinin aktiv tab-ını** yazır (API Lens pəncərəsinin özünü yox).
- Qeyd zamanı panel hansı saytın yazıldığını göstərir: `Yazılır: site.az — Səhifə başlığı`.
- Siyahı, açılan qutular, kiçilt / bağla — hər iki rejimdə eyni işləyir; ikisi eyni anda açıq olsa da canlı yenilənir.

### Geniş pəncərədə DevTools kimi bölünmüş görünüş (test sonrası D6, 2026-11-04)
Ayrı pəncərə **geniş** olanda (≥ 900px — məs. ikinci monitorda tam ekran) görünüş avtomatik DevTools → Network kimi olur:

```
┌──────────────────────────────┬──────────────────────────────────────────────┐
│ MY_TASKS_COLUMNS  GET 200 45ms│ passports                                 ✕ │
│▌passports        GET 200 85ms│ https://site.az/api/v1/passports?page=1      │
│ tasks?sort=…     GET 200 120ms│ method: GET                                  │
│ find.batch       POST 500 310 │ status: 200                                  │
│ list?checkFin=…  GET 200 60ms │ PAYLOAD   ▾ {page: "1"}                      │
│                              ⇔ RESPONSE  ▾ {countries: Array(250), …}       │
│                              │             ▸ countries: (250) [{…}, …]      │
└──────────────────────────────┴──────────────────────────────────────────────┘
   siyahı (solda)        ⇔ dartılır       detallar (sağda, tam hündürlük)
```
- Sətirə klik → sətir seçilir (göy fon), detallar **sağda tam hündürlükdə** açılır — 300px məhdudiyyəti yoxdur.
- Eyni sətirə təkrar klik və ya **✕** / **Esc** → detallar bağlanır, siyahı tam enə qayıdır.
- **↑ / ↓** — seçimi əvvəlki / növbəti request-ə keçirir (DevTools kimi).
- Aradakı xətti mouse ilə dartıb siyahının enini dəyişmək olur; en yadda qalır.
- Pəncərə daraldılanda (< 900px) və side panel-də — əvvəlki kimi sətirin altında açılan 300px qutular. Ayrı pəncərədə eyni anda yalnız **bir** qutu açıq olur — başqasına klik əvvəlkini bağlayır (D7).

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
│ │ Payload  (göndərilən)                                 │ │  │ hündürlük
│ │ {                                                     │ │  │ max 300px
│ │   "page": "1"                                         │ │  │ (daxildə scroll)
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
| — | ~~Headers~~ | **Göstərilmir** (test sonrası D4, 2026-11-04 — əvvəl D2: yalnız Referer). Bütün header-lər yenə də yazılır — HAR export üçün lazımdır ([F-002](F-002-har-export.md)) |
| 3 | **Payload** (göndərilən) | Request-in göndərdiyi data, **formatlanmış JSON**. DevTools "Payload" tab-ı kimi: POST/PUT/PATCH body + query string parametrləri (`?page=1` → `{ "page": "1" }`). Həssas sahələr mask olunur |
| 4 | **Response** (qayıdan) | Response body **formatlanmış JSON** (pretty-print, 2 boşluq girinti) |

### JSON görünüşü — DevTools "Preview" kimi açılan ağac (test sonrası D3, 2026-11-04)
Uzun JSON tam açıq göstərilmir. Qaydalar DevTools → Network → **Preview** ilə eynidir:

```
▾ {countries: Array(250), total: 250}
  ▸ countries: (250) [{…}, {…}, {…}, {…}, …]
    total: 250
```
`countries`-ə klik →
```
  ▾ countries: (250) [{…}, {…}, {…}, …]
    ▸ [0 … 99]
    ▸ [100 … 199]
    ▸ [200 … 249]
```
`[0 … 99]` → `0`-a klik →
```
      ▾ 0: {id: "AZE", nameAz: "Azərbaycan Respublikası", nameEn: "Azerbaijan (Republic of)", …}
          id: "AZE"
          nameAz: "Azərbaycan Respublikası"
          …
```
- Yalnız **kök** açıq gəlir; iç-içə obyekt və massivlər bağlıdır.
- Bağlı obyekt bir sətirlik önizləmə göstərir: `{id: "AZE", nameAz: "…", …}`; massiv — uzunluq + önizləmə: `(250) [{…}, {…}, …]`.
- 100-dən çox elementli massivlər `[0 … 99]`, `[100 … 199]` qruplarına bölünür.
- Rənglər: key — bənövşəyi, string — qırmızı, number / boolean — göy, null — boz.
- Payload və Response bölmələrində istifadə olunur. JSON olmayan mətn olduğu kimi göstərilir.

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
- [x] **Payload** və **Response** başlıqlarının yanında kopyala ikonu: klik → məzmun buferə köçür (JSON səliqəli, 2 boşluq); payload-da body, body yoxdursa query parametrləri; "✓ Kopyalandı" 1.5 san görünür (D14, v2.4.7)
- [ ] Siyahı side panel-də göstərilir
- [ ] **⧉** düyməsi ilə panel **ayrı pəncərədə** açılır (ikinci monitor üçün); **⇥** ilə side panel-ə qayıdır; pəncərənin yeri və ölçüsü yadda qalır (D5)
- [ ] Qeyd zamanı yazılan tab göstərilir: `Yazılır: <host> — <başlıq>` (D5)
- [ ] Ayrı pəncərə ≥ 900px olanda **bölünmüş görünüş**: siyahı solda, seçilmiş request-in detalları sağda tam hündürlükdə; ✕ / Esc bağlayır; ↑ / ↓ seçimi dəyişir; ara xətt dartılır (D6)
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
- [ ] **Side panel-də** eyni anda bir neçə qutu açıq ola bilər — yeni qutu açılanda əvvəlkilər bağlanmır (Sessiya #2, Q4)
- [ ] **Ayrı pəncərədə** yalnız bir qutu açıq olur: başqa sətirə klik → o açılır, əvvəlki avtomatik bağlanır; yeni açılan sətir görünən yerə scroll olunur (D7)
- [ ] Açılan qutunun hündürlüyü **məzmuna görədir, maksimum 300px** (CSS `max-height: 300px`): qısa məzmunda qutu kiçik olur, 300px-dən çox olanda qutunun daxilində scroll (Sessiya #2, Q15; test sonrası 500 → 300px, 2026-11-04)
- [ ] JSON **DevTools Preview kimi açılan ağac** şəklində göstərilir: yalnız kök açıq, iç-içə obyekt/massivlər bağlı + önizləmə, böyük massivlər `[0 … 99]` qruplarında (D3)
- [ ] Açıq qutuda **JSON formasında**, alt-alta: 1) tam URL · 2) `method: …` + `status: …` · 3) Payload — göndərilən (JSON) · 4) Response — qayıdan (JSON); headers göstərilmir (Sessiya #2, Q5, 5a; D4)
- [ ] Hər sətirin **sağ tərəfində "Yadda saxla" düyməsi** (💾) — bax: [F-003](F-003-snapshots.md)
- [ ] Mətnlər i18n ilə ([ADR-002](../03-architecture/decisions/ADR-002-i18n.md))
- [ ] Həssas sahələr mask olunmuş göstərilir ([F-005](F-005-masking.md))

## Texniki qeydlər
- Data mənbəyi: [F-001](F-001-recorder.md) recorder-in IndexedDB-yə yazdığı request-lər
- JSON body formatlanmış (pretty-print) göstərilir

## Açıq suallar
Bax: [Sessiya #2](../06-qa-sessions/2026-11-03-session-2.md)
