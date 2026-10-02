// Subscout: reads a bank statement export, finds recurring charges and forgotten trials, and tracks what you cancel.
import { useMemo, useState } from "react";
import { parseCsv, num } from "./lib/csv";
import { downloadIcs, localDate } from "./lib/ics";
import { moneyFmt } from "./lib/money";
import { uid, useStored } from "./lib/store";
import { addDays, todayISO } from "./lib/time";
import { CurrencySelect, ImportBox, Section, Stat, Stats } from "./ui/kit";

const T = "subscout";
type Tx = { date: string; desc: string; amount: number };
type Sub = { key: string; name: string; amount: number; every: "week" | "month" | "year"; last: string; next: string; count: number; changed: boolean };
type Manual = { id: string; name: string; amount: number; every: Sub["every"]; next: string; trialEnds?: string };

function sampleTx(): Tx[] {
  const out: Tx[] = []; const m = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d; };
  for (let i = 5; i >= 0; i--) {
    const base = m(i); const iso = (day: number) => { const d = new Date(base); d.setDate(day); return d.toISOString().slice(0, 10); };
    out.push({ date: iso(3), desc: "NETFLIX.COM AMSTERDAM", amount: -39.9 }, { date: iso(8), desc: "SPOTIFY P2F3A", amount: -i > -3 ? -20.99 : -17.99 }, { date: iso(12), desc: "CARREFOUR MARKET LAC", amount: -(80 + i * 13) }, { date: iso(15), desc: "GYM FITLIFE ENNASR", amount: -85 }, { date: iso(21), desc: "ICLOUD STORAGE APPLE.COM/BILL", amount: -3.9 }, { date: iso(25), desc: "STEG ELECTRICITE", amount: -(60 + i * 4) }, { date: iso(27), desc: "SALARY ACME SARL", amount: 2400 });
  }
  const ay = new Date(); ay.setMonth(ay.getMonth() - 11);
  out.push({ date: ay.toISOString().slice(0, 10), desc: "CANVA PRO ANNUAL", amount: -119 });
  return out;
}

const clean = (d: string) => d.toUpperCase().replace(/\d{3,}|[*#]|\b(PAYPAL|CB|CARTE|VIR|PRLV|SEPA|POS|DEBIT|CARD|PURCHASE)\b/g, " ").replace(/[^A-Z. ]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 2).join(" ");
const daysBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 86400000;

/** Group charges by merchant, then keep groups whose gaps look weekly, monthly or yearly and whose amounts are steady. */
function detect(txs: Tx[]): Sub[] {
  const groups = new Map<string, Tx[]>();
  txs.filter(t => t.amount < 0).forEach(t => { const k = clean(t.desc); if (k) groups.set(k, [...(groups.get(k) ?? []), t]); });
  const out: Sub[] = [];
  groups.forEach((list, key) => {
    list.sort((a, b) => a.date.localeCompare(b.date));
    const amounts = list.map(t => -t.amount), last = list[list.length - 1];
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const steady = amounts.every(a => Math.abs(a - avg) / avg < 0.25);
    if (list.length === 1) {
      if (/ANNUAL|YEARLY|ANNUEL/.test(last.desc.toUpperCase()) && daysBetween(last.date, todayISO()) < 366) out.push({ key, name: key, amount: -last.amount, every: "year", last: last.date, next: addDays(last.date, 365), count: 1, changed: false });
      return;
    }
    if (!steady) return;
    const gaps = list.slice(1).map((t, i) => daysBetween(list[i].date, t.date));
    const g = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const every: Sub["every"] | null = g >= 5 && g <= 9 ? "week" : g >= 25 && g <= 35 ? "month" : g >= 350 && g <= 380 ? "year" : null;
    if (!every) return;
    const step = every === "week" ? 7 : every === "month" ? 30 : 365;
    const prev = amounts.length > 1 ? amounts[amounts.length - 2] : amounts[0];
    out.push({ key, name: key, amount: -last.amount, every, last: last.date, next: addDays(last.date, step), count: list.length, changed: Math.abs(-last.amount - prev) > 0.01 });
  });
  return out;
}
const yearly = (amount: number, every: Sub["every"]) => amount * (every === "week" ? 52 : every === "month" ? 12 : 1);

export default function Subscout() {
  const [txs, setTxs] = useStored<Tx[]>(T, "txs", sampleTx());
  const [cancelled, setCancelled] = useStored<string[]>(T, "cancelled", []);
  const [keep, setKeep] = useStored<string[]>(T, "keep", []);
  const [names, setNames] = useStored<Record<string, string>>(T, "names", {});
  const [manual, setManual] = useStored<Manual[]>(T, "manual", [{ id: "m1", name: "Adobe trial", amount: 29.99, every: "month", next: addDays(todayISO(), 4), trialEnds: addDays(todayISO(), 4) }]);
  const [cur, setCur] = useStored(T, "cur", "TND");
  const [err, setErr] = useState("");
  const [m, setM] = useState({ name: "", amount: "", every: "month" as Sub["every"], next: addDays(todayISO(), 30), trial: false });
  const money = moneyFmt(cur);
  const subs = useMemo(() => detect(txs), [txs]);
  const active = subs.filter(s => !cancelled.includes(s.key));
  const total = active.reduce((a, s) => a + yearly(s.amount, s.every), 0) + manual.reduce((a, s) => a + yearly(s.amount, s.every), 0);
  const saved = subs.filter(s => cancelled.includes(s.key)).reduce((a, s) => a + yearly(s.amount, s.every), 0);
  const trials = manual.filter(x => x.trialEnds);

  const importCsv = (text: string) => {
    const rows = parseCsv(text); const head = rows[0]?.map(h => h.toLowerCase()) ?? [];
    const di = head.findIndex(h => /date/.test(h)), li = head.findIndex(h => /desc|libell|label|details|merchant|narrative|payee/.test(h));
    const ai = head.findIndex(h => /amount|montant|value/.test(h)), dbi = head.findIndex(h => /debit|débit/.test(h)), cri = head.findIndex(h => /credit|crédit/.test(h));
    if (di < 0 || li < 0 || (ai < 0 && dbi < 0)) { setErr("Could not find date, description and amount columns. Check the first row of the file."); return; }
    const toIso = (s: string) => { const m = s.match(/(\d{1,4})[/.-](\d{1,2})[/.-](\d{2,4})/); if (!m) return s.slice(0, 10); return m[1].length === 4 ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; };
    const parsed = rows.slice(1).map(r => ({ date: toIso(r[di] ?? ""), desc: r[li] ?? "", amount: ai >= 0 ? num(r[ai]) : num(r[cri]) - num(r[dbi]) })).filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.amount);
    setTxs(parsed); setErr(parsed.length ? "" : "No transactions found in that file.");
  };

  return (
    <div className="stack">
      <Section title="Your subscriptions" aside={<CurrencySelect id="ss-cur" value={cur} onChange={setCur} />}>
        <Stats><Stat value={active.length + manual.length} label="Active" /><Stat value={money(total / 12)} label="Per month" /><Stat value={money(total)} label="Per year" /><Stat value={money(saved)} label="Saved per year" tone="good" /></Stats>
      </Section>
      {trials.length > 0 && <Section title="Trials ending soon">
        {trials.map(t => { const d = Math.ceil(daysBetween(todayISO(), t.trialEnds!)); return <div key={t.id} className="ss-row"><strong style={{ flex: 1 }}>{t.name}</strong><span className={"pill " + (d <= 3 ? "bad" : "warn")}>{d <= 0 ? "Ends today" : `Ends in ${d} days`}</span><span>then {money(t.amount)} / {t.every}</span></div>; })}
      </Section>}
      <Section title="Found in your statement" aside={<button className="btn small" disabled={!active.length} onClick={() => downloadIcs("subscription-renewals.ics", [...active.map(s => ({ title: `Renews: ${names[s.key] || s.name} ${money(s.amount)}`, start: localDate(addDays(s.next, -2)), allDay: true, alarmMinutes: 0 })), ...manual.map(s => ({ title: `${s.trialEnds ? "Trial ends" : "Renews"}: ${s.name}`, start: localDate(addDays(s.next, -1)), allDay: true }))], "Subscription renewals")}>Remind me before renewals</button>}>
        {subs.length === 0 ? <p className="empty-note">No recurring charges found. Import at least two months of transactions.</p> : (
          <div className="table-wrap"><table className="t"><thead><tr><th>Merchant</th><th className="r">Amount</th><th>Every</th><th>Next charge</th><th className="r">Per year</th><th /></tr></thead>
            <tbody>{subs.sort((a, b) => yearly(b.amount, b.every) - yearly(a.amount, a.every)).map(s => { const off = cancelled.includes(s.key); return (
              <tr key={s.key} style={{ opacity: off ? 0.5 : 1 }}>
                <td><input className="input" style={{ minWidth: 150 }} aria-label="Name" value={names[s.key] ?? s.name} onChange={e => setNames({ ...names, [s.key]: e.target.value })} />{s.changed && <span className="pill bad" style={{ marginTop: 4 }}>Price changed</span>}</td>
                <td className="r">{money(s.amount)}</td><td>{s.every}</td><td className="num">{s.next}</td><td className="r"><strong>{money(yearly(s.amount, s.every))}</strong></td>
                <td className="r" style={{ whiteSpace: "nowrap" }}>{off ? <button className="btn ghost small" onClick={() => setCancelled(cancelled.filter(x => x !== s.key))}>Undo</button> : <>
                  {!keep.includes(s.key) && <button className="btn ghost small" onClick={() => setKeep([...keep, s.key])}>Keep</button>}
                  <button className="btn small" onClick={() => setCancelled([...cancelled, s.key])}>I cancelled it</button></>}</td>
              </tr>); })}</tbody></table></div>
        )}
      </Section>
      <div className="grid2">
        <Section title="Import a bank statement">
          <ImportBox label="CSV export from your bank's website or app" rows={4} placeholder={"Date,Description,Amount\n03/09/2026,NETFLIX.COM,-39.90"} onText={importCsv} />
          {err && <p className="pill bad" style={{ marginTop: 8 }}>{err}</p>}
          <p className="note" style={{ marginTop: 8 }}>{txs.length} transactions loaded. The file is read on this device and never uploaded.</p>
        </Section>
        <Section title="Add one by hand">
          <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); if (!m.name.trim()) return; setManual([...manual, { id: uid(), name: m.name.trim(), amount: num(m.amount), every: m.every, next: m.next, trialEnds: m.trial ? m.next : undefined }]); setM({ ...m, name: "", amount: "" }); }}>
            <div className="row"><label className="field"><span>Name</span><input id="ss-mn" className="input" value={m.name} onChange={e => setM({ ...m, name: e.target.value })} /></label><label className="field"><span>Amount</span><input id="ss-ma" className="input num" value={m.amount} onChange={e => setM({ ...m, amount: e.target.value })} /></label></div>
            <div className="row" style={{ alignItems: "flex-end" }}><label className="field"><span>Every</span><select id="ss-me" className="input" value={m.every} onChange={e => setM({ ...m, every: e.target.value as Sub["every"] })}><option value="week">Week</option><option value="month">Month</option><option value="year">Year</option></select></label>
              <label className="field"><span>{m.trial ? "Trial ends" : "Next charge"}</span><input id="ss-mx" type="date" className="input" value={m.next} onChange={e => setM({ ...m, next: e.target.value })} /></label>
              <label className="check" style={{ paddingBottom: 10 }}><input type="checkbox" checked={m.trial} onChange={e => setM({ ...m, trial: e.target.checked })} />Free trial</label></div>
            <button className="btn small primary" type="submit" style={{ alignSelf: "flex-start" }}>Add</button>
          </form>
          {manual.map(x => <div key={x.id} className="ss-row"><span style={{ flex: 1 }}>{x.name}</span><span>{money(x.amount)} / {x.every}</span><button className="btn ghost small danger" onClick={() => setManual(manual.filter(y => y.id !== x.id))}>Remove</button></div>)}
        </Section>
      </div>
      <style>{`.ss-row{display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}`}</style>
    </div>
  );
}
