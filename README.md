# bohdanmoroz.com

Personal site — single-page, static, served as plain HTML/CSS with a sprinkle of vanilla TS for the theme toggle and language switcher.

Built with **Astro 6** + **Tailwind CSS 4**. No SSR, no framework integration, no client-side router.

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static build to dist/
npm run preview      # serve the built site
```

## Project layout

```
src/
  pages/
    index.astro      # English (default, unprefixed)
    ru/index.astro   # Russian
    uk/index.astro   # Ukrainian
    404.astro
  layouts/Base.astro # <head>, meta tags, JSON-LD, theme + lang bootstrap scripts
  components/        # Hero, FactsTable, Work, HowIWork, Contact, Footer, ThemeToggle, LangSwitch
  i18n/
    index.ts         # getLangFromUrl, useTranslations, Lang type
    locales/*.json   # en.json is the source of truth; ru/uk mirror its key shape
  styles/global.css  # design tokens (CSS vars) + utility classes
public/              # favicon, og-image, robots.txt, llms.txt
```

To edit copy, change the JSON dictionaries in `src/i18n/locales/`. To add a locale, see the i18n section in [AGENTS.md](AGENTS.md).

## Testing

The site is small but the test suite is deliberately comprehensive.

| Layer             | Tool                                      | What it covers                                                                                 |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Unit              | **Vitest**                                | i18n helpers, dictionary key-shape parity across locales                                       |
| End-to-end        | **Playwright** (Chromium + mobile)        | rendering per locale, meta tags, hreflang, JSON-LD validity, 404, theme/lang toggles           |
| Accessibility     | **axe-core** (via Playwright)             | WCAG 2.1 A + AA on every route, in light _and_ dark mode                                       |
| Perf / SEO / a11y | **Lighthouse CI**                         | Hard budgets: perf ≥ 95, a11y = 100, best-practices ≥ 95, SEO = 100 — across all three locales |
| Static analysis   | **astro check**, **ESLint**, **Prettier** | TS + `.astro` type errors, lint, formatting                                                    |

### Commands

```bash
npm run test:unit      # Vitest
npm run test:e2e       # Playwright (auto-builds and previews on port 4321)
npm run test:lhci      # Lighthouse CI (builds first)
npm run typecheck      # astro check

npm run test:all       # lint + format:check + typecheck + unit + e2e + lhci, in order
```

### CI

`.github/workflows/ci.yml` runs three jobs in parallel on every push/PR to `main`:

- **static** — lint, format check, typecheck, unit tests
- **e2e** — Playwright with axe (uploads HTML report as an artifact on failure)
- **lighthouse** — LHCI against a fresh build, with public report links in the run log

### Adding tests

- New i18n logic → add to `tests/unit/i18n.test.ts`.
- New translated string → no test needed; `tests/unit/dictionary-parity.test.ts` already enforces every locale has the same keys.
- New page or new locale → add a route case to `tests/e2e/routes.spec.ts` and a URL to `.lighthouserc.json`.
- New interactive bit → add a Playwright spec under `tests/e2e/`.

## Tooling

- **Prettier** + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes).
- **ESLint** flat config (`@eslint/js` + `typescript-eslint` + `eslint-plugin-astro`).
- **Husky + lint-staged** — pre-commit hook auto-fixes staged `.js/.ts/.astro` files with ESLint + Prettier, and `.json/.md/.css` with Prettier.

## License

Source code in this repository is not currently licensed for reuse. Copy in `src/i18n/locales/` and the visual design are © Bohdan Moroz.
