import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service key. Never exposed to limbs.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_KEY"];
  if (!url || !key) {
    throw new Error("supabase: SUPABASE_URL and SUPABASE_SERVICE_KEY required");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
