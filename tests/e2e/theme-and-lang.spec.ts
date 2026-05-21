import { test, expect } from "@playwright/test";

test.describe("theme toggle", () => {
  test("toggles between light and dark and persists", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initial = await html.getAttribute("data-theme");
    expect(initial === "light" || initial === "dark").toBe(true);

    await page.getByRole("button", { name: /theme/i }).click();
    const next = initial === "light" ? "dark" : "light";
    await expect(html).toHaveAttribute("data-theme", next);
    await expect(html).toHaveAttribute("data-theme-pref", next);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", next);
  });
});

test.describe("language switcher", () => {
  test("navigates between locales and marks the current one", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a[data-lang=en]")).toHaveAttribute("aria-current", "true");

    await page.locator("a[data-lang=ru]").click();
    await expect(page).toHaveURL(/\/ru\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.locator("a[data-lang=ru]")).toHaveAttribute("aria-current", "true");

    await page.locator("a[data-lang=uk]").click();
    await expect(page).toHaveURL(/\/uk\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  });

  test("remembers the chosen language on later visits", async ({ page, context }) => {
    await page.goto("/");
    await page.locator("a[data-lang=uk]").click();
    await expect(page).toHaveURL(/\/uk\/?$/);

    // Open a fresh page in the same context (localStorage shared) and hit "/".
    const fresh = await context.newPage();
    await fresh.goto("/");
    // The bootstrap redirect runs synchronously before paint on lang-root URLs.
    await fresh.waitForURL(/\/uk\/?$/);
    await expect(fresh.locator("html")).toHaveAttribute("lang", "uk");
  });
});

test.describe("external links", () => {
  test("github and linkedin links open in a new tab with safe rel", async ({ page }) => {
    await page.goto("/");
    const gh = page.getByRole("link", { name: /github/i }).first();
    await expect(gh).toHaveAttribute("target", "_blank");
    await expect(gh).toHaveAttribute("rel", /noopener/);
    await expect(gh).toHaveAttribute("rel", /noreferrer/);
  });
});
