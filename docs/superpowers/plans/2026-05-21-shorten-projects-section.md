# Shorten projects section + surface contact CTA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink the perceived height of the Selected Work section, surface a clear contact CTA above the fold, and put "How I work" before "Work" in the scroll order.

**Architecture:** Native `<details>`/`<summary>` for the tech-stack collapse (no JS, accessible, content stays in DOM for Ctrl-F). Plain Astro component edits for reorder and CTAs. CSS-only visibility toggling via a `details[open]` selector in `global.css` — avoids guessing at Tailwind v4 variant syntax. i18n changes go through en/ru/uk in lockstep; the existing dictionary-parity unit test enforces shape.

**Tech Stack:** Astro 6, Tailwind CSS 4, TypeScript, Vitest, Playwright, axe-core, Lighthouse CI.

**Spec:** [docs/superpowers/specs/2026-05-21-shorten-projects-section-design.md](../specs/2026-05-21-shorten-projects-section-design.md)

---

## File Structure

**Modified files:**

- `src/pages/index.astro` — swap order of `<HowIWork>` and `<Work>`.
- `src/components/Hero.astro` — add mailto CTA line.
- `src/components/FactsTable.astro` — make Status row value a mailto link, drop the aside column for that row.
- `src/components/HowIWork.astro` — add `id="how-i-work"` to root `<section>` for test targeting.
- `src/components/Work.astro` — wrap project list in `<details>`, mark each project's `meta` block with a CSS class so it shows only when open; reduce row vertical padding.
- `src/styles/global.css` — add CSS rules for `details[open] .stack-meta`, the toggle's chevron rotation, and the open/closed label swap.
- `src/i18n/locales/en.json` — add `hero.contactCta`, `work.stacksToggleClosed`, `work.stacksToggleOpen`; modify `facts.statusValue`; remove `facts.statusAside`.
- `src/i18n/locales/ru.json` — same.
- `src/i18n/locales/uk.json` — same.
- `tests/e2e/routes.spec.ts` — add assertions for Hero CTA, Status CTA, section order.

**Created files:**

- `tests/e2e/work-section.spec.ts` — collapse behavior tests.

Each task ends with a commit. Run formatter + lint pre-commit hook handles formatting; do not bypass with `--no-verify`.

---

### Task 1: Add new i18n keys to en.json (source of truth)

**Files:**

- Modify: `src/i18n/locales/en.json`

The dictionary-parity unit test will start failing the moment en.json gains keys ru/uk lack. That's intentional — it forces the next task.

- [ ] **Step 1: Edit en.json**

In `src/i18n/locales/en.json`:

Under `"hero"`, add `"contactCta": "→ contact@bohdanmoroz.com"` (place it as the last key of the hero object).

Under `"work"` (sibling to `"section"`, `"heading"`, `"projects"`), add:

```json
"stacksToggleClosed": "Show tech stacks",
"stacksToggleOpen": "Hide tech stacks",
```

Under `"facts"`:

- Change `"statusValue": "Open to freelance work"` to `"statusValue": "Open to freelance work →"`.
- **Delete** the `"statusAside"` key entirely.

- [ ] **Step 2: Run dictionary parity test — expect failure**

Run: `npm run test:unit -- dictionary-parity`
Expected: FAIL. The ru/uk shapes will no longer match en (missing the three new keys and still containing `statusAside`).

- [ ] **Step 3: Do not commit yet**

The repo is in a broken-tests state until Task 2 lands ru/uk. Continue directly to Task 2.

---

### Task 2: Mirror i18n changes in ru.json and uk.json

**Files:**

- Modify: `src/i18n/locales/ru.json`
- Modify: `src/i18n/locales/uk.json`

- [ ] **Step 1: Edit ru.json**

In `src/i18n/locales/ru.json`:

Under `"hero"`, add at the end: `"contactCta": "→ contact@bohdanmoroz.com"` (email stays in Latin script — it's an address, not a phrase).

Under `"work"`, add:

```json
"stacksToggleClosed": "Показать стек",
"stacksToggleOpen": "Скрыть стек",
```

Under `"facts"`:

- Change `"statusValue": "Открыт к проектной работе"` to `"statusValue": "Открыт к проектной работе →"`.
- **Delete** `"statusAside"`.

- [ ] **Step 2: Edit uk.json**

In `src/i18n/locales/uk.json`:

Under `"hero"`, add at the end: `"contactCta": "→ contact@bohdanmoroz.com"`.

Under `"work"`, add:

```json
"stacksToggleClosed": "Показати стек",
"stacksToggleOpen": "Сховати стек",
```

Under `"facts"`:

- Change `"statusValue": "Відкритий до проєктної роботи"` to `"statusValue": "Відкритий до проєктної роботи →"`.
- **Delete** `"statusAside"`.

- [ ] **Step 3: Run dictionary parity test — expect PASS**

Run: `npm run test:unit -- dictionary-parity`
Expected: PASS.

- [ ] **Step 4: Run typecheck — expect PASS**

Run: `npm run typecheck`
Expected: PASS. `Dictionary = typeof en` automatically narrows: `facts.statusAside` is no longer in the type, and `hero.contactCta` / `work.stacksToggleClosed` / `work.stacksToggleOpen` are. Existing consumers that read `statusAside` will start erroring — that's the next task.

If `typecheck` fails with errors about `statusAside` not existing on the type, that is expected. Continue without "fixing" it.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/ru.json src/i18n/locales/uk.json
git commit -m "i18n: add hero contact CTA, work stack toggle labels; promote status value to CTA"
```

---

### Task 3: Add `id="how-i-work"` to HowIWork.astro

**Files:**

- Modify: `src/components/HowIWork.astro:11`

Pure test-targeting change; no visual effect.

- [ ] **Step 1: Edit HowIWork.astro**

Replace this line in `src/components/HowIWork.astro`:

```astro
<section class="section-divider px-6 pt-9 pb-2 sm:px-11"></section>
```

with:

```astro
<section id="how-i-work" class="section-divider px-6 pt-9 pb-2 sm:px-11"></section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HowIWork.astro
git commit -m "feat(how-i-work): add section id for test targeting"
```

---

### Task 4: Write failing e2e test for Hero contact CTA + Status CTA + section order

**Files:**

- Modify: `tests/e2e/routes.spec.ts`

Add three assertions inside the existing `for (const { path, lang, heroName } of ROUTES)` loop. The first two cover the CTAs; the third locks in the section order.

- [ ] **Step 1: Append three tests inside the per-route describe block**

In `tests/e2e/routes.spec.ts`, inside `test.describe(...)` just before the closing `});` of that describe, add:

```ts
test("hero shows a visible mailto contact CTA", async ({ page }) => {
  await page.goto(path);
  const cta = page.locator("header").getByRole("link", { name: /contact@bohdanmoroz\.com/ });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "mailto:contact@bohdanmoroz.com");
});

test("facts status row is a mailto CTA ending with an arrow", async ({ page }) => {
  await page.goto(path);
  const statusCta = page.getByRole("link", { name: /→\s*$/ });
  await expect(statusCta.first()).toBeVisible();
  await expect(statusCta.first()).toHaveAttribute("href", "mailto:contact@bohdanmoroz.com");
});

test("How I work renders before Selected Work in the DOM", async ({ page }) => {
  await page.goto(path);
  const howIWork = page.locator("#how-i-work");
  const work = page.locator("#work");
  await expect(howIWork).toBeVisible();
  await expect(work).toBeVisible();
  const order = await page.evaluate(() => {
    const a = document.querySelector("#how-i-work")!;
    const b = document.querySelector("#work")!;
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
      ? "how-before-work"
      : "work-before-how";
  });
  expect(order).toBe("how-before-work");
});
```

- [ ] **Step 2: Run the new tests — expect failure**

Run: `npx playwright test tests/e2e/routes.spec.ts --grep "hero shows|facts status|How I work renders"`

Expected: FAIL. The CTAs don't exist yet and the section order is wrong.

(If Playwright complains about no preview server, the config auto-builds and serves — first run is slow.)

- [ ] **Step 3: Do not commit yet**

Tests stay failing until Tasks 5–7 land. Continue to Task 5.

---

### Task 5: Implement the Hero contact CTA

**Files:**

- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Add contact line under the role paragraph**

In `src/components/Hero.astro`, replace the file's full content with:

```astro
---
import type { Dictionary } from "../i18n";

interface Props {
  hero: Dictionary["hero"];
}

const { hero } = Astro.props;
---

<header class="px-6 pt-10 pb-7 sm:px-11 sm:pt-12">
  <div class="label">{hero.location}</div>
  <h1 class="serif mt-3 text-4xl leading-[1.05] sm:text-[40px]">
    {hero.name}
  </h1>
  <p class="serif text-ink-soft mt-2 text-[22px] leading-[1.2] sm:text-[24px]">
    {hero.roleGeneral} · <span class="highlight-underline">{hero.roleEmphasis}</span>.
  </p>
  <a href="mailto:contact@bohdanmoroz.com" class="mono subtle mt-3 inline-block text-[12px]">
    {hero.contactCta}
  </a>
</header>
```

The `mono` + `subtle` classes are existing utilities from `global.css`. `inline-block` ensures the underline (from `.subtle`) only spans the text width, not the row.

- [ ] **Step 2: Run the hero CTA test — expect PASS**

Run: `npx playwright test tests/e2e/routes.spec.ts --grep "hero shows"`

Expected: PASS on all three routes (`/`, `/ru/`, `/uk/`).

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat(hero): add visible mailto contact CTA under role line"
```

---

### Task 6: Implement the FactsTable Status CTA

**Files:**

- Modify: `src/components/FactsTable.astro`

- [ ] **Step 1: Replace FactsTable.astro contents**

Replace the file with:

```astro
---
import type { Dictionary } from "../i18n";

interface Props {
  facts: Dictionary["facts"];
  email: string;
}

const { facts, email } = Astro.props;

const rows: Array<{
  label: string;
  value: string;
  aside?: string;
  liveDot?: boolean;
  asideHref?: string;
  valueHref?: string;
}> = [
  { label: facts.focusLabel, value: facts.focusValue, aside: facts.focusAside },
  { label: facts.domainsLabel, value: facts.domainsValue, aside: facts.domainsAside },
  { label: facts.stackLabel, value: facts.stackValue, aside: facts.stackAside },
  { label: facts.infraLabel, value: facts.infraValue },
  { label: facts.workingLabel, value: facts.workingValue },
  {
    label: facts.statusLabel,
    value: facts.statusValue,
    valueHref: `mailto:${email}`,
    liveDot: true,
  },
];
---

<div class="px-6 pb-2 sm:px-11">
  {
    rows.map((r) => (
      <div class="row">
        <div class="label">{r.label}</div>
        <div class="text-ink-soft flex items-center text-[15px]">
          {r.liveDot && <span class="bg-live mr-2 inline-block h-1.5 w-1.5 rounded-full" />}
          {r.valueHref ? (
            <a href={r.valueHref} class="subtle">
              {r.value}
            </a>
          ) : (
            r.value
          )}
        </div>
        <div class="row-right mono text-muted text-[11px]">
          {r.aside && r.asideHref ? (
            <a href={r.asideHref} class="subtle">
              {r.aside}
            </a>
          ) : (
            r.aside
          )}
        </div>
      </div>
    ))
  }
</div>
```

Changes vs. current:

- Added `valueHref?: string` to the row type.
- Status row now uses `valueHref: mailto:${email}` (and no longer reads `facts.statusAside`, which no longer exists in the dictionary).
- When `valueHref` is present, the value text is wrapped in an `<a class="subtle">`.
- The live dot stays a sibling of the link, not inside it, so the dot isn't underlined.

- [ ] **Step 2: Run typecheck — expect PASS**

Run: `npm run typecheck`
Expected: PASS. The `Dictionary["facts"]` type no longer has `statusAside`, and FactsTable no longer references it.

- [ ] **Step 3: Run the status CTA test — expect PASS**

Run: `npx playwright test tests/e2e/routes.spec.ts --grep "facts status"`
Expected: PASS on all three routes.

- [ ] **Step 4: Commit**

```bash
git add src/components/FactsTable.astro
git commit -m "feat(facts): convert status row into mailto CTA, drop aside"
```

---

### Task 7: Reorder sections in index.astro

**Files:**

- Modify: `src/pages/index.astro`

- [ ] **Step 1: Swap `<Work>` and `<HowIWork>` order**

In `src/pages/index.astro`, change the `<Base>` body from:

```astro
<Base lang={lang} meta={t.meta}>
  <Hero hero={t.hero} />
  <FactsTable facts={t.facts} email={t.footer.email} />
  <Work work={t.work} />
  <HowIWork howIWork={t.howIWork} />
  <Contact contact={t.contact} email={t.footer.email} />
  <Footer footer={t.footer} />
</Base>
```

to:

```astro
<Base lang={lang} meta={t.meta}>
  <Hero hero={t.hero} />
  <FactsTable facts={t.facts} email={t.footer.email} />
  <HowIWork howIWork={t.howIWork} />
  <Work work={t.work} />
  <Contact contact={t.contact} email={t.footer.email} />
  <Footer footer={t.footer} />
</Base>
```

- [ ] **Step 2: Run the section-order test — expect PASS**

Run: `npx playwright test tests/e2e/routes.spec.ts --grep "How I work renders"`
Expected: PASS on all three routes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: move How I Work above Selected Work in scroll order"
```

---

### Task 8: Write failing e2e tests for the tech-stack collapse

**Files:**

- Create: `tests/e2e/work-section.spec.ts`

- [ ] **Step 1: Create work-section.spec.ts**

Create `tests/e2e/work-section.spec.ts` with:

```ts
import { test, expect } from "@playwright/test";

// First project's tech stack — chosen as a sentinel string that is *unique to the meta block*
// and won't appear in the description. "BullMQ" only appears in project 01's stack line.
const STACK_SENTINEL = "BullMQ";

const ROUTES = [
  { path: "/", showLabel: /Show tech stacks/i, hideLabel: /Hide tech stacks/i },
  { path: "/ru/", showLabel: /Показать стек/i, hideLabel: /Скрыть стек/i },
  { path: "/uk/", showLabel: /Показати стек/i, hideLabel: /Сховати стек/i },
];

for (const { path, showLabel, hideLabel } of ROUTES) {
  test.describe(`${path} — work section collapse`, () => {
    test("tech stack content is present in DOM but hidden initially", async ({ page }) => {
      await page.goto(path);
      const sentinel = page.locator("#work").getByText(STACK_SENTINEL).first();
      // Present in DOM — survives Ctrl-F and SEO crawlers.
      await expect(sentinel).toHaveCount(1);
      // But not visible — the wrapping <details> is closed.
      await expect(sentinel).toBeHidden();
    });

    test("toggle summary shows the localized closed label", async ({ page }) => {
      await page.goto(path);
      const summary = page.locator("#work details > summary");
      await expect(summary).toBeVisible();
      await expect(summary).toHaveText(showLabel);
    });

    test("clicking summary reveals tech stacks and swaps label", async ({ page }) => {
      await page.goto(path);
      const sentinel = page.locator("#work").getByText(STACK_SENTINEL).first();
      const summary = page.locator("#work details > summary");

      await summary.click();

      await expect(sentinel).toBeVisible();
      await expect(summary).toHaveText(hideLabel);

      // Click again to collapse.
      await summary.click();
      await expect(sentinel).toBeHidden();
      await expect(summary).toHaveText(showLabel);
    });
  });
}
```

Notes:

- The sentinel "BullMQ" is in project 01's `meta` line in `en.json` and is the same Latin string in ru/uk JSONs (locales translate copy, not stack tokens).
- `getByText(...).first()` because the same string may legitimately appear once; `.first()` is defensive.

- [ ] **Step 2: Run the new tests — expect failure**

Run: `npx playwright test tests/e2e/work-section.spec.ts`
Expected: FAIL. There's no `<details>` in `#work` yet.

- [ ] **Step 3: Do not commit yet**

Continue to Task 9.

---

### Task 9: Implement the tech-stack collapse in Work.astro + CSS

**Files:**

- Modify: `src/components/Work.astro`
- Modify: `src/styles/global.css`

The behavior: one `<details>` wraps the project list. Each project still renders its `meta` block, but the block is given a class (`stack-meta`) that is `display: none` by default and `display: block` when the wrapping `<details>` is open. The `<summary>` text swaps via two spans, one of which is hidden when open.

- [ ] **Step 1: Update global.css**

Append to `src/styles/global.css`:

```css
/* Work section: tech-stack collapse */
.stack-meta {
  display: none;
}

details[open] .stack-meta {
  display: block;
}

.stack-summary {
  list-style: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-muted);
  user-select: none;
  padding: 4px 0;
}

.stack-summary::-webkit-details-marker {
  display: none;
}

.stack-summary:hover {
  color: var(--color-ink-soft);
}

.stack-summary .chevron {
  display: inline-block;
  transition: transform 0.15s ease;
}

details[open] .stack-summary .chevron {
  transform: rotate(180deg);
}

.stack-summary [data-when="closed"] {
  display: inline;
}

.stack-summary [data-when="open"] {
  display: none;
}

details[open] .stack-summary [data-when="closed"] {
  display: none;
}

details[open] .stack-summary [data-when="open"] {
  display: inline;
}
```

These rules are scoped enough not to leak — `.stack-meta` and `.stack-summary` are new class names used only in Work.astro.

- [ ] **Step 2: Replace Work.astro contents**

Replace `src/components/Work.astro` with:

```astro
---
import type { Dictionary } from "../i18n";

interface Props {
  work: Dictionary["work"];
}

const { work } = Astro.props;
---

<section id="work" class="section-divider px-6 pt-9 pb-2 sm:px-11">
  <div class="label">{work.section}</div>
  <h2 class="serif mt-2 text-[22px]">{work.heading}</h2>
</section>

<div class="px-6 pb-2 sm:px-11">
  <details>
    <summary class="stack-summary">
      <span data-when="closed">{work.stacksToggleClosed}</span>
      <span data-when="open">{work.stacksToggleOpen}</span>
      <span class="chevron" aria-hidden="true">▾</span>
    </summary>
    {
      work.projects.map((p, i) => (
        <div
          class={`grid grid-cols-[90px_1fr] gap-4 py-5 ${
            i < work.projects.length - 1 ? "border-paper-line border-b" : ""
          }`}
        >
          <div class="mono text-muted pt-1 text-[10px] tracking-[0.15em]">{p.num}</div>
          <div>
            <div>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="serif text-ink hover:text-ink-soft text-[19px] transition-colors"
                >
                  {p.title}
                  <span
                    aria-hidden="true"
                    class="text-muted ml-0.5 inline-block align-[2px] font-sans text-[11px] leading-none"
                  >
                    ↗
                  </span>
                  <span class="sr-only">(opens in a new tab)</span>
                  {p.linkLabel && (
                    <span class="mono text-muted inline-flex items-center gap-1 align-[1px] text-[10.5px] leading-none">
                      {p.linkLabel}
                    </span>
                  )}
                </a>
              ) : (
                <span class="serif text-[19px]">{p.title}</span>
              )}
              <span class="label ml-2">{p.tag}</span>
            </div>
            <p class="text-ink-body mt-1.5 text-[13.5px] leading-[1.55]">{p.desc}</p>
            {p.metric && <div class="mono text-ink-soft mt-2 text-[11px]">{p.metric}</div>}
            <div class="stack-meta mono text-muted mt-2 space-y-0.5 text-[10.5px] leading-[1.55]">
              {p.meta.map((m) => (
                <div>{m}</div>
              ))}
            </div>
          </div>
        </div>
      ))
    }
  </details>
</div>
```

Changes vs. current:

- Project list wrapped in `<details>` with a styled `<summary>`.
- Each project's `meta` `<div>` gained the `stack-meta` class (CSS hides it unless `details[open]`).
- Row padding `py-6` → `py-5`.
- The summary has two child spans (`data-when="closed"` and `data-when="open"`) plus a chevron; CSS swaps which is visible.

- [ ] **Step 3: Run the collapse tests — expect PASS**

Run: `npx playwright test tests/e2e/work-section.spec.ts`
Expected: PASS on all three routes, both desktop Chromium and Pixel 7 projects.

- [ ] **Step 4: Run full e2e — expect PASS**

Run: `npm run test:e2e`
Expected: PASS. This includes `routes.spec.ts`, `theme-and-lang.spec.ts`, and `accessibility.spec.ts`. The accessibility suite runs axe on every route — `<details>`/`<summary>` is native and should pass clean.

If `accessibility.spec.ts` fails on contrast for the new summary text, the muted colors in `global.css` are tuned for WCAG AA; reusing `var(--color-muted)` for the summary preserves that. If a violation surfaces anyway, investigate the actual axe rule output — do not silence the test.

- [ ] **Step 5: Commit**

```bash
git add src/components/Work.astro src/styles/global.css
git commit -m "feat(work): collapse per-project tech stacks behind a single details toggle"
```

---

### Task 10: Run the full quality gate

**Files:** none modified.

- [ ] **Step 1: Run lint + format + typecheck + unit + e2e + lhci**

Run: `npm run test:all`
Expected: PASS end-to-end. This runs, in order: ESLint, Prettier check, `astro check`, Vitest, Playwright, and Lighthouse CI.

- Lighthouse asserts perf ≥ 0.95, a11y = 1.0, best-practices ≥ 0.95, SEO = 1.0 across `/`, `/ru/`, `/uk/`. The change reduces visible DOM and adds no JS, so perf should be neutral-to-positive. If a budget regresses, per CLAUDE.md: investigate the page, not the threshold.

- [ ] **Step 2: Manual smoke test (mobile viewport)**

In Chrome DevTools at iPhone-class viewport (375 × 667), load the built `dist/` via `npm run preview` and:

1. Confirm the Hero shows `→ contact@bohdanmoroz.com` and tapping it opens the mail client.
2. Confirm the Status row in the Facts table reads `Open to freelance work →` and is itself a tap target.
3. Scroll: section order is Hero → Facts → How I Work → Work → Contact → Footer.
4. In Work, "Show tech stacks ▾" is visible. Tap it — stacks reveal under each project; label swaps to "Hide tech stacks ▴". Tap again — collapses.
5. Use the browser's find-in-page (or DevTools Search) to look for "BullMQ" while collapsed — it's found in the DOM. (Chrome will auto-expand `<details>`; Safari will not but will still indicate a match.)

- [ ] **Step 3: No commit needed**

Task 10 verifies; nothing changed on disk. If everything is green, the branch is ready for the user.

---

## Self-Review

**Spec coverage** — every spec section maps to a task:

- §1 Section reorder → Task 7.
- §2 Tech-stack collapse → Tasks 8 (test) + 9 (impl).
- §3 Hero CTA → Tasks 4 (test) + 5 (impl).
- §4 Status CTA → Tasks 4 (test) + 6 (impl).
- §5 Density tweak (`py-6` → `py-5`) → Task 9 (folded into Work.astro replacement).
- i18n changes → Tasks 1 + 2.
- `id="how-i-work"` requirement → Task 3.
- Tests (`routes.spec.ts`, new `work-section.spec.ts`, dictionary parity, a11y, lhci) → Tasks 1, 4, 8, 10.

**Type consistency:** class names (`stack-meta`, `stack-summary`, `chevron`), i18n keys (`hero.contactCta`, `work.stacksToggleClosed`, `work.stacksToggleOpen`, `facts.statusValue`), and the `valueHref` row prop are used identically in every task that references them.

**Placeholders:** none. Every code block is the full content the engineer needs to paste.
