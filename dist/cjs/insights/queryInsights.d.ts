import type { InsightsQuery, InsightsResult } from "./types.js";
/**
 * Enterprise-facing insights query. Minimum cohort size enforced server-side
 * (default 50) to prevent re-identification. Individual records never exposed.
 */
export declare function queryInsights(_query: InsightsQuery): Promise<InsightsResult>;
//# sourceMappingURL=queryInsights.d.ts.map