# F-010 — State Watcher (`data-watch`)

**Status:** 🔵 Hazırlanır · **Mərhələ:** v0.2 · **Tələblər:** — · **Əvəz edir:** [F-009](F-009-redux-action-tracker.md)

## Niyə
API request-lərinin yanında **tətbiqin daxili vəziyyətini** (komponent state, form dəyərləri) görmək. Məntiq Desktop-dakı `state-watcher` prototipindən götürülüb (2026-11-05); F-009 (Redux) bununla **əvəz olundu**.

## İstifadəçi hekayəsi
> **QA / developer** kimi, **koda `data-watch` qoyduğum komponentlərin / formların dəyərini canlı görmək** istəyirəm ki, **ekranda nə baş verdiyini DevTools açmadan yoxlayım**.

## İstifadə (koda)
```jsx
<Profile data-watch="profile" />                     // komponent: props + useState / useReducer
<input data-watch="email" {...register('email')} />  // RHF sahəsi: dəyər + xəta
<form data-watch="loginForm">…</form>                // RHF formu (FormProvider daxilində)
<div data-watch="step" data-watch-value={step} />    // istənilən dəyər
```
`data-watch` (və ya `data-watch={true}` — komponentin adı götürülür). Eyni ad təkrarlananda `#2`, `#3` əlavə olunur.

## UI
3-cü tab **"State (N)"** (Qeyd · Saxlanmışlar · State). Hər element kart: ad, növ (`component · Profile`, `field`, `form`, `value`…), mənbə (`File.tsx:12`, dev build-də), son dəyişiklik vaxtı, dəyər (JsonTree, max 300px).

## Texniki qeydlər
- Inject **CDP ilə** (F-009 R1 kimi): `Runtime.addBinding('__apiLensEmit')` + `Page.addScriptToEvaluateOnNewDocument` (sonrakı yükləmələr) + `Runtime.evaluate` (açıq səhifə — **yeniləmək lazım deyil**). Yeni icazə yoxdur, localhost məhdudiyyəti yoxdur.
- Skript: `extension/public/watch-inject.js` (prototipin `inject.js`-i; `postMessage` relay əvəzinə binding).
- React fiber ağacı: React DevTools hook-u varsa `getFiberRoots`, yoxdursa DOM-dakı `__reactContainer$`.
- Yeniləmə: React DevTools varsa hər commit-də (`onCommitFiberRoot`), RHF subject-lərinə abunə, ehtiyat olaraq hər 1 san skan.
- Yalnız yaddaşda; HAR / Saxlanmışlara düşmür. Record / Təmizlə / ✕ / səhifə naviqasiyası siyahını sıfırlayır.

## Qəbul meyarları
- [ ] Record → açıq səhifədəki `data-watch` elementləri State tab-ında görünür
- [ ] Dəyər dəyişəndə kart yenilənir (≤ 1 san)
- [ ] RHF input-a yazanda dəyər dərhal yenilənir
- [ ] `data-watch` olmayan saytda heç nə sınmır — "data-watch tapılmadı" yazılır

## Açıq suallar
- ❓ Yoxdur
