"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserModel = getUserModel;
const client_js_1 = require("../internal/http/client.js");
const errors_js_1 = require("../types/errors.js");
/**
 * Read the current personalization state for a linked user.
 *
 * baselineDirective is computed at read time from the user's top memories,
 * then cached by memory fingerprint. Returns null if the user has fewer than
 * 2 high-confidence memories.
 *
 * Throws:
 *  - ValidationError    if limbUserId is missing
 *  - NotFoundError      if no active bridge exists for this limbUserId
 *  - RateLimitedError   if the limb has exceeded its request quota
 */
async function getUserModel(params) {
    const { limbUserId } = params;
    if (!limbUserId || typeof limbUserId !== "string") {
        throw new errors_js_1.ValidationError("limbUserId is required and must be a string");
    }
    return (0, client_js_1.gatewayPost)("query", "getUserModel", { limbUserId });
}
//# sourceMappingURL=getUserModel.js.map