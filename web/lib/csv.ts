export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export function parseCsv(text: string): ParsedCsv {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines
    .slice(1)
    .map((line) => {
      const cols: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === "," && !inQuotes) {
          cols.push(cur.trim());
          cur = "";
        } else cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    })
    .filter((r) => r.length > 1);
  return { headers, rows };
}
