const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%&/<>=";
const FRAME_MS = 28;
const TOTAL_FRAMES = 18;

/** Scramble-resolve heading text on first reveal. */
export function decryptHeading(el: HTMLElement, reducedMotion: boolean): void {
  const final = el.dataset.decrypt ?? el.textContent ?? "";
  if (!final || el.dataset.done === "1") return;

  if (reducedMotion) {
    el.textContent = final;
    el.dataset.done = "1";
    return;
  }

  let frame = 0;

  const render = () => {
    let out = "";
    for (let c = 0; c < final.length; c += 1) {
      if (final[c] === " ") {
        out += " ";
        continue;
      }
      const lockAt = Math.floor((c / final.length) * TOTAL_FRAMES) + 4;
      out +=
        frame >= lockAt ? final[c] : (GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "?");
    }
    el.textContent = out;
    frame += 1;
    if (frame <= TOTAL_FRAMES + 4) {
      window.setTimeout(render, FRAME_MS);
    } else {
      el.textContent = final;
      el.dataset.done = "1";
    }
  };

  render();
}
