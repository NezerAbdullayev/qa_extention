# F-003 — API yadda saxlama

**Status:** 🔵 Hazırlanır · **Mərhələ:** MVP · **Tələblər:** FR-07, FR-10 · **Qərarlar:** [Sessiya #3](../06-qa-sessions/2026-11-04-session-3.md)

## Niyə
QA bir API-nin nəticəsini saxlasın, sonra başqa dəyərlərlə təkrar edib müqayisə etsin ([F-004](F-004-compare.md)).

## İstifadəçi hekayəsi
> **QA** kimi, **siyahıdakı bir API-ni adla yadda saxlamaq** istəyirəm ki, **sonra başqa saxlanmış API ilə müqayisə edim**.

## Harada saxlanılır (Sessiya #3, Q0)
**IndexedDB** — extension-un öz bazası, yalnız istifadəçinin brauzerində (NFR-02). Heç yerə göndərilmir.
```
api-lens (IndexedDB)
├── requests    ← cari qeyd (Start-da silinir, Sessiya #2 Q12)
└── savedApis   ← 💾 ilə saxlananlar (heç vaxt avtomatik silinmir)
```

| Hal | Saxlanmış API-lər |
|---|---|
| Brauzer / kompüter yenidən başlasa | ✅ qalır |
| Extension ⟳ (reload) | ✅ qalır |
| "Load unpacked" qovluğu başqa yerə köçürülsə | ✅ qalır — `manifest.json`-da sabit `key` (Q8) |
| Extension silinsə | ❌ silinir |
| Başqa kompüter / Chrome profili | ❌ görünmür (export / import çıxarılıb — D13) |

## UI / Axın
Panelin yuxarısında iki tab (Q1):
```
┌──────────────────────────────────────────┐
│  [ Qeyd (14) ]  [ Saxlanmışlar (3) ]     │
└──────────────────────────────────────────┘
```

### Saxlamaq
1. **Qeyd** tab-ında API sətirinin sağındakı **Yadda saxla** düyməsi (çərçivəli bookmark ikonu, hover-də mavi — D13) basılır.
2. Popup açılır — yalnız **ad** sahəsi (Q7):
   ```
   ┌──────────── API-ni yadda saxla ────────────┐
   │ passports  GET 200                          │
   │ Ad: [______________________]               │
   │     (boş qalsa avtomatik: 6 rəqəmli nömrə) │
   │                     [Ləğv et]  [Saxla]     │
   └────────────────────────────────────────────┘
   ```
3. Ad boşdursa → **təsadüfi 6 rəqəmli tam ədəd** (`100000`–`999999`, məs. `482915`), unikal.
4. Ad artıq varsa → "Bu ad artıq var" xəbərdarlığı, saxlanmır (Q2).
5. Uğurlu → "Saxlanıldı: <ad>" bildirişi; API **Saxlanmışlar** tab-ına düşür.

### Saxlanmışlar tab-ı
```
[🗑 Hamısını sil]                       Seçilib: 2   [⇄ Müqayisə et]
☐ sifariş-uğurlu          POST  orders        200   04.11 10:15   ✏️ 🗑
☐ 482915                  GET   passports     200   04.11 10:18   ✏️ 🗑
```
- Sətirə klik → detallar (F-008 ilə eyni: URL, method, status, Payload, Response — JSON ağacı).
- Geniş ayrı pəncərədə (≥ 900px) **Qeyd tab-ı ilə eyni bölünmüş görünüş**: siyahı solda, seçilmiş API sağda tam hündürlükdə; ✕ / Esc, ↑ / ↓, dartılan ara xətt (D8).
- ✏️ → adı dəyiş (eyni unikallıq qaydası) · 🗑 → dərhal sil (təsdiq yoxdur; təsdiq yalnız "Hamısını sil"də).
- ☐ seçim → 2 API seçiləndə **⇄ Müqayisə et** (F-004) — yalnız saxlanmışlar arasında.
- **🗑 Hamısını sil** → təsdiq ("Bütün saxlanmışlar (N) silinsin?" Bəli / Xeyr) → hamısı silinir (D13).

### ~~Export / import (Q5)~~ — çıxarılıb (D13, 2026-11-04)
İstifadəçi qərarı: maksimum sadəlik — **⬇ Export** və **⬆ Import** düymələri (və "Hamısını seç") silindi. Developer-ə göndərmək üçün HAR ([F-002](F-002-har-export.md)) istifadə olunur.

## Qəbul meyarları
- [ ] Hər request sətirində 💾 düyməsi; klikdə ad popup-u (yalnız ad)
- [ ] Ad boşdursa (və ya yalnız boşluqdursa) → unikal təsadüfi 6 rəqəmli tam ədəd
- [ ] Təkrar ad (böyük/kiçik hərf fərq etmir) → xəbərdarlıq, saxlanmır
- [ ] Saxlanan: tam request + response (URL, method, status, headers, payload, body, timing) + ad + saxlama tarixi + mənbə səhifə (başlıq, URL)
- [ ] **Qeyd** / **Saxlanmışlar** tab-ları
- [ ] Saxlanmışlar siyahısı: ad, method, ad (DevTools Name), status, tarix
- [ ] Saxlanmış API-ni açıb detallarına baxmaq
- [ ] Adını dəyişmək, silmək (təsdiqsiz)
- [ ] Brauzer bağlanandan sonra data qalır; avtomatik silmə yoxdur (Q3)
- ~~JSON export / import~~ — çıxarılıb (D13)
- [x] **Hamısını sil** (təsdiq ilə) (D13)
- [ ] Sabit extension ID (`manifest.json` → `key`)

## Texniki qeydlər
- Yaddaş: IndexedDB (`savedApis` store, DB versiya 2)
- İcazə: `unlimitedStorage`
- Təsadüfi ad: `crypto.getRandomValues` ilə `100000 + n % 900000`
- "Hamısını sil": `DELETE_ALL_SAVED` → `savedApis.clear()` — yalnız istifadəçinin təsdiqi ilə
