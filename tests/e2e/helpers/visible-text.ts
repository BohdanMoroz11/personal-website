import type { Page } from "@playwright/test";

/** Visible page text only — excludes inline scripts and styles. */
export async function visibleBodyText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
    return clone.textContent ?? "";
  });
}
