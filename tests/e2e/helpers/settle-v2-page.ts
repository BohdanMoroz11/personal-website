import type { Page } from "@playwright/test";

/** Put V2 motion/lock states into their settled, fully-visible form before a11y audits. */
export async function settleV2Page(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll(".signal-lock, .signal-edge").forEach((el) => {
      el.classList.add("on");
    });

    document.querySelectorAll<HTMLElement>(".case.open").forEach((card) => {
      card.classList.remove("open");
      card.querySelector(".case-bar")?.setAttribute("aria-expanded", "false");
      const detail = card.querySelector<HTMLElement>(".case-detail");
      if (detail) {
        detail.style.maxHeight = "";
        detail.toggleAttribute("hidden", true);
      }
    });

    document.querySelectorAll<HTMLElement>("[data-decrypt]").forEach((el) => {
      const finalText = el.dataset.decrypt ?? el.textContent ?? "";
      el.textContent = finalText;
      el.dataset.done = "1";
    });
  });
}
