import type { DB, Destination, Reconciliation, Sale, Tariff, Ticket, Validation, User } from "./types";
import { isoDate } from "./format";

// Data sintetis (PRD: tarif, destinasi, dan target adalah CONTOH, bukan tarif resmi)
export const DESTINATIONS: Destination[] = [
  { id: "DTN-KTB-01", code: "DTN-KTB-01", name: "Pantai Pasir Putih", kecamatan: "Katibung", category: "Wisata Bahari & Pantai Karang", manager: "BUMD Lamsel Bersinar & Pokdarwis Katibung", contact: "0812-7200-4401", photo: "/assets/dest-1.png", facilities: "3 Gerbang E-Tiket, Gazebo, Mushola, Parkir Bus", status: "BUKA", target_bulanan: 500_000_000, target_apbd: 6_500_000_000, baseline: 4_760_000_000 },
  { id: "DTN-BKH-02", code: "DTN-BKH-02", name: "Menara Siger", kecamatan: "Bakauheni", category: "Landmark Budaya & Panorama Selat Sunda", manager: "UPT Pariwisata Bakauheni", contact: "0811-7209-1102", photo: "/assets/dest-2.png", facilities: "2 Turnstile QR, Ruang Pameran, Dek Observasi", status: "BUKA", target_bulanan: 450_000_000, target_apbd: 5_800_000_000, baseline: 4_070_000_000 },
  { id: "DTN-KLD-03", code: "DTN-KLD-03", name: "Pantai Embe / Merak Belimbing", kecamatan: "Kalianda", category: "Wisata Bahari & Rekreasi Keluarga", manager: "Kerjasama Pihak Ketiga & Pemda Lamsel", contact: "0813-6902-3303", photo: "/assets/dest-3.png", facilities: "2 Loket, Saung Pantai, Area Camping, Toilet", status: "BUKA", target_bulanan: 350_000_000, target_apbd: 4_500_000_000, baseline: 3_010_000_000 },
  { id: "DTN-RJB-04", code: "DTN-RJB-04", name: "Pemandian Air Panas Way Buring", kecamatan: "Rajabasa", category: "Wisata Alam Vulkanik & Ekowisata", manager: "Pokdarwis Rajabasa & Dinas Pariwisata", contact: "0812-7944-5504", photo: "/assets/dest-4.png", facilities: "1 Gerbang POS, Kolam Reguler & VIP, Jalur Treking", status: "BUKA", target_bulanan: 250_000_000, target_apbd: 3_000_000_000, baseline: 1_940_000_000 },
  { id: "DTN-SBS-05", code: "DTN-SBS-05", name: "Pulau Sebesi & Konservasi Selat Sunda", kecamatan: "Kepulauan (Rajabasa)", category: "Wisata Bahari Pulau Tropis & Snorkeling", manager: "Koperasi Nelayan & Pokdarwis Sebesi", contact: "0813-7781-6605", photo: "/assets/dest-5.png", facilities: "Pos Dermaga Canti, Tambat Labuh, Pos Pantau BMKG", status: "PEMELIHARAAN", target_bulanan: 220_000_000, target_apbd: 2_200_000_000, baseline: 1_460_000_000 },
];

const T = (id: string, d: string, name: string, category: string, unit: string, amount: number, from = "2024-01-01"): Tariff => ({
  id, destination_id: d, name, category, unit, amount, sk_number: "Perda Kab. Lampung Selatan No. 04/2024", effective_from: from, effective_until: null, active: true,
});

export const TARIFFS: Tariff[] = [
  T("TRF-01", "DTN-KTB-01", "Dewasa", "WISATAWAN", "org", 15_000),
  T("TRF-02", "DTN-KTB-01", "Anak-anak", "WISATAWAN", "org", 10_000),
  T("TRF-03", "DTN-KTB-01", "Parkir Roda Empat", "KENDARAAN", "unit", 10_000),
  T("TRF-04", "DTN-KTB-01", "Parkir Bus", "KENDARAAN", "unit", 25_000, "2024-02-15"),
  T("TRF-05", "DTN-BKH-02", "Tiket Terusan Masuk", "WISATAWAN", "org", 20_000),
  T("TRF-06", "DTN-BKH-02", "Parkir Roda Empat", "KENDARAAN", "unit", 15_000),
  T("TRF-07", "DTN-BKH-02", "Parkir Bus Wisata", "KENDARAAN", "unit", 30_000, "2024-02-15"),
  T("TRF-08", "DTN-KLD-03", "Tiket Masuk", "WISATAWAN", "org", 15_000),
  T("TRF-09", "DTN-KLD-03", "Parkir Sepeda Motor", "KENDARAAN", "unit", 5_000),
  T("TRF-10", "DTN-KLD-03", "Parkir Mobil Pribadi", "KENDARAAN", "unit", 10_000),
  T("TRF-11", "DTN-RJB-04", "Tiket Masuk Kawasan", "WISATAWAN", "org", 10_000),
  T("TRF-12", "DTN-RJB-04", "Kolam Rendam VIP", "FASILITAS", "paket", 25_000),
  T("TRF-13", "DTN-SBS-05", "Retribusi Sandar Dermaga", "DERMAGA", "kapal", 50_000, "2024-03-01"),
  T("TRF-14", "DTN-SBS-05", "Tiket Konservasi Laut", "WISATAWAN", "org", 25_000, "2024-03-01"),
  // Riwayat tarif lama (nonaktif) - FR-007
  { ...T("TRF-H01", "DTN-KTB-01", "Dewasa", "WISATAWAN", "org", 10_000, "2021-01-01"), sk_number: "Perda No. 02/2021", effective_until: "2023-12-31", active: false },
];

export const USERS: User[] = [
  { id: "USR-01", name: "Hendra Kusuma, S.STP", nip: "19880412 201001 1 002", role: "ADMIN_DINAS", destination_id: null, active: true },
  { id: "USR-02", name: "Dr. Erliyan Redy Susanto, M.Kom", nip: "19820719 200801 1 009", role: "ADMIN_SISTEM", destination_id: null, active: true },
  { id: "USR-03", name: "Izzatul Falahiyah Hasan", nip: "23311068", role: "PENGELOLA", destination_id: "DTN-KTB-01", active: true },
  { id: "USR-04", name: "Siti Nurhaliza", nip: "19960311 202203 2 005", role: "PETUGAS_LOKET", destination_id: "DTN-KTB-01", active: true },
  { id: "USR-05", name: "Ahmad Fauzi", nip: "19950821 202102 1 003", role: "PETUGAS_LOKET", destination_id: "DTN-BKH-02", active: true },
  { id: "USR-06", name: "Lukman Hakim", nip: "19941102 202012 1 007", role: "PETUGAS_VALIDASI", destination_id: "DTN-KTB-01", active: true },
];

const CASHIER: Record<string, string> = {
  "DTN-KTB-01": "Siti Nurhaliza", "DTN-BKH-02": "Ahmad Fauzi", "DTN-KLD-03": "Bayu Saputra", "DTN-RJB-04": "Rian Pratama", "DTN-SBS-05": "Dedi Kurniawan",
};
const OFFICER: Record<string, string> = {
  "DTN-KTB-01": "Lukman Hakim", "DTN-BKH-02": "Yoga Pratama", "DTN-KLD-03": "Rudi Hartono", "DTN-RJB-04": "Andi Saputra", "DTN-SBS-05": "Joko Susilo",
};
const WEIGHT: Record<string, number> = { "DTN-KTB-01": 14, "DTN-BKH-02": 11, "DTN-KLD-03": 8, "DTN-RJB-04": 6, "DTN-SBS-05": 3 };

/** PRNG deterministik agar data sintetis konsisten */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bangun data sintetis 30 hari terakhir relatif terhadap hari ini. Signature tiket diisi oleh server (/api/tickets/sign). */
export function buildSeed(): DB {
  const rnd = mulberry32(2026);
  const sales: Sale[] = [];
  const tickets: Ticket[] = [];
  const validations: Validation[] = [];
  const reconciliations: Reconciliation[] = [];
  const now = new Date();
  let counter = 1;

  for (let back = 29; back >= 0; back--) {
    const day = new Date(now);
    day.setDate(now.getDate() - back);
    const date = isoDate(day);
    const weekend = day.getDay() === 0 || day.getDay() === 6;

    for (const d of DESTINATIONS) {
      const tariffs = TARIFFS.filter((t) => t.destination_id === d.id && t.active);
      let n = Math.round(WEIGHT[d.id] * (weekend ? 1.8 : 1) * (0.7 + rnd() * 0.6));
      if (back === 0) n = Math.max(2, Math.round(n * 0.5)); // hari ini berjalan
      let dayTotal = 0;
      for (let i = 0; i < n; i++) {
        const hour = 8 + Math.floor(rnd() * 9);
        if (back === 0 && hour >= now.getHours()) continue;
        const at = new Date(day);
        at.setHours(hour, Math.floor(rnd() * 60), Math.floor(rnd() * 60), 0);
        const main = tariffs[0];
        const qty = 1 + Math.floor(rnd() * 5);
        const items = [{ tariff_id: main.id, name: main.name, price: main.amount, qty, subtotal: main.amount * qty }];
        const extra = tariffs.find((t) => t.category !== "WISATAWAN");
        if (extra && rnd() > 0.5) items.push({ tariff_id: extra.id, name: extra.name, price: extra.amount, qty: 1, subtotal: extra.amount });
        const subtotal = items.reduce((a, b) => a + b.subtotal, 0);
        const r = rnd();
        const method = r < 0.68 ? "QRIS" : r < 0.9 ? "TUNAI" : "TRANSFER";
        const cash = method === "TUNAI" ? Math.ceil(subtotal / 50_000) * 50_000 : subtotal;
        const number = `TKT-${date.replace(/-/g, "")}-${String(counter++).padStart(5, "0")}`;
        const sale: Sale = {
          id: number, number, destination_id: d.id, cashier: CASHIER[d.id], created_at: at.toISOString(), items, subtotal, discount: 0, total: subtotal,
          method, cash_received: cash, change: cash - subtotal,
        };
        sales.push(sale);
        dayTotal += subtotal;
        const visitors = items.filter((it) => TARIFFS.find((t) => t.id === it.tariff_id)?.category === "WISATAWAN").reduce((a, b) => a + b.qty, 0) || 1;
        const used = back > 0 ? rnd() < 0.94 : rnd() < 0.6;
        const usedAt = new Date(at.getTime() + (3 + rnd() * 20) * 60_000);
        tickets.push({
          code: number, sale_id: number, destination_id: d.id, valid_date: date, signature: "", visitors,
          summary: items.map((it) => `${it.qty} ${it.name}`).join(" + "),
          status: used ? "SUDAH_DIGUNAKAN" : back > 0 ? "KEDALUWARSA" : "BELUM_DIGUNAKAN",
          used_at: used ? usedAt.toISOString() : null, used_by: used ? OFFICER[d.id] : null,
        });
        if (used) {
          validations.push({ id: `VAL-${number}`, ticket_code: number, destination_id: d.id, officer: OFFICER[d.id], method: rnd() < 0.85 ? "KAMERA" : "MANUAL", result: "VALID", reason: null, visitors, created_at: usedAt.toISOString() });
        }
      }
      // Rekonsiliasi harian (BR-08): hari ini belum, kemarin sebagian menunggu, beberapa selisih
      if (back >= 1) {
        let deposit: number | null = dayTotal;
        let notes = "Setoran cocok dengan mutasi RKUD Bank Lampung.";
        if (back === 1 && (d.id === "DTN-SBS-05" || d.id === "DTN-RJB-04")) { deposit = null; notes = "Menunggu slip setoran tunai (settlement T+1)."; }
        else if (rnd() < 0.06) { deposit = dayTotal - 15_000 * (1 + Math.floor(rnd() * 3)); notes = "Selisih kurang kas kembalian shift sore; Berita Acara setoran tambahan dibuat."; }
        reconciliations.push({
          id: `REC-${date}-${d.id}`, date, destination_id: d.id, system_amount: dayTotal, deposit_amount: deposit,
          bank_ref: deposit === null ? "" : `RKUD-381.00.01.00291.8/${date.replace(/-/g, "")}${d.id.slice(-2)}`,
          status: deposit === null ? "MENUNGGU_VERIFIKASI" : deposit === dayTotal ? "SESUAI" : "TERDAPAT_SELISIH", notes,
        });
      }
    }
  }

  // contoh penolakan validasi untuk riwayat
  const used = tickets.filter((t) => t.status === "SUDAH_DIGUNAKAN").slice(-1)[0];
  if (used) {
    validations.push({ id: "VAL-DUP-1", ticket_code: used.code, destination_id: used.destination_id, officer: OFFICER[used.destination_id], method: "KAMERA", result: "DITOLAK", reason: `Tiket sudah digunakan pada ${new Date(used.used_at!).toLocaleString("id-ID")} oleh ${used.used_by}`, visitors: 0, created_at: new Date(new Date(used.used_at!).getTime() + 120_000).toISOString() });
  }

  return {
    users: USERS, destinations: DESTINATIONS, tariffs: TARIFFS, sales, tickets, validations, reconciliations, audit_logs: [],
    settings: [
      { key: "RKUD", label: "Rekening Kas Umum Daerah (RKUD)", value: "381.00.01.00291.8 - Bank Lampung" },
      { key: "CUTOFF", label: "Cut-off Rekonsiliasi Harian", value: "15:00 WIB" },
      { key: "SYNC", label: "Interval Sinkronisasi POS & Gerbang", value: "30 detik" },
      { key: "PERDA", label: "Dasar Hukum Tarif Retribusi", value: "Perda Kab. Lampung Selatan No. 04/2024" },
      { key: "SWITCHER", label: "Peralihan Peran Cepat (Multi-Role)", value: "AKTIF" },
    ],
  };
}
