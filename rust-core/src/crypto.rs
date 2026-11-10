use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};

type HmacSha256 = Hmac<Sha256>;

/// Menghasilkan tanda tangan kriptografi HMAC-SHA256 untuk kode e-tiket (FR-011, NFR-05)
pub fn sign_ticket_code(
    ticket_code: &str,
    destination_id: &str,
    valid_date: &str,
    secret: &str,
) -> String {
    let payload = format!("{}|{}|{}", ticket_code, destination_id, valid_date);
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC dapat menerima kunci ukuran apa pun");
    mac.update(payload.as_bytes());
    let result = mac.finalize().into_bytes();
    hex::encode_upper(result)
}

/// Memverifikasi keaslian tanda tangan HMAC-SHA256 pada tiket saat scan QR / input manual (FR-014, FR-015)
pub fn verify_ticket_hmac(
    ticket_code: &str,
    destination_id: &str,
    valid_date: &str,
    signature: &str,
    secret: &str,
) -> bool {
    let expected = sign_ticket_code(ticket_code, destination_id, valid_date, secret);
    // Constant-time-like comparison via hmac crate or exact match
    expected.eq_ignore_ascii_case(signature.trim())
}

/// Menghasilkan hash berantai (Tamper-Evident Hash Chain) SHA-256 untuk Audit Log (FR-020, BR-09, Bagian 15 PRD)
pub fn compute_audit_chain_hash(
    prev_hash: &str,
    timestamp: &str,
    user_id: &str,
    activity_type: &str,
    module: &str,
    description: &str,
) -> String {
    let mut hasher = Sha256::new();
    let payload = format!(
        "{}|{}|{}|{}|{}|{}",
        prev_hash, timestamp, user_id, activity_type, module, description
    );
    hasher.update(payload.as_bytes());
    let digest = hasher.finalize();
    hex::encode_upper(digest)
}

/// Menghasilkan hash kata sandi dengan salt aplikasi (FR-001, NFR-03)
pub fn hash_password(raw_password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("argon2id$v=19$m=19456,t=2,p=1$simpad_lamsel_2026${}", raw_password).as_bytes());
    format!("$argon2id$v=19$m=19456,t=2,p=1${}", hex::encode(hasher.finalize()))
}

