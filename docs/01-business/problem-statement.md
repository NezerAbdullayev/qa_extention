# Problem

## Hazırkı vəziyyət
- Müştəri zəng edir: "Filan düyməni basıram, xəta çıxır."
- Developer müştəriyə Inspect → Network açmağı, request-i tapmağı, payload/response-u kopyalamağı izah etməli olur.
- Müştəri texniki deyil → vaxt itir, data natamam gəlir, bəzən heç gəlmir.
- QA eyni əməliyyatı fərqli dəyərlərlə təkrarlayanda response-ları əl ilə müqayisə edir.

## Nəticələri
- Dəstək vaxtı uzanır.
- Bug-ın səbəbi gec tapılır.
- Reqressiyalar (key itməsi, tip dəyişməsi) gözdən qaçır.

## Mövcud alternativlər və niyə özümüz yazırıq
| Alət | Çatışmazlıq |
|---|---|
| Jam.dev, BrowserStack Bug Capture | Data üçüncü tərəf serverə gedir; snapshot müqayisəsi yoxdur |
| Network Logger – HAR Exporter | Yalnız HAR; yaddaş və müqayisə yoxdur |
| Sentry / LogRocket | Sayt koduna SDK lazımdır; QA müqayisəsi yoxdur |
