// Renders scripts/og/og-template.html to public/og-image.png at 1200x630.
// Run with: node scripts/og/render-og.mjs
import { chromium } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(__dirname, "og-template.html");
const outPath = resolve(__dirname, "../../public/og-image.png");

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(pathToFileURL(templatePath).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(150);

await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: 1200, height: 630 },
  omitBackground: false,
});

await browser.close();
console.log(`wrote ${outPath}`);
