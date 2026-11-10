// Format data regional (design guide: Regional Data Formatting Rules)
export const rp = (n: number) => "Rp\u00a0" + Math.round(n).toLocaleString("id-ID");

export const rpShort = (n: number) => {
  if (Math.abs(n) >= 1e9) return "Rp " + (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " M";
  if (Math.abs(n) >= 1e6) return "Rp " + (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " Jt";
  return rp(n);
};

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD menurut waktu lokal (WIB) */
export const isoDate = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** DD/MM/YYYY */
export const fmtDate = (v: string | Date) => {
  const d = typeof v === "string" ? new Date(v.length === 10 ? v + "T00:00:00" : v) : v;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** HH:MM WIB (24 jam) */
export const fmtTime = (v: string | Date, seconds = false) => {
  const d = typeof v === "string" ? new Date(v) : v;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}${seconds ? ":" + pad(d.getSeconds()) : ""} WIB`;
};

export const fmtDateTime = (v: string | Date) => `${fmtDate(v)} ${fmtTime(v)}`;

export const num = (n: number) => n.toLocaleString("id-ID");

export const pct = (n: number, digits = 1) => n.toLocaleString("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits }) + "%";

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/** Escape sel CSV + cegah injeksi rumus spreadsheet (PRD Bagian 14, FR-019) */
export const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const downloadCsv = (filename: string, header: string[], rows: unknown[][]) => {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

/** SHA-256 hex uppercase (Web Crypto) - sama dengan rust-core::compute_audit_chain_hash */
export async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

