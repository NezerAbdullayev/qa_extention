# ADR-003 — UI stack: React + TypeScript + Vite + Tailwind CSS

**Status:** 🟢 Qəbul edildi · **Tarix:** 2026-11-04

## Kontekst
Side panel-də kifayət qədər interaktiv UI var: canlı yenilənən request siyahısı, eyni anda bir neçə açılan qutu, yadda saxlama modalı, JSON formasında qarşı-qarşıya müqayisə ekranı. Server yoxdur — bütün kod brauzerdə, extension daxilində işləyir (NFR-02).

## Variantlar
1. **React + TypeScript + Vite** — komponent əsaslı UI, tiplər, sürətli build, statik fayllar.
2. **Next.js** — server framework (SSR, API routes, routing). Extension-da server yoxdur; build `_next/` qovluğu yaradır (Chrome `_` ilə başlayan adları qəbul etmir), inline script-lər MV3 CSP ilə ziddiyyət təşkil edir.
3. **Vanilla JS** — build yoxdur, amma canlı siyahı və state-i əl ilə idarə etmək çətinləşir.

## Qərar
**Variant 1 + Tailwind CSS:**

| Alət | Rolu |
|---|---|
| **React** | UI komponentləri (side panel) |
| **TypeScript** | Tiplər — CDP event-ləri, request/response strukturları |
| **Vite** | Build. Çoxlu giriş nöqtəsi: `sidepanel.html` + `background.ts` (service worker) |
| **Tailwind CSS** | Stil — utility class-lar, `@tailwindcss/vite` plugin ilə |
| `@types/chrome` | Chrome extension API tipləri |

## Struktur
```
extension/
├── public/
│   ├── manifest.json          ← olduğu kimi dist/-ə kopyalanır
│   └── _locales/az/messages.json
├── src/
│   ├── background/            ← service worker (chrome.debugger, recorder)
│   ├── sidepanel/             ← React UI
│   └── shared/                ← tiplər, i18n köməkçisi t(), mesaj protokolu
├── sidepanel.html
├── vite.config.ts
└── dist/                      ← build nəticəsi → Chrome "Load unpacked"
```

## Nəticələr
- `npm run build` → `extension/dist/` → `chrome://extensions` → Developer mode → **Load unpacked**.
- `npm run dev` → `vite build --watch`; dəyişiklikdən sonra extension-u Chrome-da yeniləmək lazımdır.
- Kənar serverdən kod yüklənmir (NFR-01) — bütün kitabxanalar bundle-a daxildir.
