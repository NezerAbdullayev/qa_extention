# extension/

Chrome extension (Manifest V3) — React + TypeScript + Vite + Tailwind CSS ([ADR-003](../docs/03-architecture/decisions/ADR-003-react-vite-tailwind.md)).

## Tələblər
- Node.js 20+ (LTS) və npm
- Google Chrome 116+

## Quraşdırma və işə salma
```bash
cd extension
npm install
npm run build        # → dist/
```

Chrome-da:
1. `chrome://extensions` aç
2. Sağ yuxarıda **Developer mode**-u aktiv et
3. **Load unpacked** → `extension/dist` qovluğunu seç
4. Extension ikonuna klik → side panel açılır → **Start**

## Development
```bash
npm run dev          # dəyişiklikdə avtomatik yenidən build (dist/)
npm run typecheck    # yalnız TypeScript yoxlaması
```
Hər build-dən sonra `chrome://extensions`-da extension-un **⟳ (reload)** düyməsini bas, side panel-i bağlayıb yenidən aç.

## Struktur
```
extension/
├── public/
│   ├── manifest.json              ← MV3 manifest (dist/-ə kopyalanır)
│   └── _locales/az/messages.json  ← bütün UI mətnləri (ADR-002)
├── src/
│   ├── background/index.ts        ← service worker: chrome.debugger, recorder (F-001)
│   ├── sidepanel/                 ← React UI (F-008)
│   │   ├── App.tsx
│   │   ├── useRecorder.ts         ← background ilə canlı əlaqə
│   │   └── usePanelCollapsed.ts   ← kompakt / tam rejim
│   └── shared/
│       ├── types.ts               ← RequestRow, mesaj protokolu
│       ├── i18n.ts                ← t("key")
│       └── requestName.ts         ← DevTools "Name" qaydası
├── sidepanel.html
└── vite.config.ts
```

## Hazırkı vəziyyət (skelet)
- ✅ Side panel: başlıq, — Kiçilt / ▢ Böyüt (yadda qalır), ✕ Bağla
- ✅ Start / Stop → `chrome.debugger` attach / detach
- ✅ Yalnız XHR / Fetch, canlı siyahı: ad · method · status · müddət
- ✅ Açılan qutu: URL · method · status · Request headers · Response headers · Payload · Response (JSON, max 500px, bir neçəsi eyni anda açıq) — F-008
- ⬜ 💾 Yadda saxla — F-003
- ⬜ Müqayisə — F-004
- ⬜ HAR export — F-002
- ⬜ Masking — F-005
- ✅ Headers (ExtraInfo ilə, Cookie / Set-Cookie daxil), payload, response body (≤ 5 MB), IndexedDB-yə yazma və service worker yenidən başlayanda bərpa — F-001
- ⬜ Console error-lar, redirect zənciri — F-001
