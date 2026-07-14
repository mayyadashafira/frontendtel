/**
 * supabaseClient.js
 * ------------------------------------------------------------------
 * Client Supabase untuk browser, pakai ANON key (bukan service_role!).
 * Dipakai untuk login, register, forgot/reset password langsung ke
 * Supabase Auth (tanpa lewat backend FastAPI lagi), dan untuk apiClient
 * mengambil access_token sesi yang sedang aktif.
 * ------------------------------------------------------------------
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi di file .env frontend."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
