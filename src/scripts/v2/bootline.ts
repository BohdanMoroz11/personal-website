const TYPE_MS = 26;

function renderAvailable(prefix: string, available: string): string {
  return `${prefix}<span class="text-ok">${available}</span>`;
}

/** Typewriter boot line with blinking cursor. */
export function initBootline(
  el: HTMLElement,
  prefix: string,
  available: string,
  reducedMotion: boolean,
): void {
  const full = prefix + available;

  if (reducedMotion) {
    el.innerHTML = renderAvailable(prefix, available);
    return;
  }

  const cursor = document.createElement("span");
  cursor.className = "inline-block h-[13px] w-[7px] -translate-y-px bg-signal align-[-2px]";

  let i = 0;
  const step = () => {
    if (i <= full.length) {
      el.textContent = full.slice(0, i);
      el.appendChild(cursor);
      i += 1;
      window.setTimeout(step, TYPE_MS);
    } else {
      el.innerHTML = renderAvailable(prefix, available);
      cursor.classList.add("animate-cursor-blink");
      el.appendChild(cursor);
    }
  };

  step();
}
