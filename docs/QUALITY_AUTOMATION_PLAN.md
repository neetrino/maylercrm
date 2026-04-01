# Quality automation

Պլանը համահունչ է `21-project-onboarding.mdc` և repo root-ի կոնֆիգների հետ։

## Արված

- Prettier — `prettier.config.cjs`, `.prettierignore`
- Commitlint — `.commitlintrc.json`
- EditorConfig — `.editorconfig`
- Dependabot — `.github/dependabot.yml`
- GitHub — issue/PR templates

## Հաջորդ քայլեր (ըստ անհրաժեշտության)

- Husky + lint-staged (pre-commit)
- GitHub Actions CI (lint/build) — `reference/workflows/ci.yml.example`
- Vitest — երբ ավելացվի թեստային շերտը
