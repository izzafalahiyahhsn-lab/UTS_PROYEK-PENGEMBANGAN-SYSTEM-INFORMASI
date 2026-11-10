-- =============================================================================
-- LAMSEL TOURISM REVENUE (SIMPAD PARIWISATA BAHARI)
-- Supabase / PostgreSQL Schema & Triggers (PRD Bagian 9, 13, 14, 15)
-- Copyright©2026 by Izzatul Falahiyah Hasan dan Dr. Erliyan Redy Susanto, M.Kom
-- Jalankan skrip ini pada SQL Editor di Dashboard Supabase Anda.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. DESTINATIONS (Master Destinasi - FR-006)
CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    kecamatan TEXT NOT NULL,
    category TEXT NOT NULL,
    manager TEXT NOT NULL,
    contact TEXT NOT NULL,
    photo TEXT NOT NULL,
    facilities TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('BUKA', 'TUTUP', 'PEMELIHARAAN')),
    target_bulanan NUMERIC(18, 2) NOT NULL DEFAULT 0,
    target_apbd NUMERIC(18, 2) NOT NULL DEFAULT 0,
    baseline NUMERIC(18, 2) NOT NULL DEFAULT 0
);

-- 2. USERS (Manajemen User & RBAC 5 Persona - FR-001, FR-021)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nip TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN_SISTEM', 'ADMIN_DINAS', 'PENGELOLA', 'PETUGAS_LOKET', 'PETUGAS_VALIDASI')),
    destination_id TEXT REFERENCES destinations(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. TARIFFS (Master Tiket & Tarif Resmi dengan Riwayat & SK/Perda - FR-007, BR-10)
CREATE TABLE IF NOT EXISTS tariffs (
    id TEXT PRIMARY KEY,
    destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'org',
    amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
    sk_number TEXT NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. SALES (Transaksi Penjualan Loket POS dengan Snapshot Item - FR-008, FR-009, FR-010, BR-01)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    destination_id TEXT NOT NULL REFERENCES destinations(id),
    cashier TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Menyimpan price snapshot (tariff_id, name, price, qty, subtotal)
    subtotal NUMERIC(18, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total NUMERIC(18, 2) NOT NULL CHECK (total >= 0),
    method TEXT NOT NULL CHECK (method IN ('TUNAI', 'QRIS', 'TRANSFER')),
    cash_received NUMERIC(18, 2) NOT NULL DEFAULT 0,
    change NUMERIC(18, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sales_destination_date ON sales(destination_id, created_at);

-- 5. TICKETS (E-Tiket dengan Kode Unik & Tanda Tangan HMAC-SHA256 - FR-011, BR-02, BR-03)
CREATE TABLE IF NOT EXISTS tickets (
    code TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    destination_id TEXT NOT NULL REFERENCES destinations(id),
    valid_date DATE NOT NULL,
    signature TEXT NOT NULL,
    visitors INT NOT NULL DEFAULT 1,
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'BELUM_DIGUNAKAN'
        CHECK (status IN ('BELUM_DIGUNAKAN', 'SUDAH_DIGUNAKAN', 'KEDALUWARSA')),
    used_at TIMESTAMPTZ,
    used_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_tickets_dest_date ON tickets(destination_id, valid_date);

-- 6. VALIDATIONS (Log Validasi Pintu Masuk - FR-013 s.d. FR-016, BR-03, BR-04)
CREATE TABLE IF NOT EXISTS validations (
    id TEXT PRIMARY KEY,
    ticket_code TEXT NOT NULL,
    destination_id TEXT NOT NULL REFERENCES destinations(id),
    officer TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('KAMERA', 'MANUAL')),
    result TEXT NOT NULL CHECK (result IN ('VALID', 'DITOLAK')),
    reason TEXT,
    visitors INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validations_dest_date ON validations(destination_id, created_at DESC);

-- 7. VISITS (View Kunjungan Fisik Terkonfirmasi dari Validasi Valid - FR-017, BR-07)
CREATE OR REPLACE VIEW visits AS
SELECT
    v.id AS visit_id,
    v.ticket_code,
    v.destination_id,
    d.name AS destination_name,
    v.officer,
    v.visitors,
    v.created_at AS confirmed_at
FROM validations v
JOIN destinations d ON d.id = v.destination_id
WHERE v.result = 'VALID';

-- 8. RECONCILIATIONS (Rekonsiliasi Harian Sistem vs Setoran RKUD - FR-018, BR-08)
CREATE TABLE IF NOT EXISTS reconciliations (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    destination_id TEXT NOT NULL REFERENCES destinations(id),
    system_amount NUMERIC(18, 2) NOT NULL,
    deposit_amount NUMERIC(18, 2),
    bank_ref TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('SESUAI', 'TERDAPAT_SELISIH', 'MENUNGGU_VERIFIKASI')),
    notes TEXT NOT NULL DEFAULT '',
    UNIQUE (date, destination_id)
);

-- 9. AUDIT_LOGS (Jejak Audit Append-Only & Tamper-Evident Hash Chain - FR-020, BR-09)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    type TEXT NOT NULL,
    module TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUKSES', 'GAGAL')),
    description TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL
);

-- Trigger penolak UPDATE dan DELETE pada audit_logs (FR-020, BR-09)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log bersifat immutable (BR-09): operasi UPDATE dan DELETE ditolak oleh basis data.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- 10. SETTINGS (Pengaturan Sistem - FR-026)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value TEXT NOT NULL
);
