import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = ["/", "/ru/", "/uk/", "/this-route-does-not-exist"];

for (const path of ROUTES) {
  test(`${path} has no detectable WCAG 2.1 a11y violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
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

test("axe passes in dark mode too", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /theme/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // The toggle adds a `.theme-transition` class for 300ms; axe reads computed
  // colors and will see mid-transition values if we don't wait it out.
  await expect(page.locator("html")).not.toHaveClass(/theme-transition/);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  if (results.violations.length) {
    console.error("dark-mode axe violations:", JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations).toEqual([]);
});
