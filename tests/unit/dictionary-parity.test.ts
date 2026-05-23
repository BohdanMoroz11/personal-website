import { describe, expect, it } from "vitest";
import en from "../../src/i18n/locales/en.json";
import ru from "../../src/i18n/locales/ru.json";
import uk from "../../src/i18n/locales/uk.json";
import { languages, type Lang } from "../../src/i18n";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

// Recursively walk an object/array and return a shape descriptor.
// Strings are normalized to a leaf marker; arrays compare length and per-index shape.
function shape(value: Json): Json {
  if (Array.isArray(value)) {
    return value.map(shape);
  }
  if (value && typeof value === "object") {
    const out: { [k: string]: Json } = {};
    for (const k of Object.keys(value).sort()) {
      out[k] = shape((value as { [k: string]: Json })[k]);
    }
    return out;
  }
  // Leaf: collapse all primitives into a single type marker.
  return typeof value;
}

const dictionaries: Record<Lang, Json> = {
  en: en as unknown as Json,
  ru: ru as unknown as Json,
  uk: uk as unknown as Json,
};

describe("dictionary parity", () => {
  it("declares a dictionary file for every language in the languages map", () => {
    for (const lang of Object.keys(languages) as Lang[]) {
      expect(dictionaries[lang], `missing dictionary for ${lang}`).toBeDefined();
    }
  });

  const enShape = shape(en as unknown as Json);

  it.each((Object.keys(languages) as Lang[]).filter((l) => l !== "en"))(
    "%s has the same key shape as en",
    (lang) => {
      expect(shape(dictionaries[lang])).toEqual(enShape);
    },
  );

  // Walk en and collect the path of every non-empty string leaf.
  // Empty strings in en (e.g. optional `linkLabel`, `url`, `metric`) are
  // legitimately optional and skipped. Other locales must populate everything en populates.
  function requiredPaths(value: Json, path: (string | number)[] = []): (string | number)[][] {
    if (typeof value === "string") {
      return value.trim() === "" ? [] : [path];
    }
    if (Array.isArray(value)) {
      return value.flatMap((v, i) => requiredPaths(v, [...path, i]));
    }
    if (value && typeof value === "object") {
      return Object.entries(value).flatMap(([k, v]) => requiredPaths(v, [...path, k]));
    }
    return [];
  }

  function getAt(value: Json, path: (string | number)[]): Json {
    return path.reduce<Json>((acc, key) => (acc as Record<string | number, Json>)[key], value);
  }

  const required = requiredPaths(en as unknown as Json);

  it.each((Object.keys(languages) as Lang[]).filter((l) => l !== "en"))(
    "%s populates every string en populates",
    (lang) => {
      const empties: string[] = [];
      for (const path of required) {
        const v = getAt(dictionaries[lang], path);
        if (typeof v !== "string" || v.trim() === "") {
          empties.push(path.join("."));
        }
      }
      expect(empties, `empty/missing required strings in ${lang}`).toEqual([]);
    },
  );
});
