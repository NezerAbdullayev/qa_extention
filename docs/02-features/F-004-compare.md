# F-004 — Snapshot müqayisəsi

**Status:** 📝 Spec · **Mərhələ:** v0.2 · **Tələblər:** FR-08, FR-09

## Niyə
Eyni əməliyyatın iki cəhdi arasında nəyin dəyişdiyini (dəyər, key, tip, status) dərhal görmək.

## İstifadəçi hekayəsi
> **QA** kimi, **iki snapshot-u müqayisə etmək** istəyirəm ki, **response-da hansı dəyərlərin və key-lərin dəyişdiyini görüm**.

## Qəbul meyarları
- [ ] İki snapshot seçilir → endpoint-lər avtomatik cütləşdirilir (`method + normalize olunmuş path`)
- [ ] Path-dəki ID-lər `:id` ilə normalize olunur
- [ ] Müqayisə: status, payload, query, response body, (opsional) headers, müddət
- [ ] Nəticə: ➕ yeni key · ➖ silinmiş key · ✏️ dəyişmiş dəyər · ⚠️ tip dəyişməsi
- [ ] Yalnız bir snapshot-da olan endpoint-lər ayrıca göstərilir
- [ ] Ignore siyahısı (məs. `timestamp`, `createdAt`, `token`, `requestId`) — yadda qalır
- [ ] Massivlər üçün "id-yə görə uyğunlaşdır" seçimi

## Nümunə çıxış
```
POST /api/orders                      status: 200 → 400  ⚠️
Payload:
  ✏️ amount:        100  → -5
  ➕ couponCode:    "TEST10"
Response:
  ✏️ status:        "success" → "error"
  ➖ data.orderId:  12345
  ⚠️ data.total:    number → string
```

## Texniki qeydlər
- Diff kitabxanası: `jsondiffpatch` (extension-un içinə daxil edilir)

## Açıq suallar
- ❓ Eyni endpoint bir snapshot-da bir neçə dəfə çağırılıbsa, necə cütləşdirək? (sıra ilə / payload-a görə)
