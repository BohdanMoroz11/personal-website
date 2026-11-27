import { test, expect } from "@playwright/test";

const STACK_SENTINEL = "BullMQ";

const ROUTES = ["/", "/ru/", "/uk/"];

for (const path of ROUTES) {
  test.describe(`${path} — dossier accordion`, () => {
    test("case list is visible; first case open; stack in DOM", async ({ page }) => {
      await page.goto(path);
      const section = page.locator("#dossier");
      await expect(section).toBeVisible();
      await expect(section.getByText("01", { exact: true })).toBeVisible();

      const first = section.locator(".case").first();
      await expect(first).toHaveClass(/open/);
      await expect(first.locator(".case-bar")).toHaveAttribute("aria-expanded", "true");
      await expect(section.getByText(STACK_SENTINEL).first()).toHaveCount(1);

      // Exactly one case starts open; every other case starts closed.
      await expect(section.locator(".case.open")).toHaveCount(1);
      const total = await section.locator(".case").count();
      expect(total).toBeGreaterThan(1);
      await expect(section.locator(".case:not(.open)")).toHaveCount(total - 1);
    });

    test("clicking a closed case opens it and closes the previous one", async ({ page }) => {
      await page.goto(path);
      const section = page.locator("#dossier");
      const cases = section.locator(".case");

      await cases.nth(1).locator(".case-bar").click();

      await expect(cases.nth(0)).not.toHaveClass(/open/);
      await expect(cases.nth(0).locator(".case-bar")).toHaveAttribute("aria-expanded", "false");
      await expect(cases.nth(1)).toHaveClass(/open/);
      await expect(cases.nth(1).locator(".case-bar")).toHaveAttribute("aria-expanded", "true");
    });
  });
}
