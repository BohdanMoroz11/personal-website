const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Live Sofia clock (UTC+2 fixed offset). */
export function initClock(el: HTMLElement, suffix: string): () => void {
  const tick = () => {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() + 120) * 60_000);
    el.textContent = `${pad(utc.getHours())}:${pad(utc.getMinutes())}:${pad(utc.getSeconds())} ${suffix}`;
  };

  tick();
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
}
