# F-001 — Network Recorder

**Status:** 🔵 Hazırlanır · **Mərhələ:** MVP · **Tələblər:** FR-01, FR-02, FR-03, FR-04

## Niyə
QA və developer Inspect açmadan problemin baş verdiyi andakı bütün API trafikini yazsın.

## İstifadəçi hekayəsi
> **QA** kimi, **bir düymə ilə qeydi başladıb dayandırmaq** istəyirəm ki, **developer-ə problemi tam data ilə göstərə bilim**.

> **Developer** kimi, **öz mühitimdə request-ləri yazmaq** istəyirəm ki, **payload, response və xətaları rahat yoxlayım**.

## Qəbul meyarları
- [ ] Side panel-də Start / Stop düyməsi var
- [ ] Qeyd zamanı ikon/badge qeydin getdiyini göstərir (məs. qırmızı "REC")
- [ ] Yalnız **XHR / Fetch** tipli request-lər yazılır (CDP `Network.requestWillBeSent` → `type` = `XHR` və ya `Fetch`); şəkil, CSS, JS, font, HTML sənəd yazılmır (Sessiya #2, Q11)
- [ ] Hər request üçün: URL, method, request headers, payload, status, response headers, response body, timing, initiator
- [ ] Uğursuz request-lər səbəbi ilə yazılır (net::ERR_*, CORS, blocked, canceled)
- [ ] Redirect zənciri saxlanılır
- [ ] Console error və exception-lar yazılır
- [ ] Səhifə reload olsa belə artıq yazılmış body-lər itmir
- [ ] Qeyd zamanı request sayı canlı artır; Stop-dan sonra yekun say göstərilir

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
- ✅ Yalnız **XHR / Fetch** request-ləri yazılır (Sessiya #2, Q11). Statik resurslar (Document, Script, Stylesheet, Image, Font, Media) yazılmır.
