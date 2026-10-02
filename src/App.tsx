import { useRef, useState, useEffect } from "react";
import Tool from "./Tool";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { download, exportTool, importTool } from "./lib/store";

const TOOL = {
  name: "Subscout",
  slug: "subscout",
  pitch: "Finds forgotten subscriptions and trials in your receipts and cancels them with one tap.",
  who: "Anyone with a bank card",
  category: "Ledger",
  categoryFull: "Money & Admin",
  accentA: "#00A95C",
  accentB: "#765BA7"
};

export default function App() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const handleBackup = () => {
    const data = exportTool(TOOL.slug);
    download(`${TOOL.slug}-backup.json`, data);
    setStatusMsg("Backup saved to file!");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      importTool(TOOL.slug, await f.text());
      setStatusMsg("Restored successfully. Refreshing...");
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      setStatusMsg((err as Error).message);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all data for this tool to default?")) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`hf:${TOOL.slug}:`)) {
          localStorage.removeItem(k);
        }
      }
      location.reload();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--line)",
        padding: "12px 20px"
      }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: TOOL.accentA,
              color: "#FFF",
              fontWeight: 700,
              fontSize: 16
            }}>
              {TOOL.name.slice(0, 1)}
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 16 }}>{TOOL.name}</strong>
                <span className="pill" style={{ background: "var(--sunk)", fontSize: 11 }}>{TOOL.category}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{TOOL.categoryFull}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {statusMsg && <span className="pill good">{statusMsg}</span>}
            <button className="btn ghost small" onClick={handleBackup} title="Export data to JSON file">
              💾 Save Backup
            </button>
            <button className="btn ghost small" onClick={() => fileRef.current?.click()} title="Import previously saved data">
              📂 Restore
            </button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleRestore} />
            <button className="btn ghost small danger" onClick={handleReset} title="Reset to sample data">
              🔄 Reset
            </button>
            <a
              href={`https://github.com/mokhless2/${TOOL.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn small primary"
              style={{ textDecoration: "none" }}
            >
              ★ GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)",
        borderBottom: "1px solid var(--line)",
        padding: "36px 20px"
      }}>
        <div className="wrap stack" style={{ maxWidth: 880, textAlign: "center", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <span className="pill good">● 100% Client-Side • Runs Offline</span>
            <span className="pill">Target: {TOOL.who}</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.15 }}>
            {TOOL.pitch}
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0 auto", fontSize: 15 }}>
            Your data is stored strictly in your browser (localStorage). No servers, no trackers, no accounts.
          </p>
        </div>
      </div>

      {/* Tool Workspace */}
      <main className="wrap" style={{ paddingBlock: 32, flex: 1, width: "100%", maxWidth: 1040 }}>
        <ErrorBoundary name={TOOL.name}>
          <Tool />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        padding: "24px 20px",
        marginTop: 48,
        fontSize: 13,
        color: "var(--muted)"
      }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <strong>{TOOL.name}</strong> — Part of the open-source micro-tools suite. Released under MIT License.
          </div>
          <div>
            Built by <a href="https://github.com/mokhless2" target="_blank" rel="noreferrer">Mokhles Ben Moallem</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
