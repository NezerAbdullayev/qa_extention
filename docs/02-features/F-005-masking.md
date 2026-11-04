# F-005 — Həssas data masking

**Status:** 📝 Spec · **Mərhələ:** MVP · **Tələblər:** FR-06

## Niyə
İstifadəçinin token, cookie, parol kimi dataları göndərilən faylda (chat, e-poçt) açıq qalmasın.

## Qəbul meyarları
- [ ] Default mask olunan header-lər: `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`
- [ ] Default mask olunan body key-ləri: `password`, `token`, `accessToken`, `refreshToken`, `secret`
- [ ] Mask: `***`
- [ ] Siyahı ayarlardan dəyişdirilə bilir
- [ ] Mask **yalnız export faylında** (JSON, HAR) tətbiq olunur; extension daxilində real dəyərlər görünür (Sessiya #3, Q4)

## Açıq suallar
- ✅ Bəli — extension daxilində mask-sız, export faylında mask-lı (Sessiya #3, Q4)
