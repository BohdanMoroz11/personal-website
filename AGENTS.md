# Personal website — bohdanmoroz.com

> `CLAUDE.md` is a symlink to this file — edit `AGENTS.md` and both stay in sync.
> Keep this lean: it describes the general, stable state of the project for agents.
> It is not a changelog or a place for in-progress notes.

Single-page personal site for Bohdan Moroz, a full-stack TypeScript engineer (Sofia,
Bulgaria) advertising freelance availability to US SMBs in logistics, HR, and fintech.
Dark tactical-terminal aesthetic; Chakra Petch (display) + JetBrains Mono (chrome/labels).

## Stack

- **Astro 6** — static build, no SSR adapter
- **Tailwind CSS 4** via `@tailwindcss/vite`
- TypeScript (Astro defaults); no JS framework integration — plain `.astro` components

## Layout

- `src/pages/` — one route per locale (`index.astro`, `ru/index.astro`, `uk/index.astro`),
  plus `cv.astro` and `404.astro`. The locale pages are thin wrappers that render
  `HomePage.astro`.
- `src/components/` — the home page is composed from section components (`Topbar`, `Hero`,
  `Protocol`, `Dossier`, `Contact`, `Footer`, …). `HomePage.astro` assembles them;
  `SiteClient.astro` holds the client-side scripts (live clock, bootline typewriter,
  heading decrypt, dossier accordion, scroll reveals).
- `src/layouts/Base.astro` — `<head>`, meta, hreflang, OG tags, JSON-LD, fonts.
  `CvLayout.astro` is the print-oriented layout for `/cv`.
- `src/i18n/index.ts` — `languages`, `defaultLang`, `getLangFromUrl(url)`,
  `useTranslations(lang)`, and the `Lang` / `Dictionary` types.
- `src/i18n/locales/<lang>.json` — translation dictionaries; `en.json` is the source of truth.
- `src/cv/data.ts` — structured CV content.
- `src/styles/` — `global.css` (design tokens + utility classes), `cv.css` (the CV page).
- `astro.config.mjs` — `site: "https://bohdanmoroz.com"`, built-in i18n (default `en`,
  `prefixDefaultLocale: false`, locales `en` / `ru` / `uk`), Tailwind Vite plugin, sitemap.

## i18n

- Astro's built-in i18n routing + a hand-rolled JSON dictionary (no library deps).
- English is the default locale, served unprefixed (`/`); `ru` and `uk` are prefixed
  (`/ru/`, `/uk/`).
- To add a locale: add it to `languages` in `src/i18n/index.ts`, add
  `src/i18n/locales/<lang>.json` with the same shape as `en.json`, add it to `locales` in
  `astro.config.mjs`, and create `src/pages/<lang>/index.astro`.
- Edit copy in the JSON files, not in components. The dictionary-parity test forces every
  locale to carry `en.json`'s full key shape.

## CV

- `/cv` renders from `src/cv/data.ts` via `CvLayout.astro` + `src/styles/cv.css`.
- `public/cv.pdf` is a **committed artifact** — the Alpine deploy image has no Chromium to
  render it. After changing any CV source, run `npm run cv:pdf` and commit the regenerated
  `public/cv.pdf` plus `scripts/cv-pdf.hash`. `npm run cv:check` guards against shipping a
  stale PDF and runs in `test:all` and CI.

## Scripts

- `npm run dev` / `build` / `preview` — Astro dev server / static build to `dist/` / serve the build
- `npm run format` / `format:check` — Prettier write / check
- `npm run lint` / `lint:fix` — ESLint
- `npm run typecheck` — `astro check` (TS + `.astro` diagnostics)
- `npm run cv:pdf` / `cv:check` — regenerate / verify `public/cv.pdf`
- `npm run test:unit` — Vitest (i18n helpers + dictionary parity)
- `npm run test:e2e` — Playwright (routes, language switcher, axe a11y); auto-builds and previews
- `npm run test:lhci` — Lighthouse CI against the build
- `npm run test:all` — lint + format:check + typecheck + cv:check + unit + e2e + lhci, in order

## Testing

Tests live under `tests/`:

- `tests/unit/` — pure-function tests for the i18n helpers, and a parity test asserting every
  locale JSON has the same key shape as `en.json` (structure, not values).
- `tests/e2e/` — per-locale rendering, meta tags (canonical, og:image, description),
  hreflang, JSON-LD validity, `/cv`, 404, the language switcher, the dossier accordion and
  other interactions, and `@axe-core/playwright` accessibility on every route.
- Playwright (`playwright.config.ts`) runs desktop Chromium + Pixel 7; its `webServer`
  builds and previews on port 4321, reusing a running preview in local dev.
- Lighthouse CI (`.lighthouserc.json`) asserts hard floors: perf ≥ 0.95, a11y = 1.0,
  best-practices ≥ 0.95, SEO = 1.0 across `/`, `/ru/`, `/uk/`. If a budget fails,
  investigate the page, not the threshold.
- CI (`.github/workflows/ci.yml`): three parallel jobs — `static`, `e2e`, `lighthouse`.

Treat test failures as real until proven otherwise. Muted colors are tuned for WCAG AA; if
you change them in `src/styles/global.css`, expect the accessibility tests to scream — that's
the point.

## Dependency updates

Two layers keep dependencies current:

- **Renovate** (`renovate.json`) groups all non-major updates (`patch`, `minor`, `pin`,
  `digest`) into one PR and auto-merges it when CI passes. Runs weekly. No agent involvement.
- **Claude Code** handles majors. Renovate opens one PR per major, holds it (no automerge),
  and adds the `dep:major-review` label. That label fires
  `.github/workflows/major-dep-agent.yml`, which runs an agent on the PR branch.

If you are that agent: you are the PR **author**, not the validator — CI runs the full suite
(incl. e2e), so don't run build/unit/e2e yourself. Identify the dep and version from the diff,
read the upstream changelog/migration guide for the new major, and decide whether this repo
actually needs changes — many majors need none, so say so plainly rather than inventing work.
If changes are needed, make them per these conventions, run `npm run typecheck` as a sanity
check, and commit to the PR branch. Always post a summary comment via `gh pr comment`, linking
the release notes for every breaking change you cite. The human reviews and merges; majors are
never auto-merged.

## Tooling

- **Prettier** — `.prettierrc.json`, with `prettier-plugin-astro` + `prettier-plugin-tailwindcss`.
- **ESLint** — flat config in `eslint.config.js`.
- **Husky + lint-staged** — pre-commit hook runs `lint-staged`: staged `*.{js,ts,astro}` are
  ESLint-fixed then Prettier-formatted; `*.{json,md,css}` are Prettier-only.

## Conventions

- Edit content in `src/i18n/locales/*.json` and `src/cv/data.ts`, not in markup.
- Reuse existing CSS tokens / utility classes from `global.css` before adding new styles.
- Keep the site to its existing routes unless explicitly asked to add more.
