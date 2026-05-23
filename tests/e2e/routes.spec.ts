import { test, expect } from "@playwright/test";
import { contactEmail, mailtoContact } from "../../src/config";
import { visibleBodyText } from "./helpers/visible-text";

const LOCALES = [
  {
    path: "/",
    lang: "en",
    heroName: /Bohdan\s+Moroz/,
    title: /Bohdan Moroz/,
    jobTitleFragment: "Applied AI",
    protocolLabel: "Protocol",
  },
  {
    path: "/ru/",
    lang: "ru",
    heroName: /Богдан\s+Мороз/,
    title: /Богдан Мороз/,
    jobTitleFragment: "Прикладной ИИ",
    protocolLabel: "Протокол",
  },
  {
    path: "/uk/",
    lang: "uk",
    heroName: /Богдан\s+Мороз/,
    title: /Богдан Мороз/,
    jobTitleFragment: "Прикладний ШІ",
    protocolLabel: "Протокол",
  },
] as const;

for (const locale of LOCALES) {
  test.describe(`${locale.path} (${locale.lang})`, () => {
    test("renders with the correct lang, hero, and title", async ({ page }) => {
      await page.goto(locale.path);
      await expect(page.locator("html")).toHaveAttribute("lang", locale.lang);
      await expect(page.locator("h1")).toHaveText(locale.heroName);
      await expect(page).toHaveTitle(locale.title);
    });

    test("has canonical, description, and og:image meta tags", async ({ page }) => {
      await page.goto(locale.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://bohdanmoroz.com${locale.path}`,
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /og-image\.png$/,
      );
    });

    test("emits hreflang alternates for every locale + x-default", async ({ page }) => {
      await page.goto(locale.path);
      const hreflangs = await page
        .locator("link[rel=alternate][hreflang]")
        .evaluateAll((els) => els.map((e) => (e as HTMLLinkElement).hreflang));
      expect(hreflangs.sort()).toEqual(["en", "ru", "uk", "x-default"]);
    });

    test("has exactly one h1 and valid JSON-LD", async ({ page }) => {
      await page.goto(locale.path);
      await expect(page.locator("h1")).toHaveCount(1);
      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      expect(() => JSON.parse(raw ?? "")).not.toThrow();
    });

    test("JSON-LD Person uses localized jobTitle", async ({ page }) => {
      await page.goto(locale.path);
      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      const data = JSON.parse(raw ?? "");
      const person = data["@graph"].find((n: { "@type"?: string }) => n["@type"] === "Person");
      expect(person?.jobTitle).toContain(locale.jobTitleFragment);
    });

    test("hero exposes a visible mailto CTA", async ({ page }) => {
      await page.goto(locale.path);
      const cta = page.locator("#top").getByRole("link", { name: new RegExp(contactEmail) });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute("href", mailtoContact);
    });

    test("topbar links to main sections", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === "mobile", "Section nav is hidden below 920px");
      await page.goto(locale.path);
      await expect(page.getByRole("navigation", { name: "Sections" })).toBeVisible();
      await expect(
        page.getByRole("link", { name: new RegExp(locale.protocolLabel) }),
      ).toHaveAttribute("href", "#protocol");
    });

    test("Protocol renders before Dossier", async ({ page }) => {
      await page.goto(locale.path);
      const order = await page.evaluate(() => {
        const a = document.querySelector("#protocol")!;
        const b = document.querySelector("#dossier")!;
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
      });
      expect(order).toBeTruthy();
    });

    test("visible content has no template leaks", async ({ page }) => {
      await page.goto(locale.path);
      const text = await visibleBodyText(page);
      expect(text).not.toMatch(/\bundefined\b/);
      expect(text).not.toMatch(/\[object Object\]/);
      expect(text).not.toMatch(/\{t\.[a-z]/);
      expect(text).not.toMatch(/\{\{\s*\w+/);
    });
  });
}

test("static assets are served", async ({ request }) => {
  for (const path of ["/favicon.svg", "/robots.txt", "/sitemap-index.xml", "/og-image.png"]) {
    const res = await request.get(path);
    expect(res.status(), `${path} should be 200`).toBe(200);
  }
});
