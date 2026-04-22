import type { InsightsQuery, InsightsResult } from "./types.js";

/**
 * Enterprise-facing insights query. Minimum cohort size enforced server-side
 * (default 50) to prevent re-identification. Individual records never exposed.
 */
export async function queryInsights(_query: InsightsQuery): Promise<InsightsResult> {
  if (_query.minCohortSize < 50) {
    throw new Error("queryInsights: minCohortSize must be >= 50");
  }
  throw new Error("queryInsights: not implemented");
}
