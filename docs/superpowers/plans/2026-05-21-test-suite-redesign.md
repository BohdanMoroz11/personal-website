# Test Suite Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure and expand the test suite to six showcase-facing layers (unit, component, e2e, a11y, static-output, perf/SEO) with ~95% measured coverage and tiered CI.

**Architecture:** Vitest projects split unit vs. component tests. Component layer uses Astro's experimental Container API + cheerio. Playwright gets Firefox + WebKit projects and a CDP coverage fixture (chromium-only). Static-output layer shells out to html-validate + linkinator against the built `dist/`. CI splits into fast lane (PRs: lint + unit + component + chromium e2e) and slow lane (main push: + cross-browser e2e + static-output + lighthouse + coverage badge).

**Tech Stack:** Astro 6, Vitest 4, Playwright 1.60, `@vitest/coverage-v8`, cheerio, c8, v8-to-istanbul, html-validate, linkinator, GitHub Actions.

**Reference spec:** [docs/superpowers/specs/2026-05-21-test-suite-redesign-design.md](../specs/2026-05-21-test-suite-redesign-design.md)

---

## Task 1: Reorganize test directories

**Files:**

- Modify: `playwright.config.ts:7` (testDir stays `./tests/e2e`)
- Create: `tests/component/.gitkeep`
- Create: `tests/static/.gitkeep`

Tests already live under `tests/unit/` and `tests/e2e/`. This task only creates empty `tests/component/` and `tests/static/` directories so subsequent tasks can land files there.

- [ ] **Step 1: Create empty subdirectories with gitkeep**

```bash
mkdir -p tests/component tests/static
touch tests/component/.gitkeep tests/static/.gitkeep
```

- [ ] **Step 2: Verify directory structure**

Run: `ls tests/`
Expected: `component  e2e  static  unit`

- [ ] **Step 3: Commit**

```bash
git add tests/component/.gitkeep tests/static/.gitkeep
git commit -m "test: scaffold component and static test directories"
```

---

## Task 2: Install component-test dependencies

**Files:**

- Modify: `package.json` (devDependencies)

- [ ] **Step 1: Install cheerio**

Run: `npm install --save-dev cheerio@^1.0.0`

- [ ] **Step 2: Verify**

Run: `node -e "console.log(require('cheerio').load('<p>x</p>')('p').text())"`
Expected output: `x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "test: add cheerio for component test HTML assertions"
```

---

## Task 3: Component test helper

**Files:**

- Create: `tests/component/helpers.ts`

Shared helper that wraps Astro's experimental Container API and returns a cheerio instance, so every component test is two lines of setup.

- [ ] **Step 1: Write the helper**

```ts
// tests/component/helpers.ts
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import * as cheerio from "cheerio";
import en from "../../src/i18n/locales/en.json";
import type { Dictionary } from "../../src/i18n";

export const dict: Dictionary = en;

export async function renderComponent(
  Component: unknown,
  props: Record<string, unknown> = {},
): Promise<cheerio.CheerioAPI> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Component as never, { props });
  return cheerio.load(html);
}
```

- [ ] **Step 2: Commit**

```bash
git add tests/component/helpers.ts
git commit -m "test: add component test helper using Astro Container API"
```

---

## Task 4: Vitest projects config

**Files:**

- Modify: `vitest.config.ts` (entire file)

Split into two projects so `test:unit` and `test:component` can run independently, and coverage merges across both.

- [ ] **Step 1: Rewrite vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: process.env.CI ? ["default", "github-actions"] : ["default"],
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "component",
          include: ["tests/component/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage",
      include: ["src/i18n/**/*.ts", "src/components/**/*.astro"],
      exclude: ["src/i18n/locales/**"],
      all: true,
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 90,
      },
    },
  },
});
```

- [ ] **Step 2: Add scripts to package.json**

In `package.json` `scripts`, add:

```json
"test:component": "vitest run --project component",
```

And update `test:unit` to use the project filter:

```json
"test:unit": "vitest run --project unit",
```

- [ ] **Step 3: Run existing unit tests under new config**

Run: `npm run test:unit`
Expected: `2 passed`, both `tests/unit/i18n.test.ts` and `tests/unit/dictionary-parity.test.ts` pass.

- [ ] **Step 4: Verify component project finds zero tests (no test files yet)**

Run: `npm run test:component`
Expected: vitest reports "No test files found" and exits non-zero.

That's fine for this task — next task lands the first test.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json
git commit -m "test: split vitest into unit + component projects"
```

---

## Task 5: Component test — Hero (TDD walkthrough)

**Files:**

- Create: `tests/component/Hero.test.ts`

This task is the exemplar — full TDD pattern. Subsequent component tasks reuse the helper and follow the same shape.

- [ ] **Step 1: Write the failing test**

```ts
// tests/component/Hero.test.ts
import { describe, it, expect } from "vitest";
import Hero from "../../src/components/Hero.astro";
import { renderComponent, dict } from "./helpers";

describe("Hero", () => {
  it("renders name, role, location, and mailto from the dictionary", async () => {
    const $ = await renderComponent(Hero, { hero: dict.hero });

    expect($("h1").text()).toContain(dict.hero.name);
    expect($("p").text()).toContain(dict.hero.roleGeneral);
    expect($("p").text()).toContain(dict.hero.roleEmphasis);
    expect($(".label").text()).toContain(dict.hero.location);

    const email = $('a[href^="mailto:"]');
    expect(email).toHaveLength(1);
    expect(email.attr("href")).toBe("mailto:contact@bohdanmoroz.com");
  });
});
```

- [ ] **Step 2: Run to verify it passes (Hero already exists, test should pass first try)**

Run: `npm run test:component -- Hero`
Expected: `1 passed`

If it fails, the failure tells you whether the Container API setup works. Fix the helper if needed before continuing.

- [ ] **Step 3: Commit**

```bash
git add tests/component/Hero.test.ts
git commit -m "test(component): assert Hero renders from dictionary"
```

---

## Task 6: Component test — FactsTable

**Files:**

- Create: `tests/component/FactsTable.test.ts`
- Read for reference: `src/components/FactsTable.astro`

- [ ] **Step 1: Read FactsTable to learn its prop shape and rendered structure**

Run: `cat src/components/FactsTable.astro`

Note which dictionary keys it consumes (likely `dict.facts.*`) and what the mailto status CTA looks like.

- [ ] **Step 2: Write the test**

```ts
// tests/component/FactsTable.test.ts
import { describe, it, expect } from "vitest";
import FactsTable from "../../src/components/FactsTable.astro";
import { renderComponent, dict } from "./helpers";

describe("FactsTable", () => {
  it("renders all fact rows from the dictionary", async () => {
    const $ = await renderComponent(FactsTable, { facts: dict.facts });
    const text = $.root().text();

    // Assert each fact label appears. Adjust keys to match the actual
    // dict.facts shape — likely role, domains, stack, status, etc.
    for (const key of Object.keys(dict.facts)) {
      const fact = (dict.facts as Record<string, { label?: string }>)[key];
      if (fact && typeof fact === "object" && fact.label) {
        expect(text).toContain(fact.label);
      }
    }
  });

  it("renders the status row as a mailto CTA", async () => {
    const $ = await renderComponent(FactsTable, { facts: dict.facts });
    const mailto = $('a[href^="mailto:"]');
    expect(mailto.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm run test:component -- FactsTable`
Expected: `2 passed`

If assertions about `dict.facts` shape fail, inspect [src/i18n/locales/en.json](src/i18n/locales/en.json) and update the assertions to the actual shape. The test exists to lock in current behavior, not to invent a new shape.

- [ ] **Step 4: Commit**

```bash
git add tests/component/FactsTable.test.ts
git commit -m "test(component): assert FactsTable renders facts and mailto"
```

---

## Task 7: Component test — HowIWork

**Files:**

- Create: `tests/component/HowIWork.test.ts`

- [ ] **Step 1: Inspect the component**

Run: `cat src/components/HowIWork.astro`

- [ ] **Step 2: Write the test**

```ts
// tests/component/HowIWork.test.ts
import { describe, it, expect } from "vitest";
import HowIWork from "../../src/components/HowIWork.astro";
import { renderComponent, dict } from "./helpers";

describe("HowIWork", () => {
  it("renders the section heading and every principle", async () => {
    const $ = await renderComponent(HowIWork, { howIWork: dict.howIWork });
    const text = $.root().text();

    expect(text).toContain(dict.howIWork.title);
    for (const principle of dict.howIWork.principles) {
      expect(text).toContain(principle.title);
      expect(text).toContain(principle.body);
    }
  });
});
```

- [ ] **Step 3: Run and adjust prop name / dict shape if needed**

Run: `npm run test:component -- HowIWork`
Expected: `1 passed`

- [ ] **Step 4: Commit**

```bash
git add tests/component/HowIWork.test.ts
git commit -m "test(component): assert HowIWork renders all principles"
```

---

## Task 8: Component test — Work

**Files:**

- Create: `tests/component/Work.test.ts`

- [ ] **Step 1: Inspect the component**

Run: `cat src/components/Work.astro`

Note: Work renders 5 projects, each with a `<button class="stack-toggle">` and the section gets a `data-stacks-open="false"` attribute. The inline `<script>` behavior is covered by e2e — this test only asserts the rendered structure.

- [ ] **Step 2: Write the test**

```ts
// tests/component/Work.test.ts
import { describe, it, expect } from "vitest";
import Work from "../../src/components/Work.astro";
import { renderComponent, dict } from "./helpers";

describe("Work", () => {
  it("renders the section with stacks initially collapsed", async () => {
    const $ = await renderComponent(Work, { work: dict.work });
    expect($("#work").attr("data-stacks-open")).toBe("false");
  });

  it("renders one toggle button per project", async () => {
    const $ = await renderComponent(Work, { work: dict.work });
    const toggles = $("button.stack-toggle");
    expect(toggles.length).toBe(dict.work.projects.length);
    toggles.each((_, el) => {
      expect($(el).attr("aria-expanded")).toBe("false");
    });
  });

  it("renders every project title", async () => {
    const $ = await renderComponent(Work, { work: dict.work });
    const text = $.root().text();
    for (const project of dict.work.projects) {
      expect(text).toContain(project.title);
    }
  });
});
```

- [ ] **Step 3: Run**

Run: `npm run test:component -- Work`
Expected: `3 passed`

- [ ] **Step 4: Commit**

```bash
git add tests/component/Work.test.ts
git commit -m "test(component): assert Work renders projects with closed toggles"
```

---

## Task 9: Component test — Contact

**Files:**

- Create: `tests/component/Contact.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/component/Contact.test.ts
import { describe, it, expect } from "vitest";
import Contact from "../../src/components/Contact.astro";
import { renderComponent, dict } from "./helpers";

describe("Contact", () => {
  it("renders the contact heading and mailto link", async () => {
    const $ = await renderComponent(Contact, { contact: dict.contact });
    expect($.root().text()).toContain(dict.contact.title);

    const mailto = $('a[href^="mailto:"]');
    expect(mailto).toHaveLength(1);
    expect(mailto.attr("href")).toBe("mailto:contact@bohdanmoroz.com");
  });
});
```

- [ ] **Step 2: Run and adjust prop name if the component uses a different one**

Run: `npm run test:component -- Contact`
Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add tests/component/Contact.test.ts
git commit -m "test(component): assert Contact renders heading and mailto"
```

---

## Task 10: Component test — Footer

**Files:**

- Create: `tests/component/Footer.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/component/Footer.test.ts
import { describe, it, expect } from "vitest";
import Footer from "../../src/components/Footer.astro";
import { renderComponent, dict } from "./helpers";

describe("Footer", () => {
  it("renders footer text from the dictionary", async () => {
    const $ = await renderComponent(Footer, { footer: dict.footer });
    const text = $.root().text();
    // Footer copy is small; assert at least one known string appears.
    expect(text.length).toBeGreaterThan(0);
    if (typeof dict.footer === "string") {
      expect(text).toContain(dict.footer);
    } else if (dict.footer && typeof dict.footer === "object") {
      // Walk one level of string leaves.
      for (const value of Object.values(dict.footer)) {
        if (typeof value === "string") expect(text).toContain(value);
      }
    }
  });
});
```

- [ ] **Step 2: Run**

Run: `npm run test:component -- Footer`
Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add tests/component/Footer.test.ts
git commit -m "test(component): assert Footer renders dictionary copy"
```

---

## Task 11: Component test — ThemeToggle

**Files:**

- Create: `tests/component/ThemeToggle.test.ts`

ThemeToggle has an inline `<script>`. We only assert the rendered button structure here — the script's behavior (toggle persistence) is covered by `tests/e2e/theme-and-lang.spec.ts`.

- [ ] **Step 1: Write the test**

```ts
// tests/component/ThemeToggle.test.ts
import { describe, it, expect } from "vitest";
import ThemeToggle from "../../src/components/ThemeToggle.astro";
import { renderComponent, dict } from "./helpers";

describe("ThemeToggle", () => {
  it("renders an accessible button with both label variants in the DOM", async () => {
    const $ = await renderComponent(ThemeToggle, { themeToggle: dict.themeToggle });
    const button = $("button");
    expect(button).toHaveLength(1);
    expect(button.attr("aria-label")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, adjusting the prop name / dict path if needed**

Run: `npm run test:component -- ThemeToggle`
Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add tests/component/ThemeToggle.test.ts
git commit -m "test(component): assert ThemeToggle button renders accessibly"
```

---

## Task 12: Component test — LangSwitch

**Files:**

- Create: `tests/component/LangSwitch.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/component/LangSwitch.test.ts
import { describe, it, expect } from "vitest";
import LangSwitch from "../../src/components/LangSwitch.astro";
import { renderComponent, dict } from "./helpers";
import { languages } from "../../src/i18n";

describe("LangSwitch", () => {
  it("renders one link or option per supported language", async () => {
    const $ = await renderComponent(LangSwitch, {
      currentLang: "en",
      langSwitch: dict.langSwitch,
    });
    // Either anchor-per-language or a select with options. Accept either.
    const anchors = $("a[hreflang], a[data-lang]");
    const options = $("option[value]");
    const hits = anchors.length + options.length;
    expect(hits).toBeGreaterThanOrEqual(Object.keys(languages).length);
  });
});
```

- [ ] **Step 2: Run; adjust selectors if the component uses different attributes**

Run: `npm run test:component -- LangSwitch`
Expected: `1 passed`

If the component renders neither anchors nor options (e.g., uses divs with `data-lang`), update the selector in step 1 to match the actual markup, then re-run.

- [ ] **Step 3: Commit**

```bash
git add tests/component/LangSwitch.test.ts
git commit -m "test(component): assert LangSwitch renders one entry per language"
```

---

## Task 13: Verify component coverage

**Files:**

- (read-only) `coverage/index.html`

- [ ] **Step 1: Run full coverage**

Run: `npm run test:coverage`
Expected: all 8 component tests pass; coverage report prints.

- [ ] **Step 2: Inspect the coverage HTML for component frontmatter**

Run: `open coverage/index.html` (or `xdg-open` on Linux)

Drill into `src/components/`. Confirm each component file shows coverage on its frontmatter TS lines. Inline `<script>` blocks will show as uncovered — that's expected; they're handled by Task 18.

- [ ] **Step 3: If any component file is below 90% frontmatter coverage, add an assertion**

If a branch in a component's frontmatter is uncovered (e.g., an optional prop being absent), add a second test case to that component's test file that exercises the missing branch. Re-run.

- [ ] **Step 4: Commit any additions**

```bash
git add tests/component/
git commit -m "test(component): cover remaining frontmatter branches"
```

If no additions were needed, skip this step.

---

## Task 14: Install static-output dependencies

**Files:**

- Modify: `package.json`
- Create: `.htmlvalidate.json`

- [ ] **Step 1: Install**

Run: `npm install --save-dev html-validate@^9.0.0 linkinator@^7.0.0`

- [ ] **Step 2: Create html-validate config**

```json
// .htmlvalidate.json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "void-style": ["error", { "style": "selfclosing" }],
    "no-trailing-whitespace": "off"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .htmlvalidate.json
git commit -m "test: add html-validate and linkinator for static-output tests"
```

---

## Task 15: Static-output test — html-validate

**Files:**

- Create: `tests/static/html-validate.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/static/html-validate.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

describe("html-validate against dist/", () => {
  beforeAll(() => {
    if (!existsSync("dist/index.html")) {
      execSync("npm run build", { stdio: "inherit" });
    }
  }, 120_000);

  it("reports zero validation errors for every emitted HTML file", () => {
    let stdout = "";
    let failed = false;
    try {
      stdout = execSync('npx html-validate "dist/**/*.html"', { encoding: "utf8" });
    } catch (err) {
      failed = true;
      stdout = (err as { stdout?: string; stderr?: string }).stdout ?? "";
      stdout += (err as { stderr?: string }).stderr ?? "";
    }
    expect(failed, `html-validate output:\n${stdout}`).toBe(false);
  }, 60_000);
});
```

- [ ] **Step 2: Add a vitest project for static tests**

In `vitest.config.ts`, add a third project:

```ts
{
  test: {
    name: "static",
    include: ["tests/static/**/*.test.ts"],
    environment: "node",
    testTimeout: 120_000,
  },
},
```

- [ ] **Step 3: Add npm script**

In `package.json` `scripts`:

```json
"test:static": "vitest run --project static",
```

- [ ] **Step 4: Run**

Run: `npm run test:static`
Expected: `1 passed`. If validation errors surface, **fix the source markup** in `src/` — do not weaken the html-validate config to make the test pass.

- [ ] **Step 5: Commit**

```bash
git add tests/static/html-validate.test.ts vitest.config.ts package.json
git commit -m "test(static): assert built HTML passes html-validate"
```

---

## Task 16: Static-output test — link check

**Files:**

- Create: `tests/static/links.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/static/links.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { LinkChecker } from "linkinator";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const RUN_EXTERNAL = process.env.CHECK_EXTERNAL_LINKS === "1";

describe("linkinator against dist/", () => {
  beforeAll(() => {
    if (!existsSync("dist/index.html")) {
      execSync("npm run build", { stdio: "inherit" } as never);
    }
  }, 120_000);

  it("finds no broken links in built HTML", async () => {
    const checker = new LinkChecker();
    const result = await checker.check({
      path: "dist",
      recurse: true,
      linksToSkip: RUN_EXTERNAL ? [] : ["^https?://"],
    });
    const broken = result.links.filter((l) => l.state === "BROKEN");
    expect(
      broken,
      `broken links:\n${broken.map((l) => `${l.url} (${l.status})`).join("\n")}`,
    ).toEqual([]);
  }, 120_000);
});
```

- [ ] **Step 2: Run (internal links only)**

Run: `npm run test:static`
Expected: 2 specs pass (html-validate + links).

- [ ] **Step 3: Run once with external link checking enabled, manually**

Run: `CHECK_EXTERNAL_LINKS=1 npm run test:static`
Expected: passes. If external links are broken, fix them in source. This run is for local sanity; CI handles it via Task 20 (slow lane sets `CHECK_EXTERNAL_LINKS=1`).

- [ ] **Step 4: Commit**

```bash
git add tests/static/links.test.ts
git commit -m "test(static): assert no broken links in built dist"
```

---

## Task 17: Cross-browser e2e

**Files:**

- Modify: `playwright.config.ts:17-20`

- [ ] **Step 1: Add Firefox and WebKit projects**

Replace the `projects` array in `playwright.config.ts` with:

```ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  { name: "mobile", use: { ...devices["Pixel 7"] } },
],
```

- [ ] **Step 2: Install all browsers locally**

Run: `npx playwright install --with-deps`
Expected: chromium, firefox, webkit downloaded.

- [ ] **Step 3: Run full e2e suite across all projects**

Run: `npm run test:e2e`
Expected: every spec passes on every project. If a spec is flaky on webkit (likely the lang-switch redirect or theme persistence), investigate the root cause — do not skip the project.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts
git commit -m "test(e2e): add Firefox and WebKit cross-browser projects"
```

---

## Task 18: Playwright CDP coverage fixture (chromium only)

**Files:**

- Create: `tests/e2e/fixtures/coverage.ts`
- Modify: `tests/e2e/routes.spec.ts`, `theme-and-lang.spec.ts`, `work-section.spec.ts`, `accessibility.spec.ts` — change `import { test, expect } from "@playwright/test"` to the new fixture import.

The fixture collects v8 JS coverage on chromium and writes raw JSON to `coverage/playwright-raw/`. The merge happens in Task 19.

- [ ] **Step 1: Create the fixture**

```ts
// tests/e2e/fixtures/coverage.ts
import { test as base, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const RAW_DIR = "coverage/playwright-raw";

export const test = base.extend<object>({
  page: async ({ page, browserName }, use, testInfo) => {
    const collect = browserName === "chromium";
    if (collect) {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
    }
    await use(page);
    if (collect) {
      const entries = await page.coverage.stopJSCoverage();
      await mkdir(RAW_DIR, { recursive: true });
      const file = join(RAW_DIR, `${testInfo.project.name}-${randomUUID()}.json`);
      await writeFile(file, JSON.stringify({ result: entries }), "utf8");
    }
  },
});

export { expect };
```

- [ ] **Step 2: Switch every e2e spec to import from the fixture**

For each of `tests/e2e/routes.spec.ts`, `theme-and-lang.spec.ts`, `work-section.spec.ts`, `accessibility.spec.ts`:

Change the top-of-file import from:

```ts
import { test, expect } from "@playwright/test";
```

to:

```ts
import { test, expect } from "./fixtures/coverage";
```

(`accessibility.spec.ts` may also import `AxeBuilder` from `@axe-core/playwright` — leave that import alone.)

- [ ] **Step 3: Add coverage/playwright-raw to .gitignore**

Run: `grep -q "playwright-raw" .gitignore || echo "coverage/playwright-raw/" >> .gitignore`

- [ ] **Step 4: Run e2e and confirm raw JSON is written**

Run: `npm run test:e2e -- --project chromium`
Expected: tests pass; `ls coverage/playwright-raw/` shows one JSON file per test.

- [ ] **Step 5: Confirm non-chromium projects do not write coverage**

Run: `rm -rf coverage/playwright-raw && npm run test:e2e -- --project firefox`
Expected: `coverage/playwright-raw/` is not created.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/fixtures/coverage.ts tests/e2e/*.spec.ts .gitignore
git commit -m "test(e2e): collect v8 JS coverage on chromium via fixture"
```

---

## Task 19: Merge Playwright coverage with Vitest coverage

**Files:**

- Create: `scripts/merge-coverage.mjs`
- Modify: `package.json` scripts

- [ ] **Step 1: Install merger dependencies**

Run: `npm install --save-dev c8@^10.0.0 v8-to-istanbul@^9.0.0`

- [ ] **Step 2: Write the merge script**

```js
// scripts/merge-coverage.mjs
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import v8ToIstanbul from "v8-to-istanbul";

const RAW = "coverage/playwright-raw";
const OUT = "coverage/playwright-istanbul.json";

if (!existsSync(RAW)) {
  console.log("No Playwright raw coverage found; skipping merge.");
  process.exit(0);
}

const files = (await readdir(RAW)).filter((f) => f.endsWith(".json"));
const merged = {};

for (const file of files) {
  const { result } = JSON.parse(await readFile(join(RAW, file), "utf8"));
  for (const entry of result) {
    if (!entry.url || !entry.url.startsWith("http")) continue;
    // Map served URL → local file under dist/
    const path = new URL(entry.url).pathname;
    const local = resolve("dist", path.replace(/^\//, ""));
    if (!existsSync(local)) continue;
    try {
      const converter = v8ToIstanbul(local, 0, { source: entry.source });
      await converter.load();
      converter.applyCoverage(entry.functions);
      const istanbul = converter.toIstanbul();
      for (const [k, v] of Object.entries(istanbul)) {
        merged[k] = merged[k] ? mergeFileCoverage(merged[k], v) : v;
      }
    } catch (err) {
      console.warn(`skip ${entry.url}: ${err.message}`);
    }
  }
}

function mergeFileCoverage(a, b) {
  // Simple statement/branch hit-count merge — same shape on both sides.
  for (const k of Object.keys(b.s)) a.s[k] = (a.s[k] ?? 0) + (b.s[k] ?? 0);
  for (const k of Object.keys(b.f)) a.f[k] = (a.f[k] ?? 0) + (b.f[k] ?? 0);
  for (const k of Object.keys(b.b)) {
    a.b[k] = (a.b[k] ?? []).map((n, i) => (n ?? 0) + (b.b[k][i] ?? 0));
  }
  return a;
}

await mkdir("coverage", { recursive: true });
await writeFile(OUT, JSON.stringify(merged), "utf8");
console.log(`Wrote ${Object.keys(merged).length} files to ${OUT}`);
```

- [ ] **Step 3: Add a unified coverage script**

In `package.json` `scripts`:

```json
"test:coverage:merged": "rm -rf coverage && npm run build && npm run test:e2e -- --project chromium && node scripts/merge-coverage.mjs && npm run test:coverage",
```

The order: build (so `dist/` exists for source mapping), e2e with fixture (writes raw JSON), merge script (converts to istanbul format at `coverage/playwright-istanbul.json`), Vitest coverage (writes its own report).

Final aggregation across the two formats is intentionally left out of the threshold check — Vitest's threshold enforcement covers component + unit, and the Playwright-derived istanbul JSON is uploaded as an artifact for inspection. (Per the spec's risk-acknowledgement section: source-map fidelity may be imperfect, so we don't gate on it.)

- [ ] **Step 4: Run end-to-end**

Run: `npm run test:coverage:merged`
Expected: everything passes; `coverage/coverage-summary.json` (Vitest) and `coverage/playwright-istanbul.json` both exist.

- [ ] **Step 5: Commit**

```bash
git add scripts/merge-coverage.mjs package.json package-lock.json
git commit -m "test: merge Playwright v8 coverage into istanbul format"
```

---

## Task 20: Tiered CI workflow

**Files:**

- Modify: `.github/workflows/ci.yml` (full rewrite)

- [ ] **Step 1: Replace the workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  static-checks:
    name: Lint, format, typecheck, unit, component
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:component
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-vitest
          path: coverage
          retention-days: 14

  e2e-chromium:
    name: Playwright (chromium + axe + coverage)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e -- --project chromium
      - run: node scripts/merge-coverage.mjs
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 14
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-playwright
          path: coverage/playwright-istanbul.json
          retention-days: 14

  e2e-cross-browser:
    name: Playwright (firefox + webkit + mobile)
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps firefox webkit chromium
      - run: npm run test:e2e -- --project firefox --project webkit --project mobile

  static-output:
    name: html-validate + link check
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    env:
      CHECK_EXTERNAL_LINKS: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
      - run: npm run test:static

  lighthouse:
    name: Lighthouse CI
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
      - run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

- [ ] **Step 2: Validate locally — lint the workflow with actionlint if available**

Run: `which actionlint && actionlint .github/workflows/ci.yml || echo "actionlint not installed; skipping"`
Expected: either passes or skip message.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: split into fast-lane PR and slow-lane main-push jobs"
git push origin main
```

- [ ] **Step 4: Watch the first run on GitHub Actions**

Open the repo's Actions tab. On the main push, all 5 jobs should run. Confirm green across the board. Fix any failure at its root — do not weaken assertions to make CI green.

---

## Task 21: Coverage badge

**Files:**

- Create: `scripts/coverage-badge.mjs`
- Create: `.github/badges/.gitkeep`
- Modify: `.github/workflows/ci.yml` (add step to `static-checks` job that runs only on main push)
- Modify: `package.json` (add `coverage:badge` script)

- [ ] **Step 1: Install dependency**

Run: `npm install --save-dev coverage-badges-cli@^2.0.0`

(Or any equivalent — the script in step 2 uses the package's CLI.)

- [ ] **Step 2: Write the badge script**

```js
// scripts/coverage-badge.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";

const summary = JSON.parse(await readFile("coverage/coverage-summary.json", "utf8"));
const pct = summary.total.lines.pct;
const color = pct >= 95 ? "brightgreen" : pct >= 90 ? "green" : pct >= 80 ? "yellow" : "red";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="coverage: ${pct}%">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="120" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="65" height="20" fill="#555"/>
    <rect x="65" width="55" height="20" fill="${color === "brightgreen" ? "#4c1" : color}"/>
    <rect width="120" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="32" y="14">coverage</text>
    <text x="92" y="14">${pct}%</text>
  </g>
</svg>`;

await mkdir(".github/badges", { recursive: true });
await writeFile(".github/badges/coverage.svg", svg, "utf8");
console.log(`Wrote .github/badges/coverage.svg at ${pct}%`);
```

A hand-rolled SVG avoids a third-party runtime dep. If `coverage-badges-cli` was installed in step 1, you can uninstall it now — the inline approach is simpler and has no external dependency.

Run: `npm uninstall coverage-badges-cli`

- [ ] **Step 3: Add the script entry**

In `package.json` `scripts`:

```json
"coverage:badge": "node scripts/coverage-badge.mjs",
```

- [ ] **Step 4: Run once locally to seed the badge file**

```bash
npm run test:coverage
npm run coverage:badge
ls -la .github/badges/coverage.svg
```

Expected: SVG file exists.

- [ ] **Step 5: Add CI step to regenerate + commit on main push**

In `.github/workflows/ci.yml`, append to the `static-checks` job's `steps:`:

```yaml
- name: Regenerate coverage badge
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: npm run coverage:badge
- name: Commit badge if changed
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: |
    if [[ -n "$(git status --porcelain .github/badges/coverage.svg)" ]]; then
      git config user.name "github-actions[bot]"
      git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
      git add .github/badges/coverage.svg
      git commit -m "ci: update coverage badge [skip ci]"
      git push origin HEAD:main
    fi
```

The job needs `permissions: contents: write` at the job level for the push step. Add:

```yaml
static-checks:
  name: Lint, format, typecheck, unit, component
  runs-on: ubuntu-latest
  permissions:
    contents: write
```

- [ ] **Step 6: Commit**

```bash
git add scripts/coverage-badge.mjs .github/badges/coverage.svg .github/workflows/ci.yml package.json package-lock.json
git commit -m "ci: generate coverage badge on main push"
```

---

## Task 22: tests/README.md

**Files:**

- Create: `tests/README.md`

- [ ] **Step 1: Write the README**

```markdown
# Tests

Six layers, each with a single purpose. The directory layout mirrors the layers:

| Layer             | Location                          | Runner                                            | Purpose                                                                   |
| ----------------- | --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| Unit              | `tests/unit/`                     | Vitest (node)                                     | Pure-function logic — i18n helpers and dictionary parity                  |
| Component         | `tests/component/`                | Vitest + Astro Container API                      | Render correctness for each `.astro` component, from a stubbed dictionary |
| E2e               | `tests/e2e/`                      | Playwright (chromium, firefox, webkit, mobile)    | User-visible behavior across routes, themes, locales                      |
| Accessibility     | `tests/e2e/accessibility.spec.ts` | Playwright + `@axe-core/playwright`               | Zero axe violations across every route × every theme                      |
| Static-output     | `tests/static/`                   | Vitest shelling out to CLIs against built `dist/` | HTML validity, broken-link detection                                      |
| Performance / SEO | `.lighthouserc.json`              | Lighthouse CI                                     | Hard floors on perf/a11y/best-practices/SEO                               |

## Running each layer

- `npm run test:unit` — unit only
- `npm run test:component` — component only
- `npm run test:static` — static-output (auto-builds `dist/` if missing)
- `npm run test:e2e` — full Playwright suite across all projects
- `npm run test:e2e -- --project chromium` — single browser
- `npm run test:coverage` — Vitest coverage (unit + component)
- `npm run test:coverage:merged` — Vitest coverage + Playwright-derived coverage merged
- `npm run test:lhci` — Lighthouse CI against the built site
- `npm run test:all` — everything in order

## CI structure

- **Fast lane** (every PR + main push): lint, format:check, typecheck, unit, component, chromium e2e with coverage.
- **Slow lane** (main push only): cross-browser e2e (firefox + webkit + mobile), static-output (html-validate + linkinator with external link checking), Lighthouse CI, coverage badge regeneration.

Mirrors what you'd expect on a real product: PRs get fast signal; main gets the full battery.

## Coverage

Scope is `src/i18n/**` and `src/components/**`. Excluded: `src/styles/**` (CSS), `src/i18n/locales/**` (data, validated by parity test), `src/layouts/**` (transitive), `src/pages/**` (build-time, transitive via e2e).

Thresholds: 95% lines / statements / functions, 90% branches. Enforced in Vitest. The Playwright-derived coverage of client-side `<script>` blocks is emitted as a separate artifact (`coverage-playwright`) for inspection but not gated on, because source-map fidelity from Astro's production build is not guaranteed at .astro-source resolution.

## Philosophy

Each layer answers a different question. Unit asks "is this function correct?", component asks "does this template render the right structure?", e2e asks "does the user-visible behavior work end to end?", a11y asks "is this usable?", static-output asks "is the build artifact well-formed?", Lighthouse asks "is it fast and discoverable?".

Removing a layer always removes a class of bug we'd otherwise catch in production.
```

- [ ] **Step 2: Commit**

```bash
git add tests/README.md
git commit -m "docs(tests): explain the six-layer test suite"
```

---

## Task 23: Main README badges and Testing section

**Files:**

- Modify: `README.md` (top section)

- [ ] **Step 1: Read current README**

Run: `cat README.md`

- [ ] **Step 2: Add badges directly under the title**

Insert (under the H1) two lines:

```markdown
![CI](https://github.com/bohdanmoroz11/personal-website/actions/workflows/ci.yml/badge.svg?branch=main)
![Coverage](https://raw.githubusercontent.com/bohdanmoroz11/personal-website/main/.github/badges/coverage.svg)
```

Replace `bohdanmoroz11/personal-website` with the actual `<owner>/<repo>` if different. Verify by running `git remote get-url origin`.

- [ ] **Step 3: Add a Testing section near the bottom**

```markdown
## Testing

Six-layer suite — unit, component, e2e, a11y, static-output, Lighthouse. See [tests/README.md](tests/README.md) for what each layer covers and how to run them individually.

CI runs a fast lane on PRs and a full lane on main push. Coverage is enforced at 95% lines / statements / functions, 90% branches across `src/i18n/` and `src/components/`.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: surface CI + coverage badges and testing section"
```

---

## Task 24: Final verification

- [ ] **Step 1: Run the full test:all locally**

Run: `npm run test:all`

Update the `test:all` script first to include the new layers:

```json
"test:all": "npm run lint && npm run format:check && npm run typecheck && npm run test:unit && npm run test:component && npm run test:e2e && npm run build && npm run test:static && npm run test:lhci",
```

Expected: all green.

- [ ] **Step 2: Run merged-coverage script**

Run: `npm run test:coverage:merged`
Expected: passes; both `coverage/coverage-summary.json` and `coverage/playwright-istanbul.json` produced.

- [ ] **Step 3: Confirm coverage threshold**

Inspect `coverage/coverage-summary.json` `total` — every metric ≥ its threshold (95/95/95/90). If not, add tests in the relevant `tests/component/*.test.ts` until it does. Do not lower thresholds.

- [ ] **Step 4: Push and watch CI**

```bash
git push origin main
```

Open Actions tab. All 5 jobs should run on the main push and pass.

- [ ] **Step 5: Confirm badges render**

Open the GitHub repo landing page. CI and coverage badges visible at top of README.

- [ ] **Step 6: Final commit if any tweaks were needed**

```bash
git add -A
git commit -m "test: final adjustments to reach coverage thresholds"
git push origin main
```

If no tweaks were needed, skip.

---

## Self-review notes

- Each component file has its own task (Tasks 5–12). Inline scripts in ThemeToggle/LangSwitch/Work are intentionally covered by e2e, not by component tests — documented in `tests/README.md`.
- Cross-browser e2e (Task 17) runs the existing specs unchanged; the fixture in Task 18 wraps `page` for all browsers but only collects on chromium.
- Threshold enforcement (Task 4 sets the numbers; Task 24 confirms). Pages are excluded from coverage scope per spec.
- The coverage merge (Task 19) intentionally does not gate the threshold — Vitest handles enforcement; Playwright-derived coverage is artifact-only because of source-map risk acknowledged in the spec.
- Badge regeneration runs only on main push (Task 21) so PRs don't fight over the SVG.
- `test:all` is updated at the end of the plan (Task 24) to chain the new layers.
