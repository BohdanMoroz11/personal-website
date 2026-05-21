import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/", lang: "en", heroName: "Bohdan Moroz." },
  { path: "/ru/", lang: "ru", heroName: "Богдан Мороз." },
  { path: "/uk/", lang: "uk", heroName: "Богдан Мороз." },
];

for (const { path, lang, heroName } of ROUTES) {
  test.describe(`${path} (${lang})`, () => {
    test("renders with the correct lang and content", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("h1")).toHaveText(heroName);
      await expect(page).toHaveTitle(/Bohdan Moroz|Богдан Мороз/);
    });

    test("has canonical, description, and og:image meta tags", async ({ page }) => {
      await page.goto(path);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute("href", `https://bohdanmoroz.com${path}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /og-image\.png$/,
      );
    });

    test("emits hreflang alternates for every locale + x-default", async ({ page }) => {
      await page.goto(path);
      const hreflangs = await page
        .locator("link[rel=alternate][hreflang]")
        .evaluateAll((els) => els.map((e) => (e as HTMLLinkElement).hreflang));
      expect(hreflangs.sort()).toEqual(["en", "ru", "uk", "x-default"]);
    });

    test("has exactly one h1 and a JSON-LD block", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      const ld = page.locator('script[type="application/ld+json"]');
      await expect(ld).toHaveCount(1);
      const raw = await ld.textContent();
      expect(() => JSON.parse(raw ?? "")).not.toThrow();
    });

    test("hero shows a visible mailto contact CTA", async ({ page }) => {
      await page.goto(path);
      const cta = page.locator("header").getByRole("link", { name: /contact@bohdanmoroz\.com/ });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute("href", "mailto:contact@bohdanmoroz.com");
    });

    test("facts status row exposes mailto CTAs on the value and the aside", async ({ page }) => {
      await page.goto(path);
      const row = page.locator(".row").filter({ hasText: /Open to freelance|Открыт|Відкритий/ });
      const mailtos = row.locator('a[href="mailto:contact@bohdanmoroz.com"]');
      // Status row exposes two mailto CTAs: the value and the aside.
      await expect(mailtos).toHaveCount(2);
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

    test("body contains no untranslated placeholders", async ({ page }) => {
      await page.goto(path);
      const body = (await page.locator("body").textContent()) ?? "";
      expect(body).not.toMatch(/\bundefined\b/);
      expect(body).not.toMatch(/\[object Object\]/);
      // Templating leak guard — no raw {t.something} or {{ something }} should survive build.
      expect(body).not.toMatch(/\{t\./);
      expect(body).not.toMatch(/\{\{\s*\w+/);
    });
  });
}

test("static assets are served", async ({ request }) => {
  for (const path of ["/favicon.svg", "/robots.txt", "/sitemap-index.xml", "/og-image.png"]) {
    const res = await request.get(path);
    expect(res.status(), `${path} should be 200`).toBe(200);
  }
});

test("unknown route shows the 404 page", async ({ page }) => {
  const res = await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
  // Astro static 404.html is served by `astro preview` with a 404 status.
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText(/doesn't exist|не существует|не існує/i);
  await expect(page.locator('a[href="/"]')).toBeVisible();
});
