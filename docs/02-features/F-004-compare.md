# F-004 — API müqayisəsi və hesabat

**Status:** 📝 Spec · **Mərhələ:** ❓ (bax: Sessiya #2) · **Tələblər:** FR-08, FR-09, FR-15

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

3. Hesabat ekranda göstərilir.

## Nümunə hesabat
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
- [ ] Saxlanmış API-lərdən ikisi seçilir (A və B)
- [ ] Yalnız **response body** müqayisə olunur (payload, headers, status, müddət — yox)
- [ ] 3 rejim: key-lərə görə · dəyərlərə görə · key + dəyər
- [ ] İç-içə (nested) obyektlər tam yoxlanılır; yol nöqtə ilə göstərilir (`data.items[0].price`)
- [ ] Hər rejim üçün hesabat: xülasə (saylar) + ətraflı siyahı
- [ ] Response body JSON deyilsə (HTML, mətn, boş) → müqayisə olunmur, xəbərdarlıq göstərilir ❓
- [ ] Ignore siyahısı (məs. `timestamp`, `createdAt`, `requestId`) — yadda qalır (Should)
- [ ] Massivlər üçün "id-yə görə uyğunlaşdır" seçimi (Should)

## Texniki qeydlər
- Diff kitabxanası: `jsondiffpatch` (extension-un içinə daxil edilir) və ya öz yüngül diff funksiyamız
- Müqayisə yalnız lokal, heç yerə göndərilmir

## Açıq suallar
Bax: [Sessiya #2](../06-qa-sessions/2026-11-03-session-2.md)
