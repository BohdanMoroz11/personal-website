import { test, expect } from "@playwright/test";

test("/this-route-does-not-exist returns 404 with V2 error page", async ({ page }) => {
  const res = await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText(/Signal Lost/i);
  await expect(page.locator(".not-found-code")).toHaveText("404");
  await expect(page.getByRole("link", { name: /Return to main channel/i })).toHaveAttribute(
    "href",
    "/",
  );
});

test("404 page includes language switcher and footer links", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.locator("a[data-lang=en]")).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i }).first()).toBeVisible();
});

test("404 bootline shows error status", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  const boot = page.locator("#nf-bootline");
  await expect(boot).toContainText("signal lost", { timeout: 5000 });
  await expect(boot.locator(".text-signal")).toHaveText("signal lost");
});
