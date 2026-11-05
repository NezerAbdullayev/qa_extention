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
### İstənilən dəyişən — `window.$watch` (2.5.4)
```ts
window.$watch?.('defaultState', defaultState);   // hook, funksiya, React-dən kənar — fərq etmir
```
- **Metod forması** (2.5.5): `address?.$watch?.('address', address)` — istənilən dəyərdə (obyekt, massiv, string, rəqəm). Aktivləşdir basılanda `Object.prototype`-a **görünməz** (`enumerable: false`) və **üzərinə yazıla bilən** `$watch` əlavə olunur; `Object.keys` / `JSON` / `for…in` onu görmür. `null` / `undefined` üçün ilk `?.` mütləqdir. TS: `declare global { interface Object { $watch?<T>(name: string, value?: T): T } }`.
- Extension aktiv deyilsə `?.` sayəsində heç nə olmur (production-da zərərsiz). Dəyəri geri qaytarır.
- Yeni dəyər (`setState` → render → yenidən çağırılır) **dərhal**, yerində mutasiya (`obj.name = 'x'`) **≤ 1 san** (istinad yadda saxlanılır, hər skanda JSON müqayisə olunur).
- Aktivləşdir-dən **əvvəl** edilən çağırışlar itir — dəyər növbəti render-də və ya səhifə yeniləndikdən sonra görünür.
- TypeScript üçün bir dəfə (`.d.ts`):
  ```ts
  declare global { interface Window { $watch?: <T>(name: string, value: T) => T } }
  export {};
  ```

`data-watch` (və ya `data-watch={true}` — komponentin adı götürülür). Eyni ad təkrarlananda `#2`, `#3` əlavə olunur.

## UI
3-cü tab **"State (N)"** (Qeyd · Saxlanmışlar · State) — yalnız local səhifə qeyd olunanda görünür. Hər element kart: ad, növ (`component · Profile`, `field`, `form`, `value`…), mənbə (`File.tsx:12`, dev build-də), son dəyişiklik vaxtı, dəyər (JsonTree, max 300px).

## Texniki qeydlər
- Inject **CDP ilə** (F-009 R1 kimi): `Runtime.addBinding('__apiLensEmit')` + `Page.addScriptToEvaluateOnNewDocument` (sonrakı yükləmələr) + `Runtime.evaluate` (açıq səhifə — **yeniləmək lazım deyil**). Yeni icazə yoxdur.
- **Yalnız local** (2.5.1): qeyd olunan tab `localhost` / `127.0.0.1` deyilsə, watcher inject olunmur və State tab-ı **gizlənir** (başqa saytlarda xəta verirdi).
- **Aktivləşdir düyməsi** (2.5.3): watcher Record ilə avtomatik başlamır; State tab-ında düymə basılanda (Record aktiv olmalıdır) inject olunur. Stop / yeni Record / debugger ayrılması onu söndürür.
- Skript: `extension/public/watch-inject.js` (prototipin `inject.js`-i; `postMessage` relay əvəzinə binding).
- React fiber ağacı: React DevTools hook-u varsa `getFiberRoots`, yoxdursa DOM-dakı `__reactContainer$`.
- Yeniləmə: React DevTools varsa hər commit-də (`onCommitFiberRoot`), RHF subject-lərinə abunə, ehtiyat olaraq hər 1 san skan.
- Yalnız yaddaşda; HAR / Saxlanmışlara düşmür. Record / Təmizlə / ✕ / səhifə naviqasiyası siyahını sıfırlayır.

## Qəbul meyarları
- [ ] Record → State → **Aktivləşdir** → açıq səhifədəki `data-watch` elementləri görünür
- [ ] Dəyər dəyişəndə kart yenilənir (≤ 1 san)
- [ ] RHF input-a yazanda dəyər dərhal yenilənir
- [ ] `data-watch` olmayan saytda heç nə sınmır — "data-watch tapılmadı" yazılır

## Açıq suallar
- ❓ Yoxdur
