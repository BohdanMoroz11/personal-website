const GLYPHS_LATIN = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%&/<>=";
const GLYPHS_CYRILLIC = "АБВГДЕЖЗИКЛМНПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789#%&/<>=";
const FRAME_MS = 28;
const TOTAL_FRAMES = 18;

const CYRILLIC_RE = /[Ѐ-ӿ]/;

function pickGlyphs(text: string): string {
  return CYRILLIC_RE.test(text) ? GLYPHS_CYRILLIC : GLYPHS_LATIN;
}

/** Scramble-resolve heading text on first reveal. */
export function decryptHeading(el: HTMLElement, reducedMotion: boolean): void {
  const final = el.dataset.decrypt ?? el.textContent ?? "";
  if (!final || el.dataset.done === "1") return;

  if (reducedMotion) {
    el.textContent = final;
    el.dataset.done = "1";
    return;
  }

  const glyphs = pickGlyphs(final);
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
        frame >= lockAt ? final[c] : (glyphs[Math.floor(Math.random() * glyphs.length)] ?? "?");
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
