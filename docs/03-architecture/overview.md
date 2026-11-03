# Arxitektura

```
┌─────────────┐  mesaj   ┌──────────────────────┐  CDP   ┌────────┐
│ popup.html  │ ───────▶ │ background.js (SW)   │ ─────▶ │  Tab   │
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
| `manifest.json` | İcazələr: `debugger`, `activeTab`, `storage`, `unlimitedStorage`, `downloads` |
| `background.js` | Debugger attach/detach, event-ləri `requestId` üzrə birləşdirmək, body götürmək, yaddaşa yazmaq |
| `popup` | Start/Stop, status, export, snapshot saxla |
| `viewer` | Snapshot siyahısı və request detalları |
| `compare` | İki snapshot-un diff-i |
| `lib/` | `jsondiffpatch`, HAR builder, masking |

## Qərarlar
Bax: [decisions/](decisions/)
