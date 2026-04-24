/**
 * Direct Supabase access is intentionally not used by the SDK in v0.x.
 * All data operations route through the Seneca gateway function.
 * This module is reserved for future server-to-server use cases.
 */
export type SupabaseStub = Record<string, never>;
export declare function getSupabase(): never;
//# sourceMappingURL=client.d.ts.map