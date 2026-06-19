import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      "test-results/",
      "playwright-report/",
      ".lighthouseci/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // Node-run build scripts (e.g. CV PDF renderer). `document` appears inside
    // Playwright `page.evaluate` callbacks that execute in the browser context.
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        document: "readonly",
      },
    },
  },
];
