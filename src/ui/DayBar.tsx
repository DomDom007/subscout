// A 24-hour strip showing sleep, light and work windows. Segments may wrap past midnight.
import { hhmm, mod24 } from "../lib/time";

export type SegKind = "sleep" | "nap" | "light" | "dark" | "work" | "caffeine";
export type Seg = { start: number; end: number; kind: SegKind; label?: string };

export const SEG_STYLE: Record<SegKind, { name: string; color: string; pattern?: boolean }> = {
  sleep: { name: "Sleep", color: "#3255A4" },
  nap: { name: "Nap", color: "#765BA7" },
  work: { name: "Work", color: "#555C78" },
  light: { name: "Seek bright light", color: "#F2B400" },
  dark: { name: "Avoid bright light", color: "#FF6C2F", pattern: true },
  caffeine: { name: "No caffeine after", color: "#00838A" },
};

function pieces(s: Seg): [number, number][] {
  const a = mod24(s.start), len = ((s.end - s.start) % 24 + 24) % 24 || 24;
  const b = a + len;
  return b <= 24 ? [[a, b]] : [[a, 24], [0, b - 24]];
}

export function DayBar({ segs, marks = [] }: { segs: Seg[]; marks?: { at: number; label: string }[] }) {
  const lanes: SegKind[][] = [["sleep", "nap", "work"], ["light", "dark"]];
  return (
    <div className="daybar" role="img" aria-label={segs.map(s => `${SEG_STYLE[s.kind].name} ${hhmm(s.start)} to ${hhmm(s.end)}`).join(", ")}>
      {lanes.map((lane, li) => (
        <div className="lane" key={li}>
          {segs.filter(s => lane.includes(s.kind)).flatMap((s, i) => pieces(s).map(([a, b], k) => (
            <span key={`${i}-${k}`} className={"seg " + s.kind} title={`${SEG_STYLE[s.kind].name}: ${hhmm(s.start)} to ${hhmm(s.end)}`}
              style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%`, background: SEG_STYLE[s.kind].pattern ? `repeating-linear-gradient(135deg, ${SEG_STYLE[s.kind].color} 0 4px, transparent 4px 8px)` : SEG_STYLE[s.kind].color }} />
          )))}
        </div>
      ))}
      {segs.filter(s => s.kind === "caffeine").map((s, i) => (
        <span key={"c" + i} className="mark caf" style={{ left: `${(mod24(s.start) / 24) * 100}%` }} title={`No caffeine after ${hhmm(s.start)}`} />
      ))}
      {marks.map((m, i) => <span key={"m" + i} className="mark" style={{ left: `${(mod24(m.at) / 24) * 100}%` }} title={m.label}><em>{m.label}</em></span>)}
      <div className="ticks" aria-hidden="true">{[0, 6, 12, 18, 24].map(h => <span key={h} style={{ left: `${(h / 24) * 100}%` }}>{h === 24 ? "" : hhmm(h)}</span>)}</div>
    </div>
  );
}

export function DayBarLegend({ kinds }: { kinds: SegKind[] }) {
  return (
    <div className="daybar-legend">
      {kinds.map(k => (
        <span key={k}><i style={{ background: SEG_STYLE[k].pattern ? `repeating-linear-gradient(135deg, ${SEG_STYLE[k].color} 0 3px, transparent 3px 6px)` : SEG_STYLE[k].color, borderRadius: k === "caffeine" ? 1 : 3, width: k === "caffeine" ? 3 : 14 }} />{SEG_STYLE[k].name}</span>
      ))}
    </div>
  );
}
