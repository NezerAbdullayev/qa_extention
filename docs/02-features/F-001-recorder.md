# F-001 — Network Recorder

**Status:** 📝 Spec · **Mərhələ:** MVP · **Tələblər:** FR-01, FR-02, FR-03, FR-04

## Niyə
Müştəri Inspect açmadan problemin baş verdiyi andakı bütün API trafikini yazsın.

## İstifadəçi hekayəsi
> **Müştəri** kimi, **bir düymə ilə qeydi başladıb dayandırmaq** istəyirəm ki, **developer-ə problemi göstərə bilim**.

## Qəbul meyarları
- [ ] Popup-da Start / Stop düyməsi var
- [ ] Qeyd zamanı ikon/badge qeydin getdiyini göstərir (məs. qırmızı "REC")
- [ ] Hər request üçün: URL, method, request headers, payload, status, response headers, response body, timing, initiator
- [ ] Uğursuz request-lər səbəbi ilə yazılır (net::ERR_*, CORS, blocked, canceled)
- [ ] Redirect zənciri saxlanılır
- [ ] Console error və exception-lar yazılır
- [ ] Səhifə reload olsa belə artıq yazılmış body-lər itmir
- [ ] Stop-dan sonra yazılmış request sayı göstərilir

## Texniki qeydlər
- `chrome.debugger.attach({tabId}, "1.3")` → `Network.enable`, `Runtime.enable`
- Event-lər: `requestWillBeSent(+ExtraInfo)`, `responseReceived(+ExtraInfo)`, `loadingFinished`, `loadingFailed`
- Body: `loadingFinished`-dan dərhal sonra `Network.getResponseBody`
- Böyük payload: `Network.getRequestPostData`
- MV3 service worker yatır → data dərhal IndexedDB / `chrome.storage.session`-a yazılır

## Məhdudiyyətlər
- Start-dan əvvəlki request-lər yazılmır
- Yalnız qoşulan tab (yeni tab-lar — sonrakı mərhələ)
- Brauzerdə "debugging this browser" zolağı görünür

## Açıq suallar
- ❓ Statik resurslar (şəkil, CSS, font) default olaraq yazılsın, yoxsa yalnız XHR/Fetch?
