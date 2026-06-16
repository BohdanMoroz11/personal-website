import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settleV2Page } from "./helpers/settle-v2-page";

const ROUTES = ["/", "/ru/", "/uk/", "/this-route-does-not-exist"];

for (const path of ROUTES) {
  test(`${path} has no detectable WCAG 2.1 a11y violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "load" });
    await settleV2Page(page);
    await settleV2Page(page);

    expect(await page.locator(".signal-lock:not(.on)").count()).toBe(0);
    if (path !== "/this-route-does-not-exist") {
      expect(await page.locator(".case.open").count()).toBe(0);
    }

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    if (results.violations.length) {
      // Surface human-readable detail in CI logs before the assertion fails.
      console.error(
        `axe violations on ${path}:`,
        JSON.stringify(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.map((n) => n.target),
          })),
          null,
          2,
        ),
      );
    }

    expect(results.violations).toEqual([]);
  });
}

test("/cv has no detectable WCAG 2.1 a11y violations", async ({ page }) => {
  await page.goto("/cv", { waitUntil: "load" });
  // The CV uses its own light "print edition" palette — tuned for AA but
  // never run through the dark-site axe pass, so it gets its own check.
  await page.evaluate(() => document.fonts.ready);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  if (results.violations.length) {
    console.error(
      "axe violations on /cv:",
      JSON.stringify(
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.map((n) => n.target),
        })),
        null,
        2,
      ),
    );
  }

  expect(results.violations).toEqual([]);
});

/* V1 dark-mode axe pass via theme toggle — restore when light theme returns
test("axe passes in dark mode too", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /theme/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).not.toHaveClass(/theme-transition/);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  if (results.violations.length) {
    console.error("dark-mode axe violations:", JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations).toEqual([]);
});
*/
