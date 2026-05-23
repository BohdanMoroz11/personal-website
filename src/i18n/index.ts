import en from "./locales/en.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";

export const languages = {
  en: "English",
  ru: "Русский",
  uk: "Українська",
} as const;

export const defaultLang = "en" satisfies keyof typeof languages;

export type Lang = keyof typeof languages;
export type Dictionary = typeof en;

const dictionaries: Record<Lang, Dictionary> = { en, ru, uk };

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split("/");
  if (maybeLang && maybeLang in languages) return maybeLang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang): Dictionary {
  return dictionaries[lang];
}
