# Layihə qaydaları (Claude üçün)

## Git — bütün proseslər git ilə izlənir
- Hər məntiqi iş (sənəd yeniləməsi, feature, fix) ayrıca commit olur.
- Müəllif: **Nazar Abdullayev <nazar.abdullayev@cybernet.az>** (lokal `git config`, `--global` yox).
- **Hər dəyişiklikdən sonra avtomatik commit + push** edilir (`origin main`) — istifadəçinin ayrıca "commit et" deməsini gözləmədən.
- Bir cavabda bir neçə müstəqil qərar/dəyişiklik varsa → hər biri ayrıca commit, sonra bir push.
- Remote: https://github.com/NezerAbdullayev/qa_extention

## Commit mesajı formatı — HƏMİŞƏ

```
<type>(<scope>): <4-7 sözlük ingiliscə açıqlama>
```

- `scope` opsionaldır (məs. `recorder`, `har`, `business`, `qa`).
- Açıqlama: **ingiliscə**, **4–7 söz**, kiçik hərflə başlayır, sonunda nöqtə yoxdur, əmr formasında (`add`, `fix`, `update` — `added` yox).

### Növlər (Conventional Commits)
| Type | Nə vaxt |
|---|---|
| `feat` | Yeni funksionallıq |
| `fix` | Bug düzəlişi |
| `docs` | Yalnız sənəd dəyişikliyi |
| `refactor` | Davranışı dəyişməyən kod dəyişikliyi |
| `style` | Format, boşluq (məntiq dəyişmir) |
| `test` | Test əlavə / dəyişiklik |
| `chore` | Konfiqurasiya, alətlər, struktur |
| `perf` | Performans yaxşılaşdırması |
| `build` / `ci` | Build sistemi / CI |

### Nümunələr
```
docs(business): define three primary user groups
feat(recorder): add start and stop buttons
fix(har): handle empty response bodies correctly
chore: initialize project structure and documentation
```

### Səhv nümunələr
```
docs: users yeniləndi                 ← azərbaycanca
feat: add button                      ← 4 sözdən az
fix: fixed the bug that was causing the har export to fail  ← 7 sözdən çox, keçmiş zaman
```

## Commit-dən əvvəl
1. `git status` və `git diff` ilə dəyişikliklərə bax.
2. Lazım olsa `docs/04-progress/PROGRESS.md` və `CHANGELOG.md`-ni yenilə.
3. Bir commit = bir məntiqi dəyişiklik. Fərqli işləri ayrı commit-lərə böl.

## Versiya — hər dəyişiklikdə +1
- Versiya `extension/public/manifest.json` və `extension/package.json`-da **eyni** saxlanılır (`chrome://extensions`-da görünən budur).
- Başlanğıc: **2.4.0** (2026-11-04). **2.5.0** (2026-11-05) — F-010 State Watcher; artım buradan davam edir: 2.5.0 → 2.5.1 …
- Extension-a toxunan hər dəyişiklik commit-i (`feat`, `fix`, `perf`, `refactor`, `style`, `build`) **son rəqəmi +1** artırır: 2.4.0 → 2.4.1 → 2.4.2 …
- Versiya artımı həmin dəyişikliyin öz commit-inə daxil edilir (ayrıca commit yox).
- Yalnız sənəd (`docs`) və ya test commit-ləri versiyanı dəyişmir.
- `CHANGELOG.md`-də bölmə başlığı versiya ilə yazılır: `## [2.4.1] — YYYY-MM-DD`.
