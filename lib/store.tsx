"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AuditLog, DB, Destination, PayMethod, Reconciliation, Sale, SaleItem, Setting, Tariff, Ticket, User, Validation } from "./types";
import { buildSeed } from "./seed";
import { supabase } from "./supabase";
import { isoDate, rp, sha256Hex, uid } from "./format";
import { ROLE_LABEL } from "./rbac";

const LS_DB = "ltr-db-v1";
const LS_USER = "ltr-user";
const GENESIS = "0".repeat(64);
type Table = keyof DB;
const KEY: Record<Table, string> = {
  users: "id", destinations: "id", tariffs: "id", sales: "id", tickets: "code", validations: "id", reconciliations: "id", audit_logs: "id", settings: "key",
};

export interface Toast { id: number; type: "success" | "error" | "info"; msg: string }
export interface ValidationResult { ok: boolean; title: string; detail: string; ticket?: Ticket }

interface Ctx {
  ready: boolean;
  mode: "supabase" | "demo";
  db: DB;
  user: User | null;
  toasts: Toast[];
  toast: (msg: string, type?: Toast["type"]) => void;
  login: (userId: string) => void;
  logout: () => void;
  audit: (type: string, module: string, description: string, status?: "SUKSES" | "GAGAL") => Promise<void>;
  saveDestination: (d: Destination, isNew: boolean) => Promise<void>;
  saveTariff: (t: Omit<Tariff, "id" | "active" | "effective_until">) => Promise<void>;
  toggleTariff: (id: string) => Promise<void>;
  createSale: (input: { destination_id: string; items: SaleItem[]; discount: number; method: PayMethod; cash_received: number; valid_date: string }) => Promise<{ sale: Sale; ticket: Ticket }>;
  validateTicket: (raw: string, destination_id: string, method: "KAMERA" | "MANUAL") => Promise<ValidationResult>;
  saveReconciliation: (r: { date: string; destination_id: string; deposit_amount: number | null; bank_ref: string; notes: string }) => Promise<Reconciliation>;
  saveUser: (u: User) => Promise<void>;
  saveSetting: (s: Setting) => Promise<void>;
  resetDemo: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore di luar StoreProvider");
  return c;
};

const empty: DB = { users: [], destinations: [], tariffs: [], sales: [], tickets: [], validations: [], reconciliations: [], audit_logs: [], settings: [] };

async function signAll(tickets: Ticket[]) {
  const res = await fetch("/api/tickets/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickets }) });
  const { signatures } = await res.json();
  tickets.forEach((t, i) => (t.signature = signatures[i]));
}

/** BR-02: tiket lewat tanggal berlaku -> KEDALUWARSA */
function expire(db: DB): Ticket[] {
  const today = isoDate();
  const changed: Ticket[] = [];
  db.tickets.forEach((t) => {
    if (t.status === "BELUM_DIGUNAKAN" && t.valid_date < today) { t.status = "KEDALUWARSA"; changed.push(t); }
  });
  return changed;
}

async function buildAuditChain(db: DB) {
  const seedLogs: [string, string, string, string, string][] = [
    ["Hendra Kusuma, S.STP", "Admin Dinas", "LOGIN", "Autentikasi", "Login berhasil dari Kantor Bapenda Kalianda"],
    ["Izzatul Falahiyah Hasan", "Pengelola Destinasi", "TARIF_UPDATE", "Master Tiket", "Verifikasi tarif Perda No. 04/2024 Pantai Pasir Putih"],
    ["Hendra Kusuma, S.STP", "Admin Dinas", "REKONSILIASI", "Rekonsiliasi PAD", "Rekonsiliasi harian kemarin: setoran RKUD dicocokkan otomatis"],
  ];
  let prev = GENESIS;
  const logs: AuditLog[] = [];
  const base = Date.now() - 3 * 3600_000;
  for (let i = 0; i < seedLogs.length; i++) {
    const [user_name, role, type, module, description] = seedLogs[i];
    const created_at = new Date(base + i * 1800_000).toISOString();
    const hash = await sha256Hex(`${prev}|${created_at}|${user_name}|${type}|${module}|${description}`);
    logs.push({ id: `AUD-SEED-${i + 1}`, created_at, user_name, role, type, module, status: "SUKSES", description, prev_hash: prev, hash });
    prev = hash;
  }
  db.audit_logs = logs.reverse();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(empty);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dbRef = useRef<DB>(empty);
  const mode: Ctx["mode"] = supabase ? "supabase" : "demo";

  const commit = useCallback((next: DB) => {
    dbRef.current = next;
    setDb(next);
    if (!supabase) {
      try { localStorage.setItem(LS_DB, JSON.stringify(next)); } catch { /* kuota penuh */ }
    }
  }, []);

  const persist = useCallback(async (table: Table, rows: object[]) => {
    if (!supabase || rows.length === 0) return;
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from(table).upsert(rows.slice(i, i + 500), { onConflict: KEY[table] });
      if (error) console.error(`Supabase ${table}:`, error.message);
    }
  }, []);

  const toast = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // Inisialisasi data
  useEffect(() => {
    (async () => {
      let data: DB | null = null;
      if (supabase) {
        const tables = Object.keys(KEY) as Table[];
        const results = await Promise.all(tables.map((t) => supabase!.from(t).select("*").limit(20000)));
        if (results.every((r) => !r.error) && (results[1].data?.length ?? 0) > 0) {
          data = { ...empty };
          tables.forEach((t, i) => ((data as unknown as Record<string, unknown[]>)[t] = results[i].data ?? []));
          data.audit_logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
        }
      } else {
        const raw = localStorage.getItem(LS_DB);
        if (raw) data = JSON.parse(raw);
      }
      if (!data) {
        data = buildSeed();
        await signAll(data.tickets);
        await buildAuditChain(data);
        if (supabase) for (const t of Object.keys(KEY) as Table[]) await persist(t, data[t] as object[]);
      }
      const expired = expire(data);
      if (expired.length) persist("tickets", expired);
      commit(data);
      setUserId(localStorage.getItem(LS_USER));
      setReady(true);
    })();
  }, [commit, persist]);

  const user = db.users.find((u) => u.id === userId) ?? null;

  const audit = useCallback<Ctx["audit"]>(async (type, module, description, status = "SUKSES") => {
    const cur = dbRef.current;
    const u = cur.users.find((x) => x.id === localStorage.getItem(LS_USER));
    const prev = cur.audit_logs[0]?.hash ?? GENESIS;
    const created_at = new Date().toISOString();
    const user_name = u?.name ?? "Sistem";
    const hash = await sha256Hex(`${prev}|${created_at}|${user_name}|${type}|${module}|${description}`);
    const log: AuditLog = { id: uid("AUD"), created_at, user_name, role: u ? ROLE_LABEL[u.role] : "-", type, module, status, description, prev_hash: prev, hash };
    commit({ ...dbRef.current, audit_logs: [log, ...dbRef.current.audit_logs] });
    persist("audit_logs", [log]);
  }, [commit, persist]);

  const login = (id: string) => {
    localStorage.setItem(LS_USER, id);
    setUserId(id);
    const u = dbRef.current.users.find((x) => x.id === id);
    audit("LOGIN", "Autentikasi", `Masuk sebagai ${u?.name} (${u ? ROLE_LABEL[u.role] : ""})`);
  };
  const logout = () => {
    audit("LOGOUT", "Autentikasi", "Keluar dari sistem");
    localStorage.removeItem(LS_USER);
    setUserId(null);
  };

  const saveDestination: Ctx["saveDestination"] = async (d, isNew) => {
    const cur = dbRef.current;
    if (isNew && cur.destinations.some((x) => x.code === d.code)) throw new Error("Kode destinasi sudah dipakai");
    const list = isNew ? [...cur.destinations, d] : cur.destinations.map((x) => (x.id === d.id ? d : x));
    commit({ ...cur, destinations: list });
    await persist("destinations", [d]);
    await audit(isNew ? "DEST_CREATE" : "DEST_UPDATE", "Master Destinasi", `${isNew ? "Tambah" : "Ubah"} destinasi ${d.code} - ${d.name} (status ${d.status})`);
  };

  /** FR-007: tarif baru = versi baru, tarif lama ditutup (tidak ditimpa) */
  const saveTariff: Ctx["saveTariff"] = async (t) => {
    const cur = dbRef.current;
    const dayBefore = new Date(t.effective_from + "T00:00:00");
    dayBefore.setDate(dayBefore.getDate() - 1);
    const closed: Tariff[] = [];
    const tariffs = cur.tariffs.map((x) => {
      if (x.active && x.destination_id === t.destination_id && x.name.toLowerCase() === t.name.toLowerCase()) {
        const c = { ...x, active: false, effective_until: isoDate(dayBefore) };
        closed.push(c);
        return c;
      }
      return x;
    });
    const nt: Tariff = { ...t, id: uid("TRF"), active: true, effective_until: null };
    commit({ ...cur, tariffs: [...tariffs, nt] });
    await persist("tariffs", [...closed, nt]);
    await audit("TARIF_UPDATE", "Master Tiket", `Tarif ${t.name} ${rp(t.amount)}/${t.unit} berlaku ${t.effective_from} (${t.sk_number})${closed.length ? `; versi lama ${rp(closed[0].amount)} dinonaktifkan` : ""}`);
  };

  const toggleTariff: Ctx["toggleTariff"] = async (id) => {
    const cur = dbRef.current;
    const t = cur.tariffs.find((x) => x.id === id);
    if (!t) return;
    const nt = { ...t, active: !t.active };
    commit({ ...cur, tariffs: cur.tariffs.map((x) => (x.id === id ? nt : x)) });
    await persist("tariffs", [nt]);
    await audit("TARIF_STATUS", "Master Tiket", `Tarif ${t.name} ${nt.active ? "diaktifkan" : "dinonaktifkan"}`);
  };

  /** FR-008..011: total dihitung ulang dari tarif aktif (bukan dari klien), snapshot harga, e-tiket HMAC */
  const createSale: Ctx["createSale"] = async (input) => {
    const cur = dbRef.current;
    const u = user!;
    const items: SaleItem[] = input.items.filter((i) => i.qty > 0).map((i) => {
      const t = cur.tariffs.find((x) => x.id === i.tariff_id && x.active && x.destination_id === input.destination_id);
      if (!t) throw new Error(`Tarif ${i.name} tidak aktif`);
      return { tariff_id: t.id, name: t.name, price: t.amount, qty: i.qty, subtotal: t.amount * i.qty };
    });
    if (items.length === 0) throw new Error("Keranjang kosong");
    const subtotal = items.reduce((a, b) => a + b.subtotal, 0);
    const discount = Math.min(Math.max(0, Math.round(input.discount)), subtotal);
    const total = subtotal - discount;
    if (input.method === "TUNAI" && input.cash_received < total) throw new Error("Uang diterima kurang dari total");
    const today = isoDate().replace(/-/g, "");
    const seq = cur.sales.filter((s) => s.number.includes(today)).length + 1;
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(3))).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const number = `TKT-${today}-${String(seq).padStart(5, "0")}${rand}`;
    const sale: Sale = {
      id: number, number, destination_id: input.destination_id, cashier: u.name, created_at: new Date().toISOString(), items, subtotal, discount, total,
      method: input.method, cash_received: input.method === "TUNAI" ? input.cash_received : total, change: input.method === "TUNAI" ? input.cash_received - total : 0,
    };
    const visitors = items.filter((i) => cur.tariffs.find((t) => t.id === i.tariff_id)?.category === "WISATAWAN").reduce((a, b) => a + b.qty, 0) || 1;
    const ticket: Ticket = {
      code: number, sale_id: number, destination_id: input.destination_id, valid_date: input.valid_date, signature: "", visitors,
      summary: items.map((i) => `${i.qty} ${i.name}`).join(" + "), status: "BELUM_DIGUNAKAN", used_at: null, used_by: null,
    };
    await signAll([ticket]);
    commit({ ...dbRef.current, sales: [...dbRef.current.sales, sale], tickets: [...dbRef.current.tickets, ticket] });
    await persist("sales", [sale]);
    await persist("tickets", [ticket]);
    await audit("POS_SALE", "Penjualan Loket", `Transaksi ${number} ${rp(total)} via ${input.method} (${ticket.summary})`);
    return { sale, ticket };
  };

  /** FR-013..015, BR-02..04 */
  const validateTicket: Ctx["validateTicket"] = async (raw, destination_id, method) => {
    const u = user!;
    const input = raw.trim();
    let code = input.toUpperCase();
    let sigFromQr: string | null = null;
    if (input.startsWith("LTR|")) {
      const p = input.split("|");
      code = (p[1] || "").toUpperCase();
      sigFromQr = p[4] || "";
    }
    const record = async (result: "VALID" | "DITOLAK", reason: string | null, visitors = 0) => {
      const v: Validation = { id: uid("VAL"), ticket_code: code || input, destination_id, officer: u.name, method, result, reason, visitors, created_at: new Date().toISOString() };
      commit({ ...dbRef.current, validations: [...dbRef.current.validations, v] });
      await persist("validations", [v]);
      await audit("GATE_VALIDATION", "Validasi QR", `${code || input}: ${result}${reason ? " - " + reason : ""}`, result === "VALID" ? "SUKSES" : "GAGAL");
    };
    const reject = async (title: string, detail: string, ticket?: Ticket) => {
      await record("DITOLAK", `${title}: ${detail}`);
      return { ok: false, title, detail, ticket };
    };

    let ticket = dbRef.current.tickets.find((t) => t.code === code);
    if (supabase) {
      const { data } = await supabase.from("tickets").select("*").eq("code", code).maybeSingle();
      if (data) ticket = data as Ticket;
    }
    if (!ticket) return reject("TIDAK DITEMUKAN", "Kode tiket tidak terdaftar di sistem");

    const resp = await fetch("/api/tickets/validate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ticket.code, destination_id: ticket.destination_id, valid_date: ticket.valid_date, signature: sigFromQr ?? ticket.signature }),
    });
    const { authentic } = await resp.json();
    if (!authentic) return reject("TIKET PALSU", "Tanda tangan HMAC tidak cocok", ticket);
    if (ticket.status === "SUDAH_DIGUNAKAN") return reject("SUDAH DIGUNAKAN", `Dipakai ${new Date(ticket.used_at!).toLocaleString("id-ID")} oleh ${ticket.used_by}`, ticket);
    if (ticket.destination_id !== destination_id) {
      const d = dbRef.current.destinations.find((x) => x.id === ticket!.destination_id);
      return reject("SALAH DESTINASI", `Tiket hanya berlaku di ${d?.name ?? ticket.destination_id}`, ticket);
    }
    const today = isoDate();
    if (ticket.status === "KEDALUWARSA" || ticket.valid_date < today) return reject("KEDALUWARSA", `Tanggal berlaku ${ticket.valid_date.split("-").reverse().join("/")} telah lewat`, ticket);
    if (ticket.valid_date > today) return reject("BELUM BERLAKU", `Tiket berlaku mulai ${ticket.valid_date.split("-").reverse().join("/")}`, ticket);

    const used_at = new Date().toISOString();
    if (supabase) {
      // BR-03: UPDATE bersyarat atomik - hanya satu pemindaian yang menang
      const { data } = await supabase.from("tickets").update({ status: "SUDAH_DIGUNAKAN", used_at, used_by: u.name })
        .eq("code", ticket.code).eq("status", "BELUM_DIGUNAKAN").select();
      if (!data || data.length === 0) return reject("SUDAH DIGUNAKAN", "Tiket baru saja divalidasi di gerbang lain", ticket);
    }
    const updated: Ticket = { ...ticket, status: "SUDAH_DIGUNAKAN", used_at, used_by: u.name };
    commit({ ...dbRef.current, tickets: dbRef.current.tickets.map((t) => (t.code === updated.code ? updated : t)) });
    await record("VALID", null, updated.visitors);
    return { ok: true, title: "TIKET VALID", detail: `${updated.visitors} pengunjung - ${updated.summary}`, ticket: updated };
  };

  /** FR-018, BR-08 */
  const saveReconciliation: Ctx["saveReconciliation"] = async (r) => {
    const cur = dbRef.current;
    const system_amount = cur.sales.filter((s) => s.destination_id === r.destination_id && isoDate(new Date(s.created_at)) === r.date).reduce((a, b) => a + b.total, 0);
    const status = r.deposit_amount === null ? "MENUNGGU_VERIFIKASI" : r.deposit_amount === system_amount ? "SESUAI" : "TERDAPAT_SELISIH";
    if (status === "TERDAPAT_SELISIH" && !r.notes.trim()) throw new Error("Selisih tidak nol wajib diberi catatan tindak lanjut (BR-08)");
    const id = `REC-${r.date}-${r.destination_id}`;
    const rec: Reconciliation = { id, date: r.date, destination_id: r.destination_id, system_amount, deposit_amount: r.deposit_amount, bank_ref: r.bank_ref, status, notes: r.notes };
    const exists = cur.reconciliations.some((x) => x.id === id);
    commit({ ...cur, reconciliations: exists ? cur.reconciliations.map((x) => (x.id === id ? rec : x)) : [...cur.reconciliations, rec] });
    await persist("reconciliations", [rec]);
    await audit("REKONSILIASI", "Rekonsiliasi PAD", `${r.destination_id} ${r.date}: sistem ${rp(system_amount)} vs setoran ${r.deposit_amount === null ? "-" : rp(r.deposit_amount)} -> ${status}`);
    return rec;
  };

  const saveUser: Ctx["saveUser"] = async (u) => {
    const cur = dbRef.current;
    const exists = cur.users.some((x) => x.id === u.id);
    commit({ ...cur, users: exists ? cur.users.map((x) => (x.id === u.id ? u : x)) : [...cur.users, u] });
    await persist("users", [u]);
    await audit(exists ? "USER_UPDATE" : "USER_CREATE", "Manajemen User", `${u.name} -> ${ROLE_LABEL[u.role]}${u.active ? "" : " (nonaktif)"}`);
  };

  const saveSetting: Ctx["saveSetting"] = async (s) => {
    commit({ ...dbRef.current, settings: dbRef.current.settings.map((x) => (x.key === s.key ? s : x)) });
    await persist("settings", [s]);
    await audit("SETTING_UPDATE", "Pengaturan", `${s.label} = ${s.value}`);
  };

  const resetDemo = () => {
    localStorage.removeItem(LS_DB);
    location.reload();
  };

  return (
    <StoreCtx.Provider value={{ ready, mode, db, user, toasts, toast, login, logout, audit, saveDestination, saveTariff, toggleTariff, createSale, validateTicket, saveReconciliation, saveUser, saveSetting, resetDemo }}>
      {children}
    </StoreCtx.Provider>
  );
}

