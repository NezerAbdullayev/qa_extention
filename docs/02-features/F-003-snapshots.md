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
| Başqa kompüter / Chrome profili | ❌ görünmür → **JSON export / import** |

## UI / Axın
Panelin yuxarısında iki tab (Q1):
```
┌──────────────────────────────────────────┐
│  [ Qeyd (14) ]  [ Saxlanmışlar (3) ]     │
└──────────────────────────────────────────┘
```

### Saxlamaq
1. **Qeyd** tab-ında API sətirinin sağındakı **💾** düyməsi basılır.
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
☐ sifariş-uğurlu          POST  orders        200   04.11 10:15   ✏️ 🗑
☐ 482915                  GET   passports     200   04.11 10:18   ✏️ 🗑
[Hamısını seç]   [⬇ Export]   [⬆ Import]
```
- Sətirə klik → detallar (F-008 ilə eyni: URL, method, status, Payload, Response — JSON ağacı).
- ✏️ → adı dəyiş (eyni unikallıq qaydası) · 🗑 → sil (təsdiq ilə).
- ☐ seçim → seçilmişləri export; F-004-də müqayisə üçün də istifadə olunacaq.

### Export / import (Q5)
- **Export** → JSON fayl: `api-lens_saved_<YYYY-MM-DD_HH-mm>.json` (seçilmişlər, seçim yoxdursa hamısı).
- Export faylında həssas sahələr **mask olunur** (`***`) — Q4 / [F-005](F-005-masking.md). Extension daxilində real dəyərlər görünür.
- **Import** → JSON faylı seçilir; eyni ad varsa yeni ada ` (2)`, ` (3)` əlavə olunur; eyni ID artıq varsa — ötürülür.

## Qəbul meyarları
- [ ] Hər request sətirində 💾 düyməsi; klikdə ad popup-u (yalnız ad)
- [ ] Ad boşdursa (və ya yalnız boşluqdursa) → unikal təsadüfi 6 rəqəmli tam ədəd
- [ ] Təkrar ad (böyük/kiçik hərf fərq etmir) → xəbərdarlıq, saxlanmır
- [ ] Saxlanan: tam request + response (URL, method, status, headers, payload, body, timing) + ad + saxlama tarixi + mənbə səhifə (başlıq, URL)
- [ ] **Qeyd** / **Saxlanmışlar** tab-ları
- [ ] Saxlanmışlar siyahısı: ad, method, ad (DevTools Name), status, tarix
- [ ] Saxlanmış API-ni açıb detallarına baxmaq
- [ ] Adını dəyişmək, silmək (təsdiq ilə)
- [ ] Brauzer bağlanandan sonra data qalır; avtomatik silmə yoxdur (Q3)
- [ ] JSON export (seçilmiş / hamısı) — həssas sahələr mask olunur
- [ ] JSON import — ad toqquşmasında ` (2)` əlavə olunur
- [ ] Sabit extension ID (`manifest.json` → `key`)

## Texniki qeydlər
- Yaddaş: IndexedDB (`savedApis` store, DB versiya 2)
- İcazə: `unlimitedStorage`
- Təsadüfi ad: `crypto.getRandomValues` ilə `100000 + n % 900000`
- Export faylı brauzerin özü ilə yüklənir (`<a download>`), əlavə icazə lazım deyil
