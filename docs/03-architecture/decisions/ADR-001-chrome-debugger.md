# ADR-001 — Network trafiki üçün `chrome.debugger` API

**Status:** 🟢 Qəbul edildi · **Tarix:** 2026-11-03

## Kontekst
Request və response body daxil olmaqla Inspect → Network-dakı bütün məlumatı DevTools açmadan tutmalıyıq.

## Variantlar
1. `chrome.debugger` (CDP) — tam data, body daxil; "debugging" zolağı görünür.
2. Content script ilə fetch/XHR override — zolaq yoxdur; network səviyyəli xətaları (CORS, ERR_*) tam görmür.
3. `chrome.webRequest` — response body vermir.

## Qərar
Variant 1. Tam data əsas tələbdir; zolaq istifadəçiyə qeydin getdiyini də göstərir.

## Nəticələr
- `debugger` icazəsi Web Store-da əlavə yoxlama tələb edə bilər.
- Eyni tab-a yalnız bir debugger client qoşula bilər (başqa debug extension-larla konflikt mümkündür).
