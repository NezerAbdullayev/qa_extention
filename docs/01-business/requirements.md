# Tələblər

## Funksional (FR)
| ID | Tələb | Feature | Prioritet |
|---|---|---|---|
| FR-01 | İstifadəçi aktiv tab üçün qeydi başlada və dayandıra bilir | F-001 | Must |
| FR-02 | Hər request üçün URL, method, headers, payload, status, response headers, body, timing, initiator yazılır | F-001 | Must |
| FR-03 | Uğursuz request-lər (net::ERR, CORS, blocked, canceled) yazılır | F-001 | Must |
| FR-04 | Console error və JS exception-lar yazılır | F-001 | Should |
| FR-05 | Qeyd HAR faylı kimi export olunur | F-002 | Must |
| FR-06 | Authorization, Cookie, token, parol sahələri mask olunur | F-005 | Must |
| FR-07 | Qeyd ad verilərək snapshot kimi saxlanılır | F-003 | Must |
| FR-08 | İki snapshot seçilib müqayisə olunur (status, payload, response, struktur) | F-004 | Must |
| FR-09 | Müqayisədə ignore ediləcək sahələr təyin olunur | F-004 | Should |
| FR-10 | Snapshot-lar JSON kimi export/import olunur | F-003 | Should |
| FR-11 | Domen filtri (yalnız seçilmiş host-lar yazılır) | F-006 | Should |
| FR-12 | Qeyd birbaşa backend-ə göndərilir | F-007 | Could |

## Qeyri-funksional (NFR)
| ID | Tələb |
|---|---|
| NFR-01 | Manifest V3, kənar serverdən kod yüklənmir |
| NFR-02 | Data default olaraq yalnız lokal saxlanılır (IndexedDB) |
| NFR-03 | Response body limiti (məs. 5 MB/request) — konfiqurasiya olunan |
| NFR-04 | Müştəri üçün maksimum 3 addım (Start, Stop, Göndər) |
| NFR-05 | İnterfeys dili: ❓ (AZ / EN / hər ikisi) |

Prioritet: Must · Should · Could (MoSCoW)
