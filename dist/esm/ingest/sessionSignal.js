import { gatewayPost } from "../internal/http/client.js";
import { ValidationError } from "../types/errors.js";
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
export async function sessionSignal(params) {
    const { limbUserId, session } = params;
    if (!limbUserId || typeof limbUserId !== "string") {
        throw new ValidationError("limbUserId is required and must be a string");
    }
    if (!session || typeof session !== "object") {
        throw new ValidationError("session object is required");
    }
    if (!session.sessionRef || typeof session.sessionRef !== "string") {
        throw new ValidationError("session.sessionRef is required");
    }
    return gatewayPost("ingest", "sessionSignal", { limbUserId, session });
}
//# sourceMappingURL=sessionSignal.js.map