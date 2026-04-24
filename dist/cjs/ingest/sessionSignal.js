"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionSignal = sessionSignal;
const client_js_1 = require("../internal/http/client.js");
const errors_js_1 = require("../types/errors.js");
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
async function sessionSignal(params) {
    const { limbUserId, session } = params;
    if (!limbUserId || typeof limbUserId !== "string") {
        throw new errors_js_1.ValidationError("limbUserId is required and must be a string");
    }
    if (!session || typeof session !== "object") {
        throw new errors_js_1.ValidationError("session object is required");
    }
    if (!session.sessionRef || typeof session.sessionRef !== "string") {
        throw new errors_js_1.ValidationError("session.sessionRef is required");
    }
    return (0, client_js_1.gatewayPost)("ingest", "sessionSignal", { limbUserId, session });
}
//# sourceMappingURL=sessionSignal.js.map