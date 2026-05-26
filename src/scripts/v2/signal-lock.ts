import { decryptHeading } from "./decrypt";

/** Sharpen `.signal-lock` blocks and trigger heading decrypt on scroll. */
export function initSignalLock(reducedMotion: boolean): void {
  const lockMargin = window.matchMedia("(max-width: 620px)").matches
    ? "0px 0px 4% 0px"
    : "0px 0px -18% 0px";

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("on");
        const head = entry.target.querySelector<HTMLElement>("[data-decrypt]");
        if (head) decryptHeading(head, reducedMotion);
        io.unobserve(entry.target);
      });
    },
    { rootMargin: lockMargin, threshold: 0.1 },
  );

  document.querySelectorAll(".signal-lock, .signal-edge").forEach((el) => io.observe(el));
}
