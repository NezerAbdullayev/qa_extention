# Töhfə qaydaları

## 1. Git müəllif ayarı (bir dəfə)

Repo: https://github.com/NezerAbdullayev/qa_extention

Bütün commit və PR-lar **Nazar Abdullayev** adından getməlidir. Repo-nu klonladıqdan sonra:

```bash
git clone https://github.com/NezerAbdullayev/qa_extention.git
cd qa_extention
git config user.name  "Nazar Abdullayev"
git config user.email "nazar.abdullayev@cybernet.az"
```

Yoxlamaq üçün: `git config user.name` və `git config user.email`.

> `--global` istifadə etmirik ki, digər layihələrə təsir etməsin.

## 2. Branch adları

| Növ | Format | Nümunə |
|---|---|---|
| Feature | `feature/F-XXX-qisa-ad` | `feature/F-001-recorder` |
| Bugfix | `fix/qisa-ad` | `fix/body-lost-on-reload` |
| Sənəd | `docs/qisa-ad` | `docs/business-requirements` |

## 3. Commit mesajları

[Conventional Commits](https://www.conventionalcommits.org/). Format: `<type>(<scope>): <4-7 sözlük ingiliscə açıqlama>`.
Tam qaydalar: [CLAUDE.md](CLAUDE.md#commit-mesajı-formatı--həmişə).

```
feat(recorder): add start and stop buttons
fix(har): handle empty response bodies correctly
docs(business): update MVP scope definition
```

## 4. Pull Request axını

1. `main`-dən yeni branch açılır.
2. İş bitəndə GitHub-da PR açılır — şablon avtomatik gəlir (`.github/pull_request_template.md`).
3. PR-da əlaqəli feature ID (`F-XXX`) göstərilir.
4. `docs/04-progress/PROGRESS.md` və lazım olsa `CHANGELOG.md` yenilənir.
5. Review → merge.
