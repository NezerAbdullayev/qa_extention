# Layihə qaydaları (Claude üçün)

## Git — bütün proseslər git ilə izlənir
- Hər məntiqi iş (sənəd yeniləməsi, feature, fix) ayrıca commit olur.
- Müəllif: **Nazar Abdullayev <nazar.abdullayev@cybernet.az>** (lokal `git config`, `--global` yox).
- Commit yalnız istifadəçi **"commit et"** dedikdə edilir.

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
