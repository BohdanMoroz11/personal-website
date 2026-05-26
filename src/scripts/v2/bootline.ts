const TYPE_MS = 26;

/** Typewriter boot line with blinking cursor. */
export function initBootline(
  el: HTMLElement,
  prefix: string,
  status: string,
  reducedMotion: boolean,
  statusClass = "text-ok",
): void {
  const cursor = document.createElement("span");
  cursor.className = "inline-block h-[13px] w-[7px] -translate-y-px bg-signal align-[-2px]";

  const statusSpan = document.createElement("span");
  statusSpan.className = statusClass;

  const prefixNode = document.createTextNode("");
  el.replaceChildren(prefixNode, statusSpan);

  const paint = (n: number) => {
    if (n <= prefix.length) {
      prefixNode.data = prefix.slice(0, n);
      statusSpan.textContent = "";
    } else {
      prefixNode.data = prefix;
      statusSpan.textContent = status.slice(0, n - prefix.length);
    }
  };

  if (reducedMotion) {
    paint(prefix.length + status.length);
    return;
  }

  let i = 0;
  const step = () => {
    paint(i);
    el.appendChild(cursor);
    if (i <= prefix.length + status.length) {
      i += 1;
      window.setTimeout(step, TYPE_MS);
    } else {
      cursor.classList.add("animate-cursor-blink");
    }
  };

  step();
}
