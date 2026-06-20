# bohdanmoroz.com

Personal site — one static page per locale plus a printable CV route. Served as plain HTML/CSS with a sprinkle of vanilla TS for the terminal-style touches (live clock, typewriter bootline, scroll reveals) and the language switcher.

Built with **Astro 6** + **Tailwind CSS 4**, in a dark tactical-terminal aesthetic (Chakra Petch + JetBrains Mono). No SSR, no framework integration, no client-side router.

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
    cv.astro         # printable CV (also rendered to public/cv.pdf)
    404.astro
  layouts/
    Base.astro       # <head>, meta, hreflang, JSON-LD, fonts
    CvLayout.astro   # print-oriented layout for /cv
  components/        # Topbar, Hero, Protocol, Dossier, Contact, Footer,
                     #   HomePage (composes them), SiteClient (client scripts), …
  i18n/
    index.ts         # getLangFromUrl, useTranslations, Lang type
    locales/*.json   # en.json is the source of truth; ru/uk mirror its key shape
  cv/data.ts         # structured CV content
  styles/            # global.css (tokens + utilities), cv.css
public/              # cv.pdf, favicon, og-image, fonts, robots.txt, llms.txt
```

## CV

`/cv` is generated from `src/cv/data.ts`. The PDF at `public/cv.pdf` is committed to the repo (the deploy image has no browser to render it), so after editing any CV source, run `npm run cv:pdf` and commit the result alongside `scripts/cv-pdf.hash`. `npm run cv:check` — part of CI and `test:all` — fails the build if the committed PDF has drifted from its sources.

## Testing

The site is small but the test suite is deliberately comprehensive.

| Layer             | Tool                                      | What it covers                                                                                                |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Unit              | **Vitest**                                | i18n helpers, dictionary key-shape parity across locales                                                      |
| End-to-end        | **Playwright** (Chromium + mobile)        | rendering per locale, meta tags, hreflang, JSON-LD validity, `/cv`, 404, language switcher, page interactions |
| Accessibility     | **axe-core** (via Playwright)             | WCAG 2.1 A + AA on every route                                                                                |
| Perf / SEO / a11y | **Lighthouse CI**                         | Hard budgets: perf ≥ 95, a11y = 100, best-practices ≥ 95, SEO = 100 — across all three locales                |
| Static analysis   | **astro check**, **ESLint**, **Prettier** | TS + `.astro` type errors, lint, formatting                                                                   |

### Commands

```bash
npm run test:unit      # Vitest
npm run test:e2e       # Playwright (auto-builds and previews on port 4321)
npm run test:lhci      # Lighthouse CI (builds first)
npm run typecheck      # astro check

npm run test:all       # lint + format:check + typecheck + cv:check + unit + e2e + lhci, in order
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

## Deployment

The site runs in a Docker container on a small VPS, behind an existing reverse-proxy network (`web`). The image is published to GHCR as `ghcr.io/bohdanmoroz11/personal-website:latest`, and the server runs it via `docker-compose.yml`.

### Automated (default)

On every push to `main`, `.github/workflows/ci.yml` runs tests, then `.github/workflows/deploy.yml` builds the image, pushes it to GHCR, SSHes to the server, and runs `docker compose pull && up -d`. No action needed.

### Manual deploy (Actions down / hotfix)

When GitHub Actions is degraded (it happens — check [githubstatus.com](https://www.githubstatus.com)) or you need to ship without going through CI, use the local script. It does the same three things the Actions pipeline does, just from your laptop.

```bash
# one-time setup
docker login ghcr.io -u bohdanmoroz11   # PAT with write:packages scope

# every deploy
DEPLOY_HOST=<ssh-alias-or-host> ./scripts/deploy.sh
# or:  ./scripts/deploy.sh --host <ssh-alias-or-host>
```

`DEPLOY_HOST` is whatever you use after `ssh` — a `~/.ssh/config` alias (`bro`, `prod`, …) or a full `user@host`. The script never assumes a particular alias; set it in your shell rc if you want a default:

```bash
# ~/.zshrc or similar
export DEPLOY_HOST=bro
```

Other knobs (all optional):

| Var / flag                       | Default                                         | Why you'd change it                                                          |
| -------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `DEPLOY_IMAGE` / `--image`       | `ghcr.io/bohdanmoroz11/personal-website:latest` | Pushing to a different tag or registry                                       |
| `DEPLOY_PLATFORM` / `--platform` | `linux/amd64`                                   | Server is ARM (e.g. Ampere / Graviton)                                       |
| `SKIP_BUILD=1` / `--skip-build`  | off                                             | Re-deploy the existing remote image without rebuilding (rolls the container) |

The remote half of the deploy is intentionally tiny and lives inline in the script — `git pull --ff-only && docker compose pull && docker compose up -d && docker image prune -f`. If you ever need to deploy without your laptop's Docker, you can SSH in and run those four lines by hand.

## Dependency updates

Dependencies are kept current automatically, in two layers:

1. **Renovate — patches & minors.** [`renovate.json`](renovate.json) bundles every
   non-major update (`patch`, `minor`, `pin`, `digest`) into a single grouped PR and
   **auto-merges it once CI is green**. Runs weekly (before 6am Monday, Europe/Sofia).
   Nothing to do — if the tests pass, it lands on its own.

2. **Claude Code — majors.** Major bumps are riskier, so Renovate opens a **separate PR per
   major**, leaves it un-merged, and labels it `dep:major-review`. That label triggers
   [`.github/workflows/major-dep-agent.yml`](.github/workflows/major-dep-agent.yml), which runs
   Claude Code on the PR branch. The agent reads the diff and the upstream changelog/migration
   guide, makes any code changes the new major requires (or plainly states none are needed),
   typechecks them, commits to the PR branch, and posts a **summary comment** — with links to
   the release notes it relied on — for you to read.

   You review the PR and the agent's comment, and merge it yourself if it looks good. Majors
   are never auto-merged.

## Tooling

- **Prettier** + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes).
- **ESLint** flat config (`@eslint/js` + `typescript-eslint` + `eslint-plugin-astro`).
- **Husky + lint-staged** — pre-commit hook auto-fixes staged `.js/.ts/.astro` files with ESLint + Prettier, and `.json/.md/.css` with Prettier.
