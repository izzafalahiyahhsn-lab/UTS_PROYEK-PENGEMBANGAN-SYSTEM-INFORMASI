# Lamsel Tourism Revenue — SIMPAD Pariwisata Bahari

Aplikasi web terpadu yang mencatat penjualan tiket wisata di loket (POS), memvalidasi kunjungan fisik di pintu masuk menggunakan QR bertanda tangan kriptografi, dan merekonsiliasi penerimaan terhadap setoran kas daerah (RKUD Bank Lampung) guna meningkatkan transparansi **Pendapatan Asli Daerah (PAD) Kabupaten Lampung Selatan**.

---

## Arsitektur & Tumpukan Teknologi

1. **Frontend & Full-Stack Web (Siap Deploy Vercel):**
   - **Next.js 15 (App Router)** + **React 19** + **TypeScript**
   - **Tailwind CSS** sesuai spesifikasi *Design System* (`UI UX DESIGN WEBSITE/sistem_informasi_pendapatan_wisata_daerah.md`: Deep Maritime Navy `#16324F`, Action Blue `#2563EB`, Coastal Teal `#0F766E`, Canvas `#F5F7FA`, Plus Jakarta Sans & Inter dengan `tabular-nums`)
2. **Database & Backend-as-a-Service:**
   - **Supabase (PostgreSQL)** dengan skema lengkap pada [`supabase/schema.sql`](./supabase/schema.sql) mencakup 10 tabel/view inti, indeks tanggal & destinasi, operasi atomik validasi tiket (`BR-03`), dan trigger penolak `UPDATE`/`DELETE` pada `audit_logs` (`BR-09`).
   - Mendukung **Mode Demo Otomatis (`localStorage`)** apabila variabel lingkungan Supabase belum diisi sehingga aplikasi dapat langsung diuji coba tanpa konfigurasi tambahan.
3. **Rust Core (`rust-core/` — Validasi Teknis PRD Bagian 14):**
   - Pustaka Rust (`lamsel_rust_core`) pada folder [`rust-core/`](./rust-core) yang mengimplementasikan dan menguji:
     - Tanda tangan dan verifikasi **HMAC-SHA256** kode e-tiket (`FR-011`, `FR-014`, `NFR-05`)
     - Rantai hash **SHA-256 Tamper-Evident** untuk jejak audit (`FR-020`, `BR-09`, Bagian 15 PRD)
     - Evaluasi otomatis status rekonsiliasi harian (`BR-08`, `FR-018`)
     - Perhitungan checkout POS dengan *price snapshot* (`BR-01`, `FR-008`–`FR-010`)
     - Sanitasi sel CSV dari injeksi rumus spreadsheet (`FR-019`)

---

## Fitur Utama Sesuai PRD & Desain UI/UX

- **Ringkasan Eksekutif (`/`)**: 6 KPI utama dengan tooltip pembeda **Nilai Transaksi Tercatat (`BR-05`)** vs **Penerimaan Terverifikasi (`BR-06`)**, pemisahan **Tiket Terjual** vs **Kunjungan Terkonfirmasi (`BR-07`)**, filter periode (`Hari Ini`, `7 Hari`, `Bulan Ini`, `Kustom`) & destinasi, grafik tren nilai & kunjungan, distribusi jenis tiket, dan perbandingan kontribusi 5 destinasi wisata bahari.
- **Destinasi & Retribusi (`/destinasi`)**: Katalog 5 destinasi utama Lampung Selatan, tambah/ubah destinasi (`US-02`), kelola tarif SKRD/Perda dengan riwayat versi tanpa mengubah transaksi lama (`US-03`, `BR-01`), dan tabel ringkasan Perda No. 04/2024.
- **Transaksi & E-Tiket (`/transaksi`)**: Terminal kasir POS (`US-04`) dengan destinasi terkunci sesuai penugasan petugas, metode bayar `Tunai` (hitung kembalian otomatis), `QRIS`, dan `Transfer`, penerbitan modal **E-Tiket ber-QR HMAC-SHA256** (`US-05`) yang siap dicetak, serta tabel log transaksi dengan filter & ekspor CSV.
- **Validasi Gerbang & Kunjungan (`/validasi`)**: Pemindaian QR via kamera maupun input kode manual (`US-06`), penguncian status tiket secara atomik (`BELUM_DIGUNAKAN` → `SUDAH_DIGUNAKAN`), penolakan tiket ganda/kedaluwarsa/salah destinasi beserta alasan jelas, riwayat 5 validasi terakhir (`FR-016`), dan tabel **Data Kunjungan Fisik Terkonfirmasi** (`US-07`).
- **Laporan & Rekonsiliasi (`/laporan`)**: Tabel rekonsiliasi harian nilai sistem vs setoran RKUD Bank Lampung (`US-08`, `BR-08`), input/verifikasi setoran dengan wajib catatan bila terdapat selisih, ekspor CSV aman (`FR-019`), rekapitulasi PAD per objek wisata terhadap target APBD, dan Berita Acara Rekonsiliasi (BAR).
- **Audit Log (`/audit`)**: Jejak aktivitas *append-only* tanpa fitur ubah/hapus (`US-09`, `BR-09`) dilengkapi verifikasi integritas rantai hash SHA-256.
- **Pengaturan Sistem & RBAC (`/pengaturan` & `/login`)**: Manajemen user, matriks RBAC 5 persona (`Administrator Sistem`, `Admin Dinas`, `Pengelola Destinasi`, `Petugas Loket`, `Petugas Validasi`), dan *Role Switcher* untuk mode demo (`FR-002`).

---

## Cara Menjalankan Secara Lokal

```bash
# 1. Instal dependensi Node.js
npm install

# 2. Jalankan server pengembangan Next.js
npm run dev

# 3. Jalankan unit test modul Rust Core (opsional, membutuhkan Cargo/Rust)
npm run rust:test
```

Buka `http://localhost:3000` di browser.

---

## Cara Menghubungkan ke Supabase & Deploy ke Vercel

1. Buat proyek baru di [Supabase](https://supabase.com), buka **SQL Editor**, lalu jalankan isi file [`supabase/schema.sql`](./supabase/schema.sql).
2. Salin `.env.example` menjadi `.env.local` (atau tambahkan di **Environment Variables** pada proyek Vercel):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   HMAC_SECRET_KEY=kunci-rahasia-hmac-sha256-bapenda-lamsel-2026
   ```
3. Push repositori ini ke GitHub, lalu impor ke [Vercel](https://vercel.com/new) dan klik **Deploy**.

---

**Copyright©2026 by Izzatul Falahiyah Hasan dan Dr. Erliyan Redy Susanto, M.Kom**  
Pemerintah Kabupaten Lampung Selatan · Universitas Teknokrat Indonesia · *Sistem Demo & Simulasi - Data Sintetis*

