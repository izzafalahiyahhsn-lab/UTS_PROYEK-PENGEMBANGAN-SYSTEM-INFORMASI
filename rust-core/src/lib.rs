pub mod crypto;

use serde::{Deserialize, Serialize};

pub use crypto::{
    compute_audit_chain_hash, hash_password, sign_ticket_code, verify_ticket_hmac,
};

/// Status Rekonsiliasi PAD sesuai Aturan Bisnis BR-08 (PRD Bagian 7 & 14)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ReconciliationStatus {
    Sesuai,
    TerdapatSelisih,
    MenungguVerifikasi,
}

/// Evaluasi otomatis rekonsiliasi harian sistem vs setoran bank (BR-08, FR-018)
pub fn evaluate_reconciliation(
    system_amount: i64,
    deposit_amount: Option<i64>,
    notes: &str,
) -> Result<(ReconciliationStatus, Option<i64>), &'static str> {
    match deposit_amount {
        None => Ok((ReconciliationStatus::MenungguVerifikasi, None)),
        Some(dep) => {
            let diff = dep - system_amount;
            if diff == 0 {
                Ok((ReconciliationStatus::Sesuai, Some(0)))
            } else {
                if notes.trim().is_empty() {
                    return Err("Selisih tidak nol wajib diberi catatan tindak lanjut (BR-08)");
                }
                Ok((ReconciliationStatus::TerdapatSelisih, Some(diff)))
            }
        }
    }
}

/// Sanitasi sel CSV untuk mencegah Formula Injection pada Spreadsheet (PRD Bagian 14, FR-019)
pub fn sanitize_csv_cell(value: &str) -> String {
    let mut s = value.to_string();
    if s.starts_with('=')
        || s.starts_with('+')
        || s.starts_with('-')
        || s.starts_with('@')
        || s.starts_with('\t')
        || s.starts_with('\r')
    {
        s.insert(0, '\'');
    }
    if s.contains(',') || s.contains('"') || s.contains('\n') || s.contains(';') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s
    }
}

/// Perhitungan POS dengan Price Snapshot (BR-01, FR-008, FR-009, FR-010)
pub fn compute_pos_checkout(
    items: &[(i64, u32)],
    discount: i64,
    cash_received: i64,
    is_cash: bool,
) -> Result<(i64, i64, i64, i64), &'static str> {
    if items.is_empty() {
        return Err("Keranjang transaksi POS tidak boleh kosong");
    }
    let subtotal: i64 = items.iter().map(|(price, qty)| price * (*qty as i64)).sum();
    let valid_discount = discount.clamp(0, subtotal);
    let total = subtotal - valid_discount;
    if is_cash && cash_received < total {
        return Err("Uang tunai yang diterima kurang dari total pembayaran");
    }
    let change = if is_cash { cash_received - total } else { 0 };
    Ok((subtotal, valid_discount, total, change))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &str = "BAPENDA-LAMSEL-HMAC-SHA256-SECRET-KEY-2026-UTI";

    #[test]
    fn test_hmac_ticket_signature_and_verification() {
        let code = "TKT-20261024-00982";
        let dest = "DTN-KTB-01";
        let date = "2026-10-24";
        let sig = sign_ticket_code(code, dest, date, SECRET);
        assert_eq!(sig.len(), 64);
        assert!(verify_ticket_hmac(code, dest, date, &sig, SECRET));
        // Pemalsuan destinasi atau tanggal harus ditolak (BR-04, NFR-05)
        assert!(!verify_ticket_hmac(code, "DTN-BKH-02", date, &sig, SECRET));
        assert!(!verify_ticket_hmac(code, dest, "2026-10-25", &sig, SECRET));
    }

    #[test]
    fn test_audit_log_tamper_evident_hash_chain() {
        let genesis = "0".repeat(64);
        let h1 = compute_audit_chain_hash(
            &genesis,
            "2026-10-24T14:30:00Z",
            "USR-01",
            "LOGIN",
            "Autentikasi",
            "Login Admin Dinas",
        );
        let h2 = compute_audit_chain_hash(
            &h1,
            "2026-10-24T14:35:00Z",
            "USR-01",
            "REKONSILIASI",
            "Rekonsiliasi PAD",
            "Verifikasi setoran RKUD",
        );
        assert_ne!(h1, h2);
        assert_eq!(h2.len(), 64);
    }

    #[test]
    fn test_reconciliation_rules_br08() {
        assert_eq!(
            evaluate_reconciliation(84_750_000, Some(84_750_000), ""),
            Ok((ReconciliationStatus::Sesuai, Some(0)))
        );
        assert_eq!(
            evaluate_reconciliation(84_750_000, None, ""),
            Ok((ReconciliationStatus::MenungguVerifikasi, None))
        );
        // Selisih tanpa catatan wajib ditolak (BR-08)
        assert!(evaluate_reconciliation(7_250_000, Some(7_100_000), "   ").is_err());
        assert_eq!(
            evaluate_reconciliation(7_250_000, Some(7_100_000), "Berita acara selisih kasir"),
            Ok((ReconciliationStatus::TerdapatSelisih, Some(-150_000)))
        );
    }

    #[test]
    fn test_csv_formula_injection_escape() {
        assert_eq!(sanitize_csv_cell("=SUM(A1:A5)"), "'=SUM(A1:A5)");
        assert_eq!(sanitize_csv_cell("Pantai Pasir Putih"), "Pantai Pasir Putih");
    }
}

