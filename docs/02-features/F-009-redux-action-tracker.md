# F-009 — Redux Action Tracker

**Status:** 📝 Spec (müzakirə) · **Mərhələ:** v0.2 · **Tələblər:** —

## Niyə
API request-ləri görürük, amma **tətbiqin daxilində nə baş verdiyini** (hansı Redux action işlədi, state necə dəyişdi) görmürük. Redux DevTools bunu edir, amma ayrıca extension-dur və QA-nın API qeydi ilə əlaqələndirilmir.

Redux DevTools sehrli heç nə etmir: səhifə yüklənməzdən **əvvəl** `window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` funksiyasını window-a qoyur, tətbiq (`configureStore`) store yaradanda onu özü çağırır. Biz də eyni funksiyanı qoya bilərik.

## İstifadəçi hekayəsi
> **QA / developer** kimi, **qeyd zamanı Redux action-larını (type + payload) və dəyişən state-i API request-lərinin yanında görmək** istəyirəm ki, **"bu düyməyə basanda nə dispatch olundu və hansı API getdi" sualına bir yerdə cavab tapım**.

## Əhatə — böyük yox, normal funksionallıq
**Daxildir:**
- Action siyahısı: `type`, `payload`, vaxt
- Hər action-dan sonra state (bütöv və ya seçilmiş slice-lar)
- Redux DevTools ilə **birlikdə** işləmək (onu sındırmamaq)

**Daxil deyil (indilik):**
- Time-travel, action replay, "jump to state"
- Extension-dan `dispatch` etmək
- Redux-dan başqa store-lar (Zustand, MobX …)
- State diff vizuallaşdırması (sonra F-004 compare ilə ola bilər)

## Necə işləyir — iki variant

### A) CDP ilə (tövsiyə) — yeni icazə lazım deyil
Biz artıq `chrome.debugger` ilə taba qoşuluruq. Eyni sessiyadan:
1. `Runtime.addBinding({ name: '__apiLensEmit' })` — səhifədə `window.__apiLensEmit(string)` funksiyası yaranır, çağırılanda background-a `Runtime.bindingCalled` hadisəsi gəlir.
2. `Page.addScriptToEvaluateOnNewDocument({ source })` — inject skripti hər səhifə yüklənməsində, tətbiq kodundan **əvvəl** işləyir (document_start ekvivalenti).
3. Skript `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` üçün `defineProperty` tələsi qurur, öz enhancer-ini zəncirə əlavə edir, hər action-dan sonra `__apiLensEmit(JSON)` çağırır.

Üstünlüklər: content script, `host_permissions`, `postMessage` relay lazım deyil; yalnız qeyd gedən tabda işləyir.

### B) Content script ilə (Redux DevTools-un özü belə edir)
`content_scripts` → `"world": "MAIN"`, `"run_at": "document_start"` + ISOLATED relay skripti → background. Daim bütün saytlarda işləyir, amma `<all_urls>` icazəsi tələb edir (Chrome Web Store-da xəbərdarlıq).

## Inject skriptinin əsası
```js
let real = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;      // Redux DevTools bizdən əvvəl gəlibsə
const compose = (...f) => f.length ? f.reduce((a, b) => (...x) => a(b(...x))) : (x) => x;

const enhancer = (createStore) => (reducer, preloaded) => {
  const store = createStore(reducer, preloaded);
  const dispatch = (action) => {
    const r = store.dispatch(action);
    if (action && typeof action === 'object') emit(action, store.getState());
    return r;
  };
  return { ...store, dispatch };
};

const wrap = (base) => (...args) => {
  if (args.length === 1 && args[0] && typeof args[0] === 'object') {   // RTK: compose(opts)(...enh)
    const inner = base ? base(args[0]) : compose;
    return (...enh) => inner(...enh, enhancer);
  }
  return (base || compose)(...args, enhancer);                          // klassik compose(...enh)
};

try {
  Object.defineProperty(window, '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__', {
    configurable: true,
    get: () => wrap(real),
    set: (v) => { real = v; },                                          // Redux DevTools bizdən sonra gəlirsə
  });
} catch {}
```
`emit` — action + state-i təhlükəsiz serializasiya edir (funksiya, dövri referans → `"[unserializable]"`), ölçünü məhdudlaşdırır və `__apiLensEmit`-ə ötürür.

## Qəbul meyarları
- [ ] Qeyd aktiv olanda, Redux (RTK `configureStore`) istifadə edən saytda action-lar panelə düşür
- [ ] Hər action-da `type`, `payload`, vaxt və state görünür (JsonTree ilə)
- [ ] Redux DevTools quraşdırılıbsa, o da işləməyə davam edir
- [ ] Redux olmayan saytda heç nə sınmır, sadəcə "Redux tapılmadı" yazılır
- [ ] Serializasiya olunmayan / çox böyük state paneli dondurmur
- [ ] Həssas data masking (F-005) state-ə də tətbiq olunur

## UI / Axın
Minimal: request siyahısının yanında **"API | Redux"** tab-ı (və ya filtr). Redux siyahısı F-008 kimi açılan qutular:
```
▸ 12:01:03  taxpayerSlice/setCurrentStep     payload: 2
▸ 12:01:04  api/executeQuery/pending
▸ 12:01:04  api/executeQuery/fulfilled
```
Açanda: payload + state (JsonTree).

## Məhdudiyyətlər
- **Vaxt:** RTK qlobalı store yaradılanda bir dəfə oxuyur. Qeyd səhifə yükləndikdən sonra başlayırsa → **səhifəni yeniləmək lazımdır**. Panel bunu göstərməlidir ("Redux action-ları üçün səhifəni yeniləyin").
- **`devTools: false`** olan tətbiqlərdə (adətən production) işləmir — bu halda heç nə göstərilmir.
- **Ağır state:** 45 RTK Query keşi kimi böyük state hər action-da göndərilsə yavaş olar.
- Thunk funksiyaları görünmür, yalnız reducer-ə çatan düz action-lar (Redux DevTools ilə eyni).

## Açıq suallar
- ❓ **Variant A (CDP) və ya B (content script)?** Tövsiyə: A — yeni icazə yoxdur, mövcud debugger sessiyası istifadə olunur.
- ❓ **State: bütöv, yoxsa yalnız dəyişən slice-lar?** Tövsiyə: yalnız action-dan sonra dəyişən top-level slice-lar (referans müqayisəsi `prev[k] !== next[k]`) — ucuz və kifayətdir.
- ❓ **UI: ayrı tab, yoxsa API siyahısı ilə qarışıq vaxt xətti?** Tövsiyə: əvvəl ayrı tab (sadə).
- ❓ **Redux action-ları HAR export-a / Saxlanmışlara düşsün?** Tövsiyə: indilik yox.
- ❓ **Qeyd başlayanda səhifəni avtomatik yeniləyək, yoxsa yalnız xəbərdarlıq?**
