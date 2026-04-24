export interface InsightsQuery {
    scope: "cohort" | "aggregate" | "pattern";
    filters: {
        limbName?: string;
        dateRange?: {
            start: string;
            end: string;
        };
        topicCluster?: string;
    };
    minCohortSize: number;
}
export interface InsightsResult {
    scope: string;
    cohortSize: number;
    patterns: Array<{
        description: string;
        prevalence: number;
        confidence: number;
    }>;
    generatedAt: string;
}
//# sourceMappingURL=types.d.ts.map