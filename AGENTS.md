# Personal website — bohdanmoroz.com

Single-page personal site for Bohdan Moroz, a full-stack TypeScript engineer (Sofia, Bulgaria) advertising freelance availability to US SMBs in logistics, HR, and fintech.

## V2 redesign (in progress)

Visual V2 is being built on branch **`v2`**. V1 on `main` is the shipped editorial/paper design; V2 is a dark tactical-terminal redesign ported from a pure HTML mockup.

- **About doc:** [`docs/V2.md`](docs/V2.md) — goals, V1→V2 mapping, port phases, open decisions, acceptance criteria
- **Reference mockup:** [`V2_REFRENCE.html`](V2_REFRENCE.html) — source of truth for layout, copy, CSS, and interaction until ported
- **Workflow:** all V2 commits on `v2`; no separate PRs until ready to merge to `main`

## Stack

- **Astro 6** (static, no SSR adapter configured)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- TypeScript (Astro defaults)
- No JS framework integration — plain `.astro` components

## Layout

- `src/pages/index.astro` — the entire site. Hero, role/domains/stack table, "Selected work" projects, "How I work" principles, footer. All copy is pulled from the i18n dictionary; markup is purely presentational.
- `src/i18n/index.ts` — `languages`, `defaultLang`, `getLangFromUrl(url)`, `useTranslations(lang)`, `Dictionary` type.
- `src/i18n/locales/<lang>.json` — translation dictionaries. `en.json` is the source of truth (currently the only locale).
- `src/styles/global.css` — design tokens (CSS vars like `--color-paper`, `--color-ink`) and utility classes (`.serif`, `.mono`, `.label`, `.row`, `.section-divider`, `.dot-divider`, `.subtle`, `.highlight-underline`).
- `public/favicon.svg`
- `astro.config.mjs` — `site: "https://bohdanmoroz.com"`, Astro built-in `i18n` (default `en`, `prefixDefaultLocale: false`), Tailwind Vite plugin.

## i18n

- Uses Astro's built-in i18n routing + a hand-rolled JSON dictionary (lean approach, no library deps).
- English is the default locale and served unprefixed (`/`). Additional locales live under `src/pages/<lang>/` and get URL prefixes (e.g. `/de/`).
- To add a language: add it to `languages` in `src/i18n/index.ts`, add `src/i18n/locales/<lang>.json` with the same shape as `en.json`, add it to the `locales` array in `astro.config.mjs`, and create `src/pages/<lang>/index.astro` (can import from the existing page or duplicate).
- Edit copy in the JSON files, not in `index.astro`.

## Design

Editorial / paper-letter aesthetic: warm paper background, serif (Newsreader) headings, Inter body, JetBrains Mono labels. Single max-w-[760px] article card with section dividers. Avoid generic SaaS look.

## Scripts

- `npm run dev` — Astro dev server
- `npm run build` — static build to `dist/`
- `npm run preview`
- `npm run format` / `npm run format:check` — Prettier write / check
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run typecheck` — `astro check` (TS + `.astro` diagnostics)
- `npm run test:unit` — Vitest (i18n + dictionary parity)
- `npm run test:e2e` — Playwright (routes, theme/lang switcher, axe a11y); auto-builds and serves via `astro preview`
- `npm run test:lhci` — Lighthouse CI against the built `dist/`
- `npm run test:all` — lint + format:check + typecheck + unit + e2e + lhci, in order

## Testing

Tests live under `tests/`:

- `tests/unit/i18n.test.ts` — pure-function tests for `getLangFromUrl` and `useTranslations`.
- `tests/unit/dictionary-parity.test.ts` — asserts every locale JSON has the same key shape as `en.json` (the source of truth). Add a new locale → this test forces you to fill in every key. The shape check normalizes string leaves to a type marker, so we compare structure, not values.
- `tests/e2e/routes.spec.ts` — per-locale rendering, meta tags (canonical, og:image, description), hreflang completeness, JSON-LD validity, static assets, 404. Runs against the built site through `astro preview`.
- `tests/e2e/theme-and-lang.spec.ts` — theme toggle persistence and language switcher (including the localStorage-driven redirect from `/`).
- `tests/e2e/accessibility.spec.ts` — `@axe-core/playwright` against every route plus dark mode. Light + dark muted colors are tuned for WCAG AA — if you change them in `src/styles/global.css`, re-run these.

Playwright is configured (`playwright.config.ts`) with two projects: desktop Chromium and Pixel 7 mobile emulation. The `webServer` block runs `npm run build && npm run preview` on port 4321; in local dev it reuses an already-running preview if you have one.

Lighthouse CI config is `.lighthouserc.json`. It asserts hard floors: perf ≥ 0.95, a11y = 1.0, best-practices ≥ 0.95, SEO = 1.0 across `/`, `/ru/`, `/uk/`. Reports upload to Lighthouse temporary public storage and the URLs print at the end of the run. If a budget fails, **investigate the page**, not the threshold — the budgets are what they are because the current page meets them.

CI workflow is `.github/workflows/ci.yml`: three parallel jobs (`static`, `e2e`, `lighthouse`). Playwright HTML report uploads as an artifact on failure.

### When tests fail

Treat failures as real until proven otherwise.

If you change muted colors, theme colors, the redirect script, or add/remove a locale, expect the relevant test to scream. That's the point.

## Tooling

- **Prettier** — config in `.prettierrc.json`, uses `prettier-plugin-astro` and `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes). Ignored paths in `.prettierignore`.
- **ESLint** — flat config in `eslint.config.js` (`@eslint/js` + `typescript-eslint` + `eslint-plugin-astro`).
- **Husky + lint-staged** — pre-commit hook at `.husky/pre-commit` runs `npx lint-staged`. Staged `*.{js,ts,astro}` are auto-fixed by ESLint then Prettier; `*.{json,md,css}` are Prettier-only. `lint-staged` config lives in `package.json`. Husky installs via the `prepare` script on `npm install`.

## Conventions

- Edit content in the data arrays in `index.astro` rather than hardcoding in markup where possible.
- Reuse existing CSS utility classes / tokens from `global.css` before adding new styles.
- Keep it a single page unless explicitly asked to add routes.
