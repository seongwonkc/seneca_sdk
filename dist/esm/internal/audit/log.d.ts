/**
 * Audit log — every data access gets a row. Users can query their own
 * audit history. Constitutional requirement for Level 2 architecture.
 */
export interface AuditEntry {
    senecaUserId: string;
    actor: "limb" | "enterprise" | "user" | "system";
    actorId: string;
    action: "read" | "write" | "export" | "delete" | "derive";
    surface: "ingest" | "query" | "insights";
    method: string;
    timestamp: string;
}
export declare function writeAudit(_entry: AuditEntry): Promise<void>;
//# sourceMappingURL=log.d.ts.map