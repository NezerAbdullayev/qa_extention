# F-003 — API yadda saxlama

**Status:** 📝 Spec · **Mərhələ:** ❓ (bax: Sessiya #2) · **Tələblər:** FR-07, FR-10

## Niyə
QA bir API-nin nəticəsini saxlasın, sonra başqa dəyərlərlə təkrar edib müqayisə etsin ([F-004](F-004-compare.md)).

## İstifadəçi hekayəsi
> **QA** kimi, **siyahıdakı bir API-ni adla yadda saxlamaq** istəyirəm ki, **sonra başqa saxlanmış API ilə müqayisə edim**.

## UI / Axın
1. [F-008](F-008-request-list.md) siyahısında API sətirinin sağındakı **💾 Yadda saxla** düyməsi basılır.
2. Popup (modal) açılır:
   ```
   ┌──────────── API-ni yadda saxla ────────────┐
   │ Ad: [______________________]               │
   │     (boş qalsa avtomatik: 6 rəqəmli nömrə) │
   │                     [Ləğv et]  [Saxla]     │
   └────────────────────────────────────────────┘
   ```
3. Ad daxil edilməyibsə → **təsadüfi 6 rəqəmli tam ədəd** verilir (`100000`–`999999`, məs. `482915`).
4. API "Saxlanmış API-lər" siyahısına düşür.

## Qəbul meyarları
- [ ] Hər request sətirində "Yadda saxla" düyməsi var
- [ ] Klikdə ad soruşan popup açılır
- [ ] Ad boşdursa (və ya yalnız boşluqdursa) → təsadüfi 6 rəqəmli tam ədəd (`100000`–`999999`)
- [ ] Təsadüfi ad mövcud adla üst-üstə düşsə → yenisi generasiya olunur
- [ ] Saxlanan: tam request + response (URL, method, status, headers, payload, body, timing) + ad + saxlama tarixi
- [ ] Saxlanmış API-lər siyahısı: ad, method, path, status, tarix
- [ ] Saxlanmış API-ni açıb detallarına baxmaq
- [ ] Silmək, adını dəyişmək
- [ ] Brauzer bağlanandan sonra data qalır
- [ ] JSON export / import (başqa QA ilə paylaşmaq) — Should

## Texniki qeydlər
- Yaddaş: IndexedDB (`savedApis` store)
- İcazə: `unlimitedStorage`
- Təsadüfi ad: `crypto.getRandomValues` ilə `100000 + n % 900000`

## Açıq suallar
Bax: [Sessiya #2](../06-qa-sessions/2026-11-03-session-2.md)
