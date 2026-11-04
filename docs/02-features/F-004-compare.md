# F-004 — API müqayisəsi və hesabat

**Status:** 🔵 Hazırlanır · **Mərhələ:** MVP · **Tələblər:** FR-08, FR-09, FR-15

## Niyə
Eyni API-nin iki cəhdi arasında hansı key-lərin olmadığını, hansı dəyərlərin səhv olduğunu və ya gəlmədiyini dərhal görmək.

## İstifadəçi hekayəsi
> **QA** kimi, **iki saxlanmış API-ni seçib müqayisə etmək** istəyirəm ki, **key və dəyər fərqləri üzrə hesabat alım**.

## UI / Axın
> **Nə müqayisə olunur (Sessiya #2, Q6):** **yalnız response body.** Payload, query, request/response headers, status kodu və müddət müqayisə olunmur.

1. Saxlanmış API-lər siyahısından ([F-003](F-003-snapshots.md)) **iki** API seçilir: **A** (əsas / gözlənilən) və **B** (yoxlanılan).
2. Müqayisə rejimi seçilir:

| # | Rejim | Nəyə baxır | Hesabat nə göstərir |
|---|---|---|---|
| 1 | **Key-lərə görə** | Yalnız struktur (key-lər) | ➖ A-da olub B-də olmayan key-lər · ➕ B-də olub A-da olmayan key-lər |
| 2 | **Dəyərlərə görə** | Hər iki tərəfdə olan key-lərin dəyərləri | ✏️ fərqli dəyərlər · ∅ dəyər gəlmir (`null`, boş `""`, boş `[]`/`{}`) · ⚠️ tip dəyişməsi (`number → string`) |
| 3 | **Key + dəyər (tam)** | Hər ikisi birlikdə | 1 və 2-nin birləşmiş hesabatı |

3. Hesabat ekranda göstərilir: yuxarıda **xülasə**, altında iki response **JSON formasında qarşı-qarşıya** (A solda, B sağda) — fərqli sətirlər rənglə işarələnir (Sessiya #2, Q9).

## Qarşı-qarşıya JSON görünüşü (Sessiya #2, Q9)
```
⚠️ Fərqli API-lər müqayisə olunur: GET /api/v1/passports ↔ GET /api/tasks   ← yalnız fərqli API-lərdə
Xülasə: 2 key yoxdur · 1 yeni key · 3 dəyər fərqli · 1 dəyər gəlmir · 1 tip dəyişib

┌──────── A: "sifariş-uğurlu" ────────┬──────── B: "482915" ─────────────────┐
│ {                                   │ {                                    │
│   "status": "success",          ✏️  │   "status": "error",             ✏️  │
│   "data": {                         │   "data": {                          │
│     "orderId": 12345,           ➖  │                                      │
│     "amount": 100,              ✏️  │     "amount": -5,                ✏️  │
│     "total": 100,               ⚠️  │     "total": "100",              ⚠️  │
│     "customer": {                   │     "customer": {                    │
│       "phone": "+994...",       ∅   │       "phone": null,             ∅   │
│     }                               │     }                                │
│   }                                 │   },                                 │
│                                     │   "error": { "message": "…" }    ➕  │
│ }                                   │ }                                    │
└─────────────────────────────────────┴──────────────────────────────────────┘
```
- Rənglər: ➖ yalnız A-da (qırmızı) · ➕ yalnız B-də (yaşıl) · ✏️ fərqli dəyər (sarı) · ⚠️ tip dəyişməsi (narıncı) · ∅ dəyər gəlmir (boz)
- Hər iki tərəf **eyni sətir hündürlüyündə** düzülür; bir tərəfdə olmayan key üçün qarşı tərəfdə boş sətir qalır
- İki panel **sinxron scroll** olur
- Rejimə görə işarələmə: **Key-lərə görə** → yalnız ➖ ➕ · **Dəyərlərə görə** → yalnız ✏️ ⚠️ ∅ · **Key + dəyər** → hamısı

## Nümunə hesabat (siyahı şəklində — xülasənin altında)
```
Müqayisə: "sifariş-uğurlu" (A)  ↔  "482915" (B)        Rejim: Key + dəyər
POST /api/orders                               (yalnız response body)

Xülasə: 2 key yoxdur · 1 yeni key · 3 dəyər fərqli · 1 dəyər gəlmir · 1 tip dəyişib

Key-lər
  ➖ data.orderId          (A-da var, B-də yoxdur)
  ➖ data.invoice.url      (A-da var, B-də yoxdur)
  ➕ error.message         (yalnız B-də)
Dəyərlər
  ✏️ status:        "success" → "error"
  ✏️ data.amount:   100       → -5
  ✏️ data.currency: "AZN"     → "USD"
  ∅  data.customer.phone: "+994..." → null
  ⚠️ data.total:    number    → string
```

## Qəbul meyarları
- [x] Saxlanmış API-lərdən ikisi seçilir (A və B)
- [x] **Fərqli API-lər** də müqayisə oluna bilər (məs. `passports` ↔ `tasks`). Bu halda hesabatın başında xəbərdarlıq: "⚠️ Fərqli API-lər müqayisə olunur: `GET /api/v1/passports` ↔ `GET /api/tasks`" (Sessiya #2, Q7)
- [x] "Fərqli API" = method və ya path (query-siz) fərqlidir
- [x] Yalnız **response body** müqayisə olunur (payload, headers, status, müddət — yox)
- [x] 3 rejim: key-lərə görə · dəyərlərə görə · key + dəyər
- [x] İç-içə (nested) obyektlər tam yoxlanılır; yol nöqtə ilə göstərilir (`data.items[0].price`)
- [x] Hər rejim üçün hesabat: xülasə (saylar) + ətraflı siyahı
- [x] İki response **JSON formasında qarşı-qarşıya** göstərilir (A solda, B sağda), fərqlər rənglə işarələnir, sinxron scroll (Sessiya #2, Q9)
- [x] Response body JSON deyilsə (HTML, mətn, boş və ya parse olunmayan JSON) → **müqayisə olunmur**, xəbərdarlıq göstərilir: "⚠️ Response JSON formatında deyil — müqayisə mümkün deyil" (Sessiya #2, Q14)
- [x] Xəbərdarlıqda hansı API-nin (A və ya B, ya hər ikisi) JSON olmadığı və onun Content-Type-ı göstərilir
- [x] Ignore siyahısı (məs. `timestamp`, `createdAt`, `requestId`) — yadda qalır (Should)
- [x] Massivlər üçün "id-yə görə uyğunlaşdır" seçimi (Should)

## Texniki qeydlər
- Diff: öz yüngül funksiyamız — `extension/src/shared/compare.ts` (kitabxana yoxdur); UI — `CompareView.tsx`
- Açılış: Saxlanmışlar → 2 API seç (ilk seçilən **A**, ikinci **B**) → **⇄ Müqayisə et**; ⇆ A/B yerini dəyişir; Esc / ← Geri siyahıya qaytarır
- Görünüş: **Qarşı-qarşıya** (bir scroll konteyneri → sinxron scroll) və **Siyahı** (Key-lər / Dəyərlər)
- ∅ "dəyər gəlmir" = B-də `null`, `""`, `[]`, `{}` (A-da dolu); key ümumiyyətlə yoxdursa → ➖ (Sessiya #2, Q8 — variant A)
- Massiv elementləri default olaraq indeksə görə; "id-yə görə" seçimi yalnız bütün elementlərdə unikal `id` olduqda işləyir (yol: `items[id=5]`)
- Ignore: key adı (istənilən dərinlikdə) və ya tam yol, vergüllə ayrılır; rejim, ignore və id seçimi `chrome.storage.local` → `compareOptions`-da yadda qalır
- Müqayisə yalnız lokal, heç yerə göndərilmir

## Açıq suallar
Bax: [Sessiya #2](../06-qa-sessions/2026-11-03-session-2.md)
