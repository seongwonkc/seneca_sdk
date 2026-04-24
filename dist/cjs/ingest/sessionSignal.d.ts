import type { SessionSignalParams } from "./types.js";
/**
 * Send a structured session signal after a limb session ends.
 *
 * The gateway resolves the bridge, inserts a seneca_limb_sessions row,
 * and auto-detects session-end fatigue via quartile response time comparison.
 *
 * Throws:
 *  - ValidationError   if required params are missing or malformed
 *  - NotFoundError     if no active bridge exists for this limbUserId
 *  - RateLimitedError  if the limb has exceeded its request quota
 */
export declare function sessionSignal(params: SessionSignalParams): Promise<{
    senecaUserId: string;
    sessionId: string | null;
}>;
//# sourceMappingURL=sessionSignal.d.ts.map