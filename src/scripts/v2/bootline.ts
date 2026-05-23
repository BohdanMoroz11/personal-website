const TYPE_MS = 26;

function renderStatus(prefix: string, status: string, statusClass: string): string {
  return `${prefix}<span class="${statusClass}">${status}</span>`;
}

/** Typewriter boot line with blinking cursor. */
export function initBootline(
  el: HTMLElement,
  prefix: string,
  status: string,
  reducedMotion: boolean,
  statusClass = "text-ok",
): void {
  const full = prefix + status;

  if (reducedMotion) {
    el.innerHTML = renderStatus(prefix, status, statusClass);
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
      el.innerHTML = renderStatus(prefix, status, statusClass);
      cursor.classList.add("animate-cursor-blink");
      el.appendChild(cursor);
    }
  };

  step();
}
