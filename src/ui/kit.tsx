// Small building blocks reused by many tools.
import { useRef, useState, type ReactNode } from "react";
import { CURRENCIES } from "../lib/money";
import { openLater, shareLink, waLink } from "../lib/share";
import { useCopy } from "../lib/store";
import { QR } from "./QR";

export function Section({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={"panel " + (className ?? "")}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {aside && <div className="row" style={{ alignItems: "center" }}>{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ value, label, tone }: { value: ReactNode; label: string; tone?: "good" | "bad" | "warn" }) {
  return <div className="stat"><b style={tone ? { color: `var(--${tone})` } : undefined}>{value}</b><span>{label}</span></div>;
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="row" style={{ gap: 32 }}>{children}</div>;
}

export function CurrencySelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field" style={{ flex: "0 0 110px" }}><span>Currency</span>
      <select id={id} className="input" value={value} onChange={e => onChange(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
    </label>
  );
}

export function Example({ onClear, text = "These are sample entries so you can see how it works." }: { onClear: () => void; text?: string }) {
  return (
    <div className="panel row" style={{ alignItems: "center", justifyContent: "space-between" }}>
      <p><span className="pill warn">Example</span> {text}</p>
      <button className="btn" onClick={onClear}>Clear the example</button>
    </div>
  );
}

/** Makes a share link for `data`, with copy, WhatsApp and QR options. */
export function ShareBox({ slug, data, mode = "view", label = "Share link", message = "" }: { slug: string; data: unknown; mode?: string; label?: string; message?: string }) {
  const [url, setUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const { copied, copy } = useCopy();
  const make = async () => { const u = await shareLink(slug, data, `m=${mode}`); setUrl(u); return u; };
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row">
        <button className="btn primary" onClick={async () => copy(await make())}>{copied ? "Link copied" : label}</button>
        <button className="btn" onClick={() => openLater(async () => waLink(`${message ? message + "\n" : ""}${await make()}`))}>Send on WhatsApp</button>
        <button className="btn ghost" onClick={async () => { await make(); setShowQr(!showQr); }}>{showQr ? "Hide QR code" : "QR code"}</button>
      </div>
      {url && <input className="input note" readOnly value={url} onFocus={e => e.target.select()} aria-label="Share link" />}
      {showQr && url && (url.length < 2300 ? <div style={{ background: "#fff", padding: 12, borderRadius: 8, alignSelf: "flex-start" }}><QR text={url} size={200} /></div>
        : <p className="note">This link is too long for a QR code. Share it as a link instead.</p>)}
      <p className="note">The link carries a copy of the data, so nothing is stored on a server. Send a new link after you make changes.</p>
    </div>
  );
}

/** Import text from a file or a paste box. */
export function ImportBox({ label, accept = ".csv,text/csv,text/plain", onText, placeholder, rows = 5 }: { label: string; accept?: string; onText: (t: string) => void; placeholder?: string; rows?: number }) {
  const [text, setText] = useState("");
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <label className="field"><span>{label}</span>
        <textarea className="input" rows={rows} value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} style={{ fontFamily: "var(--mono)", fontSize: 13 }} />
      </label>
      <div className="row">
        <button className="btn small primary" disabled={!text.trim()} onClick={() => { onText(text); setText(""); }}>Import</button>
        <button className="btn small" onClick={() => file.current?.click()}>Choose a file</button>
        <input ref={file} type="file" accept={accept} hidden onChange={async e => { const f = e.target.files?.[0]; if (f) onText(await f.text()); e.target.value = ""; }} />
      </div>
    </div>
  );
}

export function SharedNotice({ children }: { children: ReactNode }) {
  return <div className="panel" style={{ borderLeft: "4px solid var(--accent)" }}>{children}</div>;
}
