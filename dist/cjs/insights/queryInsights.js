"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryInsights = queryInsights;
/**
 * Enterprise-facing insights query. Minimum cohort size enforced server-side
 * (default 50) to prevent re-identification. Individual records never exposed.
 */
async function queryInsights(_query) {
    if (_query.minCohortSize < 50) {
        throw new Error("queryInsights: minCohortSize must be >= 50");
    }
    throw new Error("queryInsights: not implemented");
}
//# sourceMappingURL=queryInsights.js.map