# İstifadəçilər

> **Qərar (Sessiya #1, 2026-11-03):** Üç əsas istifadəçi qrupu var və hamısı bərabər prioritetlidir: **developer-lər (frontend + backend)**, **QA testçilər** və **müştərilər**.

## 1. Developer (frontend və backend)
- Texniki biliyi yüksəkdir.
- Extension-u həm **özləri istifadə edirlər** (öz mühitində debug, request/response yoxlamaq), həm də **müştəri və QA-dan gələn qeydləri qəbul edirlər**.
- **Frontend developer-in ehtiyacları:** hansı request-in hansı payload ilə getdiyi, initiator (hansı kod çağırıb), console error-lar, timing.
- **Backend developer-in ehtiyacları:** request headers, payload, status, response body, xəta səbəbi; request-i təkrar etmək üçün tam məlumat (məs. cURL kimi kopyalamaq).
- **Ümumi ehtiyac:** Inspect-dəki kimi tam məlumat (HAR → DevTools-a import).

## 2. QA testçi
- Texniki.
- Ehtiyacı: snapshot saxlamaq, müqayisə etmək, ignore siyahısı, export/import.

## 3. Müştəri (son istifadəçi)
- Texniki biliyi azdır.
- Ehtiyacı: problemi göstərmək üçün ən az addım (Start → problemi təkrarla → Stop → faylı yüklə). Faylı developer-ə özü manual göndərir (e-poçt, chat və s.).

<!-- ❓ Açıq sual: başqa rol varmı? (məs. PM, dəstək operatoru) -->
