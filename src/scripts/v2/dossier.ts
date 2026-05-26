function setOpen(card: HTMLElement, open: boolean): void {
  const bar = card.querySelector<HTMLButtonElement>(".case-bar");
  const detail = card.querySelector<HTMLElement>(".case-detail");
  if (!bar || !detail) return;

  card.classList.toggle("open", open);
  bar.setAttribute("aria-expanded", String(open));
  detail.style.maxHeight = open ? `${detail.scrollHeight}px` : "";
}

/** Accordion — one open case at a time. */
export function initDossierAccordion(): void {
  document.querySelectorAll<HTMLButtonElement>(".case-bar").forEach((bar) => {
    bar.addEventListener("click", () => {
      const card = bar.closest<HTMLElement>(".case");
      if (!card) return;

      const isOpen = card.classList.contains("open");

      document.querySelectorAll<HTMLElement>(".case.open").forEach((c) => {
        if (c !== card) setOpen(c, false);
      });

      setOpen(card, !isOpen);
    });
  });

  // Initialise every card so its max-height matches reality and not the
  // SSR placeholder, then keep the open one in sync if its content reflows.
  document.querySelectorAll<HTMLElement>(".case").forEach((card) => {
    setOpen(card, card.classList.contains("open"));
  });

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const detail = (entry.target as HTMLElement).closest<HTMLElement>(".case-detail");
        const card = detail?.closest<HTMLElement>(".case");
        if (detail && card?.classList.contains("open")) {
          detail.style.maxHeight = `${detail.scrollHeight}px`;
        }
      }
    });
    document
      .querySelectorAll<HTMLElement>(".case-detail")
      .forEach((d) => ro.observe(d.firstElementChild ?? d));
  }
}
