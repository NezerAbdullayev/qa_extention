# Test planı

## Test ssenariləri (MVP)
| ID | Ssenari | Gözlənilən | Feature |
|---|---|---|---|
| T-01 | GET request uğurlu (200) | URL, headers, body yazılır | F-001 |
| T-02 | POST JSON payload | Payload tam görünür | F-001 |
| T-03 | 4xx / 5xx cavab | Status və body yazılır | F-001 |
| T-04 | Server əlçatmaz | `net::ERR_*` səbəbi yazılır | F-001 |
| T-05 | CORS xətası | CORS statusu yazılır | F-001 |
| T-06 | Qeyd zamanı səhifə reload | Əvvəlki body-lər itmir | F-001 |
| T-07 | HAR DevTools-a import | Bütün tab-lar (Headers, Payload, Response) görünür | F-002 |
| T-08 | Authorization header | Export-da `***` | F-005 |
| T-09 | Böyük response (> limit) | Kəsilir, qeyd edilir | F-001 |

## Mühit
- Chrome (son stabil versiya)
- "Load unpacked" ilə
