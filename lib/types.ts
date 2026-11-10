// Model data konseptual (PRD Bagian 9) - disederhanakan untuk klien web
export type RoleId = "ADMIN_SISTEM" | "ADMIN_DINAS" | "PENGELOLA" | "PETUGAS_LOKET" | "PETUGAS_VALIDASI";
export type DestStatus = "BUKA" | "TUTUP" | "PEMELIHARAAN";
export type PayMethod = "TUNAI" | "QRIS" | "TRANSFER";
export type TicketStatus = "BELUM_DIGUNAKAN" | "SUDAH_DIGUNAKAN" | "KEDALUWARSA";
export type ReconStatus = "SESUAI" | "TERDAPAT_SELISIH" | "MENUNGGU_VERIFIKASI";

export interface User {
  id: string;
  name: string;
  nip: string;
  role: RoleId;
  destination_id: string | null; // penugasan destinasi (null = semua)
  active: boolean;
}

export interface Destination {
  id: string;
  code: string;
  name: string;
  kecamatan: string;
  category: string;
  manager: string;
  contact: string;
  photo: string;
  facilities: string;
  status: DestStatus;
  target_bulanan: number;
  target_apbd: number;
  baseline: number; // realisasi tahun berjalan sebelum periode data sistem (migrasi data lama)
}

export interface Tariff {
  id: string;
  destination_id: string;
  name: string;
  category: string;
  unit: string;
  amount: number;
  sk_number: string;
  effective_from: string; // YYYY-MM-DD
  effective_until: string | null;
  active: boolean;
}

export interface SaleItem {
  tariff_id: string;
  name: string; // snapshot (BR-01)
  price: number; // snapshot (BR-01)
  qty: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  number: string;
  destination_id: string;
  cashier: string;
  created_at: string; // ISO
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  method: PayMethod;
  cash_received: number;
  change: number;
}

export interface Ticket {
  code: string;
  sale_id: string;
  destination_id: string;
  valid_date: string; // YYYY-MM-DD
  signature: string;
  visitors: number;
  summary: string;
  status: TicketStatus;
  used_at: string | null;
  used_by: string | null;
}

export interface Validation {
  id: string;
  ticket_code: string;
  destination_id: string;
  officer: string;
  method: "KAMERA" | "MANUAL";
  result: "VALID" | "DITOLAK";
  reason: string | null;
  visitors: number;
  created_at: string;
}

export interface Reconciliation {
  id: string;
  date: string; // YYYY-MM-DD
  destination_id: string;
  system_amount: number;
  deposit_amount: number | null;
  bank_ref: string;
  status: ReconStatus;
  notes: string;
}

export interface AuditLog {
  id: string;
  created_at: string;
  user_name: string;
  role: string;
  type: string;
  module: string;
  status: "SUKSES" | "GAGAL";
  description: string;
  prev_hash: string;
  hash: string;
}

export interface Setting {
  key: string;
  label: string;
  value: string;
}

export interface DB {
  users: User[];
  destinations: Destination[];
  tariffs: Tariff[];
  sales: Sale[];
  tickets: Ticket[];
  validations: Validation[];
  reconciliations: Reconciliation[];
  audit_logs: AuditLog[];
  settings: Setting[];
}
