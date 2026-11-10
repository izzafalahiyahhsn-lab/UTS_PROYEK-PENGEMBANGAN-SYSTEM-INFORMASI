import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Hanya inisialisasi klien peramban jika URL valid dan kunci bukan secret key server (`sb_secret_*`).
 * Kunci `sb_secret_*` ditolak oleh Supabase di peramban ("Forbidden use of secret API key in browser").
 */
const isValidBrowserKey =
  Boolean(url && key) &&
  !url!.includes("xxxx") &&
  !key!.startsWith("sb_secret_");

export const supabase: SupabaseClient | null = isValidBrowserKey
  ? createClient(url!, key!)
  : null;
