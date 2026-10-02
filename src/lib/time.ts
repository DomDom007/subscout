// Time helpers shared by the scheduling tools. All time zone math uses the browser's Intl data, so DST is handled.

export const ALL_ZONES: string[] = (() => {
  try { return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("timeZone"); }
  catch { return ["UTC", "Europe/London", "Europe/Paris", "Africa/Tunis", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"]; }
})();
export const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

// Creating Intl formatters is slow, so keep one per zone and purpose.
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(key: string, zone: string, opts: Intl.DateTimeFormatOptions, locale = "en-US") {
  const k = `${key}|${zone}|${locale}`;
  let f = fmtCache.get(k);
  if (!f) { f = new Intl.DateTimeFormat(locale, { timeZone: zone, ...opts }); fmtCache.set(k, f); }
  return f;
}

/** Minutes the zone is ahead of UTC at the given instant. */
export function tzOffset(zone: string, at: Date): number {
  const parts = fmt("full", zone, { hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(at);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Convert a wall-clock time in a zone ("2026-10-03", "21:40") to a real instant. */
export function zonedToDate(date: string, time: string, zone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let off = tzOffset(zone, new Date(guess));
  let t = guess - off * 60000;
  off = tzOffset(zone, new Date(t)); // second pass settles DST edges
  t = guess - off * 60000;
  return new Date(t);
}

/** Hour of day (fractional) of an instant in a zone. */
export function hourIn(zone: string, at: Date) {
  const p = fmt("hm", zone, { hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(at);
  return (Number(p.find(x => x.type === "hour")!.value) % 24) + Number(p.find(x => x.type === "minute")!.value) / 60;
}
export function weekdayIn(zone: string, at: Date) {
  return fmt("wd", zone, { weekday: "short" }, undefined).format(at);
}

export const mod24 = (h: number) => ((h % 24) + 24) % 24;
/** 7.5 -> "07:30" */
export function hhmm(h: number) {
  const m = Math.round(mod24(h) * 60) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export const toHours = (t: string) => { const [h, m] = t.split(":").map(Number); return h + (m || 0) / 60; };
export function zoneLabel(z: string) { return z.replace(/_/g, " ").split("/").slice(-1)[0]; }
export function offsetLabel(mins: number) {
  const s = mins >= 0 ? "+" : "-", a = Math.abs(mins);
  return `UTC${s}${Math.floor(a / 60)}${a % 60 ? ":" + String(a % 60).padStart(2, "0") : ""}`;
}
export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function prettyDate(date: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
export const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
