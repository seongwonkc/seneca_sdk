"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkUser = linkUser;
const client_js_1 = require("../internal/http/client.js");
const errors_js_1 = require("../types/errors.js");
/**
 * Link a limb-side user to a Seneca identity using a one-time link token
 * the user generated in the Seneca app.
 *
 * Seneca identities are never created implicitly by limb signup. Users
 * must explicitly consent to the bridge.
 *
 * Throws:
 *  - ValidationError      if params are missing or malformed
 *  - UnauthorizedError    if the token is invalid
 *  - TokenExpiredError    if the token has passed its 15-minute window
 *  - TokenSpentError      if the token has already been consumed
 *  - ConflictError        if limbUserId is already bridged to a different Seneca account
 *  - RateLimitedError     if the limb has exceeded its request quota
 */
async function linkUser(params) {
    const { senecaLinkToken, limbUserId } = params;
    // Client-side validation before we spend a network round-trip
    if (!senecaLinkToken || typeof senecaLinkToken !== "string") {
        throw new errors_js_1.ValidationError("senecaLinkToken is required and must be a string");
    }
    if (!limbUserId || typeof limbUserId !== "string") {
        throw new errors_js_1.ValidationError("limbUserId is required and must be a string");
    }
    return (0, client_js_1.gatewayPost)("ingest", "linkUser", {
        senecaLinkToken,
        limbUserId,
    });
}
//# sourceMappingURL=linkUser.js.map