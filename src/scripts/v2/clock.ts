const TZ = "Europe/Sofia";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZoneName: "shortOffset",
});

/** Live Sofia clock — honours DST (EET ↔ EEST) via Intl. */
export function initClock(el: HTMLElement): () => void {
  const tick = () => {
    const parts = formatter.formatToParts(new Date());
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const offset = (get("timeZoneName") || "GMT+2").replace(/^GMT/, "UTC");
    el.textContent = `${get("hour")}:${get("minute")}:${get("second")} ${offset}`;
  };

  tick();
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
}
