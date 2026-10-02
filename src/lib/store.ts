// Local-first storage: every tool keeps its data in the visitor's own browser. Costs $0, needs no server.
import { useCallback, useEffect, useState } from "react";

const PREFIX = "hf:";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
}

/** useState that persists to localStorage under `tool:key`, and syncs across open tabs. */
export function useStored<T>(tool: string, key: string, initial: T) {
  const k = `${tool}:${key}`;
  const [value, setValue] = useState<T>(() => read(k, initial));
  useEffect(() => { write(k, value); }, [k, value]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === PREFIX + k && e.newValue) setValue(JSON.parse(e.newValue)); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [k]);
  return [value, setValue] as const;
}

/** All saved data for one tool, as a JSON string the user can keep as a backup. */
export function exportTool(tool: string) {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith(`${PREFIX}${tool}:`)) out[key.slice(PREFIX.length + tool.length + 1)] = JSON.parse(localStorage.getItem(key)!);
  }
  return JSON.stringify({ tool, exported: new Date().toISOString(), data: out }, null, 2);
}
export function importTool(tool: string, json: string) {
  const parsed = JSON.parse(json);
  if (parsed.tool !== tool) throw new Error(`This backup belongs to ${parsed.tool}, not ${tool}.`);
  for (const [k, v] of Object.entries(parsed.data)) write(`${tool}:${k}`, v);
}

/** Trigger a file download of text content. */
export function download(filename: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  }, []);
  return { copied, copy };
}
