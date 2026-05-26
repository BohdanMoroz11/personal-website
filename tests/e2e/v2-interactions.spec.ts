import { test, expect } from "@playwright/test";

test.describe("V2 client interactions", () => {
  test("live clock updates in the topbar", async ({ page }) => {
    await page.goto("/");
    const clock = page.locator("#clock");
    await expect(clock).toBeVisible();
    await expect(clock).toContainText(/UTC[+-]\d/);

    const first = await clock.textContent();
    await page.waitForTimeout(1100);
    const second = await clock.textContent();
    expect(second).toMatch(/^\d{2}:\d{2}:\d{2} UTC[+-]\d+(:\d{2})?$/);
    expect(second).not.toBe(first);
  });

  test("bootline finishes typing and marks availability", async ({ page }) => {
    await page.goto("/");
    const boot = page.locator("#bootline");
    await expect(boot).toContainText("available for work", { timeout: 5000 });
    await expect(boot.locator(".text-ok")).toHaveText("available for work");
  });

  test("signal-lock sections sharpen on scroll into view", async ({ page }) => {
    await page.goto("/");
    await page.locator("#protocol").scrollIntoViewIfNeeded();
    await expect(page.locator("#protocol .signal-lock").first()).toHaveClass(/on/);
  });

  test("section headings resolve decrypt animation", async ({ page }) => {
    await page.goto("/");
    await page.locator("#contact").scrollIntoViewIfNeeded();
    const heading = page.locator("#contact h2[data-decrypt]");
    await expect(heading).toHaveAttribute("data-done", "1", { timeout: 5000 });
    await expect(heading).toHaveText("Open Channel");
  });

  test("dossier accordion opens one case at a time", async ({ page }) => {
    await page.goto("/");
    const cases = page.locator("#dossier .case");
    await expect(cases.first()).toHaveClass(/open/);

    await cases.nth(1).locator(".case-bar").click();
    await expect(cases.first()).not.toHaveClass(/open/);
    await expect(cases.nth(1)).toHaveClass(/open/);
  });

  test("respects prefers-reduced-motion for bootline", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const boot = page.locator("#bootline");
    await expect(boot.locator(".text-ok")).toHaveText("available for work");
    await expect(boot.locator(".animate-cursor-blink")).toHaveCount(0);
  });
});

/* Covered by not-found.spec.ts — avoid duplicating bootline assertion here */
