/**
 * Direct Supabase access is intentionally not used by the SDK in v0.x.
 * All data operations route through the Seneca gateway function.
 * This module is reserved for future server-to-server use cases.
 */

export type SupabaseStub = Record<string, never>;

export function getSupabase(): never {
  throw new Error(
    "Direct Supabase access is not supported in @seneca/sdk v0.x. " +
    "All operations route through the gateway.",
  );
}
