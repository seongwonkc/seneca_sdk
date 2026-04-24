"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observe = observe;
const client_js_1 = require("../internal/http/client.js");
const errors_js_1 = require("../types/errors.js");
const validateQuestionData_js_1 = require("../internal/validation/validateQuestionData.js");
/**
 * Write one or more behavioral observations about a linked limb user.
 * Fire-and-forget from the limb perspective -- the SDK handles durability.
 *
 * Confidence is clamped to 0.7 max server-side. Values above that are
 * reserved for Seneca internal corroboration process.
 *
 * Throws:
 *  - ValidationError   if params fail client-side checks
 *  - NotFoundError     if limbUserId has no active bridge
 *  - RateLimitedError  if the limb has exceeded its request quota
 */
async function observe(params) {
    const { limbUserId, observations } = params;
    if (!limbUserId || typeof limbUserId !== "string") {
        throw new errors_js_1.ValidationError("limbUserId is required and must be a string");
    }
    if (!Array.isArray(observations) || observations.length === 0) {
        throw new errors_js_1.ValidationError("observations must be a non-empty array");
    }
    if (observations.length > 10) {
        throw new errors_js_1.ValidationError("observations array must contain at most 10 items");
    }
    for (let i = 0; i < observations.length; i++) {
        const obs = observations[i];
        if (!obs)
            throw new errors_js_1.ValidationError("observations[" + i + "] is undefined");
        if (!Number.isFinite(obs.confidence) || obs.confidence < 0 || obs.confidence > 1) {
            throw new errors_js_1.ValidationError("observations[" + i + "].confidence must be a finite number between 0 and 1");
        }
        const hasText = typeof obs.observation === "string" && obs.observation.trim().length > 0;
        if (!hasText) {
            throw new errors_js_1.ValidationError("observations[" + i + "].observation is required and must be a non-empty string");
        }
        if (obs.questionData !== undefined) {
            (0, validateQuestionData_js_1.validateQuestionData)(obs.questionData, i);
        }
    }
    return (0, client_js_1.gatewayPost)("ingest", "observe", {
        limbUserId,
        observations,
    });
}
//# sourceMappingURL=observe.js.map