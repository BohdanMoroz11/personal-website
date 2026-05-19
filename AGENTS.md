# Personal website — bohdanmoroz.com

Single-page personal site for Bohdan Moroz, a full-stack TypeScript engineer (Sofia, Bulgaria) advertising freelance availability to US SMBs in logistics, HR, and fintech.

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

## Tooling

- **Prettier** — config in `.prettierrc.json`, uses `prettier-plugin-astro` and `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes). Ignored paths in `.prettierignore`.
- **ESLint** — flat config in `eslint.config.js` (`@eslint/js` + `typescript-eslint` + `eslint-plugin-astro`).
- **Husky + lint-staged** — pre-commit hook at `.husky/pre-commit` runs `npx lint-staged`. Staged `*.{js,ts,astro}` are auto-fixed by ESLint then Prettier; `*.{json,md,css}` are Prettier-only. `lint-staged` config lives in `package.json`. Husky installs via the `prepare` script on `npm install`.

## Conventions

- Edit content in the data arrays in `index.astro` rather than hardcoding in markup where possible.
- Reuse existing CSS utility classes / tokens from `global.css` before adding new styles.
- Keep it a single page unless explicitly asked to add routes.
