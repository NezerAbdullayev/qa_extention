# F-011 — Postman (request-i redaktə edib yenidən göndərmək, 4-cü tab)

**Status:** 🔵 Hazırlanır (2.5.16) · **Mərhələ:** v0.3 · **Tələblər:** —

## Niyə
- **QA:** eyni API-ni fərqli data ilə tez-tez vurmaq (test datası yaratmaq, sərhəd hallarını yoxlamaq) — formu hər dəfə əl ilə doldurmadan.
- **Frontend:** backend-in müəyyən cavabına (xəta, boş siyahı, böyük data) necə reaksiya verdiyini tez yoxlamaq; Postman-a token / cookie köçürmədən.

## İstifadəçi hekayəsi
> **QA / developer** kimi, **qeyd olunmuş request-i işarələyib ayrıca siyahıya salmaq, sonra onun URL / header / body-sini dəyişib yenidən göndərmək** istəyirəm ki, **Postman açmadan, saytdakı login ilə eyni API-ni istədiyim data ilə vura bilim**.

## UI / Axın
0. **Aktivləşdirmə (State tab kimi, R6):** 4-cü tab-ın toolbar-ının solunda keçid düyməsi **Enable ⇄ Disable** (Enable — Record rəngi, Disable — boz). Söndürülü ikən:
   - Qeyd / Saxlanmışlar-da "Postman-a göndər" düymələri **görünmür**,
   - siyahı boşdur, Postman debugger-ə qoşulmur.
   Disable basanda siyahı **silinir**. Altında açılıb-bağlanan **"İstifadə qaydası"** (State tab-ındakı kimi).
1. **Qeyd** və **Saxlanmışlar** tab-larında hər sətirdə yeni düymə — **kağız təyyarə ikonu** (✈ "send"), 💾-nin yanında, eyni ölçü / stil; tooltip: **"Postman-a göndər"** (R7) → request **4-cü tab**-a düşür (sayğac artır, qısa toast).
2. **4-cü tab — "Postman (N)"** (R1b) — göndərilmiş request-lərin siyahısı (F-008 kimi sətirlər: ad · method · son status).
3. Sətrə klik → redaktə forması açılır:
   - **Method** (dropdown) + **URL** (query parametrləri URL-in içində)
   - **Headers** — açar = dəyər cədvəli (əlavə et / sil). Brauzerin icazə vermədiyi header-lər (`Cookie`, `Host`, `Origin`, `Content-Length`…) göstərilmir.
   - **Body** — mətn sahəsi; JSON-dursa format yoxlanılır (səhv JSON → xəbərdarlıq, göndərmə bloklanmır)
4. **Send** → cavab altda: **status · müddət (ms) · response** (JsonTree, resize olunan qutu — 2.5.15). Təsdiq soruşulmur (R4).
5. **Orijinala qaytar** — redaktələri silib qeyd olunmuş request-ə qayıdır (R3).

```
Qeyd · Saxlanmışlar · State · Postman (2)
┌──────────────────────────────────────────┐
│ [ Disable ]  ● Aktiv                     │
│ ▸ İstifadə qaydası                       │
├──────────────────────────────────────────┤
│ ▾ register        POST   201             │
│   POST ▾ │ http://localhost:3000/api/... │
│   Headers  Authorization │ Bearer eyJ…  ✕│
│            Content-Type  │ application/… ✕│
│            + header                      │
│   Body  { "name": "Test", "regionId": 5 }│
│   [ Send ]  ↺ Orijinala qaytar           │
│   201 · 184 ms                           │
│   ▾ { id: 77, name: "Test", … }          │
│ ▸ objects         GET    200             │
└──────────────────────────────────────────┘
```

## Texniki qeydlər
### Göndərmə — saytın öz səhifəsinin içindən (qərar R1)
Background aktiv tab-a `chrome.debugger` ilə qoşulur (artıq Record / Watch üçün istifadə olunur) və `Runtime.evaluate` ilə səhifənin içində `fetch` işlədir — DevTools Console-a `fetch(...)` yazmaq kimi:

```js
chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
  expression: `(async () => {
    const t0 = performance.now();
    const res = await fetch(URL, { method, headers, body, credentials: 'include' });
    return { status: res.status, statusText: res.statusText,
             headers: Object.fromEntries(res.headers), body: await res.text(),
             ms: Math.round(performance.now() - t0) };
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
```

Niyə belə:
- Cookie / sessiya avtomatik gedir (saytdakı login ilə).
- CORS yoxdur — sorğu saytın öz origin-indən gedir.
- Yeni icazə lazım deyil (`host_permissions` yox).
- Qeyd gedirsə, göndərilən sorğu "Qeyd" siyahısına da düşür.

Alternativ (rədd edildi): extension-un öz `fetch`-i — cookie getmir, `<all_urls>` icazəsi lazımdır, Network-də görünmür.

### Məlumat — yalnız yaddaşda (R5)
- Siyahı **background-un yaddaşında** saxlanılır (IndexedDB yox) — State tab-ı kimi: **Disable** basılanda və ya **panel bağlananda** (✕, D15) hamısı **itir**.
- Hər element: orijinal request-in kopyası (`method`, `url`, `requestHeaders`, `postData`) + redaktə olunmuş versiya (R3) + son cavab.

### Məhdudiyyətlər
- **Sorğu aktiv tab-ın içindən gedir** — həmin tab-da bu API-ni çağıran **tətbiq** açıq olmalıdır. Origin yoxlaması **yoxdur** (R9): frontend adətən başqa domendəki API-ni çağırır (`localhost:3000` → `api.test.az`); sorğu tətbiqin özü kimi CORS-dan keçir. Alınmasa (CORS / şəbəkə) xəta və bu izah göstərilir.
- Göndərmə zamanı debugger qoşulur → Chrome-un "API Lens started debugging" zolağı (Record-dakı kimi). Record / Watch gedirsə sessiya paylaşılır.
- Binary cavablar (şəkil, fayl) ilk versiyada düzgün göstərilmir — yalnız JSON / mətn.
- `Authorization` token-i qeyd anındakı dəyərdir; vaxtı bitibsə formda dəyişilir.

## Qəbul meyarları
- [ ] Enable-dən əvvəl "Postman-a göndər" düymələri görünmür; Enable → görünür
- [ ] Qeyd və Saxlanmışlar-da ✈ basanda request Postman tab-ına düşür (sayğac artır)
- [ ] Postman-da sətrə klik → method, URL, header-lər, body redaktə olunur
- [ ] Send → sorğu aktiv tab-dan (cookie ilə) gedir, status / müddət / response görünür
- [ ] Göndərilə bilməyəndə (CORS / şəbəkə / səhv URL) xəta mətni və izah görünür
- [ ] Səhv JSON body → xəbərdarlıq
- [ ] Redaktə yadda qalır; "Orijinala qaytar" ilkin request-ə qaytarır
- [ ] Disable və ya panel bağlanması → siyahı silinir; elementi tək-tək silmək olur

## Daxil deyil (ilk versiya)
- Kolleksiyalar / qovluqlar
- Environment dəyişənləri (`{{token}}`, `{{baseUrl}}`)
- Avtomatik ardıcıl / toplu göndərmə (QA "data vurma" ssenariləri)
- Cavabların müqayisəsi (sonra F-004 ilə ola bilər)
- Binary / fayl yükləmə (multipart)

## Qərarlar
| # | Sual | Qərar |
|---|---|---|
| R1 | Kim göndərir | **Saytın öz səhifəsi** (`Runtime.evaluate` → `fetch`, cookie ilə) |
| R2 | Ayrı tab, yoxsa Saxlanmışlar | **Ayrı 4-cü tab** (2026-11-06) |
| R3 | Redaktə yadda qalsın | **Bəli** + "Orijinala qaytar" |
| R1b | Tab-ın adı | **Postman (N)** — tanış ad, nə etdiyi dərhal aydındır |
| R4 | POST / PUT / DELETE təsdiqi | **Xeyr** — Send dərhal göndərir |
| R5 | Siyahı saxlanılsın | **Xeyr** — yalnız yaddaşda; Disable / panel bağlanması → itir (State kimi) |
| R6 | Aktivləşdirmə | **Bəli**, State kimi: tab-ın öz **Enable ⇄ Disable** düyməsi; yalnız aktiv ikən göndərmə düymələri görünür |
| R7 | Göndərmə düyməsi | **✈ kağız təyyarə** ikonu, 💾-nin yanında, tooltip "Postman-a göndər"; **Qeyd və Saxlanmışlar**-da |
| R8 | Saxlanmışlardan da göndərmək | **Bəli** |
| R9 | Aktiv tab ilə API eyni origin olmalıdır? | **Xeyr** (koda keçəndə dəyişdi) — API çox vaxt başqa domendədir; sorğu tətbiq kimi gedir |

## Kod
- `extension/src/background/postman.ts` — header süzgəci (`Cookie`, `Origin`, `Sec-*`, `:authority`…), səhifədə işləyən `fetch` (arqumentlər JSON kimi ötürülür, koda yapışdırılmır), debugger sessiyası paylaşılır / müvəqqəti qoşulur.
- `extension/src/sidepanel/PostmanTab.tsx` — Enable / Disable, İstifadə qaydası, siyahı, redaktə forması, cavab (JsonTree, resize olunan qutu).
- `extension/src/sidepanel/PostmanButton.tsx` — ✈ düyməsi (Qeyd + Saxlanmışlar).

## Açıq suallar
- ❓ Yoxdur (Enable / Disable adları istəsəniz dəyişə bilər)
