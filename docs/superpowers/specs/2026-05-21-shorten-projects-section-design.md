# Shorten the projects section and surface contact earlier

**Status:** design
**Date:** 2026-05-21
**Files in scope:** `src/pages/index.astro`, `src/components/Work.astro`, `src/components/Hero.astro`, `src/components/FactsTable.astro`, `src/i18n/locales/{en,ru,uk}.json`, `tests/`

## Problem

The Selected Work section is the tallest block on the page, especially on mobile. A prospective client has to scroll past five projects' worth of long tech-stack lines before reaching the value pitch ("How I work") and the contact section. Tech-stack lines must remain in the DOM so Ctrl-F still finds keywords, but they don't need to be visible by default.

## Goals

1. Cut perceived scroll on mobile by ~half between Hero and the next obvious action.
2. Keep all tech-stack content in the DOM (Ctrl-F + SEO unaffected).
3. Give visitors a clearly clickable contact path within the first viewport.

## Non-goals

- Removing any projects or rewriting copy beyond what the redesign requires.
- Changing the editorial / paper-letter aesthetic.
- Adding client-side framework dependencies. Plain Astro + native HTML only.

## Design

### 1. Section reorder

`src/pages/index.astro`: swap the order of `<Work>` and `<HowIWork>`.

New order: `Hero → FactsTable → HowIWork → Work → Contact → Footer`.

No component changes — only the order of the JSX children in `index.astro`.

### 2. Collapse tech stacks behind a single global toggle

Project titles, tags, descriptions, and metrics stay visible at all times. Only the `meta` block (tech stack lines + year line) is hidden behind a single global toggle. One `<details>` wraps the project list in `Work.astro`; the `<summary>` reads e.g. `Show tech stacks ▾` / `Hide tech stacks ▴`. When open, every project's meta block becomes visible; when closed, none do.

Implementation note: a single `<details>` element is wrapped around the project list. Each project row contains its `meta` block, but the block is rendered inside a `<div class="hidden details-open:block">` (Tailwind v4 supports `details[open]` via a custom variant, or we use `group/details` + `group-open:block`). If the variant gymnastics get hairy, the equivalent: one `<details>` with the `<summary>` first, then the project list, then a sibling block of "expanded extras" — but that breaks per-project alignment. So we stick with the group-open approach.

Concretely, the structure in `Work.astro` becomes:

```astro
<details class="group/stacks">
  <summary class="...">{work.stacksToggleClosed}</summary>
  {/* project list — unchanged except for the meta wrapper below */}
  ...
  <div class="mono hidden group-open/stacks:block ...">
    {p.meta.map((m) => <div>{m}</div>)}
  </div>
  ...
</details>
```

The `<summary>` is styled to match existing labels (`mono` + muted, with a small chevron). When `<details>` is open, the chevron rotates and the label text swaps via two spans (one visible when closed, one when open).

Accessibility: native `<details>`/`<summary>` is accessible by default. No ARIA needed. Keyboard works. Screen readers announce the expanded/collapsed state.

### 3. Hero contact CTA

In `Hero.astro`, add a small line below the role paragraph:

```
→ contact@bohdanmoroz.com
```

Rendered as a `mailto:` link, using `mono` + `subtle` classes. Sits between the role line and whatever follows.

New i18n key: `hero.contactCta` with the value `"→ contact@bohdanmoroz.com"`. The email itself stays the source of truth in `footer.email`; this string is purely the display label. (Choosing a separate key rather than reusing `footer.email` because the arrow prefix is a presentation choice that may be localized.)

### 4. FactsTable Status row CTA

In `FactsTable.astro`:

- Wrap the **value** of the Status row in a `mailto:` `<a>` element (currently only the aside is linkable).
- Append a trailing arrow: `"Open to freelance work →"`.
- Drop the `statusAside`. The row no longer needs the right-column "& open to offers" since the value itself is now the obvious CTA.

Implementation: extend the row type with an optional `valueHref`. The Status row sets `valueHref: mailto:${email}`. When present, the value (and the live-dot) are wrapped in the anchor.

i18n changes:

- `facts.statusValue`: `"Open to freelance work →"`
- Remove `facts.statusAside` from all locale files and the `Dictionary` type.

### 5. Minor density tweak

In `Work.astro`, reduce row vertical padding from `py-6` to `py-5`. Keep all other spacing.

## i18n changes (en.json, ru.json, uk.json)

Add:

- `hero.contactCta`: `"→ contact@bohdanmoroz.com"` (same in every locale — it's an email)
- `work.stacksToggleClosed`: e.g. `"Show tech stacks"` / RU / UK equivalents
- `work.stacksToggleOpen`: e.g. `"Hide tech stacks"` / RU / UK equivalents

Modify:

- `facts.statusValue`: append `" →"` in every locale

Remove:

- `facts.statusAside` from every locale + the `Dictionary` type

The dictionary-parity test enforces matching keys across locales, so the ru/uk files must be updated in the same commit.

## Testing

### Unit (`tests/unit/`)

- **Dictionary parity** — already covers shape. Will fail until ru/uk JSONs gain the new keys and lose `statusAside`. No new test needed; existing test enforces it.

### E2E (`tests/e2e/`)

Extend existing specs rather than creating new files:

- **`routes.spec.ts`** — already checks per-locale rendering and meta. Add assertions:
  - Hero contains a visible `mailto:` link whose text starts with `→`.
  - FactsTable Status row contains a `mailto:` link wrapping the value text.
  - Section order in DOM: the Work section (`#work`) appears _after_ the How-I-work section. (`HowIWork.astro` has no `id` today; add `id="how-i-work"` to its root `<section>` as part of this change so the test can target it.)

- **`theme-and-lang.spec.ts`** — no changes expected.

- **New file: `tests/e2e/work-section.spec.ts`** — focused tests for the new collapse behavior:
  - On initial load, the `<details>` is closed and the first project's tech-stack text is _not visible_ (Playwright `toBeHidden()`).
  - The tech-stack text _is present in the DOM_ (Playwright `toHaveCount(>=1)` on a locator that doesn't require visibility) — protects the Ctrl-F requirement.
  - Clicking the `<summary>` opens the `<details>` and the tech-stack text becomes visible.
  - Toggle label swaps from "Show tech stacks" to "Hide tech stacks" (and the localized variants on `/ru/` and `/uk/`).
  - Runs on both the desktop Chromium and Pixel 7 projects already configured in `playwright.config.ts`.

- **`accessibility.spec.ts`** — already runs axe on every route. Native `<details>` is accessible; the test should pass without modification. Run it explicitly after the change.

### Lighthouse

- `.lighthouserc.json` budgets are unchanged. The change reduces DOM render work (less initially painted text) and adds no JS, so perf should be neutral-to-positive. If anything regresses, investigate the page per CLAUDE.md guidance — do not raise the threshold.

### Manual smoke test

- Build + preview, then on mobile viewport: confirm scroll from top of page to a visible Contact CTA is meaningfully shorter than before. Confirm Ctrl-F for a token like "BullMQ" still highlights the match (browser may auto-expand `<details>` on find — that's fine and is the desired behavior).

## Risks & open questions

- **Tailwind v4 `group-open` variant**: needs verification that the syntax used works in v4 as-shipped. If not, fall back to a `<details>[open]` selector in `global.css` (`details[open] .stack-meta { display: block }`). The user-facing behavior is identical either way.
- **Browser Ctrl-F into closed `<details>`**: Chrome and Firefox auto-expand `<details>` when find-in-page matches inside. Safari does not (as of last check). The content is still in the DOM in both cases — searchable by view-source, by SEO crawlers, and by Chrome/FF find. Safari users who Ctrl-F won't see the highlight unless they expand. Acceptable trade-off given the goal.
- **JS-disabled visitors**: `<details>` works without JS. No issue.

## Out of scope

- Per-project toggles (rejected in favor of one global toggle).
- Hiding tech stacks on mobile only (rejected — would split Ctrl-F behavior between desktop/mobile).
- Reordering Contact above Work (rejected in favor of conventional order with stronger early CTAs).
