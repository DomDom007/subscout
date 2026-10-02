// CSV parsing that handles quotes, commas and semicolons inside fields.
export function parseCsv(text: string): string[][] {
  const first = text.split("\n")[0] ?? "";
  // Use whichever separator appears most in the header: tabs (pasted from a spreadsheet), semicolons (European exports) or commas.
  const count = (c: string) => first.split(c).length - 1;
  const sep = [",", ";", "\t"].sort((a, b) => count(b) - count(a))[0];
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(x => x.trim() !== "")) rows.push(row.map(x => x.trim()));
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(x => x.trim() !== "")) rows.push(row.map(x => x.trim()));
  return rows;
}
/** Rows as objects keyed by lower-cased header. */
export function csvObjects(text: string): Record<string, string>[] {
  const [head, ...rest] = parseCsv(text);
  if (!head) return [];
  const keys = head.map(h => h.toLowerCase());
  return rest.map(r => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ""])));
}
export function toCsv(rows: (string | number)[][]) {
  return rows.map(r => r.map(v => { const s = String(v ?? ""); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\n");
}
/** Loose number parsing: "1 234,50", "$12.30", "-4" */
export function num(s: string | number | undefined) {
  if (typeof s === "number") return s;
  if (!s) return 0;
  let t = s.replace(/[^\d,.\-]/g, "");
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(",")) t = /,\d{1,2}$/.test(t) ? t.replace(",", ".") : t.replace(/,/g, "");
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}
