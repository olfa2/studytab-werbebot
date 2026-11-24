const TZ = "Europe/Vienna";

export function fmtDateTime(iso: string | null) {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function fmtDay(iso: string) {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}

export function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}

function offsetMs(utcMs: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

/** "2026-11-24T18:30" (Wiener Ortszeit) -> ISO in UTC */
export function viennaLocalToIso(local: string) {
  const naive = Date.parse(local + ":00Z");
  if (Number.isNaN(naive)) return null;
  let utc = naive - offsetMs(naive);
  utc = naive - offsetMs(utc);
  return new Date(utc).toISOString();
}

/** ISO -> Wert für <input type="datetime-local"> in Wiener Zeit */
export function isoToViennaLocal(iso: string | null) {
  if (!iso) return "";
  const ms = Date.parse(iso);
  return new Date(ms + offsetMs(ms)).toISOString().slice(0, 16);
}

/** Montag der aktuellen Woche (YYYY-MM-DD) */
export function currentWeek() {
  const d = new Date(dayKey(new Date().toISOString()) + "T00:00:00Z");
  const diff = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function fmtNum(n: number | null | undefined) {
  if (n == null) return "–";
  return new Intl.NumberFormat("de-AT", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

/** Montag der nächsten Woche (YYYY-MM-DD) – für Posts, die du diese Woche sammelst */
export function nextWeek() {
  const d = new Date(currentWeek() + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}
