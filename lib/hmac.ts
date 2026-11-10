import crypto from "node:crypto";

/**
 * HMAC-SHA256 e-tiket (FR-011, NFR-05). Payload & output identik dengan
 * rust-core/src/crypto.rs::sign_ticket_code -> diuji silang di `cargo test`.
 */
export const HMAC_SECRET = process.env.HMAC_SECRET_KEY || "BAPENDA-LAMSEL-HMAC-SHA256-SECRET-KEY-2026-UTI";

export function signTicket(code: string, destinationId: string, validDate: string) {
  return crypto.createHmac("sha256", HMAC_SECRET).update(`${code}|${destinationId}|${validDate}`).digest("hex").toUpperCase();
}

export function verifyTicket(code: string, destinationId: string, validDate: string, signature: string) {
  const expected = Buffer.from(signTicket(code, destinationId, validDate));
  const given = Buffer.from((signature || "").trim().toUpperCase());
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

