# Arxitektura

```
┌─────────────┐  mesaj   ┌──────────────────────┐  CDP   ┌────────┐
│ sidepanel   │ ───────▶ │ background.js (SW)   │ ─────▶ │  Tab   │
│ Start/Stop  │          │ chrome.debugger      │ ◀───── │        │
└─────────────┘          │ event-ləri birləşdir │ events └────────┘
                         └──────────┬───────────┘
                                    │
                              ┌─────▼─────┐
                              │ IndexedDB │  sessions / snapshots / requests
                              └─────┬─────┘
                    ┌───────────────┼────────────────┐
              ┌─────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
              │ viewer.html│  │compare.html│  │ HAR export  │
              └────────────┘  └────────────┘  └─────────────┘
```

## Komponentlər
| Komponent | Vəzifə |
|---|---|
| `manifest.json` | İcazələr: `debugger`, `activeTab`, `storage`, `unlimitedStorage`, `downloads`, `sidePanel` |
| `background.js` | Debugger attach/detach, event-ləri `requestId` üzrə birləşdirmək, body götürmək, yaddaşa yazmaq |
| `sidepanel` | Əsas UI (Sessiya #2, Q1): Start/Stop, request siyahısı (F-008), yadda saxla, export. Bağla · kiçilt (kompakt rejim) · əl ilə en dəyişmə |
| `viewer` | Snapshot siyahısı və request detalları |
| `compare` | İki snapshot-un diff-i |
| `lib/` | `jsondiffpatch`, HAR builder, masking |
| `_locales/` | i18n tərcümələri: `az/messages.json` (default), gələcəkdə `en/`, `ru/` və s. Bax: [ADR-002](decisions/ADR-002-i18n.md) |

## Qərarlar
Bax: [decisions/](decisions/)
