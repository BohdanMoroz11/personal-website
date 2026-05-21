# Test suite redesign — design

**Date:** 2026-05-21
**Status:** Approved, pending implementation plan
**Scope:** Restructure and expand the test suite of bohdanmoroz.com so the suite itself is showcase-facing — legible to anyone browsing the repo and demonstrating range across testing layers — while pushing measured coverage to ~95%.

## Goal

The repo is a personal showcase for a freelance full-stack TypeScript engineer. The current test suite (Vitest unit, Playwright e2e + axe, Lighthouse CI) is competent but minimal. Redesign it so:

1. The `tests/` directory layout is self-explanatory and tells a clear story about how each layer contributes.
2. Measured coverage approaches ~95% across all production source under `src/`, including Astro component frontmatter and client-side inline scripts.
3. CI demonstrates a real tiered pipeline (fast-lane PR, full-lane main) rather than a single monolithic run.
4. The main README surfaces a coverage badge and a CI status badge so the result is immediately visible on the GitHub landing page.

Non-goals: visual regression testing (deferred), nightly cron runs, deployment workflows (separate concern), changing the application itself.

## Test layers

Six layers, each with one clear purpose:

| Layer             | Location                          | Runner                                            | Purpose                                                                  |
| ----------------- | --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| Unit              | `tests/unit/`                     | Vitest (node env)                                 | Pure-function logic — i18n helpers, dictionary parity                    |
| Component         | `tests/component/`                | Vitest (node env) + Astro Container API           | Render correctness for each `.astro` component from a stubbed dictionary |
| E2e               | `tests/e2e/`                      | Playwright                                        | User-visible behavior across routes, themes, locales                     |
| Accessibility     | `tests/e2e/accessibility.spec.ts` | Playwright + `@axe-core/playwright`               | Zero axe violations across every route × every theme                     |
| Static-output     | `tests/static/`                   | Vitest (shells out to CLIs) against built `dist/` | HTML validity, broken-link detection                                     |
| Performance / SEO | `.lighthouserc.json`              | Lighthouse CI against built `dist/`               | Hard floors on perf/a11y/best-practices/SEO scores                       |

Lighthouse is intentionally kept outside `tests/` — it asserts budgets, not behavior. The `tests/` folder is for assertions about correctness; budgets live next to their config.

## Directory layout

```
tests/
  unit/
    i18n.test.ts
    dictionary-parity.test.ts
  component/
    Hero.test.ts
    FactsTable.test.ts
    HowIWork.test.ts
    Work.test.ts
    Contact.test.ts
    Footer.test.ts
    ThemeToggle.test.ts
    LangSwitch.test.ts
  e2e/
    routes.spec.ts
    theme-and-lang.spec.ts
    work-section.spec.ts
    accessibility.spec.ts
  static/
    html-validate.test.ts
    links.test.ts
  README.md
```

`tests/README.md` is the showcase-facing entry point. It explains the philosophy, what each layer covers, what's intentionally out of scope, and how to run each layer in isolation. One page, no fluff.

## Layer details

### Component tests (new)

Use Astro's built-in `experimental_AstroContainer` API (Astro 6, no new runtime dep) to render each component to an HTML string in a node Vitest environment. Parse with `cheerio` and assert:

- Required dictionary-driven content is present (i.e., translations are actually consumed, not hardcoded).
- Structural invariants hold (e.g., Work renders 5 project entries, each with a toggle button).
- Conditional rendering branches behave (e.g., FactsTable mailto CTA renders when expected).

Each test file targets one component, mirrors its file path under `src/components/`, and exists primarily to lift coverage of component frontmatter TS to ~100% while documenting expected render output.

Component tests do **not** exercise inline `<script>` behavior — those scripts only run in the browser. They are covered by e2e.

### Static-output tests (new)

Two specs under `tests/static/`, each a Vitest test that shells out to a CLI and asserts on the exit code / parsed output:

- `html-validate.test.ts` — runs `html-validate` against every file in `dist/**/*.html` with `.htmlvalidate.json` config.
- `links.test.ts` — runs `linkinator` against `dist/` recursively, checking internal links resolve and external links return non-error status. External link checks are skipped in fast-lane CI to avoid flakiness; they only run on main.

Both depend on `dist/` existing, so the test command runs `astro build` first if needed (or the CI job orders `build` before `test:static`).

### Cross-browser e2e

`playwright.config.ts` adds two projects to the existing two:

- Chromium (desktop)
- Mobile Chrome (Pixel 7)
- **Firefox (desktop) — new**
- **WebKit (desktop) — new**

All four projects run the full e2e + a11y spec set. The coverage fixture (below) is gated to Chromium only.

### Client-side coverage instrumentation (new)

A Playwright fixture wraps each test (Chromium project only) with `page.coverage.startJSCoverage({ resetOnNavigation: false })` / `stopJSCoverage()`. Raw v8 coverage JSON is written per-test to `coverage/raw/`. After the Playwright run completes, a post-process step:

1. Loads Astro's emitted source maps for inline-script bundles.
2. Uses `v8-to-istanbul` to convert v8 coverage to istanbul format with sources mapped back to `.astro` files where possible.
3. Merges with the Vitest-emitted istanbul coverage via `c8` into a single `coverage/coverage-summary.json` + HTML report.

**Risk acknowledgement:** Astro/Vite's production minification may degrade source-map fidelity for inline `<script>` blocks. Expected outcomes ranked by probability:

1. (~70%) Coverage % is computed at the bundled-JS level — accurate aggregate number, but "view uncovered line in `.astro` source" UX is imperfect.
2. (~20%) Clean source-mapping back to `.astro` works end-to-end.
3. (~10%) Mapping fails; the report falls back to bundled-JS coverage only, with a note in `tests/README.md`.

In all three cases, a real measured number is produced. Outcome 3 still satisfies the showcase goal; outcomes 1–2 satisfy it well.

## Tooling additions

New devDependencies:

- `@vitest/coverage-v8` (already added)
- `cheerio` — component test HTML assertions
- `c8` — coverage merger and reporter
- `v8-to-istanbul` — convert Playwright v8 coverage to istanbul format
- `html-validate` — static HTML conformance
- `linkinator` — broken-link checking
- `coverage-badge` (or equivalent) — generates the SVG badge from coverage summary

Config files added or modified:

- `vitest.config.ts` — convert to projects layout (`unit`, `component`), expand coverage `include` to `src/i18n/**` and `src/components/**` (pages excluded per the coverage strategy section).
- `playwright.config.ts` — add `firefox` and `webkit` projects; add coverage fixture wired only to chromium project.
- `.htmlvalidate.json` — new, with rules tuned for static-site output (allow self-closing void elements per HTML5, etc.).
- `.github/workflows/ci.yml` — restructure into tiered jobs (see CI section).
- `package.json` — new scripts: `test:component`, `test:static`, `test:coverage` (already added, now merges Playwright coverage), `coverage:badge` (regenerates README badge if a generated SVG is used instead of shields.io endpoint).

## CI structure

Single `.github/workflows/ci.yml`. Triggers: `pull_request` and `push: main`.

**Fast lane (always runs):**

- `static-checks` job — lint, format:check, typecheck, `test:unit`, `test:component`
- `e2e-chromium` job — Playwright chromium project (functional + a11y) with coverage fixture; uploads `coverage/` and merged report as artifacts

**Slow lane (only when `github.event_name == 'push' && github.ref == 'refs/heads/main'`):**

- `e2e-cross-browser` job — Playwright firefox + webkit + Mobile Chrome projects (no coverage fixture)
- `static-output` job — build site, run `test:static` (html-validate + linkinator with external link checks enabled)
- `lighthouse` job — existing LHCI, unchanged

On a PR: 2 jobs, parallel, ~2 min target.
On a push to main: 5 jobs, parallel.

Coverage thresholds are enforced in both lanes — the fast-lane `e2e-chromium` job fails if merged coverage drops below threshold.

## Coverage strategy

**Scope (included):**

- `src/i18n/**/*.ts` — exercised by unit tests
- `src/components/**/*.astro` — frontmatter TS exercised by component tests; inline `<script>` blocks exercised by Chromium e2e via CDP coverage fixture

**Scope (excluded):**

- `src/styles/**` — CSS, no coverage concept
- `src/i18n/locales/**` — JSON data, validated by parity test instead
- `src/layouts/**` — purely structural, covered transitively by pages
- `src/pages/**` — page frontmatter runs at build time, not in browser, and pages are thin shells that compose components. Their behavior is validated transitively by e2e route specs; instrumenting build-time execution for coverage is high-effort, low-value for a 4-page static site

**Thresholds (project-wide, enforced):**

- Lines: 95%
- Statements: 95%
- Branches: 90%
- Functions: 95%

95% is deliberate over 100%. Forcing 100% pushes toward ignore-comments on defensive branches and toward tests that exist only to hit the number. 95% says "essentially everything is covered" with room for one or two pragmatic exceptions, which reads more credible than a fragile 100%.

**Per-layer expectations (documented in `tests/README.md`, not enforced as separate thresholds):**

- Unit: 100% — small surface, no excuse.
- Component: every component file has at least one render test asserting dictionary-driven content appears.
- E2e: every user-facing interactive behavior covered at least once on Chromium; cross-browser projects re-run the same specs.
- Accessibility: every route × every theme has zero axe violations.

## README surfacing

Main `README.md` gains, near the top:

- A coverage badge — generated SVG at `.github/badges/coverage.svg`, regenerated from `coverage/coverage-summary.json` by the `coverage-badge` npm package and committed back to main by the `e2e-chromium` job's badge step (runs only on `push: main`).
- A CI status badge from GitHub Actions.
- A short "Testing" section linking to `tests/README.md` for the full philosophy.

New devDep for the badge step: `coverage-badge` (or equivalent — a small script that reads `coverage-summary.json` and writes an SVG).

## Acceptance criteria

The redesign is complete when:

1. `tests/` matches the layout above with each layer populated and passing.
2. `tests/README.md` exists and is accurate.
3. `npm run test:coverage` produces a merged report covering Vitest + Playwright with measured coverage ≥ 95% lines / 90% branches / 95% functions across the scoped source.
4. CI runs as tiered: 2 jobs on PRs, 5 jobs on main push, all green.
5. Cross-browser e2e passes on Chromium, Firefox, WebKit, and Mobile Chrome.
6. `npm run test:static` against a fresh `dist/` reports zero HTML validation errors and zero broken internal links.
7. Main README displays coverage and CI badges that reflect the current main branch state.

## Out of scope

- Visual regression testing (Playwright screenshot diffs) — deferred; can be added later as a seventh layer without restructuring.
- Nightly cron — explicitly declined; main-push slow lane is sufficient given the site's update cadence.
- Deployment workflows — separate concern, not part of this redesign.
- Mutation testing — overkill for the current code volume.
