import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** null jika env belum diisi -> aplikasi memakai mode demo (localStorage) */
export const supabase: SupabaseClient | null = url && key && !url.includes("xxxx") ? createClient(url, key) : null;

