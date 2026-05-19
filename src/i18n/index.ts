import en from "./locales/en.json";

export const languages = {
  en: "English",
} as const;

export const defaultLang = "en" satisfies keyof typeof languages;

export type Lang = keyof typeof languages;

const dictionaries = { en } as const;

export type Dictionary = (typeof dictionaries)[Lang];

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split("/");
  if (maybeLang && maybeLang in languages) return maybeLang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang): Dictionary {
  return dictionaries[lang];
}
