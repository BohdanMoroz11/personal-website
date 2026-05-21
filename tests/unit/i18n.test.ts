import { describe, expect, it } from "vitest";
import { defaultLang, getLangFromUrl, languages, useTranslations, type Lang } from "../../src/i18n";

const SITE = "https://bohdanmoroz.com";

describe("getLangFromUrl", () => {
  it("returns the default lang for the root URL", () => {
    expect(getLangFromUrl(new URL(`${SITE}/`))).toBe(defaultLang);
  });

  it.each(Object.keys(languages).filter((l) => l !== defaultLang) as Lang[])(
    "returns %s when the URL is prefixed with the locale",
    (lang) => {
      expect(getLangFromUrl(new URL(`${SITE}/${lang}/`))).toBe(lang);
      expect(getLangFromUrl(new URL(`${SITE}/${lang}`))).toBe(lang);
    },
  );

  it("falls back to the default lang for unknown prefixes", () => {
    expect(getLangFromUrl(new URL(`${SITE}/xx/`))).toBe(defaultLang);
    expect(getLangFromUrl(new URL(`${SITE}/zzzz`))).toBe(defaultLang);
  });

  it("does not treat deep paths as a locale", () => {
    expect(getLangFromUrl(new URL(`${SITE}/blog/post`))).toBe(defaultLang);
  });
});

describe("useTranslations", () => {
  it("returns a dictionary for every declared language", () => {
    for (const lang of Object.keys(languages) as Lang[]) {
      const t = useTranslations(lang);
      expect(t).toBeDefined();
      expect(typeof t.meta.title).toBe("string");
      expect(typeof t.meta.description).toBe("string");
    }
  });

  it("returns the English dictionary for the default lang", () => {
    const t = useTranslations(defaultLang);
    expect(t.hero.name).toMatch(/Bohdan Moroz/);
  });
});
