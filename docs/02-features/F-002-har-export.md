# F-002 — HAR Export

**Status:** 📝 Spec · **Mərhələ:** MVP · **Tələblər:** FR-05

## Niyə
Developer faylı öz Chrome-unda DevTools → Network tab-ına sürükləyib Inspect-dəki kimi görsün.

## Qəbul meyarları
- [ ] Stop-dan sonra "HAR yüklə" düyməsi
- [ ] Fayl HAR 1.2 standartına uyğundur, Chrome DevTools-a import olunur
- [ ] Fayl adı: `<host>_<YYYY-MM-DD_HH-mm>.har`
- [ ] Mask olunmuş sahələr (F-005) export-da da mask olunub
- [ ] Console logları ayrıca JSON və ya HAR `_console` sahəsində

## Açıq suallar
- ❓ Console logları HAR-ın içində, yoxsa ayrıca fayl?
