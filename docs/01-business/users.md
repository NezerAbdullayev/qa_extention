# İstifadəçilər

> **Qərar (Sessiya #1, 2026-11-03):** Əsas istifadəçilər şirkət daxilindəki iki qrupdur: **developer-lər (frontend + backend)** və **QA testçilər**. Hər ikisi bərabər prioritetlidir.
> Müştərilər **hələlik nəzərdə tutulmur** (Q4 yenilənməsi — layihə daxilidir). Gələcəkdə əlavə oluna bilər, bax: [Gələcək istifadəçilər](#gələcək-istifadəçilər-hələlik-yox).

## 1. Developer (frontend və backend)
- Texniki biliyi yüksəkdir.
- Extension-u həm **özləri istifadə edirlər** (öz mühitində debug, request/response yoxlamaq), həm də **QA-dan gələn qeydləri qəbul edirlər**.
- **Frontend developer-in ehtiyacları:** hansı request-in hansı payload ilə getdiyi, initiator (hansı kod çağırıb), console error-lar, timing.
- **Backend developer-in ehtiyacları:** request headers, payload, status, response body, xəta səbəbi; request-i təkrar etmək üçün tam məlumat (məs. cURL kimi kopyalamaq).
- **Ümumi ehtiyac:** Inspect-dəki kimi tam məlumat (HAR → DevTools-a import).

## 2. QA testçi
- Texniki.
- Ehtiyacı: qeydi başlatmaq/dayandırmaq, faylı yükləyib developer-ə göndərmək, snapshot saxlamaq, müqayisə etmək, ignore siyahısı, export/import.

## Gələcək istifadəçilər (hələlik yox)
### Müştəri (son istifadəçi)
- Texniki biliyi azdır.
- Ehtiyacı: problemi göstərmək üçün ən az addım (Start → problemi təkrarla → Stop → faylı yüklə → özü göndərsin).
- Əlavə olunsa lazım olacaq: müştəriyə paylama üsulu (məs. Web Store unlisted + privacy policy), sadə interfeys, qısa təlimat.

<!-- ❓ Açıq sual: başqa rol varmı? (məs. PM, dəstək operatoru) -->
