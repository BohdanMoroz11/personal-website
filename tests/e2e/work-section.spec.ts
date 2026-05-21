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
