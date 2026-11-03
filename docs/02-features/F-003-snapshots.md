# F-003 — Snapshot yaddaşı

**Status:** 📝 Spec · **Mərhələ:** v0.2 · **Tələblər:** FR-07, FR-10

## Niyə
QA əməliyyatın nəticəsini saxlasın, sonra başqa dəyərlərlə təkrar edib müqayisə etsin.

## İstifadəçi hekayəsi
> **QA** kimi, **qeydi adla saxlamaq** istəyirəm ki, **sonra yeni cəhdlə müqayisə edim**.

## Qəbul meyarları
- [ ] Stop-dan sonra "Snapshot kimi saxla" + ad + (opsional) teq/qeyd
- [ ] Snapshot siyahısı: ad, tarix, host, request sayı
- [ ] Snapshot-u açıb request detallarına baxmaq
- [ ] Silmək, adını dəyişmək
- [ ] JSON export / import (başqa QA ilə paylaşmaq)
- [ ] Brauzer bağlanandan sonra data qalır

## Texniki qeydlər
- Yaddaş: IndexedDB (`snapshots`, `requests` store-ları)
- İcazə: `unlimitedStorage`

## Açıq suallar
- ❓ Snapshot-ları layihə/modul üzrə qruplaşdırmaq lazımdırmı?
- ❓ Köhnə snapshot-lar avtomatik silinsinmi?
