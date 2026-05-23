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

  document.querySelectorAll<HTMLElement>(".case.open .case-detail").forEach((detail) => {
    detail.style.maxHeight = `${detail.scrollHeight}px`;
  });
}
