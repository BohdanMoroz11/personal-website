import { test, expect } from "@playwright/test";

// "BullMQ" appears only in project 01's tech-stack line and is the same Latin
// string in every locale (stack tokens aren't translated).
const STACK_SENTINEL = "BullMQ";

const ROUTES = [
  { path: "/", showLabel: /Show tech stacks/i, hideLabel: /Hide tech stacks/i },
  { path: "/ru/", showLabel: /Показать стек/i, hideLabel: /Скрыть стек/i },
  { path: "/uk/", showLabel: /Показати стек/i, hideLabel: /Сховати стек/i },
];

for (const { path, showLabel, hideLabel } of ROUTES) {
  test.describe(`${path} — work section collapse`, () => {
    test("project list is visible; tech stack content is in DOM but collapsed initially", async ({
      page,
    }) => {
      await page.goto(path);
      const section = page.locator("#work");
      // Section state attribute is the source of truth for the collapse.
      await expect(section).toHaveAttribute("data-stacks-open", "false");
      // Project list itself is rendered (project numbers visible).
      await expect(section.getByText("01", { exact: true })).toBeVisible();
      // Stack sentinel is in the DOM (so Ctrl-F and SEO crawlers find it).
      await expect(section.getByText(STACK_SENTINEL).first()).toHaveCount(1);
      // Each project has its own toggle button, all closed.
      const toggles = section.locator("button.stack-toggle");
      await expect(toggles).toHaveCount(5);
      for (let i = 0; i < 5; i++) {
        await expect(toggles.nth(i)).toHaveAttribute("aria-expanded", "false");
      }
    });

    test("toggle buttons show the localized closed label initially", async ({ page }) => {
      await page.goto(path);
      const firstToggle = page.locator("#work button.stack-toggle").first();
      await expect(firstToggle).toBeVisible();
      await expect(firstToggle).toContainText(showLabel);
    });

    test("clicking any toggle expands all stacks and swaps every label", async ({ page }) => {
      await page.goto(path);
      const section = page.locator("#work");
      const toggles = section.locator("button.stack-toggle");

      // Click the second project's toggle.
      await toggles.nth(1).click();

      await expect(section).toHaveAttribute("data-stacks-open", "true");
      for (let i = 0; i < 5; i++) {
        await expect(toggles.nth(i)).toHaveAttribute("aria-expanded", "true");
        await expect(toggles.nth(i)).toContainText(hideLabel);
      }

      // Click another (the third) — collapses everything back.
      await toggles.nth(2).click();
      await expect(section).toHaveAttribute("data-stacks-open", "false");
      for (let i = 0; i < 5; i++) {
        await expect(toggles.nth(i)).toHaveAttribute("aria-expanded", "false");
        await expect(toggles.nth(i)).toContainText(showLabel);
      }
    });
  });
}
