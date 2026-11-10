import type { RoleId } from "./types";

export const ROLE_LABEL: Record<RoleId, string> = {
  ADMIN_SISTEM: "Administrator Sistem",
  ADMIN_DINAS: "Admin Dinas (Bapenda & Pariwisata)",
  PENGELOLA: "Pengelola Destinasi",
  PETUGAS_LOKET: "Petugas Loket (POS)",
  PETUGAS_VALIDASI: "Petugas Validasi Masuk",
};

export type Module = "dashboard" | "destinasi" | "transaksi" | "validasi" | "laporan" | "audit" | "pengaturan";

// Matriks hak akses (PRD Bagian 8)
export const ACCESS: Record<Module, RoleId[]> = {
  dashboard: ["ADMIN_SISTEM", "ADMIN_DINAS", "PENGELOLA"],
  destinasi: ["ADMIN_SISTEM", "ADMIN_DINAS", "PENGELOLA", "PETUGAS_LOKET"],
  transaksi: ["PENGELOLA", "PETUGAS_LOKET"],
  validasi: ["ADMIN_SISTEM", "ADMIN_DINAS", "PENGELOLA", "PETUGAS_VALIDASI"],
  laporan: ["ADMIN_SISTEM", "ADMIN_DINAS", "PENGELOLA"],
  audit: ["ADMIN_SISTEM", "ADMIN_DINAS"],
  pengaturan: ["ADMIN_SISTEM"],
};

export const can = {
  editDestination: (r: RoleId) => r === "ADMIN_SISTEM" || r === "PENGELOLA",
  createDestination: (r: RoleId) => r === "ADMIN_SISTEM",
  manageTariff: (r: RoleId) => r === "PENGELOLA",
  sell: (r: RoleId) => r === "PETUGAS_LOKET",
  validate: (r: RoleId) => r === "PETUGAS_VALIDASI",
  reconcile: (r: RoleId) => r === "ADMIN_DINAS" || r === "PENGELOLA",
  exportCsv: (r: RoleId) => r === "ADMIN_SISTEM" || r === "ADMIN_DINAS" || r === "PENGELOLA",
};

export const NAV: { href: string; label: string; module: Module; icon: string }[] = [
  { href: "/", label: "Ringkasan Eksekutif", module: "dashboard", icon: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" },
  { href: "/destinasi", label: "Destinasi & Retribusi", module: "destinasi", icon: "M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" },
  { href: "/transaksi", label: "Transaksi & E-Tiket", module: "transaksi", icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" },
  { href: "/validasi", label: "Validasi Gerbang & Kunjungan", module: "validasi", icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2v2" },
  { href: "/laporan", label: "Laporan & Rekonsiliasi", module: "laporan", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/audit", label: "Audit Log", module: "audit", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" },
  { href: "/pengaturan", label: "Pengaturan Sistem", module: "pengaturan", icon: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" },
];

