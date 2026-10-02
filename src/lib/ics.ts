// Calendar files (.ics) work with Google Calendar, Outlook and Apple Calendar, at no cost.
import { download } from "./store";

export type CalEvent = { title: string; start: Date; end?: Date; allDay?: boolean; description?: string; location?: string; alarmMinutes?: number; rrule?: string };
const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const day = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function buildIcs(events: CalEvent[], name = "Hundredfold") {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hundredfold//EN", `X-WR-CALNAME:${esc(name)}`];
  events.forEach((e, i) => {
    lines.push("BEGIN:VEVENT", `UID:${Date.now()}-${i}@hundredfold`, `DTSTAMP:${stamp(new Date())}`);
    if (e.allDay) {
      const end = new Date(e.start); end.setDate(end.getDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${day(e.start)}`, `DTEND;VALUE=DATE:${day(end)}`);
    } else lines.push(`DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end ?? new Date(e.start.getTime() + 3600000))}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.alarmMinutes !== undefined) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, `TRIGGER:-PT${e.alarmMinutes}M`, "END:VALARM");
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
export const downloadIcs = (filename: string, events: CalEvent[], name?: string) => download(filename, buildIcs(events, name), "text/calendar");
/** "2026-10-03" -> local midnight Date */
export const localDate = (iso: string, time = "09:00") => new Date(`${iso}T${time}:00`);
