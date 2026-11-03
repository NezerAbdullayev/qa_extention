# F-005 — Həssas data masking

**Status:** 📝 Spec · **Mərhələ:** MVP · **Tələblər:** FR-06

## Niyə
Müştərinin token, cookie, parol kimi dataları göndərilən faylda açıq qalmasın.

## Qəbul meyarları
- [ ] Default mask olunan header-lər: `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`
- [ ] Default mask olunan body key-ləri: `password`, `token`, `accessToken`, `refreshToken`, `secret`
- [ ] Mask: `***`
- [ ] Siyahı ayarlardan dəyişdirilə bilir
- [ ] Mask yaddaşa yazılarkən, yoxsa yalnız export zamanı? → ❓

## Açıq suallar
- ❓ QA öz snapshot-larında mask-sız data görməlidirmi?
